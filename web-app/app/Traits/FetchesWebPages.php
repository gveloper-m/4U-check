<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Spatie\Browsershot\Browsershot;

trait FetchesWebPages
{
    private static array $USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0',
    ];

    protected function randomUserAgent(): string
    {
        return self::$USER_AGENTS[array_rand(self::$USER_AGENTS)];
    }

    protected function browserHeaders(): array
    {
        return [
            'User-Agent'                => $this->randomUserAgent(),
            'Accept'                    => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language'           => 'el-GR,el;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding'           => 'gzip, deflate, br',
            'Connection'                => 'keep-alive',
            'Upgrade-Insecure-Requests' => '1',
            'Sec-Fetch-Dest'            => 'document',
            'Sec-Fetch-Mode'            => 'navigate',
            'Sec-Fetch-Site'            => 'none',
            'Sec-Fetch-User'            => '?1',
            'Cache-Control'             => 'max-age=0',
            'DNT'                       => '1',
        ];
    }

    /**
     * Fetch HTML with up to 3 attempts, rotating UA on each retry.
     * Backs off 1-2s on 403/429 before retrying.
     */
    protected function fetchHtml(string $url): string
    {
        $lastException = null;

        for ($attempt = 0; $attempt < 3; $attempt++) {
            if ($attempt > 0) {
                usleep(rand(800000, 2000000)); // 0.8–2s between retries
            }

            try {
                $response = Http::withHeaders($this->browserHeaders())
                    ->timeout(25)
                    ->get($url);

                if (in_array($response->status(), [403, 429, 503])) {
                    usleep(rand(1500000, 3000000)); // 1.5–3s on rate-limit before next attempt
                    continue;
                }

                if (! $response->successful()) {
                    throw new \Exception("HTTP {$response->status()} for {$url}");
                }

                return $response->body();

            } catch (\Throwable $e) {
                $lastException = $e;
            }
        }

        throw $lastException ?? new \Exception("Failed to fetch {$url}");
    }

    /**
     * Locate a usable Chrome/Chromium binary for Browsershot.
     *
     * Prefers Puppeteer's own downloaded Chrome-for-Testing build (cached
     * under ~/.cache/puppeteer, resolved dynamically since the exact cached
     * version changes whenever `npm install puppeteer` updates it) over any
     * distro-packaged browser. This is deliberate: Debian bookworm's
     * `chromium` package was found to crash on launch (SIGTRAP, no usable
     * error) on some hosts' kernels, while Puppeteer's pinned build launches
     * correctly — it's built/tested specifically against the DevTools
     * protocol version Browsershot's internals speak.
     */
    protected function findChromePath(): ?string
    {
        foreach ($this->puppeteerCacheHomes() as $home) {
            $matches = glob("{$home}/.cache/puppeteer/chrome/*/chrome-linux64/chrome") ?: [];
            if (! empty($matches)) {
                rsort($matches); // newest cached version first, if more than one
                return $matches[0];
            }
        }

        if ($env = env('CHROME_PATH')) {
            return $env;
        }

        $paths = [
            '/opt/google/chrome/chrome',
            '/opt/google/chrome/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
        ];

        foreach ($paths as $path) {
            if (file_exists($path) && is_executable($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Candidate HOME directories to check for a Puppeteer Chrome cache —
     * covers running as root (Docker default here) and as www-data (in case
     * the container ever drops privileges).
     */
    private function puppeteerCacheHomes(): array
    {
        return array_unique(array_filter([
            getenv('HOME') ?: null,
            '/root',
            '/var/www',
        ]));
    }

    /**
     * Run a Browsershot-based Chrome launch under a system-wide, non-blocking
     * lock. Headless Chrome is memory-hungry and, on the 4GB production host,
     * Horizon can run up to 20 concurrent queue workers — several audit
     * modules across different reports/users can all want a Chrome instance
     * at the same moment. Serializing every launch (screenshots AND
     * performance-metric captures) through one lock keeps at most one Chrome
     * process alive system-wide, which is cheap insurance against OOM.
     *
     * The lock is intentionally NON-BLOCKING: a single audit job has its own
     * hard 600s timeout, and a single module can now need a dozen-plus Chrome
     * launches. Waiting out a contended lock repeatedly can push a job past
     * its own timeout and kill it with zero results — far worse than one
     * skipped screenshot or metric sample. If Chrome is already busy, $work
     * is simply not run and this returns null.
     */
    protected function withChromeLock(callable $work): mixed
    {
        return Cache::lock('chrome-launch', 25)->get($work);
    }

    /**
     * Capture a screenshot of a page — or, when $selector is given, just the
     * first element matching that CSS selector — and store it on the "public"
     * disk. Returns the relative path (usable with asset('storage/...') on the
     * frontend or storage_path('app/public/...') for PDF export) or null if no
     * Chrome binary is available or the capture failed for any reason.
     */
    protected function captureScreenshot(string $url, ?string $selector = null): ?string
    {
        $chromePath = $this->findChromePath();
        if (! $chromePath) {
            Log::warning('Screenshot capture skipped: no Chrome/Chromium binary found (CHROME_PATH not set and none of the known paths exist).', ['url' => $url]);
            return null;
        }

        $relative = 'audit-screenshots/' . date('Y/m/d') . '/'
            . sha1($url . '|' . $selector . '|' . microtime(true)) . '.png';
        $absolute = storage_path('app/public/' . $relative);

        try {
            if (! is_dir(dirname($absolute))) {
                mkdir(dirname($absolute), 0755, true);
            }

            $captured = $this->withChromeLock(function () use ($url, $selector, $chromePath, $absolute): bool {
                $shot = Browsershot::url($url)
                    ->setChromePath($chromePath)
                    ->noSandbox()
                    ->timeout(20)
                    ->windowSize(1280, 800)
                    ->addChromiumArguments([
                        'disable-dev-shm-usage',
                        'disable-gpu',
                        'disable-setuid-sandbox',
                        'disable-extensions',
                        'disable-background-networking',
                        'disable-default-apps',
                        'disable-sync',
                        'disable-translate',
                        'mute-audio',
                        'no-first-run',
                        'no-zygote',
                        'renderer-process-limit=1',
                        'js-flags=--max-old-space-size=256',
                    ]);

                if ($selector) {
                    $shot->select($selector);
                }

                $shot->save($absolute);

                return file_exists($absolute);
            });
        } catch (\Throwable $e) {
            Log::warning('Screenshot capture failed for ' . $url . ($selector ? " [{$selector}]" : '') . ': ' . $e->getMessage(), [
                'chrome_path' => $chromePath,
                'exception'   => get_class($e),
            ]);
            return null;
        }

        if ($captured === null || $captured === false) {
            Log::warning('Screenshot capture skipped or failed for ' . $url . ($selector ? " [{$selector}]" : '') . ' — Chrome was busy with another capture, or the file was not written.');
            return null;
        }

        return $relative;
    }

    private const RENDER_FAILED_SENTINEL = '__render_failed__';

    /**
     * Detect a JavaScript-rendered "empty shell" page (React/Vue/Next/Inertia
     * without SSR, etc.) — a plain HTTP fetch of such a page returns almost no
     * visible content because everything is rendered client-side after the
     * fact. Confirmed on 4utest.com itself: <body> is just
     * <div id="app" data-page="...">, zero real text.
     *
     * <script>/<style>/<noscript>/<template> BLOCKS (not just their tags) are
     * stripped before counting — SPA shells routinely embed large inline
     * JSON/JS blobs (state hydration payloads, webpack runtime) whose text
     * content would otherwise mask exactly the shells this is meant to catch.
     */
    protected function looksLikeEmptySpaShell(string $html, int $threshold = 80): bool
    {
        $body = preg_match('/<body[^>]*>(.*?)<\/body>/is', $html, $m) ? $m[1] : $html;
        $body = preg_replace('/<(script|style|noscript|template)\b[^>]*>.*?<\/\1>/is', ' ', $body);
        $text = trim(preg_replace('/\s+/', ' ', strip_tags($body)));

        return mb_strlen($text) < $threshold;
    }

    /**
     * If $rawHtml looks like an empty SPA shell, render $url through headless
     * Chrome to get the real post-JS document and return that instead —
     * otherwise return $rawHtml unchanged (the fast, cheap path every
     * traditional server-rendered site keeps using).
     *
     * The rendered result is shared via a short-TTL Redis cache keyed by URL:
     * every audit dispatches 7 module jobs concurrently with no chaining
     * (see RunAuditorJob), so several modules can want the same page's
     * rendered HTML within the same few seconds — only one of them should
     * actually pay the Chrome cost.
     */
    protected function fetchRenderedIfNeeded(string $url, string $rawHtml): string
    {
        if (! $this->looksLikeEmptySpaShell($rawHtml)) {
            return $rawHtml;
        }

        $cacheKey = 'audit-rendered-html:' . sha1($url);
        $cached   = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached === self::RENDER_FAILED_SENTINEL ? $rawHtml : $cached;
        }

        $chromePath = $this->findChromePath();
        if (! $chromePath) {
            return $rawHtml;
        }

        try {
            $rendered = $this->withChromeLock(function () use ($url, $chromePath): string {
                return Browsershot::url($url)
                    ->setChromePath($chromePath)
                    ->noSandbox()
                    ->timeout(20)
                    ->userAgent($this->randomUserAgent())
                    // Default page.goto() wait is 'load', which fires before a
                    // React/Vue app's client-side data-fetching/hydration is
                    // done — capturing right after that can be just as empty
                    // as the raw HTML. networkidle2 (via false here) waits for
                    // hydration while still tolerating lingering connections
                    // (analytics beacons, websockets) that networkidle0 would
                    // hang on until the timeout.
                    ->waitUntilNetworkIdle(false)
                    ->addChromiumArguments([
                        'disable-dev-shm-usage',
                        'disable-gpu',
                        'disable-setuid-sandbox',
                        'disable-extensions',
                        'disable-background-networking',
                        'disable-default-apps',
                        'disable-sync',
                        'disable-translate',
                        'disable-blink-features=AutomationControlled',
                        'mute-audio',
                        'no-first-run',
                        'no-zygote',
                        'renderer-process-limit=1',
                        'js-flags=--max-old-space-size=256',
                    ])
                    ->bodyHtml(); // despite the name, returns the FULL document (page.content()) — head included
            });
        } catch (\Throwable $e) {
            Log::warning('Rendered-HTML fetch failed for ' . $url . ': ' . $e->getMessage());
            Cache::put($cacheKey, self::RENDER_FAILED_SENTINEL, 240);
            return $rawHtml;
        }

        // null means withChromeLock() found Chrome BUSY (non-blocking lock) —
        // contention, not failure. Don't cache a failure sentinel for it;
        // just fall back this once and let the next caller try again.
        if ($rendered === null || trim($rendered) === '') {
            return $rawHtml;
        }

        // Guard against caching 15 minutes of still-useless content (auth
        // wall, bot-block, genuinely broken JS) as if it were a good render.
        if ($this->looksLikeEmptySpaShell($rendered, 150)) {
            Cache::put($cacheKey, self::RENDER_FAILED_SENTINEL, 240);
            return $rawHtml;
        }

        Cache::put($cacheKey, $rendered, 900);
        return $rendered;
    }
}
