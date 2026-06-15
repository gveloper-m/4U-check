<?php

namespace App\Http\Controllers;

use App\Jobs\RunAuditorJob;
use App\Models\FullAuditReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditController extends Controller
{
    private const AUDITORS = [
        'seo_schema'         => SeoSchemaAuditController::class,
        'security'           => SecurityInfrastructureController::class,
        'catalog_integrity'  => EcommerceCatalogAuditController::class,
        'marketing_tracking' => TrackingAuditController::class,
        'broken_resources'   => BrokenResourceController::class,
        'performance'        => PerformanceAuditController::class,
        'accessibility'      => AccessibilityAuditController::class,
    ];

    /**
     * GET /audits — list user's reports paginated
     */
    public function index(): InertiaResponse
    {
        $reports = auth()->user()
            ->auditReports()
            ->latest()
            ->paginate(15);

        return Inertia::render('Audits/Index', ['reports' => $reports]);
    }

    /**
     * POST /audits — start a new scan, then redirect to show page for live polling
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'site_url' => 'required|url',
            'name'     => 'nullable|string|max:255',
        ]);

        $reportId = DB::table('full_audit_reports')->insertGetId([
            'user_id'     => auth()->id(),
            'name'        => $validated['name'] ?? null,
            'site_url'    => $validated['site_url'],
            'status'      => 'running',
            'executed_at' => now(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        foreach (self::AUDITORS as $key => $controllerClass) {
            RunAuditorJob::dispatch($reportId, $key, $controllerClass, $validated['site_url']);
        }

        return redirect()->route('audits.show', $reportId);
    }

    /**
     * GET /audits/{report} — show single report
     */
    public function show(FullAuditReport $report): InertiaResponse
    {
        abort_unless($report->user_id === auth()->id(), 403);

        return Inertia::render('Audits/Show', ['report' => $report]);
    }

    /**
     * GET /audits/{report}/status — JSON polling endpoint
     */
    public function status(FullAuditReport $report): JsonResponse
    {
        abort_unless($report->user_id === auth()->id(), 403);

        $record    = DB::table('full_audit_reports')->find($report->id);
        $doneCount = 0;
        $progress  = [];

        foreach (RunAuditorJob::COLUMN_MAP as $key => $col) {
            $isDone          = $record->$col !== null;
            $progress[$key]  = $isDone ? 'done' : 'running';
            if ($isDone) $doneCount++;
        }

        if ($doneCount === 7 && $record->status !== 'completed') {
            DB::table('full_audit_reports')->where('id', $report->id)->update([
                'status'     => 'completed',
                'updated_at' => now(),
            ]);
            $record->status = 'completed';
        }

        return response()->json([
            'status'   => $record->status,
            'progress' => [
                'completed' => $doneCount,
                'total'     => 7,
                'auditors'  => $progress,
            ],
        ]);
    }

    /**
     * DELETE /audits/{report}
     */
    public function destroy(FullAuditReport $report): JsonResponse
    {
        abort_unless($report->user_id === auth()->id(), 403);

        $report->delete();

        return response()->json(['success' => true]);
    }

    /**
     * GET /audits/{report}/export/pdf
     */
    public function exportPdf(FullAuditReport $report): Response
    {
        abort_unless($report->user_id === auth()->id(), 403);

        $pdf = Pdf::loadView('exports.audit-report', ['report' => $report])
            ->setPaper('a4', 'portrait')
            ->setOptions(['defaultFont' => 'DejaVu Sans', 'isRemoteEnabled' => false]);

        $filename = 'audit-report-' . parse_url($report->site_url, PHP_URL_HOST)
            . '-' . $report->created_at->format('Ymd-His') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * GET /audits/{report}/export/csv
     */
    public function exportCsv(FullAuditReport $report): StreamedResponse
    {
        abort_unless($report->user_id === auth()->id(), 403);

        $filename = 'audit-report-' . parse_url($report->site_url, PHP_URL_HOST)
            . '-' . $report->created_at->format('Ymd-His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function () use ($report) {
            $handle = fopen('php://output', 'w');

            // ── Report header ──────────────────────────────────────────────────
            fputcsv($handle, ['Field', 'Value']);
            fputcsv($handle, ['Report ID',    $report->id]);
            fputcsv($handle, ['Site URL',     $report->site_url]);
            fputcsv($handle, ['Name',         $report->name ?? '']);
            fputcsv($handle, ['Status',       $report->status]);
            fputcsv($handle, ['Health Score', $report->health_score ?? '']);
            fputcsv($handle, ['Created At',   $report->created_at]);
            fputcsv($handle, []);

            // ── Score deductions ───────────────────────────────────────────────
            if (is_array($report->score_deductions) && count($report->score_deductions) > 0) {
                fputcsv($handle, ['SCORE DEDUCTIONS']);
                foreach ($report->score_deductions as $deduction) {
                    fputcsv($handle, ['', $deduction]);
                }
                fputcsv($handle, []);
            }

            // ── SEO & Schema ───────────────────────────────────────────────────
            $seo = $report->seo_schema_result ?? [];
            if (is_array($seo)) {
                fputcsv($handle, ['SEO & SCHEMA']);
                fputcsv($handle, ['Meta Title Status',       $seo['meta_title']['status']       ?? '']);
                fputcsv($handle, ['Meta Title Value',        $seo['meta_title']['value']        ?? '']);
                fputcsv($handle, ['Meta Title Length',       $seo['meta_title']['length']       ?? '']);
                fputcsv($handle, ['Meta Desc Status',        $seo['meta_description']['status'] ?? '']);
                fputcsv($handle, ['Meta Desc Length',        $seo['meta_description']['length'] ?? '']);
                fputcsv($handle, ['H1 Count',                $seo['h1_tags']['count']           ?? '']);
                fputcsv($handle, ['Canonical Status',        $seo['canonical']['status']        ?? '']);
                fputcsv($handle, ['Canonical URL',           $seo['canonical']['url']           ?? '']);
                fputcsv($handle, ['Schema Valid',            ($seo['schema_validation']['has_valid_schema'] ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['OG Status',               $seo['open_graph']['status']       ?? '']);
                fputcsv($handle, ['Images Missing Alt',      $seo['image_alt_text']['missing_alt'] ?? '']);
                fputcsv($handle, ['robots.txt',              ($seo['technical_seo']['robots_txt']['exists'] ?? false) ? 'Found' : 'Missing']);
                fputcsv($handle, ['sitemap.xml',             ($seo['technical_seo']['sitemap_xml']['exists'] ?? false) ? 'Found' : 'Missing']);
                foreach ($seo['schema_validation']['errors'] ?? [] as $err) {
                    fputcsv($handle, ['Schema Error', $err]);
                }
                foreach ($seo['open_graph']['issues'] ?? [] as $issue) {
                    fputcsv($handle, ['OG Issue', $issue]);
                }
                foreach ($seo['image_alt_text']['missing_alt_urls'] ?? [] as $src) {
                    fputcsv($handle, ['Image Missing Alt', $src]);
                }
                fputcsv($handle, []);
            }

            // ── Security ───────────────────────────────────────────────────────
            $sec = $report->security_result ?? [];
            if (is_array($sec)) {
                fputcsv($handle, ['SECURITY']);
                fputcsv($handle, ['SSL Valid',             ($sec['ssl']['ssl_valid']       ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['SSL Days Left',         $sec['ssl']['ssl_days_left']    ?? '']);
                fputcsv($handle, ['SSL Expiry',            $sec['ssl']['ssl_expiry']       ?? '']);
                fputcsv($handle, ['SSL Issuer',            $sec['ssl']['ssl_issuer']       ?? '']);
                fputcsv($handle, ['Mixed Content',         ($sec['mixed_content']['has_mixed_content'] ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['SPF Record',            ($sec['dns_security']['spf_record_exists']   ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['DMARC Record',          ($sec['dns_security']['dmarc_record_exists'] ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['DKIM Found',            ($sec['dns_security']['dkim_found']          ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['DKIM Selector',         $sec['dns_security']['dkim_selector']        ?? '']);
                fputcsv($handle, ['HTTPS Redirect',        ($sec['https_redirect']['redirects_to_https'] ?? null) === true ? 'Yes' : 'No']);
                fputcsv($handle, ['Header Score',          $sec['security_headers']['score']  ?? '']);
                foreach ($sec['security_headers']['headers_missing'] ?? [] as $h) {
                    fputcsv($handle, ['Missing Header', $h]);
                }
                foreach ($sec['security_headers']['info_disclosure'] ?? [] as $h => $val) {
                    fputcsv($handle, ['Info Disclosure', "{$h}: {$val}"]);
                }
                foreach ($sec['mixed_content']['mixed_content_items'] ?? [] as $item) {
                    fputcsv($handle, ['Mixed Content Item', $item['element'] ?? '', $item['url'] ?? '']);
                }
                fputcsv($handle, []);
            }

            // ── Performance ────────────────────────────────────────────────────
            $perf = $report->performance_result ?? [];
            if (is_array($perf)) {
                fputcsv($handle, ['PERFORMANCE']);
                fputcsv($handle, ['Pages Tested',          $perf['pages_tested']                    ?? '']);
                fputcsv($handle, ['TTFB (ms)',              $perf['metrics']['ttfb_ms']              ?? '']);
                fputcsv($handle, ['Desktop FCP (ms)',       $perf['metrics']['desktop']['fcp_ms']    ?? '']);
                fputcsv($handle, ['Desktop LCP (ms)',       $perf['metrics']['desktop']['lcp_ms']    ?? '']);
                fputcsv($handle, ['Desktop CLS',            $perf['metrics']['desktop']['cls_score'] ?? '']);
                fputcsv($handle, ['Mobile FCP (ms)',        $perf['metrics']['mobile']['fcp_ms']     ?? '']);
                fputcsv($handle, ['Mobile LCP (ms)',        $perf['metrics']['mobile']['lcp_ms']     ?? '']);
                fputcsv($handle, ['Mobile CLS',             $perf['metrics']['mobile']['cls_score']  ?? '']);
                fputcsv($handle, ['HTML Size (KB)',         $perf['page_analysis']['html_size_kb']   ?? '']);
                fputcsv($handle, ['Compression',            ($perf['page_analysis']['compression_enabled'] ?? false) ? 'Enabled' : 'Disabled']);
                fputcsv($handle, ['Content Encoding',       $perf['page_analysis']['content_encoding'] ?? '']);
                fputcsv($handle, ['Render-Blocking Scripts', count($perf['page_analysis']['render_blocking_scripts'] ?? [])]);
                fputcsv($handle, ['Render-Blocking Styles',  count($perf['page_analysis']['render_blocking_styles']  ?? [])]);
                foreach ($perf['page_analysis']['issues'] ?? [] as $issue) {
                    fputcsv($handle, ['Performance Issue', $issue]);
                }
                fputcsv($handle, []);
            }

            // ── Marketing Tracking ─────────────────────────────────────────────
            $trk = $report->tracking_result ?? [];
            if (is_array($trk)) {
                fputcsv($handle, ['MARKETING TRACKING']);
                fputcsv($handle, ['Pages Crawled',     $trk['pages_crawled'] ?? '']);
                fputcsv($handle, ['GA4 Detected',      ($trk['tracking_scripts']['ga4']['detected']           ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['GA4 IDs',           implode(', ', $trk['tracking_scripts']['ga4']['ids']   ?? [])]);
                fputcsv($handle, ['Facebook Detected', ($trk['tracking_scripts']['facebook_pixel']['detected'] ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['Facebook IDs',      implode(', ', $trk['tracking_scripts']['facebook_pixel']['ids'] ?? [])]);
                fputcsv($handle, ['TikTok Detected',   ($trk['tracking_scripts']['tiktok_pixel']['detected']  ?? false) ? 'Yes' : 'No']);
                fputcsv($handle, ['TikTok IDs',        implode(', ', $trk['tracking_scripts']['tiktok_pixel']['ids']   ?? [])]);
                fputcsv($handle, []);
            }

            // ── Broken Resources ───────────────────────────────────────────────
            $br = $report->broken_resources_result ?? [];
            if (is_array($br)) {
                fputcsv($handle, ['BROKEN RESOURCES']);
                fputcsv($handle, ['Pages Crawled',          $br['pages_crawled']                    ?? '']);
                fputcsv($handle, ['Total Links Checked',    $br['summary']['total_links_checked']   ?? '']);
                fputcsv($handle, ['Broken Links Count',     $br['summary']['broken_links_count']    ?? '']);
                fputcsv($handle, ['Broken Links %',         $br['summary']['broken_links_percentage'] ?? '']);
                fputcsv($handle, ['Total Images Checked',   $br['summary']['total_images_checked']  ?? '']);
                fputcsv($handle, ['Broken Images Count',    $br['summary']['broken_images_count']   ?? '']);
                fputcsv($handle, ['Broken Images %',        $br['summary']['broken_images_percentage'] ?? '']);
                if (! empty($br['broken_links'])) {
                    fputcsv($handle, []);
                    fputcsv($handle, ['Broken Links — URL', 'Status', 'Found On Page']);
                    foreach ($br['broken_links'] as $item) {
                        fputcsv($handle, [$item['url'] ?? '', $item['status_code'] ?? ($item['error'] ?? ''), $item['found_on'] ?? '']);
                    }
                }
                if (! empty($br['broken_images'])) {
                    fputcsv($handle, []);
                    fputcsv($handle, ['Broken Images — URL', 'Status', 'Found On Page']);
                    foreach ($br['broken_images'] as $item) {
                        fputcsv($handle, [$item['url'] ?? '', $item['status_code'] ?? ($item['error'] ?? ''), $item['found_on'] ?? '']);
                    }
                }
                fputcsv($handle, []);
            }

            // ── Ecommerce Catalog ──────────────────────────────────────────────
            $cat = $report->catalog_result ?? [];
            if (is_array($cat)) {
                fputcsv($handle, ['ECOMMERCE CATALOG']);
                fputcsv($handle, ['Pages Crawled',        $cat['pages_crawled']           ?? '']);
                fputcsv($handle, ['Product Pages Found',  $cat['product_pages_found']     ?? '']);
                fputcsv($handle, ['Products Audited',     $cat['products_audited']        ?? '']);
                fputcsv($handle, ['Broken Products',      $cat['broken_products_count']   ?? '']);
                fputcsv($handle, ['Broken %',             $cat['broken_percentage']       ?? '']);
                if (! empty($cat['results'])) {
                    fputcsv($handle, []);
                    fputcsv($handle, ['Product URL', 'Broken', 'Price Error', 'Detected Price', 'Schema Stock', 'Cart Disabled', 'Stock Mismatch']);
                    foreach ($cat['results'] as $item) {
                        fputcsv($handle, [
                            $item['url']              ?? '',
                            ($item['is_broken']       ?? false) ? 'Yes' : 'No',
                            ($item['has_price_error'] ?? false) ? 'Yes' : 'No',
                            $item['detected_price']   ?? '',
                            $item['schema_stock']     ?? '',
                            ($item['cart_disabled']   ?? false) ? 'Yes' : 'No',
                            ($item['stock_mismatch']  ?? false) ? 'Yes' : 'No',
                        ]);
                    }
                }
                fputcsv($handle, []);
            }

            // ── Accessibility ──────────────────────────────────────────────────
            $a11y = $report->accessibility_result ?? [];
            if (is_array($a11y)) {
                fputcsv($handle, ['ACCESSIBILITY']);
                fputcsv($handle, ['Score',               $a11y['score']                                   ?? '']);
                fputcsv($handle, ['Form Labels — Pass',  $a11y['checks']['form_labels']['pass']           ?? '']);
                fputcsv($handle, ['Form Labels — Fail',  $a11y['checks']['form_labels']['fail']           ?? '']);
                fputcsv($handle, ['Images Missing Alt',  $a11y['checks']['image_alt']['missing_count']    ?? '']);
                fputcsv($handle, ['ARIA Violations',     $a11y['checks']['aria_labels']['fail']           ?? '']);
                fputcsv($handle, ['Heading Issues',      count($a11y['checks']['heading_hierarchy']['issues'] ?? [])]);
                fputcsv($handle, ['Vague Links',         $a11y['checks']['link_text']['fail']             ?? '']);
                fputcsv($handle, ['HTML Lang',           ($a11y['checks']['landmarks']['has_lang']  ?? false) ? $a11y['checks']['landmarks']['lang'] : 'Missing']);
                fputcsv($handle, ['Main Landmark',       ($a11y['checks']['landmarks']['has_main']  ?? false) ? 'Present' : 'Missing']);
                fputcsv($handle, ['Skip Nav',            ($a11y['checks']['landmarks']['has_skip_nav'] ?? false) ? 'Present' : 'Missing']);
                fputcsv($handle, ['Color Contrast Fail', $a11y['checks']['color_contrast']['fail']       ?? '']);

                // Unlabeled inputs
                if (! empty($a11y['checks']['form_labels']['violations'])) {
                    fputcsv($handle, []);
                    fputcsv($handle, ['Unlabeled Inputs — Element', 'Type', 'Name', 'ID', 'HTML Snippet']);
                    foreach ($a11y['checks']['form_labels']['violations'] as $v) {
                        fputcsv($handle, [$v['element'] ?? '', $v['type'] ?? '', $v['name'] ?? '', $v['id'] ?? '', $v['html_snippet'] ?? '']);
                    }
                }

                // Images missing alt
                if (! empty($a11y['checks']['image_alt']['violations'])) {
                    fputcsv($handle, []);
                    fputcsv($handle, ['Images Missing Alt — Src', 'Parent Tag', 'Parent Href', 'HTML Snippet']);
                    foreach ($a11y['checks']['image_alt']['violations'] as $v) {
                        fputcsv($handle, [$v['src'] ?? '', $v['parent_tag'] ?? '', $v['parent_href'] ?? '', $v['html_snippet'] ?? '']);
                    }
                }

                // ARIA violations
                if (! empty($a11y['checks']['aria_labels']['violations'])) {
                    fputcsv($handle, []);
                    fputcsv($handle, ['ARIA Violations — Element', 'Href/Src', 'Issue', 'HTML Snippet']);
                    foreach ($a11y['checks']['aria_labels']['violations'] as $v) {
                        fputcsv($handle, [
                            $v['element']      ?? '',
                            $v['href']         ?? ($v['src'] ?? ''),
                            $v['issue']        ?? '',
                            $v['html_snippet'] ?? '',
                        ]);
                    }
                }

                // Heading issues
                if (! empty($a11y['checks']['heading_hierarchy']['issues'])) {
                    fputcsv($handle, []);
                    fputcsv($handle, ['Heading Issues']);
                    foreach ($a11y['checks']['heading_hierarchy']['issues'] as $issue) {
                        fputcsv($handle, ['', $issue]);
                    }
                }

                // Color contrast violations
                if (! empty($a11y['checks']['color_contrast']['violations'])) {
                    fputcsv($handle, []);
                    fputcsv($handle, ['Color Contrast — Element/Selector', 'FG Color', 'BG Color', 'Ratio', 'Required', 'Source', 'HTML Snippet']);
                    foreach ($a11y['checks']['color_contrast']['violations'] as $v) {
                        $label = $v['selector'] ?? ($v['element'] ?? '');
                        if (!empty($v['class'])) $label .= ' .' . trim($v['class']);
                        if (!empty($v['id']))    $label .= ' #' . $v['id'];
                        fputcsv($handle, [
                            $label,
                            $v['fg_color']     ?? '',
                            $v['bg_color']     ?? '',
                            $v['ratio']        ?? '',
                            $v['required']     ?? 4.5,
                            $v['source']       ?? '',
                            $v['html_snippet'] ?? '',
                        ]);
                    }
                }
                fputcsv($handle, []);
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * GET /audits/compare?ids[]=1&ids[]=2
     */
    public function compare(Request $request): InertiaResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:2|max:3',
            'ids.*' => 'integer',
        ]);

        $userId  = auth()->id();
        $reports = FullAuditReport::whereIn('id', $validated['ids'])
            ->where('user_id', $userId)
            ->get();

        abort_if($reports->count() < 2, 403);

        return Inertia::render('Audits/Compare', ['reports' => $reports]);
    }
}
