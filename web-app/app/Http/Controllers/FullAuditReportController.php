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
        $record = DB::table('full_audit_reports')
            ->where('id', $id)
            ->where('user_id', auth()->id())
            ->first();

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
            $fuzzResult = ($record->fuzz_testing_result ?? null) !== null
                ? json_decode($record->fuzz_testing_result, true)
                : null;
            ['score' => $score, 'deductions' => $ded] = \App\Support\HealthScore::compute(
                $audits,
                (bool) ($record->fuzz_requested ?? false),
                $fuzzResult,
            );

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
            $query = DB::table('full_audit_reports')
                ->where('user_id', auth()->id());

            if ($request->has('site_url')) {
                $query->where('site_url', $request->query('site_url'));
            }

            return response()->json(['success' => true, 'audits' => $query->latest('executed_at')->paginate(10)]);
        } catch (\Throwable $e) {
            \Log::error('Audit history error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'error' => 'Could not retrieve history.'], 400);
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
}
