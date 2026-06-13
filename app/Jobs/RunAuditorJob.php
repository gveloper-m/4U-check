<?php

namespace App\Jobs;

use App\Mail\ScanCompletedMail;
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
    ];

    public function __construct(
        public readonly int    $reportId,
        public readonly string $auditorKey,
        public readonly string $controllerClass,
        public readonly string $pageUrl,
    ) {}

    public function handle(): void
    {
        $column = self::COLUMN_MAP[$this->auditorKey];

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

    public function failed(\Throwable $exception): void
    {
        // Write a timeout/error marker so the finalization check can still count this auditor as done.
        $column = self::COLUMN_MAP[$this->auditorKey];
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

            $doneCount = 0;
            foreach (self::COLUMN_MAP as $col) {
                if ($record->$col !== null) {
                    $doneCount++;
                }
            }

            if ($doneCount < 6) {
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
                Mail::to($scan->user->email)
                    ->queue(new ScanCompletedMail($scan, $score, $reportUrl));
            }
        });
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
            if (($seo['meta_description']['status'] ?? '') !== 'OK') { $score -= 5;  $deductions[] = 'SEO: bad meta description (-5)'; }
            if (($seo['h1_tags']['status'] ?? '')          !== 'OK') { $score -= 5;  $deductions[] = 'SEO: H1 issue (-5)'; }
            if (($seo['canonical']['status'] ?? '') === 'MISSING')   { $score -= 3;  $deductions[] = 'SEO: missing canonical (-3)'; }
            if (($seo['canonical']['status'] ?? '') === 'MISMATCH')  { $score -= 5;  $deductions[] = 'SEO: canonical mismatch (-5)'; }
            if (! ($seo['schema_validation']['has_valid_schema'] ?? false)) { $score -= 5; $deductions[] = 'SEO: no structured data (-5)'; }
            if (($seo['open_graph']['status'] ?? '') === 'MISSING')  { $score -= 5;  $deductions[] = 'SEO: missing OG tags (-5)'; }
            if (($seo['image_alt_text']['status'] ?? '') === 'BAD')  { $score -= 5;  $deductions[] = 'SEO: images missing alt text (-5)'; }
            if (! ($seo['technical_seo']['robots_txt']['exists']  ?? true)) { $score -= 3; $deductions[] = 'SEO: robots.txt missing (-3)'; }
            if (! ($seo['technical_seo']['sitemap_xml']['exists'] ?? true)) { $score -= 3; $deductions[] = 'SEO: sitemap.xml missing (-3)'; }
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
        $trk = $audits['marketing_tracking'] ?? [];
        if (($trk['status'] ?? '') === 'ok') {
            $scripts = $trk['tracking_scripts'] ?? [];
            if (! ($scripts['ga4']['detected']            ?? false)) { $score -= 5; $deductions[] = 'Tracking: no GA4 detected (-5)'; }
            if (! ($scripts['facebook_pixel']['detected'] ?? false)) { $score -= 3; $deductions[] = 'Tracking: no Facebook Pixel (-3)'; }
        }

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
            $ttfb = $perf['avg_ttfb'] ?? null;
            if ($ttfb !== null) {
                if ($ttfb > 1500)     { $score -= 10; $deductions[] = "Performance: TTFB {$ttfb}ms (very slow) (-10)"; }
                elseif ($ttfb > 600)  { $score -= 5;  $deductions[] = "Performance: TTFB {$ttfb}ms (slow) (-5)"; }
            }
            if (! ($perf['compression_detected'] ?? false)) { $score -= 5; $deductions[] = 'Performance: compression not enabled (-5)'; }
        }

        return ['score' => max(0, $score), 'deductions' => $deductions];
    }
}
