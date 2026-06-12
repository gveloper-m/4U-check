<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Spatie\Browsershot\Browsershot;
use App\Traits\FetchesWebPages;

class TrackingAuditController extends Controller
{
    use FetchesWebPages;

    private $baseHost = '';

    /**
     * Audit a site for marketing tracking scripts across all pages.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function auditMarketingTracking(Request $request): JsonResponse
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
        $parsedUrl      = parse_url($pageUrl);
        $this->baseHost = $parsedUrl['host'] ?? '';

        $allGA4 = $allFacebook = $allTikTok = [];
        $visited     = [];          // url => true  (O(1) lookup)
        $inQueue     = [$pageUrl => true];
        $queue       = [$pageUrl];
        $pagesCrawled = 0;

        while (! empty($queue)) {
            // Pull up to 20 unvisited URLs for concurrent fetch
            $batch = [];
            while (! empty($queue) && count($batch) < 20) {
                $url = array_shift($queue);
                if (! isset($visited[$url])) {
                    $batch[] = $url;
                }
            }
            if (empty($batch)) {
                continue;
            }

            $responses = Http::pool(function ($pool) use ($batch) {
                foreach ($batch as $url) {
                    $pool->as($url)->withHeaders($this->browserHeaders())->timeout(25)->get($url);
                }
            });

            usleep(rand(300000, 700000)); // 0.3–0.7s between batches

            foreach ($batch as $url) {
                $response = $responses[$url] ?? null;
                if ($response instanceof \Throwable || ! $response || ! $response->successful()) {
                    $visited[$url] = true;
                    continue;
                }

                $visited[$url] = true;
                $htmlContent   = $response->body();

                $ga4      = $this->detectGA4($htmlContent);
                $facebook = $this->detectFacebookPixel($htmlContent);
                $tiktok   = $this->detectTikTokPixel($htmlContent);

                $allGA4      = array_merge($allGA4, $ga4['ids']);
                $allFacebook = array_merge($allFacebook, $facebook['ids']);
                $allTikTok   = array_merge($allTikTok, $tiktok['ids']);

                foreach ($this->extractInternalLinks($htmlContent, $url) as $link) {
                    if (! isset($visited[$link]) && ! isset($inQueue[$link])) {
                        $queue[]          = $link;
                        $inQueue[$link]   = true;
                    }
                }
                $pagesCrawled++;
            }
        }

        $allGA4      = array_values(array_unique($allGA4));
        $allFacebook = array_values(array_unique($allFacebook));
        $allTikTok   = array_values(array_unique($allTikTok));

        DB::table('marketing_tracking_audits')->insert([
            'site_url'                => $pageUrl,
            'ga4_detected'            => count($allGA4) > 0 ? 1 : 0,
            'ga4_ids'                 => count($allGA4) > 0 ? json_encode($allGA4) : null,
            'facebook_pixel_detected' => count($allFacebook) > 0 ? 1 : 0,
            'facebook_pixel_ids'      => count($allFacebook) > 0 ? json_encode($allFacebook) : null,
            'tiktok_pixel_detected'   => count($allTikTok) > 0 ? 1 : 0,
            'tiktok_pixel_ids'        => count($allTikTok) > 0 ? json_encode($allTikTok) : null,
            'executed_at'             => now(),
        ]);

        return [
            'site_url'      => $pageUrl,
            'pages_crawled' => $pagesCrawled,
            'tracking_scripts' => [
                'ga4'             => ['detected' => count($allGA4) > 0,      'ids' => $allGA4],
                'facebook_pixel'  => ['detected' => count($allFacebook) > 0, 'ids' => $allFacebook],
                'tiktok_pixel'    => ['detected' => count($allTikTok) > 0,   'ids' => $allTikTok],
            ],
            'executed_at' => now(),
        ];
    }

    /**
     * Get audit history for tracking scripts.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getAuditHistory(Request $request): JsonResponse
    {
        try {
            $query = DB::table('marketing_tracking_audits');

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
     * Fetch the HTML content of a page.
     *
     * @param string $url
     * @return string
     * @throws \Exception
     */
    private function fetchPageContent(string $url): string
    {
        try {
            // Add small delay to avoid rate limiting
            usleep(random_int(100000, 500000)); // 100-500ms delay
            
            $response = Http::withHeaders($this->getBrowserHeaders())
                ->timeout(20)
                ->get($url);

            if (!$response->successful()) {
                throw new \Exception("Failed to fetch page. HTTP Status: {$response->status()}");
            }

            return $response->body();

        } catch (\Exception $e) {
            // If HTTP request fails (403, timeout, etc), try with browser automation
            try {
                \Log::info("Retrying with browser automation for: $url");
                $html = Browsershot::url($url)
                    ->setChromePath('/usr/bin/google-chrome')
                    ->noSandbox()
                    ->disableImages()
                    ->timeout(20000)
                    ->bodyHtml();
                return $html;
            } catch (\Exception $browserError) {
                \Log::error("Both HTTP and browser methods failed for $url: " . $browserError->getMessage());
                throw new \Exception("Error fetching page content: " . $e->getMessage());
            }
        }
    }

    private function getBrowserHeaders(): array
    {
        return [
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language' => 'en-US,en;q=0.9',
            'Accept-Encoding' => 'gzip, deflate, br',
            'DNT' => '1',
            'Connection' => 'keep-alive',
            'Upgrade-Insecure-Requests' => '1',
            'Sec-Fetch-Dest' => 'document',
            'Sec-Fetch-Mode' => 'navigate',
            'Sec-Fetch-Site' => 'none',
            'Cache-Control' => 'max-age=0',
            'Pragma' => 'no-cache',
        ];
    }

    /**
     * Extract internal links from HTML.
     *
     * @param string $htmlContent
     * @param string $baseUrl
     * @return array
     */
    private function extractInternalLinks(string $htmlContent, string $baseUrl): array
    {
        $links = [];

        try {
            libxml_use_internal_errors(true);
            $dom = new \DOMDocument();
            @$dom->loadHTML($htmlContent);
            libxml_clear_errors();

            $anchors = $dom->getElementsByTagName('a');
            for ($i = 0; $i < $anchors->length; $i++) {
                $href = $anchors->item($i)->getAttribute('href');
                if (!empty($href) && !str_starts_with($href, 'javascript:')) {
                    $absoluteUrl = $this->makeAbsoluteUrl($href, $baseUrl);
                    $linkHost = parse_url($absoluteUrl)['host'] ?? '';
                    if ($linkHost === $this->baseHost) {
                        $cleanUrl = explode('#', $absoluteUrl)[0];
                        if (!in_array($cleanUrl, $links)) {
                            $links[] = $cleanUrl;
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            // Return what we have
        }

        return $links;
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
        
        if (str_starts_with($url, '//')) {
            return $baseScheme . ':' . $url;
        }
        
        if (str_starts_with($url, '/')) {
            return $baseScheme . '://' . $baseHost . $url;
        }
        
        $basePath = dirname($baseParts['path'] ?? '');
        while (str_starts_with($url, '../')) {
            $url = substr($url, 3);
            $basePath = dirname($basePath);
        }
        
        $url = str_replace('./', '', $url);
        $basePath = rtrim($basePath, '/');
        
        return $baseScheme . '://' . $baseHost . $basePath . '/' . $url;
    }

    /**
     * Detect Google Analytics 4 tracking.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectGA4(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: gtag/js with measurement ID in src
        if (preg_match_all('/googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/i', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 2: gtm.js with container ID
        if (preg_match_all('/googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/i', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 3: gtag config call
        if (preg_match_all('/gtag\([\'"]config[\'"]\s*,\s*[\'"]([G|GTM]-[A-Z0-9]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 4: dataLayer push with measurement ID
        if (preg_match_all('/[\'"](G-[A-Z0-9]+)[\'"].*?measurement_id/i', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }

    /**
     * Detect Facebook / Meta Pixel tracking.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectFacebookPixel(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: fbevents.js script tag with pixel ID in src (rare but possible)
        if (preg_match_all('/connect\.facebook\.net\/[^\/]*\/fbevents\.js/i', $htmlContent, $matches)) {
            $detected = true;
        }

        // Pattern 2: fbq init with pixel ID
        if (preg_match_all('/fbq\([\'"]init[\'"]\s*,\s*[\'"](\d+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 4: Direct Facebook pixel data
        if (preg_match_all('/data-pixel-id=[\'"](\d+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 5: noscript img tag with pixel ID
        if (preg_match_all('/facebook\.com\/tr\?id=(\d+)/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }

    /**
     * Detect TikTok Pixel tracking.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectTikTokPixel(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: analytics.tiktok.com pixel script
        if (preg_match_all('/analytics\.tiktok\.com\/i18n\/pixel\/sdk\.js/i', $htmlContent)) {
            $detected = true;
        }

        // Pattern 2: ttq.load with pixel ID
        if (preg_match_all('/ttq\.load\([\'"](\w+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 3: tiktok_pixel or pixel_id variables
        if (preg_match_all('/(?:tiktok_pixel|pixel_id)\s*[=:]\s*[\'"]([A-Z0-9]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 4: data attributes for TikTok
        if (preg_match_all('/data-tiktok-pixel-id=[\'"]([A-Z0-9]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 5: Direct pixel code in script tags
        if (preg_match_all('/ttq\.track\([\'"]([A-Z]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }
}
