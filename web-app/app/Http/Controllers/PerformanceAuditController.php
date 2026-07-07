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

        // Cap pages to avoid timeout on large sites
        $pagesToTest = array_slice($pagesToTest, 0, 15);

        // TTFB: quick HTTP HEAD check across all pages
        foreach ($pagesToTest as $testUrl) {
            $ttfb = $this->measureTTFB($testUrl);
            if ($ttfb !== null) {
                $allTTFB[] = $ttfb;
            }
        }

        // Browsershot: only sample the first 3 pages — 98 Chrome instances on a crawled site triggers bot detection
        foreach (array_slice($pagesToTest, 0, 3) as $testUrl) {
            $desktopMetrics = $this->measurePerformanceMetrics($testUrl, 'desktop');
            if ($desktopMetrics['fcp'] !== null) {
                $allDesktopMetrics[] = $desktopMetrics;
            }

            $mobileMetrics = $this->measurePerformanceMetrics($testUrl, 'mobile');
            if ($mobileMetrics['fcp'] !== null) {
                $allMobileMetrics[] = $mobileMetrics;
            }
        }

        $avgTTFB    = ! empty($allTTFB) ? (int) (array_sum($allTTFB) / count($allTTFB)) : null;
        $desktopAvg = $this->averageMetrics($allDesktopMetrics);
        $mobileAvg  = $this->averageMetrics($allMobileMetrics);

        $pageAnalysis = $this->analyzePageResources($pageUrl, $encoding, $homepageHtml);
        $homepageScreenshot = $this->captureScreenshot($pageUrl);

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
                ->timeout(30)
                ->head($url);
            $endTime = microtime(true) * 1000;

            return (int)($endTime - $startTime);
        } catch (\Exception $httpError) {
            // If HTTP fails, try with browser
            $chromePath = $this->findChromePath();
            if (! $chromePath) return null;
            try {
                $startTime = microtime(true) * 1000;
                Browsershot::url($url)
                    ->setChromePath($chromePath)
                    ->noSandbox()
                    ->disableImages()
                    ->timeout(30)
                    ->bodyHtml();
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
        try {
            $chromePath = $this->findChromePath();
            
            if (!$chromePath) {
                return ['fcp' => null, 'lcp' => null, 'cls' => null];
            }

            // Viewport dimensions
            [$w, $h] = $viewport === 'mobile' ? [412, 732] : [1920, 1080];

            $browsershot = Browsershot::url($url)
                ->setChromePath($chromePath)
                ->timeout(60)
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

        } catch (\Throwable $e) {
            \Log::debug("Performance metrics error for {$viewport} on {$url}: " . $e->getMessage());
            return ['fcp' => null, 'lcp' => null, 'cls' => null];
        }
    }

    private function analyzePageResources(string $url, ?string $encoding = null, ?string $html = null): array
    {
        $result = [
            'html_size_kb'            => null,
            'compression_enabled'     => false,
            'content_encoding'        => null,
            'render_blocking_scripts' => [],
            'render_blocking_styles'  => [],
            'total_render_blocking'   => 0,
            'issues'                  => [],
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

            if (empty($encoding)) {
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

        } catch (\Throwable $e) {
            $result['issues'][] = 'Page analysis error: ' . $e->getMessage();
        }

        return $result;
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
