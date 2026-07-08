<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use Spatie\Browsershot\Browsershot;
use Carbon\Carbon;
use App\Traits\FetchesWebPages;

class BrokenResourceController extends Controller
{
    use FetchesWebPages;

    private $visitedUrls = [];
    private $queuedUrls = [];
    private $allLinks = [];
    private $allImages = [];
    private $baseHost = '';
    private int $screenshotBudget = 6;
    private array $foundOnScreenshotCache = [];

    /**
     * Audit a site for broken links and images across all pages.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function auditBrokenResources(Request $request): JsonResponse
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
        $this->allLinks  = [];
        $this->allImages = [];
        $parsedUrl       = parse_url($pageUrl);
        $this->baseHost  = $parsedUrl['host'] ?? '';

        $visited        = [];           // url => true  (O(1) lookup)
        $inQueue        = [$pageUrl => true];
        $queue          = [$pageUrl];
        $pagesProcessed = 0;
        $deadline       = microtime(true) + 210; // hard 3.5-minute budget
        // The deadline above is the real governor of wall-clock time; this
        // cap just stops the BFS queue from growing unbounded in memory on
        // very large sites. Raised so mid-size sites get fully crawled
        // instead of stopping early on link/image checks.
        $maxPages       = 150;

        while (! empty($queue) && $pagesProcessed < $maxPages && microtime(true) < $deadline) {
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
                $resources     = $this->extractResources($htmlContent, $url);

                $this->allLinks  = array_merge($this->allLinks,  $resources['links']);
                $this->allImages = array_merge($this->allImages, $resources['images']);

                foreach ($resources['pages'] as $newPage) {
                    if (! isset($visited[$newPage]) && ! isset($inQueue[$newPage])) {
                        $queue[]             = $newPage;
                        $inQueue[$newPage]   = true;
                    }
                }
                $pagesProcessed++;
            }
        }

        // Dedup by URL across all crawled pages, keeping the first found_on reference
        $seen = [];
        $uniqueLinks = [];
        foreach ($this->allLinks as $item) {
            if (!isset($seen[$item['url']])) {
                $seen[$item['url']] = true;
                $uniqueLinks[] = $item;
            }
        }
        $this->allLinks = $uniqueLinks;

        $seen = [];
        $uniqueImages = [];
        foreach ($this->allImages as $item) {
            if (!isset($seen[$item['url']])) {
                $seen[$item['url']] = true;
                $uniqueImages[] = $item;
            }
        }
        $this->allImages = $uniqueImages;

        $brokenLinks  = $this->checkResources($this->allLinks);
        $brokenImages = $this->checkResources($this->allImages);

        DB::table('broken_resources_audits')->insert([
            'site_url'             => $pageUrl,
            'total_links_checked'  => count($this->allLinks),
            'total_images_checked' => count($this->allImages),
            'broken_links'         => count($brokenLinks)  > 0 ? json_encode($brokenLinks)  : null,
            'broken_images'        => count($brokenImages) > 0 ? json_encode($brokenImages) : null,
            'executed_at'          => now(),
        ]);

        $topBrokenLinks  = array_slice($brokenLinks,  0, 20);
        $topBrokenImages = array_slice($brokenImages, 0, 20);

        // Screenshot the page each broken link/image was found on, so the report
        // can show visual context for where the problem lives (capped across both
        // lists to avoid launching too many Chrome instances per scan).
        $this->attachFoundOnScreenshots($topBrokenLinks);
        $this->attachFoundOnScreenshots($topBrokenImages);

        return [
            'site_url'      => $pageUrl,
            'pages_crawled' => $pagesProcessed,
            'summary'       => [
                'total_links_checked'      => count($this->allLinks),
                'broken_links_count'       => count($brokenLinks),
                'broken_links_percentage'  => count($this->allLinks)  > 0
                    ? round((count($brokenLinks)  / count($this->allLinks))  * 100, 2) : 0,
                'total_images_checked'     => count($this->allImages),
                'broken_images_count'      => count($brokenImages),
                'broken_images_percentage' => count($this->allImages) > 0
                    ? round((count($brokenImages) / count($this->allImages)) * 100, 2) : 0,
            ],
            'broken_links'  => $topBrokenLinks,
            'broken_images' => $topBrokenImages,
            'executed_at'   => now(),
        ];
    }

    /**
     * Attach a screenshot of the page each item was found on. Screenshots are
     * cached per found_on URL (several broken items often share the same page)
     * and capped by $this->screenshotBudget across the whole audit run.
     */
    private function attachFoundOnScreenshots(array &$items): void
    {
        foreach ($items as &$item) {
            $page = $item['found_on'] ?? null;
            if (! $page) {
                continue;
            }

            if (! array_key_exists($page, $this->foundOnScreenshotCache)) {
                if ($this->screenshotBudget <= 0) {
                    $this->foundOnScreenshotCache[$page] = null;
                    continue;
                }
                $this->foundOnScreenshotCache[$page] = $this->captureScreenshot($page);
                $this->screenshotBudget--;
            }

            if ($this->foundOnScreenshotCache[$page]) {
                $item['screenshot'] = $this->foundOnScreenshotCache[$page];
            }
        }
        unset($item);
    }

    /**
     * Get audit history for a site or all audits.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getAuditHistory(Request $request): JsonResponse
    {
        try {
            $query = DB::table('broken_resources_audits');
            
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
     * Extract all links, images, and internal pages from HTML content.
     *
     * @param string $htmlContent
     * @param string $baseUrl
     * @return array
     */
    private function extractResources(string $htmlContent, string $baseUrl): array
    {
        $crawler = new Crawler($htmlContent, $baseUrl);
        
        $links      = [];
        $images     = [];
        $pages      = [];
        $seenLinks  = [];
        $seenImages = [];

        $aElements = $crawler->filter('a[href]');

        // Extract all links (a tags with href)
        $aElements->each(function (Crawler $node) use (&$links, &$pages, &$seenLinks, $baseUrl) {
            $href = $node->attr('href');

            // Skip empty, hash-only, and javascript links
            if (empty($href) || $href === '#' || str_starts_with($href, 'javascript:')
                || str_starts_with($href, 'mailto:') || str_starts_with($href, 'tel:')
                || str_starts_with($href, '#')) {
                return;
            }

            $absoluteUrl = $this->makeAbsoluteUrl($href, $baseUrl);

            // Check if it's an internal link on same host
            $urlHost = parse_url($absoluteUrl)['host'] ?? '';
            if ($urlHost === $this->baseHost) {
                $cleanUrl = explode('#', $absoluteUrl)[0];
                if (!in_array($cleanUrl, $pages) && !in_array($cleanUrl, $this->visitedUrls)) {
                    $pages[] = $cleanUrl;
                }
            }

            if (!isset($seenLinks[$absoluteUrl])) {
                $seenLinks[$absoluteUrl] = true;
                $links[] = ['url' => $absoluteUrl, 'found_on' => $baseUrl];
            }
        });

        // Extract all images (img tags with src)
        $crawler->filter('img[src]')->each(function (Crawler $node) use (&$images, &$seenImages, $baseUrl) {
            $src = $node->attr('src');

            if (empty($src)) {
                return;
            }

            $absoluteUrl = $this->makeAbsoluteUrl($src, $baseUrl);
            if (!isset($seenImages[$absoluteUrl])) {
                $seenImages[$absoluteUrl] = true;
                $images[] = ['url' => $absoluteUrl, 'found_on' => $baseUrl];
            }
        });

        return [
            'links'  => $links,
            'images' => $images,
            'pages'  => array_unique($pages),
        ];
    }

    /**
     * Convert relative URLs to absolute URLs.
     *
     * @param string $url
     * @param string $baseUrl
     * @return string
     */
    private function makeAbsoluteUrl(string $url, string $baseUrl): string
    {
        // Already absolute
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return $url;
        }
        
        // Parse base URL
        $baseParts = parse_url($baseUrl);
        $baseScheme = $baseParts['scheme'] ?? 'https';
        $baseHost = $baseParts['host'] ?? '';
        $baseAuthority = $baseHost . (isset($baseParts['port']) ? ':' . $baseParts['port'] : '');

        // Handle protocol-relative URLs (//example.com)
        if (str_starts_with($url, '//')) {
            return $baseScheme . ':' . $url;
        }

        // Handle root-relative URLs (/path)
        if (str_starts_with($url, '/')) {
            return $baseScheme . '://' . $baseAuthority . $url;
        }
        
        // Handle relative URLs (../path or ./path)
        $basePath = dirname($baseParts['path'] ?? '');
        
        // Simple relative path joining
        while (str_starts_with($url, '../')) {
            $url = substr($url, 3);
            $basePath = dirname($basePath);
        }
        
        $url = str_replace('./', '', $url);
        $basePath = rtrim($basePath, '/');
        
        return $baseScheme . '://' . $baseAuthority . $basePath . '/' . $url;
    }

    /**
     * Check resources concurrently using Http pool (batches of 20).
     *
     * @param array $urls
     * @return array
     */
    // $resources is [['url' => ..., 'found_on' => ...], ...]
    private function checkResources(array $resources): array
    {
        if (empty($resources)) {
            return [];
        }

        $brokenResources = [];
        $timeout         = 15;
        $batchSize       = 20;

        // Build a url => found_on map and a flat URL list for pooling
        $foundOnMap = [];
        $urlList    = [];
        foreach ($resources as $item) {
            $foundOnMap[$item['url']] = $item['found_on'] ?? null;
            $urlList[] = $item['url'];
        }

        foreach (array_chunk($urlList, $batchSize) as $batch) {
            $responses = Http::pool(function ($pool) use ($batch, $timeout) {
                foreach ($batch as $url) {
                    $pool->as($url)->timeout($timeout)->withoutRedirecting()->head($url);
                }
            });

            foreach ($batch as $url) {
                try {
                    $response = $responses[$url];
                    if ($response instanceof \Throwable) {
                        continue; // connection error — skip, not a broken link
                    }
                    $statusCode = $response->status();

                    // If HEAD not allowed, fall back to GET
                    if ($statusCode === 405) {
                        $response   = Http::timeout($timeout)->withoutRedirecting()->get($url);
                        $statusCode = $response->status();
                    }

                    // 403/401/429 = server is alive but blocking our checker — not broken for real users
                    if ($statusCode === 404 || $statusCode === 410 || $statusCode >= 500) {
                        $brokenResources[] = [
                            'url'         => $url,
                            'status_code' => $statusCode,
                            'found_on'    => $foundOnMap[$url] ?? null,
                        ];
                    }
                } catch (\Exception $e) {
                    $brokenResources[] = [
                        'url'      => $url,
                        'error'    => 'Timeout or connection error',
                        'found_on' => $foundOnMap[$url] ?? null,
                    ];
                }
            }
        }

        return $brokenResources;
    }
}

