<?php

namespace App\Jobs;

use App\Http\Controllers\BrokenResourceController;
use App\Http\Controllers\EcommerceCatalogAuditController;
use App\Http\Controllers\PerformanceAuditController;
use App\Http\Controllers\SecurityInfrastructureController;
use App\Http\Controllers\SeoSchemaAuditController;
use App\Http\Controllers\TrackingAuditController;
use App\Models\ScheduledScan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ProcessScheduledScan implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;
    public int $tries   = 1;

    private const AUDITORS = [
        'seo_schema'         => SeoSchemaAuditController::class,
        'security'           => SecurityInfrastructureController::class,
        'catalog_integrity'  => EcommerceCatalogAuditController::class,
        'marketing_tracking' => TrackingAuditController::class,
        'broken_resources'   => BrokenResourceController::class,
        'performance'        => PerformanceAuditController::class,
    ];

    public function __construct(public readonly ScheduledScan $scan) {}

    public function handle(): void
    {
        $scan = $this->scan;

        // Create the audit report record
        $reportId = DB::table('full_audit_reports')->insertGetId([
            'user_id'     => $scan->user_id,
            'name'        => $scan->name . ' (auto)',
            'site_url'    => $scan->site_url,
            'status'      => 'running',
            'executed_at' => now(),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Dispatch all 6 auditor jobs
        foreach (self::AUDITORS as $key => $controllerClass) {
            RunAuditorJob::dispatch($reportId, $key, $controllerClass, $scan->site_url);
        }

        // Update scan timestamps and link report
        $scan->update([
            'last_run_at'    => now(),
            'next_run_at'    => ScheduledScan::computeNextRun($scan->interval),
            'last_report_id' => $reportId,
        ]);
    }
}
