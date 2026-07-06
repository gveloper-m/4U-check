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
        $h1Check          = $this->checkH1Tags($crawler);
        $canonicalCheck   = $this->checkCanonical($crawler, $pageUrl);
        $schemaValidation = $this->validateSchemaMarkup($crawler);
        $openGraph        = $this->checkOpenGraph($crawler);
        $imageAltText     = $this->checkImagesAltText($crawler);
        $technicalSeo     = $this->checkTechnicalSeo($pageUrl);
        $robotsCheck      = $this->checkRobotsDirectives($crawler);
        $urlQuality       = $this->checkUrlQuality($pageUrl);
        $pageContent      = $this->checkPageContent($crawler);
        $headingStructure = $this->checkHeadingStructure($crawler);
        $internalLinking  = $this->checkInternalLinking($crawler, $pageUrl);

        DB::table('seo_schema_audits')->insert([
            'site_url'                => $pageUrl,
            'meta_title_status'       => $titleCheck['status'],
            'meta_description_status' => $descriptionCheck['status'],
            'h1_count'                => $h1Check['count'],
            'canonical_url'           => $canonicalCheck['url'],
            'has_valid_schema'        => $schemaValidation['has_valid_schema'],
            'schema_errors'           => empty($schemaValidation['errors']) ? null : json_encode($schemaValidation['errors']),
            'executed_at'             => now(),
        ]);

        return [
            'site_url'         => $pageUrl,
            'meta_title'       => $titleCheck,
            'meta_description' => $descriptionCheck,
            'h1_tags'          => $h1Check,
            'canonical'        => $canonicalCheck,
            'schema_validation'=> $schemaValidation,
            'open_graph'       => $openGraph,
            'image_alt_text'   => $imageAltText,
            'technical_seo'    => $technicalSeo,
            'robots_directives'=> $robotsCheck,
            'url_quality'      => $urlQuality,
            'page_content'     => $pageContent,
            'heading_structure'=> $headingStructure,
            'internal_linking' => $internalLinking,
            'executed_at'      => now(),
        ];
    }

    public function getAuditHistory(Request $request): JsonResponse
    {
        try {
            $query = DB::table('seo_schema_audits');
            if ($request->has('site_url')) {
                $query->where('site_url', $request->query('site_url'));
            }
            return response()->json(['success' => true, 'audits' => $query->latest('executed_at')->paginate(10)], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    // ── Meta title ────────────────────────────────────────────────────────────

    private function checkMetaTitle(Crawler $crawler): array
    {
        $titleNode = $crawler->filter('title');

        if ($titleNode->count() === 0) {
            return ['status' => 'MISSING', 'value' => null, 'length' => 0, 'issues' => ['Meta title tag is missing']];
        }

        $value  = trim($titleNode->first()->text());
        $length = mb_strlen($value);
        $issues = [];

        if ($length === 0) {
            $status = 'EMPTY';
            $issues[] = 'Meta title is empty';
        } elseif ($length > 60) {
            $status = 'TOO_LONG';
            $issues[] = "Meta title is {$length} characters — titles truncate around 60 characters in SERPs";
        } elseif ($length < 30) {
            $status = 'TOO_SHORT';
            $issues[] = "Meta title is only {$length} characters — aim for 30–60 to fill the SERP snippet";
        } else {
            $status = 'OK';
        }

        // Duplicate pipe/separator check: "Brand | Page | More" pattern dilutes keyword signal
        $separatorCount = substr_count($value, '|') + substr_count($value, ' - ') + substr_count($value, ' – ');
        if ($separatorCount >= 3) {
            $issues[] = 'Title has multiple separators — simplify to [Primary Keyword] | Brand';
        }

        return compact('status', 'value', 'length', 'issues');
    }

    // ── Meta description ─────────────────────────────────────────────────────
    // Meta description is secondary for modern search — it affects SERP snippet
    // display for branded queries but search engines increasingly auto-generate
    // snippets from page content. The lede paragraph is what matters most.

    private function checkMetaDescription(Crawler $crawler): array
    {
        $metaNode = $crawler->filter('meta[name="description"]');

        $desc = [
            'status' => 'MISSING',
            'value'  => null,
            'length' => 0,
            'issues' => [],
            'note'   => 'Meta description controls branded SERP snippets — the lede paragraph (first text after H1) is equally important for AI and modern search extraction',
            'lede'   => $this->extractLede($crawler),
        ];

        if ($metaNode->count() > 0) {
            $value  = trim($metaNode->first()->attr('content') ?? '');
            $length = mb_strlen($value);
            $desc['value']  = $value;
            $desc['length'] = $length;

            if ($length === 0) {
                $desc['status'] = 'EMPTY';
                $desc['issues'][] = 'Meta description is present but empty';
            } elseif ($length > 160) {
                $desc['status'] = 'TOO_LONG';
                $desc['issues'][] = "Meta description is {$length} characters — it will be truncated in SERPs beyond 160";
            } else {
                $desc['status'] = 'OK';
            }
        } else {
            $desc['issues'][] = 'Meta description tag is missing — add one for branded search display';
        }

        return $desc;
    }

    private function extractLede(Crawler $crawler): array
    {
        $ledeText = null;

        // Try content areas in descending specificity
        foreach (['main p', 'article p', '[role="main"] p', '.content p', '#content p', '#main p'] as $sel) {
            try {
                $p = $crawler->filter($sel)->first();
                if ($p->count() > 0) {
                    $text = trim(preg_replace('/\s+/', ' ', $p->text()));
                    if (mb_strlen($text) > 30) {
                        $ledeText = $text;
                        break;
                    }
                }
            } catch (\Throwable) {}
        }

        // Fall back to any first paragraph
        if (!$ledeText) {
            try {
                $crawler->filter('p')->each(function (Crawler $p) use (&$ledeText) {
                    if ($ledeText) return;
                    $text = trim(preg_replace('/\s+/', ' ', $p->text()));
                    if (mb_strlen($text) > 30) $ledeText = $text;
                });
            } catch (\Throwable) {}
        }

        $length = $ledeText ? mb_strlen($ledeText) : 0;
        $issues = [];

        if (!$ledeText) {
            $issues[] = 'No lede paragraph found — add a clear opening sentence after the H1 that states what the page covers';
        } elseif ($length < 60) {
            $issues[] = 'Lede paragraph is very short — expand it to clearly introduce the page topic for both readers and crawlers';
        }

        return [
            'text'   => $ledeText ? mb_substr($ledeText, 0, 400) : null,
            'length' => $length,
            'issues' => $issues,
        ];
    }

    // ── H1 tags — context-aware ───────────────────────────────────────────────
    // Multiple H1s inside separate <article> elements is valid HTML5 — this is
    // the standard pattern for archive/blog-list pages where each article has
    // its own heading. Only flag truly ambiguous multiple H1s on single-topic pages.

    private function checkH1Tags(Crawler $crawler): array
    {
        $h1Nodes    = $crawler->filter('h1');
        $h1Count    = $h1Nodes->count();
        $h1Texts    = [];
        $h1sInArticles = 0;

        $h1Nodes->each(function (Crawler $h1) use (&$h1Texts, &$h1sInArticles) {
            $text = trim(preg_replace('/\s+/', ' ', $h1->text()));
            if ($text) $h1Texts[] = mb_substr($text, 0, 100);

            // Walk parent chain to detect <article> wrapping
            $node = $h1->getNode(0);
            $parent = $node ? $node->parentNode : null;
            while ($parent) {
                if ($parent instanceof \DOMElement && strtolower($parent->nodeName) === 'article') {
                    $h1sInArticles++;
                    break;
                }
                $parent = $parent->parentNode ?? null;
            }
        });

        $allInArticles = $h1Count > 1 && $h1sInArticles === $h1Count;
        $articleCount  = $crawler->filter('article')->count();

        $status = match (true) {
            $h1Count === 0   => 'MISSING',
            $h1Count === 1   => 'OK',
            $allInArticles   => 'OK',   // valid archive/list page pattern
            default          => 'MULTIPLE',
        };

        $issues = [];
        if ($status === 'MISSING') {
            $issues[] = 'No H1 found — every page should have exactly one H1 (or one per article on list pages)';
        } elseif ($status === 'MULTIPLE') {
            $issues[] = "Multiple H1 tags ({$h1Count}) on a single-topic page — consolidate to one primary heading";
        }

        return [
            'count'          => $h1Count,
            'status'         => $status,
            'texts'          => $h1Texts,
            'in_articles'    => $h1sInArticles,
            'article_count'  => $articleCount,
            'context'        => $allInArticles ? 'archive_or_list' : ($h1Count > 1 ? 'multiple_on_page' : 'normal'),
            'issues'         => $issues,
        ];
    }

    // ── Canonical URL ─────────────────────────────────────────────────────────

    private function checkCanonical(Crawler $crawler, string $pageUrl): array
    {
        $canonicalNode = $crawler->filter('link[rel="canonical"]');
        $canonicalUrl  = null;
        $multiple      = $canonicalNode->count() > 1;

        if ($canonicalNode->count() > 0) {
            $canonicalUrl = $canonicalNode->first()->attr('href');
        }

        $canonicalMatches = $canonicalUrl !== null
            ? rtrim($canonicalUrl, '/') === rtrim($pageUrl, '/')
            : null;

        $issues = [];
        if ($multiple) {
            $issues[] = 'Multiple canonical tags found — only one is allowed';
        }
        if (!$canonicalUrl) {
            $issues[] = 'No canonical tag — add <link rel="canonical"> to prevent duplicate content issues';
        } elseif (!$canonicalMatches) {
            $issues[] = 'Canonical URL does not match the audited URL — verify this is intentional';
        }

        return [
            'url'                 => $canonicalUrl,
            'matches_audited_url' => $canonicalMatches,
            'multiple_found'      => $multiple,
            'status'              => $canonicalUrl
                ? ($canonicalMatches ? 'OK' : 'MISMATCH')
                : 'MISSING',
            'issues'              => $issues,
        ];
    }

    // ── Open Graph ────────────────────────────────────────────────────────────

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

        // Also check Twitter/X cards
        $twitterCard  = $crawler->filter('meta[name="twitter:card"]');
        $twitterTitle = $crawler->filter('meta[name="twitter:title"]');
        $result['twitter_card']  = $twitterCard->count() > 0  ? $twitterCard->first()->attr('content')  : null;
        $result['twitter_title'] = $twitterTitle->count() > 0 ? $twitterTitle->first()->attr('content') : null;

        $result['status'] = empty($result['missing']) ? 'OK' : (count($result['missing']) <= 2 ? 'PARTIAL' : 'MISSING');
        return $result;
    }

    // ── Image alt text — accurate per WCAG ───────────────────────────────────
    // alt="" (empty string) = intentionally decorative, correct per WCAG 2.1 H67
    // missing alt attribute = accessibility violation (no declaration of purpose)
    // non-empty alt = present (quality of text cannot be verified automatically)

    private function checkImagesAltText(Crawler $crawler): array
    {
        $total       = 0;
        $missingAlt  = 0;  // alt attribute completely absent — the real problem
        $decorative  = 0;  // alt="" — intentionally decorative, correct
        $hasAlt      = 0;  // non-empty alt text present
        $missingUrls = [];

        $crawler->filter('img')->each(function (Crawler $img) use (
            &$total, &$missingAlt, &$decorative, &$hasAlt, &$missingUrls
        ) {
            $total++;
            $node = $img->getNode(0);

            if (!$node instanceof \DOMElement) return;

            if (!$node->hasAttribute('alt')) {
                // No alt attribute at all — genuinely missing
                $missingAlt++;
                $src = $img->attr('src') ?? '(no src)';
                if (count($missingUrls) < 15) {
                    $role = $img->attr('role') ?? '';
                    $missingUrls[] = [
                        'src'      => $src,
                        'role'     => $role ?: null,
                        'in_link'  => ($node->parentNode instanceof \DOMElement && strtolower($node->parentNode->nodeName) === 'a'),
                    ];
                }
            } elseif ($img->attr('alt') === '') {
                $decorative++; // alt="" = intentionally decorative — this is CORRECT per spec
            } else {
                $hasAlt++; // has descriptive alt text
            }
        });

        $issues = [];
        if ($missingAlt > 0) {
            $inLinks = count(array_filter($missingUrls, fn($u) => $u['in_link'] ?? false));
            $issues[] = "{$missingAlt} image(s) have no alt attribute — images in links without alt are especially problematic for screen readers";
            if ($inLinks > 0) {
                $issues[] = "{$inLinks} of those are inside <a> tags — an image-only link needs an alt to describe the link destination";
            }
        }

        return [
            'total_images'     => $total,
            'missing_alt'      => $missingAlt,
            'decorative'       => $decorative,
            'has_alt'          => $hasAlt,
            'missing_alt_urls' => $missingUrls,
            'note'             => 'alt="" counts as correct (decorative declaration). Only absent alt attributes are flagged.',
            'status'           => $missingAlt === 0 ? 'OK' : ($missingAlt <= 3 ? 'WARN' : 'BAD'),
            'issues'           => $issues,
        ];
    }

    // ── Technical SEO: robots.txt, sitemap ───────────────────────────────────

    private function checkTechnicalSeo(string $pageUrl): array
    {
        $parsed = parse_url($pageUrl);
        $base   = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
        $result = ['robots_txt' => null, 'sitemap_xml' => null, 'issues' => []];

        foreach (['robots_txt' => '/robots.txt', 'sitemap_xml' => '/sitemap.xml'] as $key => $path) {
            try {
                $res = Http::withHeaders($this->browserHeaders())->timeout(10)->head($base . $path);
                if ($res->successful()) {
                    $result[$key] = ['exists' => true, 'status_code' => $res->status()];
                } else {
                    $result[$key] = ['exists' => false, 'status_code' => $res->status()];
                    $result['issues'][] = "{$path} not found (HTTP {$res->status()})";
                }
            } catch (\Throwable) {
                $result[$key]       = ['exists' => false, 'status_code' => null];
                $result['issues'][] = "{$path} could not be fetched";
            }
        }

        return $result;
    }

    // ── Robots meta directives ────────────────────────────────────────────────

    private function checkRobotsDirectives(Crawler $crawler): array
    {
        $directives = [];

        foreach (['meta[name="robots"]', 'meta[name="googlebot"]'] as $sel) {
            $nodes = $crawler->filter($sel);
            if ($nodes->count() > 0) {
                $content = strtolower(trim($nodes->first()->attr('content') ?? ''));
                foreach (array_map('trim', explode(',', $content)) as $d) {
                    if ($d !== '') $directives[] = $d;
                }
            }
        }

        $isNoindex  = in_array('noindex', $directives, true);
        $isNofollow = in_array('nofollow', $directives, true);

        $issues = [];
        if ($isNoindex)  $issues[] = 'Page has noindex directive — Google will not index this page';
        if ($isNofollow) $issues[] = 'Page has nofollow directive — Google will not follow links on this page';

        return [
            'is_noindex'  => $isNoindex,
            'is_nofollow' => $isNofollow,
            'directives'  => $directives,
            'status'      => $isNoindex ? 'NOINDEX' : (empty($directives) ? 'OK' : 'OK'),
            'issues'      => $issues,
        ];
    }

    // ── URL slug quality ──────────────────────────────────────────────────────

    private function checkUrlQuality(string $pageUrl): array
    {
        $parsed  = parse_url($pageUrl);
        $path    = $parsed['path'] ?? '/';
        $slug    = ltrim($path, '/');
        $issues  = [];

        $pathLength   = strlen($path);
        $segments     = empty($slug) ? 0 : count(array_filter(explode('/', $slug)));
        $hasUppercase = (bool) preg_match('/[A-Z]/', $path);
        $hasUnderscores = str_contains($slug, '_');
        $hasHyphens   = str_contains($slug, '-');
        $hasDynamicId = (bool) preg_match('/[?&](id|p|page_id|product_id)=\d+/', $pageUrl);
        $hasQuery     = !empty($parsed['query']);
        $hasSpaces    = str_contains($path, '%20') || str_contains($path, '+');

        if ($pathLength > 100) {
            $issues[] = "URL path is very long ({$pathLength} chars) — keep slugs concise and descriptive";
        }
        if ($hasUppercase) {
            $issues[] = 'URL contains uppercase characters — use lowercase throughout for consistency and to avoid duplicate URLs';
        }
        if ($hasUnderscores && !$hasHyphens) {
            $issues[] = 'URL uses underscores — Google treats hyphens as word separators, underscores as a single token';
        }
        if ($hasDynamicId) {
            $issues[] = 'URL contains a numeric ID parameter — keyword-based slugs typically outperform ID-based URLs';
        }
        if ($segments > 4) {
            $issues[] = "URL has {$segments} path segments — flatter structures (≤3 levels) are generally preferred";
        }
        if ($hasSpaces) {
            $issues[] = 'URL contains encoded spaces — use hyphens to separate words in slugs';
        }

        return [
            'path'              => $path,
            'path_length'       => $pathLength,
            'segments'          => $segments,
            'has_uppercase'     => $hasUppercase,
            'uses_hyphens'      => $hasHyphens,
            'uses_underscores'  => $hasUnderscores,
            'has_query_params'  => $hasQuery,
            'has_dynamic_id'    => $hasDynamicId,
            'issues'            => $issues,
            'status'            => empty($issues) ? 'OK' : (count($issues) >= 2 ? 'BAD' : 'WARN'),
        ];
    }

    // ── Page content depth ───────────────────────────────────────────────────

    private function checkPageContent(Crawler $crawler): array
    {
        $text = '';

        // Try specific content containers first, avoiding nav/footer noise
        foreach (['main', 'article', '[role="main"]', '.content', '#content', '#main', '.post-content', '.entry-content'] as $sel) {
            try {
                $node = $crawler->filter($sel)->first();
                if ($node->count() > 0) {
                    $text = $node->text();
                    break;
                }
            } catch (\Throwable) {}
        }

        if (empty(trim($text))) {
            try { $text = $crawler->filter('body')->text(); } catch (\Throwable) {}
        }

        $wordCount = str_word_count(trim(preg_replace('/\s+/', ' ', $text)));
        $issues    = [];

        if ($wordCount < 300) {
            $issues[] = "Thin content: ~{$wordCount} words — pages under 300 words struggle to rank for non-branded terms";
        } elseif ($wordCount < 600) {
            $issues[] = "Moderate content depth: ~{$wordCount} words — consider expanding for competitive topics";
        }

        // Detect if page relies heavily on JavaScript-rendered content
        $scriptBlocks = $crawler->filter('script:not([src])')->count();
        if ($scriptBlocks > 5 && $wordCount < 200) {
            $issues[] = 'Page has many inline script blocks but few visible words — content may be JS-rendered and invisible to crawlers';
        }

        return [
            'word_count'    => $wordCount,
            'content_depth' => match (true) {
                $wordCount < 300  => 'thin',
                $wordCount < 600  => 'moderate',
                $wordCount < 1500 => 'good',
                default           => 'comprehensive',
            },
            'issues' => $issues,
        ];
    }

    // ── Heading structure quality ─────────────────────────────────────────────

    private function checkHeadingStructure(Crawler $crawler): array
    {
        $headings = [];
        $levels   = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

        foreach ($levels as $tag) {
            $crawler->filter($tag)->each(function (Crawler $h) use ($tag, &$headings) {
                $text = trim(preg_replace('/\s+/', ' ', $h->text()));
                $headings[] = [
                    'level' => (int) substr($tag, 1),
                    'text'  => mb_substr($text, 0, 100),
                ];
            });
        }

        // headings already in DOM order from DomCrawler — no sort needed

        $issues    = [];
        $prevLevel = 0;

        foreach ($headings as $i => $heading) {
            if ($i === 0) { $prevLevel = $heading['level']; continue; }
            if ($heading['level'] > $prevLevel + 1) {
                $issues[] = "Heading skip: H{$prevLevel} → H{$heading['level']} (\"{$heading['text']}\") — keep hierarchy sequential";
            }
            $prevLevel = $heading['level'];
        }

        // Check for empty headings
        $emptyHeadings = array_filter($headings, fn($h) => trim($h['text']) === '');
        if (count($emptyHeadings) > 0) {
            $issues[] = count($emptyHeadings) . ' empty heading tag(s) found — these create confusing document structure';
        }

        // Check if H2 count is reasonable (too many H2s = structure likely flat)
        $h2Count = count(array_filter($headings, fn($h) => $h['level'] === 2));
        if ($h2Count > 15) {
            $issues[] = "{$h2Count} H2 tags — this is a lot; verify headings are used for structure, not styling";
        }

        return [
            'total_headings' => count($headings),
            'headings'       => array_slice($headings, 0, 30),
            'issues'         => $issues,
            'status'         => empty($issues) ? 'OK' : (count($issues) >= 2 ? 'BAD' : 'WARN'),
        ];
    }

    // ── Internal linking signals ──────────────────────────────────────────────

    private function checkInternalLinking(Crawler $crawler, string $pageUrl): array
    {
        $parsed   = parse_url($pageUrl);
        $host     = $parsed['host'] ?? '';
        $scheme   = $parsed['scheme'] ?? 'https';
        $internal = 0;
        $external = 0;
        $nofollow = 0;
        $issues   = [];

        $crawler->filter('a[href]')->each(function (Crawler $a) use (
            &$internal, &$external, &$nofollow, $host, $scheme
        ) {
            $href = $a->attr('href') ?? '';
            if (empty($href) || preg_match('/^(#|mailto:|tel:|javascript:)/i', $href)) return;

            $rel = strtolower($a->attr('rel') ?? '');
            if (str_contains($rel, 'nofollow')) $nofollow++;

            // Resolve to absolute
            if (filter_var($href, FILTER_VALIDATE_URL)) {
                $abs = $href;
            } elseif (str_starts_with($href, '//')) {
                $abs = $scheme . ':' . $href;
            } elseif (str_starts_with($href, '/')) {
                $abs = $scheme . '://' . $host . $href;
            } else {
                $abs = $scheme . '://' . $host . '/' . ltrim($href, './');
            }

            $linkHost = parse_url($abs, PHP_URL_HOST) ?? '';
            if ($linkHost === $host || $linkHost === 'www.' . $host || 'www.' . $linkHost === $host) {
                $internal++;
            } else {
                $external++;
            }
        });

        if ($internal < 3) {
            $issues[] = "Only {$internal} internal link(s) — internal linking helps Google discover pages and understand content hierarchy";
        }
        if ($nofollow > ($internal + $external) * 0.5 && ($internal + $external) > 5) {
            $issues[] = 'More than half of links have rel=nofollow — review whether internal links need nofollow';
        }

        return [
            'internal_links' => $internal,
            'external_links' => $external,
            'nofollow_links' => $nofollow,
            'total_links'    => $internal + $external,
            'issues'         => $issues,
        ];
    }

    // ── Schema markup: JSON-LD + RDFa ────────────────────────────────────────
    // Both are valid. RDFa embeds directly in HTML, avoids duplication risk,
    // and parses cleanly by AI extraction systems. JSON-LD adds no extra bytes
    // to the visible DOM but must not assert facts not on the page.

    private function validateSchemaMarkup(Crawler $crawler): array
    {
        $jsonLd = $this->validateSchemaJsonLd($crawler);
        $rdfa   = $this->detectRdfa($crawler);
        $microdata = $this->detectMicrodata($crawler);

        $hasAnySchema = $jsonLd['has_valid_schema'] || $rdfa['detected'] || $microdata['detected'];

        $implementedTypes = [];
        if ($jsonLd['has_valid_schema'])   $implementedTypes[] = 'JSON-LD';
        if ($rdfa['detected'])             $implementedTypes[] = 'RDFa';
        if ($microdata['detected'])        $implementedTypes[] = 'Microdata';

        $issues = $jsonLd['errors'];
        if (!$hasAnySchema) {
            $issues[] = 'No structured markup found — add JSON-LD, RDFa, or Microdata to help search engines understand page type and content';
        }

        return array_merge($jsonLd, [
            'has_valid_schema'   => $hasAnySchema,
            'rdfa'               => $rdfa,
            'microdata'          => $microdata,
            'implementations'    => $implementedTypes,
            'errors'             => $issues,
        ]);
    }

    private function validateSchemaJsonLd(Crawler $crawler): array
    {
        $result = [
            'has_valid_schema' => false,
            'schemas_found'    => [],
            'errors'           => [],
        ];

        $requiredFields = [
            'Product'       => ['name', 'image'],
            'WebSite'       => ['name'],
            'Organization'  => ['name'],
            'LocalBusiness' => ['name'],
            'Article'       => ['headline'],
            'BlogPosting'   => ['headline'],
            'BreadcrumbList'=> ['itemListElement'],
            'FAQPage'       => ['mainEntity'],
            'Event'         => ['name', 'startDate'],
            'Recipe'        => ['name'],
            'Review'        => ['itemReviewed'],
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

                $schemas = isset($data['@graph']) && is_array($data['@graph']) ? $data['@graph'] : [$data];

                foreach ($schemas as $schema) {
                    if (!is_array($schema)) continue;
                    $type  = $schema['@type'] ?? null;
                    $entry = ['type' => $type, 'is_valid' => true, 'missing_keys' => []];

                    if ($type) {
                        $result['has_valid_schema'] = true;
                        if (isset($requiredFields[$type])) {
                            foreach ($requiredFields[$type] as $key) {
                                if (empty($schema[$key])) {
                                    $entry['is_valid']       = false;
                                    $entry['missing_keys'][] = $key;
                                    $result['errors'][]      = "Schema '{$type}' missing required field: {$key}";
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

    private function detectRdfa(Crawler $crawler): array
    {
        // RDFa uses vocab, typeof, property attributes — valid W3C alternative to JSON-LD
        try {
            $vocabNodes    = $crawler->filter('[vocab]');
            $typeofNodes   = $crawler->filter('[typeof]');
            $propertyNodes = $crawler->filter('[property]');

            $types = [];
            $typeofNodes->each(function (Crawler $n) use (&$types) {
                $t = $n->attr('typeof');
                if ($t) $types[] = $t;
            });

            $vocabs = [];
            $vocabNodes->each(function (Crawler $n) use (&$vocabs) {
                $v = $n->attr('vocab');
                if ($v) $vocabs[] = $v;
            });

            return [
                'detected'       => $vocabNodes->count() > 0 || $typeofNodes->count() > 0,
                'vocab_count'    => $vocabNodes->count(),
                'typeof_count'   => $typeofNodes->count(),
                'property_count' => $propertyNodes->count(),
                'types_found'    => array_unique($types),
                'vocabs'         => array_unique($vocabs),
            ];
        } catch (\Throwable) {
            return ['detected' => false, 'vocab_count' => 0, 'typeof_count' => 0, 'property_count' => 0, 'types_found' => [], 'vocabs' => []];
        }
    }

    private function detectMicrodata(Crawler $crawler): array
    {
        try {
            $scopeNodes    = $crawler->filter('[itemscope]');
            $typeNodes     = $crawler->filter('[itemtype]');

            $types = [];
            $typeNodes->each(function (Crawler $n) use (&$types) {
                $t = $n->attr('itemtype');
                if ($t) $types[] = $t;
            });

            return [
                'detected'    => $scopeNodes->count() > 0,
                'scope_count' => $scopeNodes->count(),
                'types'       => array_unique($types),
            ];
        } catch (\Throwable) {
            return ['detected' => false, 'scope_count' => 0, 'types' => []];
        }
    }
}
