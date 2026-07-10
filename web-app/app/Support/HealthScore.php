<?php

namespace App\Support;

class HealthScore
{
    /**
     * The single source of truth for the health score. Both RunAuditorJob
     * (the live scan pipeline) and FullAuditReportController (the legacy
     * /api/audit/full-report endpoint) call this, so the two can never
     * diverge again.
     *
     * @param  array  $audits            module-keyed decoded results (keys per RunAuditorJob::COLUMN_MAP)
     * @param  bool   $fuzzRequested     whether the optional fuzz module ran
     * @param  array|null $fuzzResult    decoded fuzz result, if any
     * @return array{score:int, deductions:array<int,array>}
     *
     * Each deduction is a structured object:
     *   { module, key, label, points, severity, fixKey }
     * Scoring is severe-only for advisory checks: only clearly-broken
     * findings deduct; informational findings live in the module result and
     * are surfaced in the UI without touching the score.
     */
    public static function compute(array $audits, bool $fuzzRequested = false, ?array $fuzzResult = null): array
    {
        $score      = 100;
        $deductions = [];

        $deduct = function (int $points, string $module, string $key, string $label) use (&$score, &$deductions): void {
            $score -= $points;
            $deductions[] = [
                'module'   => $module,
                'key'      => $key,
                'label'    => $label,
                'points'   => $points,
                'severity' => Deductions::severityFor($points),
                'fixKey'   => "fix.{$module}.{$key}",
            ];
        };

        // --- SEO ---
        $seo = $audits['seo_schema'] ?? [];
        if (($seo['status'] ?? '') === 'ok') {
            if (($seo['meta_title']['status'] ?? '')       !== 'OK')        $deduct(5,  'seo', 'meta_title', 'SEO: bad meta title');
            if (($seo['meta_description']['status'] ?? '') === 'MISSING')   $deduct(2,  'seo', 'meta_description', 'SEO: missing meta description');
            if (($seo['h1_tags']['status'] ?? '')          !== 'OK')        $deduct(5,  'seo', 'h1_tags', 'SEO: H1 issue');
            if (($seo['canonical']['status'] ?? '') === 'MISSING')          $deduct(3,  'seo', 'canonical_missing', 'SEO: missing canonical');
            if (($seo['canonical']['status'] ?? '') === 'MISMATCH')         $deduct(5,  'seo', 'canonical_mismatch', 'SEO: canonical mismatch');
            if (! ($seo['schema_validation']['has_valid_schema'] ?? false)) $deduct(5,  'seo', 'schema', 'SEO: no structured data');
            if (($seo['open_graph']['status'] ?? '') === 'MISSING')         $deduct(5,  'seo', 'open_graph', 'SEO: missing OG tags');
            if (($seo['image_alt_text']['status'] ?? '') === 'BAD')         $deduct(5,  'seo', 'image_alt', 'SEO: images missing alt attribute');
            if (! ($seo['technical_seo']['robots_txt']['exists']  ?? true)) $deduct(3,  'seo', 'robots_txt', 'SEO: robots.txt missing');
            if (! ($seo['technical_seo']['sitemap_xml']['exists'] ?? true)) $deduct(3,  'seo', 'sitemap', 'SEO: sitemap.xml missing');
            // A page blocked from indexing (via meta OR the X-Robots-Tag header) can't rank at all.
            if (($seo['robots_directives']['is_noindex'] ?? false)
                || ($seo['x_robots_tag']['is_noindex'] ?? false))           $deduct(10, 'seo', 'noindex', 'SEO: page is noindexed');
            if (($seo['page_content']['content_depth'] ?? '') === 'thin')   $deduct(5,  'seo', 'thin_content', 'SEO: thin content (< 300 words)');
            if (($seo['url_quality']['status'] ?? '') === 'BAD')            $deduct(3,  'seo', 'url_quality', 'SEO: URL slug quality issues');
            if (\count($seo['heading_structure']['issues'] ?? []) > 1)      $deduct(3,  'seo', 'heading_structure', 'SEO: heading structure issues');
            $internalLinks = $seo['internal_linking']['internal_links'] ?? null;
            if ($internalLinks !== null && $internalLinks < 2)              $deduct(3,  'seo', 'internal_links', 'SEO: very few internal links');
        }

        // --- Security ---
        $sec = $audits['security'] ?? [];
        if (($sec['status'] ?? '') === 'ok') {
            if (! ($sec['ssl']['ssl_valid'] ?? false))                          $deduct(20, 'security', 'ssl_invalid', 'Security: invalid/missing SSL');
            elseif (($sec['ssl']['ssl_days_left'] ?? 99) <= 30)                 $deduct(10, 'security', 'ssl_expiring', 'Security: SSL expiring soon');
            if ($sec['mixed_content']['has_mixed_content'] ?? false)            $deduct(10, 'security', 'mixed_content', 'Security: mixed content');
            if (! ($sec['dns_security']['spf_record_exists']   ?? false))       $deduct(5,  'security', 'spf', 'Security: no SPF record');
            if (! ($sec['dns_security']['dmarc_record_exists'] ?? false))       $deduct(5,  'security', 'dmarc', 'Security: no DMARC record');
            $hs = $sec['security_headers']['score'] ?? 6;
            if ($hs <= 2)     $deduct(10, 'security', 'headers_most_missing', 'Security: most headers missing');
            elseif ($hs <= 4) $deduct(5,  'security', 'headers_some_missing', 'Security: some headers missing');
            if (($sec['https_redirect']['redirects_to_https'] ?? null) === false) $deduct(5, 'security', 'https_redirect', 'Security: HTTP not redirected to HTTPS');
            // New severe checks (informational sub-signals live in the result, unscored)
            if ($sec['csp_quality']['unsafe'] ?? false)                         $deduct(5,  'security', 'csp_unsafe', 'Security: CSP allows unsafe-inline/eval');
            if ($sec['cookie_flags']['insecure_session'] ?? false)              $deduct(5,  'security', 'cookie_insecure', 'Security: session cookie missing Secure/HttpOnly');
        }

        // --- Catalog ---
        $cat = $audits['catalog_integrity'] ?? [];
        if (($cat['status'] ?? '') === 'ok' && ($cat['products_audited'] ?? 0) > 0) {
            $pct = $cat['broken_percentage'] ?? 0;
            if ($pct > 50)     $deduct(20, 'catalog', 'broken_products', "Catalog: {$pct}% products broken");
            elseif ($pct > 10) $deduct(10, 'catalog', 'broken_products', "Catalog: {$pct}% products broken");
            elseif ($pct > 0)  $deduct(5,  'catalog', 'broken_products', "Catalog: {$pct}% products broken");
        }

        // --- Tracking ---
        // Deliberately no score deduction. Whether GA4/Meta/TikTok/etc. are
        // installed is a marketing decision, not a technical health problem;
        // the module's findings are shown in full in its own section.

        // --- Broken Resources ---
        $br = $audits['broken_resources'] ?? [];
        if (($br['status'] ?? '') === 'ok') {
            $brokenLinks  = $br['summary']['broken_links_count']  ?? 0;
            $brokenImages = $br['summary']['broken_images_count'] ?? 0;
            $brokenAssets = ($br['summary']['broken_scripts_count'] ?? 0) + ($br['summary']['broken_stylesheets_count'] ?? 0);
            if ($brokenLinks > 10)    $deduct(10, 'broken', 'broken_links', "{$brokenLinks} broken links");
            elseif ($brokenLinks > 0) $deduct(5,  'broken', 'broken_links', "{$brokenLinks} broken link(s)");
            if ($brokenImages > 0)    $deduct(5,  'broken', 'broken_images', "{$brokenImages} broken image(s)");
            // A 404 script or stylesheet can break page rendering/behaviour outright.
            if ($brokenAssets > 0)    $deduct(5,  'broken', 'broken_assets', "{$brokenAssets} broken script/stylesheet file(s)");
        }

        // --- Performance ---
        $perf = $audits['performance'] ?? [];
        if (($perf['status'] ?? '') === 'ok') {
            $ttfb = $perf['metrics']['ttfb_ms'] ?? null;
            if ($ttfb !== null) {
                if ($ttfb > 1500)    $deduct(10, 'performance', 'ttfb', "Performance: TTFB {$ttfb}ms (very slow)");
                elseif ($ttfb > 600) $deduct(5,  'performance', 'ttfb', "Performance: TTFB {$ttfb}ms (slow)");
            }
            // Core Web Vitals — worst of desktop/mobile (data was already captured but never scored).
            $lcp = max(
                $perf['metrics']['desktop']['lcp_ms'] ?? 0,
                $perf['metrics']['mobile']['lcp_ms']  ?? 0,
            );
            if ($lcp > 4000)    $deduct(8, 'performance', 'lcp', "Performance: LCP {$lcp}ms (poor)");
            elseif ($lcp > 2500) $deduct(4, 'performance', 'lcp', "Performance: LCP {$lcp}ms (needs improvement)");
            $cls = max(
                $perf['metrics']['desktop']['cls_score'] ?? 0,
                $perf['metrics']['mobile']['cls_score']  ?? 0,
            );
            if ($cls > 0.25)    $deduct(5, 'performance', 'cls', "Performance: CLS {$cls} (poor)");
            elseif ($cls > 0.1) $deduct(2, 'performance', 'cls', "Performance: CLS {$cls} (needs improvement)");
            // Only scored when the module decided it's worth flagging (large enough page).
            if ($perf['page_analysis']['compression_worth_flagging'] ?? false) $deduct(5, 'performance', 'compression', 'Performance: compression not enabled');
            $unminifiedCount = \count($perf['page_analysis']['unminified_assets'] ?? []);
            if ($unminifiedCount > 0) $deduct(3, 'performance', 'minification', "Performance: {$unminifiedCount} unminified CSS/JS file(s) over 10KB");
        }

        // --- Accessibility ---
        $a11y = $audits['accessibility'] ?? [];
        if (($a11y['status'] ?? '') === 'ok') {
            $checks    = $a11y['checks'] ?? [];
            $formFail  = $checks['form_labels']['fail']        ?? 0;
            $imgFail   = $checks['image_alt']['missing_count'] ?? 0;
            $ariaFail  = $checks['aria_labels']['fail']        ?? 0;
            $hIssues   = \count($checks['heading_hierarchy']['issues'] ?? []);
            $csFail    = $checks['color_contrast']['fail']     ?? 0;
            $linkFail  = $checks['link_text']['fail']          ?? 0;

            if ($formFail > 3)  $deduct(8, 'accessibility', 'form_labels', "Accessibility: {$formFail} unlabeled form inputs");
            if ($imgFail  > 5)  $deduct(5, 'accessibility', 'image_alt', "Accessibility: {$imgFail} images missing alt text");
            if ($ariaFail > 2)  $deduct(5, 'accessibility', 'aria', "Accessibility: {$ariaFail} elements missing ARIA name");
            if ($hIssues  > 0)  $deduct(5, 'accessibility', 'headings', 'Accessibility: heading hierarchy issues');
            if (! ($checks['landmarks']['has_lang']  ?? true)) $deduct(5, 'accessibility', 'lang', 'Accessibility: missing html lang attribute');
            if (! ($checks['landmarks']['has_main']  ?? true)) $deduct(3, 'accessibility', 'main_landmark', 'Accessibility: no <main> landmark');
            if ($csFail   > 2)  $deduct(5, 'accessibility', 'contrast', "Accessibility: {$csFail} color contrast violations");
            if ($linkFail > 5)  $deduct(2, 'accessibility', 'link_text', "Accessibility: {$linkFail} vague/empty links");
            // New severe checks
            if ($checks['zoom_disabled']['disabled'] ?? false)      $deduct(5, 'accessibility', 'zoom_disabled', 'Accessibility: pinch-zoom disabled');
            if ($checks['duplicate_ids']['breaks_labels'] ?? false) $deduct(3, 'accessibility', 'duplicate_ids', 'Accessibility: duplicate IDs break label associations');
        }

        // --- Fuzz Testing (optional) ---
        if ($fuzzRequested && $fuzzResult && ($fuzzResult['status'] ?? '') === 'ok') {
            $summary = $fuzzResult['summary'] ?? [];
            $serious = ($summary['reflected_input'] ?? 0) + ($summary['error_disclosure'] ?? 0) + ($summary['server_error'] ?? 0);
            $slow    = $summary['slow_response'] ?? 0;
            if ($serious > 0) $deduct(min(20, $serious * 8), 'fuzz', 'input_handling', "Fuzz testing: {$serious} potential input-handling issue(s) found");
            if ($slow > 0)    $deduct(min(5, $slow * 2), 'fuzz', 'slow_response', "Fuzz testing: {$slow} slow-response finding(s)");
        }

        // Sort by impact so "top fixes first" surfaces are trivial downstream
        // and FinalizeMassEmail's "Top 5 most impactful" claim becomes true.
        usort($deductions, fn ($a, $b) => $b['points'] <=> $a['points']);

        return ['score' => max(0, $score), 'deductions' => $deductions];
    }
}
