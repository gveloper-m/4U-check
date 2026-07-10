<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Spatie\Browsershot\Browsershot;
use Spatie\Browsershot\Enums\Polling;
use Carbon\Carbon;
use App\Traits\FetchesWebPages;

class PerformanceAuditController extends Controller
{
    use FetchesWebPages;

    /**
     * Audit a site for performance metrics across multiple pages.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function auditPerformance(Request $request): JsonResponse
    {
        $validated = $request->validate(['page_url' => 'required|url']);

        try {
            $result = $this->performAudit($validated['page_url']);
            return response()->json(array_merge(['success' => true], $result), 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    public function performAudit(string $pageUrl): array
    {
        // Fetch homepage ONCE with decode_content=false so we can read Content-Encoding
        // before the BFS crawl floods the site and triggers rate-limiting
        $homepageResponse = null;
        for ($try = 0; $try < 3; $try++) {
            if ($try > 0) usleep(rand(800000, 1500000));
            $r = Http::withOptions(['decode_content' => false])
                ->withHeaders(array_merge($this->browserHeaders(), ['Accept-Encoding' => 'gzip, deflate, br']))
                ->timeout(20)->get($pageUrl);
            if ($r->successful()) { $homepageResponse = $r; break; }
            if (! in_array($r->status(), [403, 429, 503])) break;
        }

        // Build pages list from homepage HTML (decompress if needed)
        if ($homepageResponse) {
            $encoding = $homepageResponse->header('Content-Encoding');
            $rawBody  = $homepageResponse->body();
            $homepageHtml = match (strtolower((string) $encoding)) {
                'gzip', 'x-gzip' => (string) @gzdecode($rawBody),
                'deflate'        => (string) @gzinflate($rawBody),
                default          => $rawBody,
            };
            // Brotli: PHP has no built-in brotli_uncompress — fetch a plain auto-decoded version for HTML parsing
            if (strtolower((string) $encoding) === 'br') {
                try {
                    $plain = Http::withHeaders($this->browserHeaders())->timeout(20)->get($pageUrl);
                    $homepageHtml = $plain->successful() ? $plain->body() : null;
                } catch (\Throwable $e) {
                    $homepageHtml = null;
                }
            }
        } else {
            $encoding     = null;
            $homepageHtml = null;
        }

        $pagesToTest = $this->getInternalPages($pageUrl, $homepageHtml);

        $allTTFB           = [];
        $allDesktopMetrics = [];
        $allMobileMetrics  = [];

        // Cap pages to avoid timeout on large sites. TTFB is a plain HTTP
        // HEAD request (cheap), so it can cover a much wider slice of the
        // site than the full Browsershot-based metrics/screenshot pass below.
        $pagesToTest = array_slice($pagesToTest, 0, 30);

        // TTFB: quick HTTP HEAD check across all pages
        foreach ($pagesToTest as $testUrl) {
            $ttfb = $this->measureTTFB($testUrl);
            if ($ttfb !== null) {
                $allTTFB[] = $ttfb;
            }
        }

        // Browsershot: sample the first 8 pages for real metrics + a
        // full-page screenshot of each. Kept well below $pagesToTest's count
        // to limit both bot-detection risk (many Chrome hits from one host)
        // and per-job wall-clock time — each page here costs up to 3 Chrome
        // launches (desktop metrics, mobile metrics, screenshot), all
        // serialized system-wide via withChromeLock().
        $browsershotSample = array_slice($pagesToTest, 0, 8);
        $pageScreenshots   = [];

        foreach ($browsershotSample as $testUrl) {
            $desktopMetrics = $this->measurePerformanceMetrics($testUrl, 'desktop');
            if ($desktopMetrics['fcp'] !== null) {
                $allDesktopMetrics[] = $desktopMetrics;
            }

            $mobileMetrics = $this->measurePerformanceMetrics($testUrl, 'mobile');
            if ($mobileMetrics['fcp'] !== null) {
                $allMobileMetrics[] = $mobileMetrics;
            }

            $shot = $this->captureScreenshot($testUrl);
            if ($shot !== null) {
                $pageScreenshots[] = ['url' => $testUrl, 'screenshot' => $shot];
            }
        }

        $avgTTFB    = ! empty($allTTFB) ? (int) (array_sum($allTTFB) / count($allTTFB)) : null;
        $desktopAvg = $this->averageMetrics($allDesktopMetrics);
        $mobileAvg  = $this->averageMetrics($allMobileMetrics);

        $pageAnalysis = $this->analyzePageResources($pageUrl, $encoding, $homepageHtml);

        // Keep the legacy "homepage" key pointing at the entry URL's shot
        // (if it was captured) so existing consumers keep working.
        $homepageScreenshot = null;
        foreach ($pageScreenshots as $entry) {
            if ($entry['url'] === $pageUrl) {
                $homepageScreenshot = $entry['screenshot'];
                break;
            }
        }

        DB::table('performance_audits')->insert([
            'site_url'          => $pageUrl,
            'ttfb_ms'           => $avgTTFB,
            'desktop_fcp_ms'    => $desktopAvg['fcp'] ?? null,
            'desktop_lcp_ms'    => $desktopAvg['lcp'] ?? null,
            'desktop_cls_score' => $desktopAvg['cls'] ?? null,
            'mobile_fcp_ms'     => $mobileAvg['fcp'] ?? null,
            'mobile_lcp_ms'     => $mobileAvg['lcp'] ?? null,
            'mobile_cls_score'  => $mobileAvg['cls'] ?? null,
            'executed_at'       => now(),
        ]);

        return [
            'site_url'     => $pageUrl,
            'pages_tested' => count($pagesToTest),
            'metrics'      => [
                'ttfb_ms' => $avgTTFB,
                'desktop' => [
                    'fcp_ms'    => $desktopAvg['fcp'] ?? null,
                    'lcp_ms'    => $desktopAvg['lcp'] ?? null,
                    'cls_score' => $desktopAvg['cls'] ?? null,
                ],
                'mobile'  => [
                    'fcp_ms'    => $mobileAvg['fcp'] ?? null,
                    'lcp_ms'    => $mobileAvg['lcp'] ?? null,
                    'cls_score' => $mobileAvg['cls'] ?? null,
                ],
            ],
            'page_analysis' => $pageAnalysis,
            'screenshots'   => [
                'homepage' => $homepageScreenshot,
                'pages'    => $pageScreenshots,
            ],
            'executed_at' => now(),
        ];
    }

    /**
     * Get performance audit history.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getAuditHistory(Request $request): JsonResponse
    {
        try {
            $query = DB::table('performance_audits');

            if ($request->has('site_url')) {
                $query->where('site_url', $request->query('site_url'));
            }

            $audits = $query->latest('executed_at')->paginate(10);

            return response()->json([
                'success' => true,
                'audits' => $audits,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get internal pages from a site.
     *
     * @param string $url
     * @return array
     */
    private function getInternalPages(string $url, ?string $htmlContent = null): array
    {
        $pages = [$url];

        // Use pre-fetched HTML if provided, otherwise fetch fresh
        if ($htmlContent === null) {
            try {
                $response = Http::withHeaders($this->browserHeaders())->timeout(15)->get($url);
                if ($response->successful()) {
                    $htmlContent = $response->body();
                }
            } catch (\Exception $e) {
                return $pages;
            }
        }

        if (! $htmlContent) {
            return $pages;
        }

        $htmlContent = $this->fetchRenderedIfNeeded($url, $htmlContent);

        try {
            $parsedUrl = parse_url($url);
            $host = $parsedUrl['host'] ?? '';

            // Parse HTML for internal links
            libxml_use_internal_errors(true);
            $dom = new \DOMDocument();
            @$dom->loadHTML($htmlContent);
            libxml_clear_errors();

            $links = $dom->getElementsByTagName('a');
            for ($i = 0; $i < $links->length; $i++) {
                $href = $links->item($i)->getAttribute('href');
                if (!empty($href)) {
                    $absoluteUrl = $this->makeAbsoluteUrl($href, $url);
                    $linkHost = parse_url($absoluteUrl)['host'] ?? '';
                    if ($linkHost === $host && !in_array($absoluteUrl, $pages)) {
                        $pages[] = explode('#', $absoluteUrl)[0];
                    }
                }
            }
        } catch (\Exception $e) {
            // Return just the homepage
        }

        return $pages;
    }

    /**
     * Convert relative URL to absolute.
     *
     * @param string $url
     * @param string $baseUrl
     * @return string
     */
    private function makeAbsoluteUrl(string $url, string $baseUrl): string
    {
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return $url;
        }
        
        $baseParts = parse_url($baseUrl);
        $baseScheme = $baseParts['scheme'] ?? 'https';
        $baseHost = $baseParts['host'] ?? '';
        $baseAuthority = $baseHost . (isset($baseParts['port']) ? ':' . $baseParts['port'] : '');

        if (str_starts_with($url, '//')) {
            return $baseScheme . ':' . $url;
        }

        if (str_starts_with($url, '/')) {
            return $baseScheme . '://' . $baseAuthority . $url;
        }

        $basePath = dirname($baseParts['path'] ?? '');
        while (str_starts_with($url, '../')) {
            $url = substr($url, 3);
            $basePath = dirname($basePath);
        }

        $url = str_replace('./', '', $url);
        $basePath = rtrim($basePath, '/');

        return $baseScheme . '://' . $baseAuthority . $basePath . '/' . $url;
    }

    /**
     * Average metrics across multiple measurements.
     *
     * @param array $measurements
     * @return array
     */
    private function averageMetrics(array $measurements): array
    {
        if (empty($measurements)) {
            return ['fcp' => null, 'lcp' => null, 'cls' => null];
        }

        $fcp = array_column($measurements, 'fcp');
        $lcp = array_column($measurements, 'lcp');
        $cls = array_column($measurements, 'cls');

        return [
            'fcp' => !empty($fcp) ? (int)(array_sum($fcp) / count($fcp)) : null,
            'lcp' => !empty($lcp) ? (int)(array_sum($lcp) / count($lcp)) : null,
            'cls' => !empty($cls) ? round(array_sum($cls) / count($cls), 3) : null,
        ];
    }

    /**
     * Measure Time To First Byte (TTFB).
     *
     * @param string $url
     * @return int|null
     */
    private function measureTTFB(string $url): ?int
    {
        try {
            // Add small delay to avoid rate limiting
            usleep(random_int(100000, 500000)); // 100-500ms delay

            $startTime = microtime(true) * 1000;
            $response = Http::withHeaders($this->browserHeaders())
                ->timeout(12)
                ->head($url);
            $endTime = microtime(true) * 1000;

            return (int)($endTime - $startTime);
        } catch (\Exception $httpError) {
            // If HTTP fails, try with browser
            $chromePath = $this->findChromePath();
            if (! $chromePath) return null;
            try {
                $startTime = microtime(true) * 1000;
                $ok = $this->withChromeLock(function () use ($url, $chromePath): bool {
                    Browsershot::url($url)
                        ->setChromePath($chromePath)
                        ->noSandbox()
                        ->disableImages()
                        ->timeout(15)
                        ->bodyHtml();
                    return true;
                });
                if (! $ok) return null;
                $endTime = microtime(true) * 1000;
                return (int)($endTime - $startTime);
            } catch (\Exception $browserError) {
                return null;
            }
        }
    }

    /**
     * Measure Core Web Vitals using Browsershot.
     *
     * @param string $url
     * @param string $viewport 'desktop' or 'mobile'
     * @return array
     */
    private function measurePerformanceMetrics(string $url, string $viewport = 'desktop'): array
    {
        $empty = ['fcp' => null, 'lcp' => null, 'cls' => null];

        try {
            $chromePath = $this->findChromePath();

            if (!$chromePath) {
                return $empty;
            }

            // Viewport dimensions
            [$w, $h] = $viewport === 'mobile' ? [412, 732] : [1920, 1080];

            $result = $this->withChromeLock(function () use ($url, $chromePath, $w, $h): array {
                $browsershot = Browsershot::url($url)
                    ->setChromePath($chromePath)
                    ->timeout(30)
                    ->userAgent($this->randomUserAgent())
                    ->addChromiumArguments([
                        'no-sandbox',
                        'disable-dev-shm-usage',
                        'disable-gpu',
                        'disable-software-rasterizer',
                        'disable-extensions',
                        'disable-blink-features=AutomationControlled',
                        'lang=en-US,en',
                    ])
                    ->windowSize($w, $h);

                // Inject JavaScript to extract performance metrics
                $metricsJson = $browsershot->evaluate($this->getPerformanceScript());

                if (!empty($metricsJson)) {
                    $metrics = json_decode($metricsJson, true);
                    if (is_array($metrics)) {
                        return [
                            'fcp' => $metrics['fcp'] ?? null,
                            'lcp' => $metrics['lcp'] ?? null,
                            'cls' => $metrics['cls'] ?? null,
                        ];
                    }
                }

                return ['fcp' => null, 'lcp' => null, 'cls' => null];
            });

            return $result ?? $empty;

        } catch (\Throwable $e) {
            \Log::debug("Performance metrics error for {$viewport} on {$url}: " . $e->getMessage());
            return $empty;
        }
    }

    private function analyzePageResources(string $url, ?string $encoding = null, ?string $html = null): array
    {
        $result = [
            'html_size_kb'               => null,
            'compression_enabled'        => false,
            'compression_worth_flagging' => false,
            'content_encoding'           => null,
            'render_blocking_scripts'    => [],
            'render_blocking_styles'     => [],
            'total_render_blocking'      => 0,
            'unminified_assets'          => [],
            'assets_checked'             => 0,
            'issues'                     => [],
        ];

        try {
            // Use pre-fetched data from performAudit() if available; avoids a second request
            // (which would often be rate-limited after the BFS crawl)
            if ($html === null) {
                $response = null;
                for ($try = 0; $try < 3; $try++) {
                    if ($try > 0) usleep(rand(800000, 1500000));
                    $r = Http::withOptions(['decode_content' => false])
                        ->withHeaders(array_merge($this->browserHeaders(), [
                            'Accept-Encoding' => 'gzip, deflate, br',
                        ]))->timeout(20)->get($url);
                    if ($r->successful()) { $response = $r; break; }
                    if (! in_array($r->status(), [403, 429, 503])) break;
                }
                if (! $response) {
                    return $result;
                }
                $encoding = $response->header('Content-Encoding');
                $rawBody  = $response->body();
                $html     = match (strtolower((string) $encoding)) {
                    'gzip', 'x-gzip' => (string) @gzdecode($rawBody),
                    'deflate'        => (string) @gzinflate($rawBody),
                    default          => $rawBody,
                };
            }

            $result['html_size_kb']       = round(strlen($html) / 1024, 1);
            $result['compression_enabled'] = ! empty($encoding);
            $result['content_encoding']   = $encoding ?: 'none';

            // Below ~10KB, gzip/brotli would save a few hundred bytes at
            // most — not something worth flagging as a real issue, let alone
            // scoring against. A tiny, simple page skipping an optimization
            // that wouldn't meaningfully change its real-world load time
            // isn't "unhealthy"; it's proportionate. Same principle as not
            // scoring against missing marketing pixels — don't penalize a
            // site for skipping something that plainly doesn't matter at
            // its actual scale.
            $result['compression_worth_flagging'] = empty($encoding) && $result['html_size_kb'] > 10;

            if ($result['compression_worth_flagging']) {
                $result['issues'][] = 'HTML response is not compressed (enable gzip or brotli)';
            }
            if ($result['html_size_kb'] > 100) {
                $result['issues'][] = "Large HTML page: {$result['html_size_kb']} KB (consider reducing DOM size)";
            }

            // Render-blocking scripts in <head> without async/defer
            preg_match('/<head[^>]*>(.*?)<\/head>/is', $html, $headMatch);
            $head = $headMatch[1] ?? '';

            preg_match_all('/<script[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $head, $scriptMatches, PREG_SET_ORDER);
            foreach ($scriptMatches as $m) {
                if (! preg_match('/\b(async|defer)\b/i', $m[0])) {
                    $result['render_blocking_scripts'][] = $m[1];
                }
            }

            // Render-blocking stylesheets in <head>
            preg_match_all('/<link[^>]+rel=["\']stylesheet["\'][^>]*>/i', $head, $styleMatches, PREG_SET_ORDER);
            foreach ($styleMatches as $m) {
                if (! preg_match('/media=["\']print["\']/i', $m[0])) {
                    preg_match('/href=["\']([^"\']+)["\']/i', $m[0], $hrefMatch);
                    if (! empty($hrefMatch[1])) {
                        $result['render_blocking_styles'][] = $hrefMatch[1];
                    }
                }
            }

            $result['total_render_blocking'] = count($result['render_blocking_scripts']) + count($result['render_blocking_styles']);

            if (count($result['render_blocking_scripts']) > 0) {
                $n = count($result['render_blocking_scripts']);
                $result['issues'][] = "{$n} render-blocking script(s) in <head> without async/defer";
            }
            if (count($result['render_blocking_styles']) > 3) {
                $n = count($result['render_blocking_styles']);
                $result['issues'][] = "{$n} render-blocking stylesheets — consider inlining critical CSS";
            }

            $minification = $this->checkAssetMinification($html, $url);
            $result['unminified_assets'] = $minification['unminified_assets'];
            $result['assets_checked']    = $minification['assets_checked'];
            if (! empty($minification['unminified_assets'])) {
                $n = count($minification['unminified_assets']);
                $result['issues'][] = "{$n} unminified CSS/JS file(s) over 10KB — minifying would meaningfully reduce transfer size";
            }

        } catch (\Throwable $e) {
            $result['issues'][] = 'Page analysis error: ' . $e->getMessage();
        }

        return $result;
    }

    /**
     * Flag same-origin CSS/JS files that are both large enough for
     * minification to matter AND appear unminified. Below the size
     * threshold, minifying saves a negligible number of bytes and just
     * makes the source harder to debug — not a real issue, so those files
     * are never even fetched for this check. Third-party assets (CDNs,
     * analytics, fonts) are skipped too since the site owner doesn't
     * control them.
     */
    private function checkAssetMinification(string $html, string $baseUrl): array
    {
        $unminified          = [];
        $checked             = 0;
        $sizeThresholdBytes  = 10 * 1024; // 10KB — below this, minification is not worth flagging
        $maxAssetsToCheck    = 6;         // bound extra HTTP requests this adds to the audit
        $baseHost            = parse_url($baseUrl, PHP_URL_HOST) ?? '';

        try {
            preg_match_all('/<script[^>]+src=["\']([^"\']+)["\']/i', $html, $scriptMatches);
            preg_match_all('/<link[^>]+rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\']/i', $html, $styleMatches1);
            preg_match_all('/<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']stylesheet["\']/i', $html, $styleMatches2);

            $urls = array_unique(array_merge($scriptMatches[1] ?? [], $styleMatches1[1] ?? [], $styleMatches2[1] ?? []));

            foreach ($urls as $assetUrl) {
                if ($checked >= $maxAssetsToCheck) {
                    break;
                }

                $absolute = $this->makeAbsoluteUrl($assetUrl, $baseUrl);
                if ((parse_url($absolute, PHP_URL_HOST) ?? '') !== $baseHost) {
                    continue; // third-party asset — not something the site owner can minify
                }

                try {
                    $resp = Http::withHeaders($this->browserHeaders())->timeout(10)->get($absolute);
                    if (! $resp->successful()) {
                        continue;
                    }
                } catch (\Throwable $e) {
                    continue; // a failed fetch here isn't a minification finding — skip, don't fail the whole check
                }

                $content = $resp->body();
                $sizeBytes = strlen($content);
                $checked++;

                if ($sizeBytes > $sizeThresholdBytes && ! $this->looksMinified($content)) {
                    $path = parse_url($absolute, PHP_URL_PATH) ?? '';
                    $unminified[] = [
                        'url'     => $absolute,
                        'size_kb' => round($sizeBytes / 1024, 1),
                        'type'    => str_ends_with(strtolower($path), '.css') ? 'css' : 'js',
                    ];
                }
            }
        } catch (\Throwable $e) {
            // Minification is a nice-to-have finding — never worth failing the
            // whole performance analysis over.
        }

        return ['unminified_assets' => $unminified, 'assets_checked' => $checked];
    }

    /**
     * Heuristic, not a real minifier diff: minified output is characteristically
     * one giant line (or a few very long ones) with sparse newlines; formatted
     * source has many short lines. Either signal alone is enough to call it
     * minified — false positives here just mean skipping a real finding, not
     * penalizing a site that doesn't deserve it.
     */
    private function looksMinified(string $content): bool
    {
        $length = strlen($content);
        if ($length === 0) {
            return true;
        }
        $newlineCount = substr_count($content, "\n");
        $avgLineLength = $length / max(1, $newlineCount + 1);

        return $avgLineLength > 300 || $newlineCount < ($length / 2000);
    }

    /**
     * Find Chrome/Chromium executable path.
     *
     * @return string|null
     */
    /**
     * Get JavaScript to extract performance metrics.
     *
     * @return string
     */
    private function getPerformanceScript(): string
    {
        return <<<'JS'
            new Promise(resolve => {
                const metrics = { fcp: null, lcp: null, cls: 0 };

                // FCP — available synchronously after page load
                const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
                if (fcpEntry) metrics.fcp = Math.round(fcpEntry.startTime);

                // CLS — sum all non-input layout shifts
                let clsValue = 0;
                performance.getEntriesByType('layout-shift').forEach(e => {
                    if (!e.hadRecentInput) clsValue += e.value;
                });
                metrics.cls = parseFloat(clsValue.toFixed(3));

                // LCP — must observe buffered entries via PerformanceObserver
                try {
                    const lcpObs = new PerformanceObserver(list => {
                        const entries = list.getEntries();
                        if (entries.length > 0) {
                            const e = entries[entries.length - 1];
                            metrics.lcp = Math.round(e.startTime || e.renderTime || e.loadTime || 0);
                        }
                    });
                    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
                    // Allow observer callback to fire before resolving
                    setTimeout(() => {
                        lcpObs.disconnect();
                        resolve(JSON.stringify(metrics));
                    }, 500);
                } catch (e) {
                    // LCP not supported in this browser build
                    resolve(JSON.stringify(metrics));
                }
            })
        JS;
    }
}
