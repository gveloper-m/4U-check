<?php

namespace App\Http\Controllers;

use App\Jobs\RunAuditorJob;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class FullAuditReportController extends Controller
{
    private const AUDITORS = [
        'seo_schema'         => SeoSchemaAuditController::class,
        'security'           => SecurityInfrastructureController::class,
        'catalog_integrity'  => EcommerceCatalogAuditController::class,
        'marketing_tracking' => TrackingAuditController::class,
        'broken_resources'   => BrokenResourceController::class,
        'performance'        => PerformanceAuditController::class,
    ];

    /**
     * Kick off a full audit asynchronously. Returns report_id immediately.
     * Client polls GET /api/audit/full-report/status/{id} for results.
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page_url' => 'required|url',
            'format'   => 'sometimes|string|in:json,pdf',
        ]);

        $pageUrl = $validated['page_url'];
        $format  = strtolower($validated['format'] ?? 'json');

        $reportId = DB::table('full_audit_reports')->insertGetId([
            'user_id'     => auth()->id(),
            'site_url'    => $pageUrl,
            'status'      => 'running',
            'executed_at' => now(),
        ]);

        foreach (self::AUDITORS as $key => $controllerClass) {
            RunAuditorJob::dispatch($reportId, $key, $controllerClass, $pageUrl);
        }

        return response()->json([
            'success'   => true,
            'status'    => 'running',
            'report_id' => $reportId,
            'site_url'  => $pageUrl,
            'format'    => $format,
            'poll_url'  => url("/api/audit/full-report/status/{$reportId}") . ($format === 'pdf' ? '?format=pdf' : ''),
            'message'   => 'All 6 auditors are running in parallel. Poll the poll_url to check progress.',
        ], 202);
    }

    /**
     * Poll for the status of a running audit.
     * Returns partial progress or the full completed report.
     * Pass ?format=pdf to download as PDF once completed.
     */
    public function status(Request $request, int $id): JsonResponse|Response
    {
        $record = DB::table('full_audit_reports')->find($id);

        if (! $record) {
            return response()->json(['success' => false, 'error' => 'Report not found'], 404);
        }

        // Count how many auditors have written their result
        $progress = [];
        $doneCount = 0;
        foreach (RunAuditorJob::COLUMN_MAP as $key => $col) {
            $isDone = $record->$col !== null;
            $progress[$key] = $isDone ? 'done' : 'running';
            if ($isDone) $doneCount++;
        }

        // If all 6 are done and status not yet marked completed, finalize
        if ($doneCount === 6 && $record->status !== 'completed') {
            $audits = $this->buildAuditsArray($record);
            ['score' => $score, 'deductions' => $ded] = $this->computeHealthScore($audits);

            DB::table('full_audit_reports')->where('id', $id)->update([
                'status'           => 'completed',
                'health_score'     => $score,
                'score_deductions' => json_encode($ded),
            ]);

            $record = DB::table('full_audit_reports')->find($id);
        }

        if ($record->status !== 'completed') {
            return response()->json([
                'success'   => true,
                'status'    => $record->status,
                'report_id' => $id,
                'progress'  => ['completed' => $doneCount, 'total' => 6, 'auditors' => $progress],
            ]);
        }

        // Build the full report
        $audits = $this->buildAuditsArray($record);
        $report = [
            'site_url'         => $record->site_url,
            'generated_at'     => $record->executed_at,
            'audits'           => $audits,
            'health_score'     => $record->health_score,
            'score_deductions' => json_decode($record->score_deductions ?? '[]', true),
        ];

        $format = strtolower($request->query('format', 'json'));

        if ($format === 'pdf') {
            $pdf      = Pdf::loadView('audit-report', ['report' => $report])
                ->setPaper('a4', 'portrait')
                ->setOptions(['defaultFont' => 'DejaVu Sans', 'isRemoteEnabled' => false]);
            $filename = 'audit-report-' . parse_url($record->site_url, PHP_URL_HOST) . '-' . now()->format('Ymd-His') . '.pdf';
            return $pdf->download($filename);
        }

        return response()->json(['success' => true, 'report' => $report]);
    }

    public function history(Request $request): JsonResponse
    {
        try {
            $query = DB::table('full_audit_reports');
            if ($request->has('site_url')) {
                $query->where('site_url', $request->query('site_url'));
            }
            return response()->json(['success' => true, 'audits' => $query->latest('executed_at')->paginate(10)]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    // -------------------------------------------------------------------------

    private function buildAuditsArray(object $record): array
    {
        $map = [
            'seo_schema'         => 'seo_schema_result',
            'security'           => 'security_result',
            'catalog_integrity'  => 'catalog_result',
            'marketing_tracking' => 'tracking_result',
            'broken_resources'   => 'broken_resources_result',
            'performance'        => 'performance_result',
        ];

        $audits = [];
        foreach ($map as $key => $col) {
            $raw = $record->$col;
            $audits[$key] = $raw !== null ? json_decode($raw, true) : ['status' => 'running'];
        }
        return $audits;
    }

    private function computeHealthScore(array $audits): array
    {
        $score      = 100;
        $deductions = [];

        // SEO checks
        $seo = $audits['seo_schema'] ?? [];
        if (($seo['status'] ?? '') === 'ok') {
            if (($seo['meta_title']['status'] ?? '')       !== 'OK') { $score -= 5;  $deductions[] = 'SEO: bad meta title'; }
            if (($seo['meta_description']['status'] ?? '') !== 'OK') { $score -= 5;  $deductions[] = 'SEO: bad meta description'; }
            if (($seo['h1_tags']['status'] ?? '')          !== 'OK') { $score -= 5;  $deductions[] = 'SEO: H1 count issue'; }
            if (($seo['canonical']['status'] ?? '') === 'MISSING')   { $score -= 3;  $deductions[] = 'SEO: missing canonical'; }
            if (($seo['canonical']['status'] ?? '') === 'MISMATCH')  { $score -= 5;  $deductions[] = 'SEO: canonical mismatch'; }
            if (! ($seo['schema_validation']['has_valid_schema'] ?? false)) { $score -= 5; $deductions[] = 'SEO: no structured data'; }
            if (($seo['open_graph']['status'] ?? '') === 'MISSING')  { $score -= 5;  $deductions[] = 'SEO: missing OG tags'; }
            if (($seo['image_alt_text']['status'] ?? '') === 'BAD')  { $score -= 5;  $deductions[] = 'SEO: many images missing alt text'; }
            if (! ($seo['technical_seo']['robots_txt']['exists'] ?? true))  { $score -= 3; $deductions[] = 'SEO: robots.txt missing'; }
            if (! ($seo['technical_seo']['sitemap_xml']['exists'] ?? true)) { $score -= 3; $deductions[] = 'SEO: sitemap.xml missing'; }
        }

        // Security checks
        $sec = $audits['security'] ?? [];
        if (($sec['status'] ?? '') === 'ok') {
            if (! ($sec['ssl']['ssl_valid'] ?? false))               { $score -= 20; $deductions[] = 'Security: invalid SSL'; }
            elseif (($sec['ssl']['ssl_days_left'] ?? 99) <= 30)      { $score -= 10; $deductions[] = 'Security: SSL expiring soon'; }
            if ($sec['mixed_content']['has_mixed_content'] ?? false)  { $score -= 10; $deductions[] = 'Security: mixed content'; }
            if (! ($sec['dns_security']['spf_record_exists']   ?? false)) { $score -= 5; $deductions[] = 'Security: no SPF record'; }
            if (! ($sec['dns_security']['dmarc_record_exists'] ?? false)) { $score -= 5; $deductions[] = 'Security: no DMARC record'; }
            $hs = $sec['security_headers']['score'] ?? 6;
            if ($hs <= 2)      { $score -= 10; $deductions[] = 'Security: most security headers missing'; }
            elseif ($hs <= 4)  { $score -= 5;  $deductions[] = 'Security: some security headers missing'; }
            if (($sec['https_redirect']['redirects_to_https'] ?? null) === false) { $score -= 5; $deductions[] = 'Security: http:// not redirected to https://'; }
        }

        // Catalog checks
        $cat = $audits['catalog_integrity'] ?? [];
        if (($cat['status'] ?? '') === 'ok' && ($cat['products_audited'] ?? 0) > 0) {
            $pct = $cat['broken_percentage'] ?? 0;
            if ($pct > 50)     { $score -= 20; $deductions[] = "Catalog: {$pct}% products broken"; }
            elseif ($pct > 10) { $score -= 10; $deductions[] = "Catalog: {$pct}% products broken"; }
            elseif ($pct > 0)  { $score -= 5;  $deductions[] = "Catalog: {$pct}% products broken"; }
        }

        // Tracking checks
        $trk = $audits['marketing_tracking'] ?? [];
        if (($trk['status'] ?? '') === 'ok') {
            $scripts = $trk['tracking_scripts'] ?? [];
            if (! ($scripts['ga4']['detected']           ?? false)) { $score -= 5; $deductions[] = 'Tracking: no GA4'; }
            if (! ($scripts['facebook_pixel']['detected'] ?? false)) { $score -= 3; $deductions[] = 'Tracking: no Facebook Pixel'; }
        }

        // Broken resources
        $br = $audits['broken_resources'] ?? [];
        if (($br['status'] ?? '') === 'ok') {
            $brokenLinks  = $br['summary']['broken_links_count']  ?? 0;
            $brokenImages = $br['summary']['broken_images_count'] ?? 0;
            if ($brokenLinks > 10)    { $score -= 10; $deductions[] = "{$brokenLinks} broken links"; }
            elseif ($brokenLinks > 0) { $score -= 5;  $deductions[] = "{$brokenLinks} broken links"; }
            if ($brokenImages > 0)    { $score -= 5;  $deductions[] = "{$brokenImages} broken images"; }
        }

        // Performance
        $perf = $audits['performance'] ?? [];
        if (($perf['status'] ?? '') === 'ok') {
            $ttfb = $perf['metrics']['ttfb_ms'] ?? null;
            if ($ttfb !== null) {
                if ($ttfb > 800)     { $score -= 10; $deductions[] = "Performance: slow TTFB {$ttfb}ms"; }
                elseif ($ttfb > 400) { $score -= 5;  $deductions[] = "Performance: TTFB {$ttfb}ms"; }
            }
            $lcp = $perf['metrics']['desktop']['lcp_ms'] ?? null;
            if ($lcp !== null) {
                if ($lcp > 4000)     { $score -= 10; $deductions[] = "Performance: poor LCP {$lcp}ms"; }
                elseif ($lcp > 2500) { $score -= 5;  $deductions[] = "Performance: needs improvement LCP {$lcp}ms"; }
            }
            $pa = $perf['page_analysis'] ?? [];
            if (! ($pa['compression_enabled'] ?? true)) { $score -= 5; $deductions[] = 'Performance: no gzip/brotli compression'; }
            if (($pa['total_render_blocking'] ?? 0) > 3) { $score -= 3; $deductions[] = 'Performance: render-blocking resources'; }
        }

        return ['score' => max(0, $score), 'deductions' => $deductions];
    }
}
