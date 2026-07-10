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

    private $baseHost     = '';
    private $collectedHtml = '';

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
        $allGtm = $allLinkedin = $allTwitter = $allPinterest = [];
        $allSnapchat = $allMsUet = $allHotjar = $allClarity = [];
        // Per-tracker count of pages whose HTML matched that tracker family.
        $pageHits = [
            'ga4'                => 0,
            'facebook_pixel'     => 0,
            'tiktok_pixel'       => 0,
            'google_tag_manager' => 0,
            'linkedin_insight'   => 0,
            'twitter_pixel'      => 0,
            'pinterest_tag'      => 0,
            'snapchat_pixel'     => 0,
            'microsoft_uet'      => 0,
            'hotjar'             => 0,
            'clarity'            => 0,
        ];
        $this->collectedHtml = '';
        $visited     = [];          // url => true  (O(1) lookup)
        $inQueue     = [$pageUrl => true];
        $queue       = [$pageUrl];
        $pagesCrawled = 0;
        $deadline     = microtime(true) + 120; // hard 2-minute budget
        $maxPages     = 60;

        while (! empty($queue) && $pagesCrawled < $maxPages && microtime(true) < $deadline) {
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
                if (microtime(true) >= $deadline) {
                    break;
                }

                $response = $responses[$url] ?? null;
                if ($response instanceof \Throwable || ! $response || ! $response->successful()) {
                    $visited[$url] = true;
                    continue;
                }

                $visited[$url] = true;
                $htmlContent   = $response->body();
                $htmlContent   = $this->fetchRenderedIfNeeded($url, $htmlContent);
                $this->collectedHtml .= $htmlContent;

                $ga4       = $this->detectGA4($htmlContent);
                $facebook  = $this->detectFacebookPixel($htmlContent);
                $tiktok    = $this->detectTikTokPixel($htmlContent);
                $linkedin  = $this->detectLinkedInInsight($htmlContent);
                $twitter   = $this->detectTwitterPixel($htmlContent);
                $pinterest = $this->detectPinterestTag($htmlContent);
                $snapchat  = $this->detectSnapchatPixel($htmlContent);
                $msUet     = $this->detectMicrosoftUet($htmlContent);
                $hotjar    = $this->detectHotjar($htmlContent);
                $clarity   = $this->detectClarity($htmlContent);
                $pageGtmIds = $this->detectGtmIds($htmlContent);

                $allGA4       = array_merge($allGA4, $ga4['ids']);
                $allFacebook  = array_merge($allFacebook, $facebook['ids']);
                $allTikTok    = array_merge($allTikTok, $tiktok['ids']);
                $allGtm       = array_merge($allGtm, $pageGtmIds);
                $allLinkedin  = array_merge($allLinkedin, $linkedin['ids']);
                $allTwitter   = array_merge($allTwitter, $twitter['ids']);
                $allPinterest = array_merge($allPinterest, $pinterest['ids']);
                $allSnapchat  = array_merge($allSnapchat, $snapchat['ids']);
                $allMsUet     = array_merge($allMsUet, $msUet['ids']);
                $allHotjar    = array_merge($allHotjar, $hotjar['ids']);
                $allClarity   = array_merge($allClarity, $clarity['ids']);

                // Per-page coverage: count pages where each tracker family appears.
                if ($ga4['detected'])                 $pageHits['ga4']++;
                if ($facebook['detected'])            $pageHits['facebook_pixel']++;
                if ($tiktok['detected'])              $pageHits['tiktok_pixel']++;
                if (! empty($pageGtmIds))             $pageHits['google_tag_manager']++;
                if ($linkedin['detected'])            $pageHits['linkedin_insight']++;
                if ($twitter['detected'])             $pageHits['twitter_pixel']++;
                if ($pinterest['detected'])           $pageHits['pinterest_tag']++;
                if ($snapchat['detected'])            $pageHits['snapchat_pixel']++;
                if ($msUet['detected'])               $pageHits['microsoft_uet']++;
                if ($hotjar['detected'])              $pageHits['hotjar']++;
                if ($clarity['detected'])             $pageHits['clarity']++;

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

        // Fetch GTM container JS files and scan them for pixel IDs inside the container.
        $gtmIds = array_values(array_unique(array_merge(
            $this->detectGtmIds($this->collectedHtml),
            $allGtm
        )));
        foreach ($gtmIds as $gtmId) {
            try {
                $containerUrl = "https://www.googletagmanager.com/gtm.js?id={$gtmId}";
                $containerJs  = Http::timeout(10)->get($containerUrl);
                if ($containerJs->successful()) {
                    $js = $containerJs->body();
                    $ga4  = $this->detectGA4($js);
                    $fb   = $this->detectFacebookPixel($js);
                    $tt   = $this->detectTikTokPixel($js);
                    $allGA4      = array_merge($allGA4,      $ga4['ids']);
                    $allFacebook = array_merge($allFacebook, $fb['ids']);
                    $allTikTok   = array_merge($allTikTok,   $tt['ids']);
                    // Also treat GTM presence as implicit GA4 detection
                    if (empty($allGA4)) $allGA4 = ["via-{$gtmId}"];
                }
            } catch (\Throwable) {}
        }

        $allGA4       = array_values(array_unique($allGA4));
        $allFacebook  = array_values(array_unique($allFacebook));
        $allTikTok    = array_values(array_unique($allTikTok));
        $allGtm       = array_values(array_unique($gtmIds));
        $allLinkedin  = array_values(array_unique($allLinkedin));
        $allTwitter   = array_values(array_unique($allTwitter));
        $allPinterest = array_values(array_unique($allPinterest));
        $allSnapchat  = array_values(array_unique($allSnapchat));
        $allMsUet     = array_values(array_unique($allMsUet));
        $allHotjar    = array_values(array_unique($allHotjar));
        $allClarity   = array_values(array_unique($allClarity));

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

        // Detection flags per tracker family. For ga4/facebook/tiktok we preserve the
        // original "ids present" semantics (also captures container-fetch-only hits);
        // for the newer families a per-page presence hit also counts as detected.
        $detectedFlags = [
            'ga4'                => count($allGA4) > 0,
            'facebook_pixel'     => count($allFacebook) > 0,
            'tiktok_pixel'       => count($allTikTok) > 0,
            'google_tag_manager' => count($allGtm) > 0,
            'linkedin_insight'   => count($allLinkedin) > 0  || $pageHits['linkedin_insight'] > 0,
            'twitter_pixel'      => count($allTwitter) > 0   || $pageHits['twitter_pixel'] > 0,
            'pinterest_tag'      => count($allPinterest) > 0 || $pageHits['pinterest_tag'] > 0,
            'snapchat_pixel'     => count($allSnapchat) > 0  || $pageHits['snapchat_pixel'] > 0,
            'microsoft_uet'      => count($allMsUet) > 0     || $pageHits['microsoft_uet'] > 0,
            'hotjar'             => count($allHotjar) > 0    || $pageHits['hotjar'] > 0,
            'clarity'            => count($allClarity) > 0   || $pageHits['clarity'] > 0,
        ];

        $trackingScripts = [
            'ga4'                => ['detected' => $detectedFlags['ga4'],                'ids' => $allGA4],
            'facebook_pixel'     => ['detected' => $detectedFlags['facebook_pixel'],     'ids' => $allFacebook],
            'tiktok_pixel'       => ['detected' => $detectedFlags['tiktok_pixel'],       'ids' => $allTikTok],
            'google_tag_manager' => ['detected' => $detectedFlags['google_tag_manager'], 'ids' => $allGtm],
            'linkedin_insight'   => ['detected' => $detectedFlags['linkedin_insight'],   'ids' => $allLinkedin],
            'twitter_pixel'      => ['detected' => $detectedFlags['twitter_pixel'],      'ids' => $allTwitter],
            'pinterest_tag'      => ['detected' => $detectedFlags['pinterest_tag'],      'ids' => $allPinterest],
            'snapchat_pixel'     => ['detected' => $detectedFlags['snapchat_pixel'],     'ids' => $allSnapchat],
            'microsoft_uet'      => ['detected' => $detectedFlags['microsoft_uet'],      'ids' => $allMsUet],
            'hotjar'             => ['detected' => $detectedFlags['hotjar'],             'ids' => $allHotjar],
            'clarity'            => ['detected' => $detectedFlags['clarity'],            'ids' => $allClarity],
        ];

        // Per-tracker coverage across crawled pages. Only detected families are listed.
        $coverageTrackers = [];
        foreach ($detectedFlags as $family => $isDetected) {
            if (! $isDetected) {
                continue;
            }
            $coverageTrackers[$family] = $pagesCrawled > 0
                ? (int) round(($pageHits[$family] / $pagesCrawled) * 100)
                : 0;
        }

        return [
            'site_url'         => $pageUrl,
            'pages_crawled'    => $pagesCrawled,
            'tracking_scripts' => $trackingScripts,
            'coverage'         => [
                'pages_crawled' => $pagesCrawled,
                'trackers'      => $coverageTrackers,
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
    private function detectGtmIds(string $html): array
    {
        $ids = [];
        // IIFE form: })(window,document,'script','dataLayer','GTM-XXXXX');
        if (preg_match_all("/['\"]+(GTM-[A-Z0-9]{4,})['\"]+/", $html, $matches)) {
            $ids = array_merge($ids, $matches[1]);
        }
        // Direct URL form: gtm.js?id=GTM-XXXXX
        if (preg_match_all('/gtm\.js\?id=(GTM-[A-Z0-9]{4,})/i', $html, $matches)) {
            $ids = array_merge($ids, $matches[1]);
        }
        return array_values(array_unique($ids));
    }

    private function detectGA4(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: gtag/js with measurement ID in src
        if (preg_match_all('/googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/i', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 2: gtm.js URL form
        if (preg_match_all('/gtm\.js\?id=(GTM-[A-Z0-9]+)/i', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 3: gtag config call — G- or GTM- IDs
        if (preg_match_all('/gtag\([\'"]config[\'"]\s*,\s*[\'"]([GM]-[A-Z0-9\-]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 4: bare G- measurement ID in quotes anywhere
        if (preg_match_all('/[\'"]+(G-[A-Z0-9]{6,})[\'\"]+/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 5: dataLayer push with measurement_id
        if (preg_match_all('/[\'"]measurement_id[\'"]\s*:\s*[\'"]([G]-[A-Z0-9]+)[\'"]/', $htmlContent, $matches)) {
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

    /**
     * Detect LinkedIn Insight Tag.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectLinkedInInsight(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: _linkedin_partner_id variable
        if (preg_match_all('/_linkedin_partner_id\s*=\s*[\'"]?(\d+)[\'"]?/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 2: insight.min.js analytics loader
        if (preg_match_all('/snap\.licdn\.com\/li\.lms-analytics\/insight\.min\.js/i', $htmlContent)) {
            $detected = true;
        }

        // Pattern 3: linkedin_data_partner_ids array entries
        if (preg_match_all('/linkedin_data_partner_ids[^\]]*?(\d{4,})/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }

    /**
     * Detect X / Twitter Pixel (uwt).
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectTwitterPixel(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: uwt.js loader
        if (preg_match_all('/static\.ads-twitter\.com\/uwt\.js/i', $htmlContent)) {
            $detected = true;
        }

        // Pattern 2: twq('config', 'ID') / twq("config", "ID")
        if (preg_match_all('/twq\([\'"]config[\'"]\s*,\s*[\'"]([A-Za-z0-9]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 3: twq('init', 'ID')
        if (preg_match_all('/twq\([\'"]init[\'"]\s*,\s*[\'"]([A-Za-z0-9]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }

    /**
     * Detect Pinterest Tag.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectPinterestTag(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: core.js loader
        if (preg_match_all('/s\.pinimg\.com\/ct\/core\.js/i', $htmlContent)) {
            $detected = true;
        }

        // Pattern 2: pintrk('load', 'ID')
        if (preg_match_all('/pintrk\([\'"]load[\'"]\s*,\s*[\'"]([0-9]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 3: pintrk('init', 'ID')
        if (preg_match_all('/pintrk\([\'"]init[\'"]\s*,\s*[\'"]([0-9]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }

    /**
     * Detect Snapchat Pixel.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectSnapchatPixel(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: scevent.min.js loader
        if (preg_match_all('/sc-static\.net\/scevent\.min\.js/i', $htmlContent)) {
            $detected = true;
        }

        // Pattern 2: snaptr('init', 'ID')
        if (preg_match_all('/snaptr\([\'"]init[\'"]\s*,\s*[\'"]([^\'"]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }

    /**
     * Detect Microsoft / Bing UET tag.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectMicrosoftUet(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: bat.js loader combined with the uetq queue global
        if (preg_match_all('/bat\.bing\.com\/bat\.js/i', $htmlContent)
            && preg_match('/uetq/', $htmlContent)) {
            $detected = true;
        }

        // Pattern 2: ti:"ID" UET tag id inside the init object
        if (preg_match_all('/[\'"]?ti[\'"]?\s*:\s*[\'"]([0-9]+)[\'"]/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }

    /**
     * Detect Hotjar tracking.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectHotjar(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: static.hotjar.com loader
        if (preg_match_all('/static\.hotjar\.com/i', $htmlContent)) {
            $detected = true;
        }

        // Pattern 2: hj('...') queue call
        if (preg_match_all('/\bhj\([\'"]/', $htmlContent)) {
            $detected = true;
        }

        // Pattern 3: hjid: ID site identifier
        if (preg_match_all('/hjid\s*:\s*[\'"]?(\d+)[\'"]?/', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }

    /**
     * Detect Microsoft Clarity.
     *
     * @param string $htmlContent
     * @return array
     */
    private function detectClarity(string $htmlContent): array
    {
        $detected = false;
        $ids = [];

        // Pattern 1: clarity.ms/tag/PROJECT_ID loader
        if (preg_match_all('/clarity\.ms\/tag\/([A-Za-z0-9]+)/i', $htmlContent, $matches)) {
            $detected = true;
            $ids = array_merge($ids, array_unique($matches[1]));
        }

        // Pattern 2: clarity("...") queue call (present but no extractable id)
        if (preg_match_all('/clarity\([\'"]/', $htmlContent)) {
            $detected = true;
        }

        return [
            'detected' => $detected,
            'ids' => array_values(array_unique($ids)),
        ];
    }
}
