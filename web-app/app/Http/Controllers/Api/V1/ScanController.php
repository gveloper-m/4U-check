<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\RunAuditorJob;
use App\Models\FullAuditReport;
use App\Http\Controllers\SeoSchemaAuditController;
use App\Http\Controllers\SecurityInfrastructureController;
use App\Http\Controllers\EcommerceCatalogAuditController;
use App\Http\Controllers\TrackingAuditController;
use App\Http\Controllers\BrokenResourceController;
use App\Http\Controllers\PerformanceAuditController;
use App\Http\Controllers\AccessibilityAuditController;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ScanController extends Controller
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

    public function index(Request $request): JsonResponse
    {
        $scans = $request->user()
            ->auditReports()
            ->latest()
            ->paginate(20)
            ->through(fn ($r) => $this->summarize($r));

        return response()->json($scans);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasReachedScanLimit()) {
            return response()->json(['error' => 'Monthly scan limit reached.'], 429);
        }

        $validated = $request->validate([
            'url'  => ['required', 'url', 'max:2048'],
            'name' => ['nullable', 'string', 'max:100'],
        ]);

        $url  = rtrim($validated['url'], '/');
        $name = $validated['name'] ?? $url;

        $reportId = DB::table('full_audit_reports')->insertGetId([
            'user_id'    => $user->id,
            'site_url'   => $url,
            'name'       => $name,
            'status'     => 'pending',
            'share_uuid' => Str::uuid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach (self::AUDITORS as $key => $controllerClass) {
            RunAuditorJob::dispatch($reportId, $key, $controllerClass, $url);
        }

        return response()->json(['id' => $reportId, 'status' => 'pending', 'url' => $url], 202);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $report = $this->findOwned($request, $id);

        if (! $report) {
            return response()->json(['error' => 'Not found.'], 404);
        }

        return response()->json($this->full($report));
    }

    public function pdf(Request $request, int $id): mixed
    {
        $report = $this->findOwned($request, $id);

        if (! $report) {
            return response()->json(['error' => 'Not found.'], 404);
        }

        if ($report->status !== 'completed') {
            return response()->json(['error' => 'Scan not yet completed.'], 409);
        }

        $user     = $request->user();
        $filename = 'audit-' . preg_replace('/[^a-z0-9]+/', '-', strtolower(parse_url($report->site_url, PHP_URL_HOST) ?? 'report')) . '.pdf';

        $agency = null;
        if ($user->is_agency) {
            $logoPath = null;
            if ($user->agency_logo) {
                $path = storage_path('app/public/' . $user->agency_logo);
                if (file_exists($path)) {
                    $logoPath = $path;
                }
            }
            $agency = [
                'name'            => $user->company_name,
                'logo_path'       => $logoPath,
                'primary_color'   => $user->agency_primary_color   ?? '#1a1a2e',
                'secondary_color' => $user->agency_secondary_color ?? '#2d3748',
                'footer_text'     => $user->agency_footer_text,
            ];
        }

        return Pdf::loadView('exports.audit-report', ['report' => $report, 'agency' => $agency])
            ->setPaper('a4', 'portrait')
            ->setOptions(['defaultFont' => 'DejaVu Sans', 'isRemoteEnabled' => false])
            ->download($filename);
    }

    public function csv(Request $request, int $id): mixed
    {
        $report = $this->findOwned($request, $id);

        if (! $report) {
            return response()->json(['error' => 'Not found.'], 404);
        }

        if ($report->status !== 'completed') {
            return response()->json(['error' => 'Scan not yet completed.'], 409);
        }

        $filename = 'audit-' . preg_replace('/[^a-z0-9]+/', '-', strtolower(parse_url($report->site_url, PHP_URL_HOST) ?? 'report')) . '.csv';

        return response()->stream(function () use ($report) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['module', 'key', 'value']);

            $sections = [
                'seo_schema'       => $report->seo_schema_result,
                'security'         => $report->security_result,
                'catalog'          => $report->catalog_result,
                'tracking'         => $report->tracking_result,
                'broken_resources' => $report->broken_resources_result,
                'performance'      => $report->performance_result,
                'accessibility'    => $report->accessibility_result,
            ];

            foreach ($sections as $module => $data) {
                if (! is_array($data)) {
                    continue;
                }
                foreach ($data as $key => $value) {
                    fputcsv($handle, [$module, $key, is_array($value) ? json_encode($value) : $value]);
                }
            }

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function findOwned(Request $request, int $id): ?FullAuditReport
    {
        return $request->user()->auditReports()->find($id);
    }

    private function summarize(FullAuditReport $r): array
    {
        return [
            'id'           => $r->id,
            'url'          => $r->site_url,
            'name'         => $r->name,
            'status'       => $r->status,
            'health_score' => $r->health_score,
            'created_at'   => $r->created_at?->toIso8601String(),
        ];
    }

    private function full(FullAuditReport $r): array
    {
        return array_merge($this->summarize($r), [
            'results' => [
                'seo_schema'       => $r->seo_schema_result,
                'security'         => $r->security_result,
                'catalog'          => $r->catalog_result,
                'tracking'         => $r->tracking_result,
                'broken_resources' => $r->broken_resources_result,
                'performance'      => $r->performance_result,
                'accessibility'    => $r->accessibility_result,
            ],
        ]);
    }
}
