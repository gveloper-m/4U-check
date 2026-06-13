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

            fputcsv($handle, ['Field', 'Value']);
            fputcsv($handle, ['Report ID',   $report->id]);
            fputcsv($handle, ['Site URL',    $report->site_url]);
            fputcsv($handle, ['Name',        $report->name ?? '']);
            fputcsv($handle, ['Status',      $report->status]);
            fputcsv($handle, ['Health Score', $report->health_score ?? '']);
            fputcsv($handle, ['Created At',  $report->created_at]);
            fputcsv($handle, []);

            $audits = [
                'SEO & Schema'        => $report->seo_schema_result,
                'Security'            => $report->security_result,
                'Catalog Integrity'   => $report->catalog_result,
                'Marketing Tracking'  => $report->tracking_result,
                'Broken Resources'    => $report->broken_resources_result,
                'Performance'         => $report->performance_result,
            ];

            foreach ($audits as $label => $data) {
                fputcsv($handle, [$label]);
                if (is_array($data)) {
                    foreach ($data as $key => $value) {
                        fputcsv($handle, [$key, is_array($value) ? json_encode($value) : $value]);
                    }
                }
                fputcsv($handle, []);
            }

            if (is_array($report->score_deductions)) {
                fputcsv($handle, ['Score Deductions']);
                foreach ($report->score_deductions as $deduction) {
                    fputcsv($handle, [$deduction]);
                }
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
