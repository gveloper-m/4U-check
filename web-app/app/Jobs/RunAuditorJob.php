<?php

namespace App\Jobs;

use App\Mail\ScanCompletedMail;
use App\Models\McpAgent;
use App\Models\ScheduledScan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class RunAuditorJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;
    public int $tries   = 1;

    public const COLUMN_MAP = [
        'seo_schema'         => 'seo_schema_result',
        'security'           => 'security_result',
        'catalog_integrity'  => 'catalog_result',
        'marketing_tracking' => 'tracking_result',
        'broken_resources'   => 'broken_resources_result',
        'performance'        => 'performance_result',
        'accessibility'      => 'accessibility_result',
    ];

    // Opt-in modules — only expected/counted for reports that requested them
    // (currently just fuzz testing, gated behind full_audit_reports.fuzz_requested).
    public const OPTIONAL_COLUMN_MAP = [
        'fuzz_testing' => 'fuzz_testing_result',
    ];

    public function __construct(
        public readonly int    $reportId,
        public readonly string $auditorKey,
        public readonly string $controllerClass,
        public readonly string $pageUrl,
    ) {}

    public function handle(): void
    {
        $column = (self::COLUMN_MAP + self::OPTIONAL_COLUMN_MAP)[$this->auditorKey];

        try {
            $result = app($this->controllerClass)->performAudit($this->pageUrl);
            $data   = json_encode(array_merge(['status' => 'ok'], $result));
        } catch (\Throwable $e) {
            $data = json_encode(['status' => 'error', 'error' => $e->getMessage()]);
        }

        DB::table('full_audit_reports')
            ->where('id', $this->reportId)
            ->update([$column => $data]);

        $this->tryFinalize();
    }

    public function failed(\Throwable $_exception): void
    {
        // Write a timeout/error marker so the finalization check can still count this auditor as done.
        $column = (self::COLUMN_MAP + self::OPTIONAL_COLUMN_MAP)[$this->auditorKey];
        DB::table('full_audit_reports')
            ->where('id', $this->reportId)
            ->whereNull($column)
            ->update([$column => json_encode(['status' => 'error', 'error' => 'timed out'])]);

        $this->tryFinalize();
    }

    private function tryFinalize(): void
    {
        // Check if all 6 auditors are done; if so, compute the health score and mark completed.
        // Use a DB-level lock so only one job runs this logic even when multiple finish simultaneously.
        DB::transaction(function () {
            $record = DB::table('full_audit_reports')
                ->lockForUpdate()
                ->find($this->reportId);

            if (! $record || $record->status === 'completed') {
                return;
            }

            $expectedColumns = self::COLUMN_MAP;
            if ($record->fuzz_requested ?? false) {
                $expectedColumns = $expectedColumns + self::OPTIONAL_COLUMN_MAP;
            }

            $doneCount = 0;
            foreach ($expectedColumns as $col) {
                if ($record->$col !== null) {
                    $doneCount++;
                }
            }

            if ($doneCount < count($expectedColumns)) {
                return;
            }

            ['score' => $score, 'deductions' => $deductions] = $this->computeHealthScore($record);

            DB::table('full_audit_reports')->where('id', $this->reportId)->update([
                'status'           => 'completed',
                'health_score'     => $score,
                'score_deductions' => json_encode($deductions),
                'updated_at'       => now(),
            ]);

            // Send email if this report belongs to a scheduled scan with notify_email=true.
            $scan = ScheduledScan::where('last_report_id', $this->reportId)
                ->where('notify_email', true)
                ->with('user')
                ->first();

            if ($scan && $scan->user) {
                $reportUrl = url('/audits/' . $this->reportId);
                $locale    = $scan->user->language ?? 'en';
                Mail::to($scan->user->email)
                    ->queue((new ScanCompletedMail($scan, $score, $reportUrl, $record, $deductions))->locale($locale));
            }

        });

        // MCP agent push is outside the transaction — a failure here must not roll back the score.
        $reportRecord = DB::table('full_audit_reports')->find($this->reportId);
        if ($reportRecord && $reportRecord->status === 'completed') {
            $agent = McpAgent::whereHas('monitoredSite', fn ($q) => $q->where('url', $reportRecord->site_url))
                ->first();

            if ($agent) {
                $agent->update([
                    'latest_report_json' => json_encode([
                        'report_id'    => $this->reportId,
                        'url'          => $reportRecord->site_url,
                        'health_score' => $reportRecord->health_score,
                        'status'       => 'completed',
                        'scanned_at'   => now()->toIso8601String(),
                        'modules'      => [
                            'seo_schema'         => json_decode($reportRecord->seo_schema_result         ?? 'null', true),
                            'security'           => json_decode($reportRecord->security_result           ?? 'null', true),
                            'performance'        => json_decode($reportRecord->performance_result        ?? 'null', true),
                            'broken_resources'   => json_decode($reportRecord->broken_resources_result   ?? 'null', true),
                            'catalog_integrity'  => json_decode($reportRecord->catalog_result            ?? 'null', true),
                            'marketing_tracking' => json_decode($reportRecord->tracking_result           ?? 'null', true),
                            'accessibility'      => json_decode($reportRecord->accessibility_result      ?? 'null', true),
                            'fuzz_testing'       => ($reportRecord->fuzz_requested ?? false)
                                ? json_decode($reportRecord->fuzz_testing_result ?? 'null', true)
                                : null,
                        ],
                    ], JSON_UNESCAPED_UNICODE),
                ]);
            }
        }
    }

    private function computeHealthScore(object $record): array
    {
        $audits = [];
        foreach (self::COLUMN_MAP as $key => $col) {
            $raw = $record->$col;
            $audits[$key] = $raw !== null ? json_decode($raw, true) : ['status' => 'running'];
        }

        $score      = 100;
        $deductions = [];

        // --- SEO ---
        $seo = $audits['seo_schema'] ?? [];
        if (($seo['status'] ?? '') === 'ok') {
            if (($seo['meta_title']['status'] ?? '')       !== 'OK') { $score -= 5;  $deductions[] = 'SEO: bad meta title (-5)'; }
            // Meta description is secondary — lower weight; lede paragraph matters more
            if (($seo['meta_description']['status'] ?? '') === 'MISSING') { $score -= 2; $deductions[] = 'SEO: missing meta description (-2)'; }
            if (($seo['h1_tags']['status'] ?? '')          !== 'OK') { $score -= 5;  $deductions[] = 'SEO: H1 issue (-5)'; }
            if (($seo['canonical']['status'] ?? '') === 'MISSING')   { $score -= 3;  $deductions[] = 'SEO: missing canonical (-3)'; }
            if (($seo['canonical']['status'] ?? '') === 'MISMATCH')  { $score -= 5;  $deductions[] = 'SEO: canonical mismatch (-5)'; }
            if (! ($seo['schema_validation']['has_valid_schema'] ?? false)) { $score -= 5; $deductions[] = 'SEO: no structured data (-5)'; }
            if (($seo['open_graph']['status'] ?? '') === 'MISSING')  { $score -= 5;  $deductions[] = 'SEO: missing OG tags (-5)'; }
            if (($seo['image_alt_text']['status'] ?? '') === 'BAD')  { $score -= 5;  $deductions[] = 'SEO: images missing alt attribute (-5)'; }
            if (! ($seo['technical_seo']['robots_txt']['exists']  ?? true)) { $score -= 3; $deductions[] = 'SEO: robots.txt missing (-3)'; }
            if (! ($seo['technical_seo']['sitemap_xml']['exists'] ?? true)) { $score -= 3; $deductions[] = 'SEO: sitemap.xml missing (-3)'; }
            // New signals
            if ($seo['robots_directives']['is_noindex'] ?? false)           { $score -= 10; $deductions[] = 'SEO: page is noindexed (-10)'; }
            if (($seo['page_content']['content_depth'] ?? '') === 'thin')   { $score -= 5;  $deductions[] = 'SEO: thin content (< 300 words) (-5)'; }
            if (($seo['url_quality']['status'] ?? '') === 'BAD')            { $score -= 3;  $deductions[] = 'SEO: URL slug quality issues (-3)'; }
            if (\count($seo['heading_structure']['issues'] ?? []) > 1)      { $score -= 3;  $deductions[] = 'SEO: heading structure issues (-3)'; }
            $internalLinks = $seo['internal_linking']['internal_links'] ?? null;
            if ($internalLinks !== null && $internalLinks < 2)              { $score -= 3;  $deductions[] = 'SEO: very few internal links (-3)'; }
        }

        // --- Security ---
        $sec = $audits['security'] ?? [];
        if (($sec['status'] ?? '') === 'ok') {
            if (! ($sec['ssl']['ssl_valid'] ?? false))                                          { $score -= 20; $deductions[] = 'Security: invalid/missing SSL (-20)'; }
            elseif (($sec['ssl']['ssl_days_left'] ?? 99) <= 30)                                { $score -= 10; $deductions[] = 'Security: SSL expiring soon (-10)'; }
            if ($sec['mixed_content']['has_mixed_content'] ?? false)                            { $score -= 10; $deductions[] = 'Security: mixed content (-10)'; }
            if (! ($sec['dns_security']['spf_record_exists']   ?? false))                       { $score -= 5;  $deductions[] = 'Security: no SPF record (-5)'; }
            if (! ($sec['dns_security']['dmarc_record_exists'] ?? false))                       { $score -= 5;  $deductions[] = 'Security: no DMARC record (-5)'; }
            $hs = $sec['security_headers']['score'] ?? 6;
            if ($hs <= 2)     { $score -= 10; $deductions[] = 'Security: most headers missing (-10)'; }
            elseif ($hs <= 4) { $score -= 5;  $deductions[] = 'Security: some headers missing (-5)'; }
            if (($sec['https_redirect']['redirects_to_https'] ?? null) === false) { $score -= 5; $deductions[] = 'Security: HTTP not redirected to HTTPS (-5)'; }
        }

        // --- Catalog ---
        $cat = $audits['catalog_integrity'] ?? [];
        if (($cat['status'] ?? '') === 'ok' && ($cat['products_audited'] ?? 0) > 0) {
            $pct = $cat['broken_percentage'] ?? 0;
            if ($pct > 50)     { $score -= 20; $deductions[] = "Catalog: {$pct}% products broken (-20)"; }
            elseif ($pct > 10) { $score -= 10; $deductions[] = "Catalog: {$pct}% products broken (-10)"; }
            elseif ($pct > 0)  { $score -= 5;  $deductions[] = "Catalog: {$pct}% products broken (-5)"; }
        }

        // --- Tracking ---
        // Deliberately no score deduction here. Whether GA4/Facebook Pixel/TikTok
        // Pixel are installed is a marketing decision, not a technical health
        // problem — conflating the two would penalize sites for a legitimate
        // business choice not to run third-party trackers. The Tracking module's
        // findings are still shown in full in their own report section; this
        // health score just doesn't treat "no analytics" as "unhealthy."

        // --- Broken Resources ---
        $br = $audits['broken_resources'] ?? [];
        if (($br['status'] ?? '') === 'ok') {
            $brokenLinks  = $br['summary']['broken_links_count']  ?? 0;
            $brokenImages = $br['summary']['broken_images_count'] ?? 0;
            if ($brokenLinks > 10)    { $score -= 10; $deductions[] = "{$brokenLinks} broken links (-10)"; }
            elseif ($brokenLinks > 0) { $score -= 5;  $deductions[] = "{$brokenLinks} broken link(s) (-5)"; }
            if ($brokenImages > 0)    { $score -= 5;  $deductions[] = "{$brokenImages} broken image(s) (-5)"; }
        }

        // --- Performance ---
        $perf = $audits['performance'] ?? [];
        if (($perf['status'] ?? '') === 'ok') {
            $ttfb = $perf['metrics']['ttfb_ms'] ?? null;
            if ($ttfb !== null) {
                if ($ttfb > 1500)     { $score -= 10; $deductions[] = "Performance: TTFB {$ttfb}ms (very slow) (-10)"; }
                elseif ($ttfb > 600)  { $score -= 5;  $deductions[] = "Performance: TTFB {$ttfb}ms (slow) (-5)"; }
            }
            // Only scored when PerformanceAuditController determined it's actually
            // worth flagging (page large enough that gzip/brotli would meaningfully
            // help) — a tiny page skipping compression isn't a health problem.
            if ($perf['page_analysis']['compression_worth_flagging'] ?? false) { $score -= 5; $deductions[] = 'Performance: compression not enabled (-5)'; }
            // Same size-gated principle: only same-origin CSS/JS files over 10KB
            // that still look unminified are ever reported here — a small file
            // gains nothing from minifying it, so it's never flagged at all.
            $unminifiedCount = \count($perf['page_analysis']['unminified_assets'] ?? []);
            if ($unminifiedCount > 0) { $score -= 3; $deductions[] = "Performance: {$unminifiedCount} unminified CSS/JS file(s) over 10KB (-3)"; }
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

            if ($formFail > 3)  { $score -= 8;  $deductions[] = "Accessibility: {$formFail} unlabeled form inputs (-8)"; }
            if ($imgFail  > 5)  { $score -= 5;  $deductions[] = "Accessibility: {$imgFail} images missing alt text (-5)"; }
            if ($ariaFail > 2)  { $score -= 5;  $deductions[] = "Accessibility: {$ariaFail} elements missing ARIA name (-5)"; }
            if ($hIssues  > 0)  { $score -= 5;  $deductions[] = 'Accessibility: heading hierarchy issues (-5)'; }
            if (! ($checks['landmarks']['has_lang']  ?? true)) { $score -= 5; $deductions[] = 'Accessibility: missing html lang attribute (-5)'; }
            if (! ($checks['landmarks']['has_main']  ?? true)) { $score -= 3; $deductions[] = 'Accessibility: no <main> landmark (-3)'; }
            if ($csFail   > 2)  { $score -= 5;  $deductions[] = "Accessibility: {$csFail} color contrast violations (-5)"; }
        }

        // --- Fuzz Testing (optional — only requested for some scans) ---
        if ($record->fuzz_requested ?? false) {
            $fuzzRaw = $record->fuzz_testing_result ?? null;
            $fuzz    = $fuzzRaw !== null ? json_decode($fuzzRaw, true) : null;
            if ($fuzz && ($fuzz['status'] ?? '') === 'ok') {
                $summary = $fuzz['summary'] ?? [];
                $serious = ($summary['reflected_input'] ?? 0) + ($summary['error_disclosure'] ?? 0) + ($summary['server_error'] ?? 0);
                $slow    = $summary['slow_response'] ?? 0;
                if ($serious > 0) {
                    $deduction = min(20, $serious * 8);
                    $score -= $deduction;
                    $deductions[] = "Fuzz testing: {$serious} potential input-handling issue(s) found (-{$deduction})";
                }
                if ($slow > 0) {
                    $deduction = min(5, $slow * 2);
                    $score -= $deduction;
                    $deductions[] = "Fuzz testing: {$slow} slow-response finding(s) (-{$deduction})";
                }
            }
        }

        return ['score' => max(0, $score), 'deductions' => $deductions];
    }
}
