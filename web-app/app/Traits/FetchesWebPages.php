<?php

namespace App\Traits;

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
     * Locate a usable Chrome/Chromium binary for Browsershot, checking the
     * CHROME_PATH env var (set in the production Docker image) first.
     */
    protected function findChromePath(): ?string
    {
        if ($env = env('CHROME_PATH')) {
            return $env;
        }

        $paths = [
            '/opt/google/chrome/chrome',
            '/opt/google/chrome/google-chrome',
            '/var/www/html/chrome/linux-151.0.7884.0/chrome-linux64/chrome',
            '/root/.cache/puppeteer/chrome/linux-151.0.7884.0/chrome-linux64/chrome',
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
            return null;
        }

        $relative = 'audit-screenshots/' . date('Y/m/d') . '/'
            . sha1($url . '|' . $selector . '|' . microtime(true)) . '.png';
        $absolute = storage_path('app/public/' . $relative);

        try {
            if (! is_dir(dirname($absolute))) {
                mkdir(dirname($absolute), 0755, true);
            }

            $shot = Browsershot::url($url)
                ->setChromePath($chromePath)
                ->noSandbox()
                ->timeout(30)
                ->windowSize(1440, 900)
                ->addChromiumArguments(['disable-dev-shm-usage', 'disable-gpu']);

            if ($selector) {
                $shot->select($selector);
            }

            $shot->save($absolute);

            return file_exists($absolute) ? $relative : null;
        } catch (\Throwable $e) {
            Log::debug('Screenshot capture failed for ' . $url . ($selector ? " [{$selector}]" : '') . ': ' . $e->getMessage());
            return null;
        }
    }
}
