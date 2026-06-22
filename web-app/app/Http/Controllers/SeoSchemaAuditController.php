<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use App\Traits\FetchesWebPages;

class SeoSchemaAuditController extends Controller
{
    use FetchesWebPages;

    public function auditSeoSchema(Request $request): JsonResponse
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
        $htmlContent = $this->fetchHtml($pageUrl);
        $crawler     = new Crawler($htmlContent, $pageUrl);

        $titleCheck       = $this->checkMetaTitle($crawler);
        $descriptionCheck = $this->checkMetaDescription($crawler);

        $h1Count  = $crawler->filter('h1')->count();
        $h1Status = match (true) {
            $h1Count === 0 => 'MISSING',
            $h1Count === 1 => 'OK',
            default        => 'MULTIPLE',
        };

        $canonicalUrl  = null;
        $canonicalNode = $crawler->filter('link[rel="canonical"]');
        if ($canonicalNode->count() > 0) {
            $canonicalUrl = $canonicalNode->first()->attr('href');
        }
        $canonicalMatches = $canonicalUrl !== null
            ? rtrim($canonicalUrl, '/') === rtrim($pageUrl, '/')
            : null;

        $schemaValidation = $this->validateSchemaJsonLd($crawler);
        $openGraph        = $this->checkOpenGraph($crawler);
        $imageAltText     = $this->checkImagesAltText($crawler);
        $technicalSeo     = $this->checkTechnicalSeo($pageUrl);

        DB::table('seo_schema_audits')->insert([
            'site_url'                => $pageUrl,
            'meta_title_status'       => $titleCheck['status'],
            'meta_description_status' => $descriptionCheck['status'],
            'h1_count'                => $h1Count,
            'canonical_url'           => $canonicalUrl,
            'has_valid_schema'        => $schemaValidation['has_valid_schema'],
            'schema_errors'           => empty($schemaValidation['errors']) ? null : json_encode($schemaValidation['errors']),
            'executed_at'             => now(),
        ]);

        return [
            'site_url'         => $pageUrl,
            'meta_title'       => $titleCheck,
            'meta_description' => $descriptionCheck,
            'h1_tags'          => ['count' => $h1Count, 'status' => $h1Status],
            'canonical'        => [
                'url'                 => $canonicalUrl,
                'matches_audited_url' => $canonicalMatches,
                'status'              => $canonicalUrl
                    ? ($canonicalMatches ? 'OK' : 'MISMATCH')
                    : 'MISSING',
            ],
            'schema_validation' => $schemaValidation,
            'open_graph'        => $openGraph,
            'image_alt_text'    => $imageAltText,
            'technical_seo'     => $technicalSeo,
            'executed_at'       => now(),
        ];
    }

    public function getAuditHistory(Request $request): JsonResponse
    {
        try {
            $query = DB::table('seo_schema_audits');

            if ($request->has('site_url')) {
                $query->where('site_url', $request->query('site_url'));
            }

            $audits = $query->latest('executed_at')->paginate(10);

            return response()->json([
                'success' => true,
                'audits'  => $audits,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 400);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function checkMetaTitle(Crawler $crawler): array
    {
        $titleNode = $crawler->filter('title');

        if ($titleNode->count() === 0) {
            return [
                'status' => 'MISSING',
                'value'  => null,
                'length' => 0,
                'issues' => ['Meta title tag is missing'],
            ];
        }

        $value  = trim($titleNode->first()->text());
        $length = strlen($value);
        $issues = [];

        if ($length === 0) {
            $status   = 'EMPTY';
            $issues[] = 'Meta title is empty';
        } elseif ($length > 60) {
            $status   = 'TOO_LONG';
            $issues[] = "Meta title is {$length} characters (recommended: 30–60)";
        } elseif ($length < 30) {
            $status   = 'TOO_SHORT';
            $issues[] = "Meta title is only {$length} characters (recommended: 30–60)";
        } else {
            $status = 'OK';
        }

        return compact('status', 'value', 'length', 'issues');
    }

    private function checkMetaDescription(Crawler $crawler): array
    {
        $metaNode = $crawler->filter('meta[name="description"]');

        if ($metaNode->count() === 0) {
            return [
                'status' => 'MISSING',
                'value'  => null,
                'length' => 0,
                'issues' => ['Meta description tag is missing'],
            ];
        }

        $value  = trim($metaNode->first()->attr('content') ?? '');
        $length = strlen($value);
        $issues = [];

        if ($length === 0) {
            $status   = 'EMPTY';
            $issues[] = 'Meta description is empty';
        } elseif ($length > 160) {
            $status   = 'TOO_LONG';
            $issues[] = "Meta description is {$length} characters (recommended: ≤160)";
        } else {
            $status = 'OK';
        }

        return compact('status', 'value', 'length', 'issues');
    }

    private function checkOpenGraph(Crawler $crawler): array
    {
        $tags   = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
        $result = ['found' => [], 'missing' => [], 'issues' => []];

        foreach ($tags as $property) {
            $node = $crawler->filter("meta[property=\"{$property}\"]");
            if ($node->count() > 0) {
                $content = trim($node->first()->attr('content') ?? '');
                $result['found'][$property] = $content ?: '(empty)';
                if ($content === '') {
                    $result['issues'][] = "{$property} is present but empty";
                }
            } else {
                $result['missing'][] = $property;
                $result['issues'][]  = "{$property} meta tag is missing";
            }
        }

        $result['status'] = empty($result['missing']) ? 'OK' : (count($result['missing']) <= 2 ? 'PARTIAL' : 'MISSING');
        return $result;
    }

    private function checkImagesAltText(Crawler $crawler): array
    {
        $total        = 0;
        $missingAlt   = 0;
        $missingUrls  = [];

        $crawler->filter('img')->each(function (Crawler $img) use (&$total, &$missingAlt, &$missingUrls) {
            $total++;
            $alt = $img->attr('alt');
            if ($alt === null || trim($alt) === '') {
                $missingAlt++;
                $src = $img->attr('src') ?? '(no src)';
                if (count($missingUrls) < 10) {
                    $missingUrls[] = $src;
                }
            }
        });

        return [
            'total_images'     => $total,
            'missing_alt'      => $missingAlt,
            'missing_alt_urls' => $missingUrls,
            'status'           => $missingAlt === 0 ? 'OK' : ($missingAlt <= 3 ? 'WARN' : 'BAD'),
            'issues'           => $missingAlt > 0
                ? ["{$missingAlt} image(s) missing alt attribute"]
                : [],
        ];
    }

    private function checkTechnicalSeo(string $pageUrl): array
    {
        $parsed  = parse_url($pageUrl);
        $base    = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
        $result  = ['robots_txt' => null, 'sitemap_xml' => null, 'issues' => []];

        foreach (['robots_txt' => '/robots.txt', 'sitemap_xml' => '/sitemap.xml'] as $key => $path) {
            try {
                $res = Http::withHeaders($this->browserHeaders())
                    ->timeout(10)
                    ->head($base . $path);
                if ($res->successful()) {
                    $result[$key] = ['exists' => true, 'status_code' => $res->status()];
                } else {
                    $result[$key] = ['exists' => false, 'status_code' => $res->status()];
                    $result['issues'][] = "{$path} not found (HTTP {$res->status()})";
                }
            } catch (\Throwable) {
                $result[$key]   = ['exists' => false, 'status_code' => null];
                $result['issues'][] = "{$path} could not be fetched";
            }
        }

        return $result;
    }

    private function validateSchemaJsonLd(Crawler $crawler): array
    {
        $result = [
            'has_valid_schema' => false,
            'schemas_found'    => [],
            'errors'           => [],
        ];

        // Required fields per known @type
        $requiredFields = [
            'Product'      => ['name', 'image'],
            'WebSite'      => ['name'],
            'Organization' => ['name'],
            'LocalBusiness'=> ['name'],
            'Article'      => ['headline'],
            'BreadcrumbList'=> ['itemListElement'],
        ];

        $crawler->filter('script[type="application/ld+json"]')->each(
            function (Crawler $node) use (&$result, $requiredFields) {
                $raw = trim($node->text());

                if (empty($raw)) {
                    $result['errors'][] = 'Empty JSON-LD script block found';
                    return;
                }

                $data = json_decode($raw, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    $result['errors'][] = 'Invalid JSON in LD+JSON block: ' . json_last_error_msg();
                    return;
                }

                // Unwrap @graph arrays
                $schemas = isset($data['@graph']) && is_array($data['@graph'])
                    ? $data['@graph']
                    : [$data];

                foreach ($schemas as $schema) {
                    if (! is_array($schema)) {
                        continue;
                    }

                    $type   = $schema['@type'] ?? null;
                    $entry  = ['type' => $type, 'is_valid' => true, 'missing_keys' => []];

                    if ($type) {
                        $result['has_valid_schema'] = true;

                        if (isset($requiredFields[$type])) {
                            foreach ($requiredFields[$type] as $key) {
                                if (empty($schema[$key])) {
                                    $entry['is_valid']        = false;
                                    $entry['missing_keys'][]  = $key;
                                    $result['errors'][]       = "Schema '{$type}' missing required field: {$key}";
                                }
                            }
                        }
                    }

                    $result['schemas_found'][] = $entry;
                }
            }
        );

        return $result;
    }
}
