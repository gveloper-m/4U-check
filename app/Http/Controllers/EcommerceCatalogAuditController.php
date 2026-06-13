<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use Spatie\Browsershot\Browsershot;
use App\Traits\FetchesWebPages;

class EcommerceCatalogAuditController extends Controller
{
    use FetchesWebPages;

    private $baseHost = '';

    /**
     * Audit an e-commerce site for catalog integrity across all product pages.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function auditCatalogIntegrity(Request $request): JsonResponse
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

        $visited      = [];         // url => true  (O(1) lookup)
        $inQueue      = [$pageUrl => true];
        $queue        = [$pageUrl];
        $productPages = [];
        $auditResults = [];
        $pagesCrawled = 0;
        $deadline     = microtime(true) + 180; // hard 3-minute budget
        $maxPages     = 50;

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
                $response = $responses[$url] ?? null;
                if ($response instanceof \Throwable || ! $response || ! $response->successful()) {
                    $visited[$url] = true;
                    continue;
                }

                $visited[$url] = true;
                $htmlContent   = $response->body();
                $pagesCrawled++;

                if ($this->isProductPage($htmlContent, $url)) {
                    $productPages[$url] = $htmlContent; // key=url, value=html already fetched
                }

                foreach ($this->extractInternalLinks($htmlContent, $url) as $link) {
                    if (! isset($visited[$link]) && ! isset($inQueue[$link])) {
                        $queue[]        = $link;
                        $inQueue[$link] = true;
                    }
                }
            }
        }

        $brokenCount = 0;

        foreach ($productPages as $productUrl => $htmlContent) {
            try {
                $crawler            = new Crawler($htmlContent, $productUrl);
                $schemaData         = $this->extractSchemaData($crawler);
                $priceCheck         = $this->checkPriceIntegrity($crawler, $htmlContent);
                $stockCheck         = $this->checkStockStatus($crawler, $schemaData);
                $cartButtonDisabled = $this->isCartButtonDisabled($crawler, $htmlContent);
                $isBroken           = $priceCheck['has_error'] || $stockCheck['is_mismatch'] || $cartButtonDisabled;

                if ($isBroken) {
                    $brokenCount++;
                }

                $auditResults[] = [
                    'url'             => $productUrl,
                    'is_broken'       => $isBroken,
                    'has_price_error' => $priceCheck['has_error'],
                    'price_errors'    => $priceCheck['error_details'],
                    'detected_price'  => $priceCheck['detected_price'],
                    'schema_stock'    => $schemaData['stock_status'] ?? null,
                    'schema_price'    => $schemaData['price'] ?? null,
                    'frontend_stock'  => $stockCheck['frontend_status'],
                    'stock_mismatch'  => $stockCheck['is_mismatch'],
                    'stock_details'   => $stockCheck['mismatch_details'],
                    'cart_disabled'   => $cartButtonDisabled,
                ];

                DB::table('ecommerce_catalog_audits')->insert([
                    'page_url'            => $productUrl,
                    'has_price_error'     => $priceCheck['has_error'],
                    'detected_price'      => $priceCheck['detected_price'],
                    'schema_stock_status' => $schemaData['stock_status'] ?? null,
                    'cart_button_disabled'=> $cartButtonDisabled,
                    'is_broken_catalog'   => $isBroken,
                    'executed_at'         => now(),
                ]);
            } catch (\Exception $e) {
                continue;
            }
        }

        return [
            'site_url'               => $pageUrl,
            'pages_crawled'          => $pagesCrawled,
            'product_pages_found'    => count(array_keys($productPages)),
            'products_audited'       => count($auditResults),
            'broken_products_count'  => $brokenCount,
            'broken_percentage'      => count($auditResults) > 0
                ? round(($brokenCount / count($auditResults)) * 100, 2)
                : 0,
            'results'                => $auditResults,
            'executed_at'            => now(),
        ];
    }

    /**
     * Get audit history for catalog checks.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getAuditHistory(Request $request): JsonResponse
    {
        try {
            $query = DB::table('ecommerce_catalog_audits');

            if ($request->has('page_url')) {
                $query->where('page_url', $request->query('page_url'));
            }

            if ($request->has('broken_only') && $request->boolean('broken_only')) {
                $query->where('is_broken_catalog', true);
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
     * Check if page is a product page.
     * Requires at least one strong signal rather than matching broad keywords.
     */
    private function isProductPage(string $htmlContent, string $url = ''): bool
    {
        // Exclude pages that are definitely not individual products
        if ($url && preg_match('#/(?:collection|category|campaign|help|blog|news|store-locator|cart|signin|search|wishlist|account|checkout)(?:/|$)#i', $url)) {
            return false;
        }

        // Strong signal 1: JSON-LD schema.org Product type
        if (str_contains($htmlContent, '"@type":"Product"') ||
            str_contains($htmlContent, '"@type": "Product"')) {
            return true;
        }

        // Strong signal 2: og:type = product (Open Graph)
        if (preg_match('/<meta[^>]+property=["\']og:type["\'][^>]+content=["\']product["\']|<meta[^>]+content=["\']product["\'][^>]+property=["\']og:type["\']/i', $htmlContent)) {
            return true;
        }

        // URL-based signal: /product/ or /p/ path segment
        if ($url && preg_match('~/(?:product|item|p)/[^/?]+~i', $url)) {
            return true;
        }

        // Strong signal 3: WooCommerce / Shopify add-to-cart form with a price element
        $hasAddToCart = preg_match('/(?:add[_-]to[_-]cart|single_add_to_cart_button|btn[_-]add[_-]to[_-]cart|Προσθήκη στο καλάθι)/i', $htmlContent);
        $hasPrice     = preg_match('/<[^>]+class="[^"]*(?:^|\s)(?:price|product-price|woocommerce-Price)(?:\s|$)[^"]*"[^>]*>/i', $htmlContent);

        if ($hasAddToCart && $hasPrice) {
            return true;
        }

        return false;
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
     * Extract JSON-LD schema data from the page.
     *
     * @param Crawler $crawler
     * @return array
     */
    private function extractSchemaData(Crawler $crawler): array
    {
        $schemaData = [
            'stock_status' => null,
            'price' => null,
        ];

        try {
            $crawler->filter('script[type="application/ld+json"]')->each(function (Crawler $node) use (&$schemaData) {
                $scriptContent = $node->text();
                
                if (empty($scriptContent)) {
                    return;
                }

                $jsonData = json_decode($scriptContent, true);

                if (!is_array($jsonData)) {
                    return;
                }

                // Check for Product type
                if (isset($jsonData['@type']) && $jsonData['@type'] === 'Product') {
                    // Extract stock status
                    if (isset($jsonData['offers'])) {
                        $offers = is_array($jsonData['offers']) ? $jsonData['offers'] : [$jsonData['offers']];
                        
                        foreach ($offers as $offer) {
                            if (isset($offer['availability'])) {
                                $schemaData['stock_status'] = $offer['availability'];
                            }
                            if (isset($offer['price'])) {
                                $schemaData['price'] = $offer['price'];
                            }
                        }
                    }
                }
            });

        } catch (\Exception $e) {
            \Log::debug("Error extracting schema data: " . $e->getMessage());
        }

        return $schemaData;
    }

    /**
     * Check for price integrity errors.
     *
     * @param Crawler $crawler
     * @param string $htmlContent
     * @return array
     */
    private function checkPriceIntegrity(Crawler $crawler, string $htmlContent): array
    {
        $result = [
            'has_error' => false,
            'detected_price' => null,
            'error_details' => [],
        ];

        // Pattern 1: Look for zero price (e.g., "0,00€", "0.00 €")
        if (preg_match_all('/0[,\.]\s*00\s*€|€\s*0[,\.]\s*00|0\.00\s*€|€\s*0\.00/', $htmlContent, $matches)) {
            $result['has_error'] = true;
            $result['error_details'][] = 'Zero price detected in page content';
        }

        // Pattern 2: Look for "Δωρεάν" (Free in Greek) where it shouldn't be
        if (preg_match_all('/Δωρεάν|free|complimentary/i', $htmlContent, $matches)) {
            // Check if it's in a price context (near price elements)
            if ($this->isInPriceContext($htmlContent, $matches[0][0] ?? '')) {
                $result['has_error'] = true;
                $result['error_details'][] = 'Free/complimentary indicator detected where price expected';
            }
        }

        // Pattern 3: Look for empty price fields
        if (preg_match_all('/<[^>]*class="[^"]*price[^"]*"[^>]*>\s*(?:<[^>]*>)*\s*(?:<\/[^>]*>)?/', $htmlContent, $matches)) {
            foreach ($matches[0] as $priceElement) {
                if (empty(strip_tags($priceElement))) {
                    $result['has_error'] = true;
                    $result['error_details'][] = 'Empty price element detected';
                }
            }
        }

        // Pattern 4: Try to extract actual price (require at least one digit)
        if (preg_match('/€\s*(\d[\d,\.]*)|price["\']?\s*[=:]\s*["\']?(\d[\d,\.]*)/i', $htmlContent, $matches)) {
            $priceValue = ($matches[1] !== '') ? $matches[1] : (($matches[2] !== '') ? $matches[2] : null);
            if ($priceValue) {
                $result['detected_price'] = $priceValue;
            }
        }

        // Pattern 5: Check for missing price entirely
        $priceElements = $crawler->filter('[class*="price"], [id*="price"], .product-price, .price')->count();
        if ($priceElements === 0) {
            $result['has_error'] = true;
            $result['error_details'][] = 'No price elements found on page';
        }

        // If a price was detected via regex or JSON-LD, clear "empty element" false-positives
        // (JS-rendered sites have SSR price containers that are empty until hydration)
        if (! empty($result['detected_price'])) {
            $result['error_details'] = array_values(array_filter(
                $result['error_details'],
                fn($e) => ! str_contains($e, 'Empty price element') && ! str_contains($e, 'No price elements')
            ));
            $result['has_error'] = ! empty($result['error_details']);
        }

        return $result;
    }

    /**
     * Check stock status consistency.
     *
     * @param Crawler $crawler
     * @param array $schemaData
     * @return array
     */
    private function checkStockStatus(Crawler $crawler, array $schemaData): array
    {
        $result = [
            'frontend_status' => 'unknown',
            'is_mismatch' => false,
            'mismatch_details' => [],
        ];

        $schemaStatus = $schemaData['stock_status'] ?? null;

        // Check for "out of stock" indicators
        $outOfStockIndicators = [
            'Εξαντλήθηκε', // Greek: Out of Stock
            'Out of Stock',
            'out-of-stock',
            'unavailable',
            'sold-out',
            'Unavailable',
            'Not Available',
        ];

        $htmlContent = $crawler->html();
        $isOutOfStock = false;

        foreach ($outOfStockIndicators as $indicator) {
            if (stripos($htmlContent, $indicator) !== false) {
                $isOutOfStock = true;
                $result['frontend_status'] = 'OutOfStock';
                break;
            }
        }

        if (!$isOutOfStock) {
            $result['frontend_status'] = 'InStock';
        }

        // Check for mismatch between schema and frontend
        if ($schemaStatus && $schemaStatus !== $result['frontend_status']) {
            $result['is_mismatch'] = true;
            $result['mismatch_details'][] = "Schema says {$schemaStatus} but frontend shows {$result['frontend_status']}";
        }

        // Additional check: presence of "Add to Cart" button
        $addToCartExists = $crawler->filter('[class*="add-to-cart"], [class*="add-cart"], button:contains("Add to Cart"), button:contains("Προσθήκη στο καλάθι")')->count() > 0;

        if ($isOutOfStock && $addToCartExists) {
            $result['is_mismatch'] = true;
            $result['mismatch_details'][] = 'Out of Stock status shown but Add to Cart button is visible';
        }

        if (!$isOutOfStock && !$addToCartExists) {
            $result['mismatch_details'][] = 'In Stock but no Add to Cart button found';
        }

        return $result;
    }

    /**
     * Check if cart button is disabled.
     *
     * @param Crawler $crawler
     * @param string $htmlContent
     * @return bool
     */
    private function isCartButtonDisabled(Crawler $crawler, string $htmlContent): bool
    {
        // Look for disabled add to cart button
        $disabledButton = $crawler->filter('[class*="add-to-cart"][disabled], [class*="add-cart"][disabled], button:contains("Add to Cart")[disabled]')->count() > 0;

        if ($disabledButton) {
            return true;
        }

        // Check for disabled attribute in HTML
        if (preg_match('/add-to-cart.*?disabled|disabled.*?add-to-cart/i', $htmlContent)) {
            return true;
        }

        // Check for stock-related class that disables button
        if (preg_match('/class="[^"]*(?:disabled|unavailable|out-of-stock)[^"]*".*?add-to-cart|add-to-cart.*?class="[^"]*(?:disabled|unavailable|out-of-stock)[^"]*"/i', $htmlContent)) {
            return true;
        }

        return false;
    }

    /**
     * Check if a match is in a price context.
     *
     * @param string $htmlContent
     * @param string $match
     * @return bool
     */
    private function isInPriceContext(string $htmlContent, string $match): bool
    {
        // Find position of match
        $pos = strpos($htmlContent, $match);

        if ($pos === false) {
            return false;
        }

        // Get surrounding context (500 chars before and after)
        $start = max(0, $pos - 250);
        $end = min(strlen($htmlContent), $pos + 250);
        $context = substr($htmlContent, $start, $end - $start);

        // Check if context contains price-related elements
        $priceIndicators = ['€', '$', '£', '¥', 'price', 'cost', 'amount'];

        foreach ($priceIndicators as $indicator) {
            if (stripos($context, $indicator) !== false) {
                return true;
            }
        }

        return false;
    }
}

