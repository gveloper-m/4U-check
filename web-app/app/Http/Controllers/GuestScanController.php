<?php

namespace App\Http\Controllers;

use App\Jobs\RunAuditorJob;
use App\Rules\PublicUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GuestScanController extends Controller
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

    // Throttle window: one free scan per IP or browser token within this many days
    private const LIMIT_DAYS = 30;

    public function store(Request $request): JsonResponse
    {
        $ip         = $request->ip();
        $guestToken = $request->cookie('guest_scan_token');

        $base = DB::table('full_audit_reports')
            ->whereNull('user_id')
            ->where('created_at', '>', now()->subDays(self::LIMIT_DAYS));

        $blockedByIp    = (clone $base)->where('guest_ip', $ip)->exists();
        $blockedByToken = $guestToken && (clone $base)->where('guest_token', $guestToken)->exists();

        if ($blockedByIp || $blockedByToken) {
            return response()->json(['error' => 'limit_reached'], 429);
        }

        $validated = $request->validate([
            'site_url' => ['required', 'url', new PublicUrl],
        ]);

        $guestToken = $guestToken ?? Str::uuid()->toString();
        $shareUuid  = Str::uuid()->toString();

        $reportId = DB::table('full_audit_reports')->insertGetId([
            'user_id'       => null,
            'guest_ip'      => $ip,
            'guest_token'   => $guestToken,
            'site_url'      => $validated['site_url'],
            'status'        => 'running',
            'share_uuid'    => $shareUuid,
            'share_enabled' => true,
            'executed_at'   => now(),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        foreach (self::AUDITORS as $key => $controllerClass) {
            RunAuditorJob::dispatch($reportId, $key, $controllerClass, $validated['site_url']);
        }

        return response()
            ->json(['uuid' => $shareUuid])
            ->cookie('guest_scan_token', $guestToken, 60 * 24 * self::LIMIT_DAYS); // 30-day cookie
    }

    public function status(string $uuid): JsonResponse
    {
        $report = DB::table('full_audit_reports')
            ->where('share_uuid', $uuid)
            ->whereNull('user_id')
            ->select([
                'status', 'health_score', 'site_url', 'score_deductions',
                'seo_schema_result', 'security_result', 'catalog_result',
                'tracking_result', 'broken_resources_result',
                'performance_result', 'accessibility_result',
            ])
            ->first();

        abort_if(! $report, 404);

        // Count auditors completed so far
        $cols     = RunAuditorJob::COLUMN_MAP;
        $doneCount = 0;
        foreach ($cols as $col) {
            if ($report->$col !== null) $doneCount++;
        }

        // Auto-complete when all 7 done (mirrors what AuditController::status does)
        if ($doneCount === 7 && $report->status !== 'completed') {
            DB::table('full_audit_reports')
                ->where('share_uuid', $uuid)
                ->update(['status' => 'completed', 'updated_at' => now()]);
            $report->status = 'completed';
        }

        $decode = fn(?string $v) => $v !== null ? json_decode($v, true) : null;

        return response()->json([
            'status'       => $report->status,
            'health_score' => $report->health_score,
            'site_url'     => $report->site_url,
            'progress'     => ['completed' => $doneCount, 'total' => 7],
            'deductions'   => json_decode($report->score_deductions ?? '[]', true) ?? [],
            'categories'   => [
                'seo'             => $report->seo_schema_result !== null,
                'security'        => $report->security_result !== null,
                'performance'     => $report->performance_result !== null,
                'broken_resources'=> $report->broken_resources_result !== null,
                'accessibility'   => $report->accessibility_result !== null,
                'catalog'         => $report->catalog_result !== null,
                'tracking'        => $report->tracking_result !== null,
            ],
            // Full module results — only populated once completed
            'seo_result'           => $decode($report->seo_schema_result),
            'security_result'      => $decode($report->security_result),
            'performance_result'   => $decode($report->performance_result),
            'broken_result'        => $decode($report->broken_resources_result),
            'catalog_result'       => $decode($report->catalog_result),
            'tracking_result'      => $decode($report->tracking_result),
            'accessibility_result' => $decode($report->accessibility_result),
        ]);
    }
}
