<?php

namespace App\Jobs;

use App\Http\Controllers\Audits\AccessibilityAuditController;
use App\Http\Controllers\Audits\BrokenResourceController;
use App\Http\Controllers\Audits\EcommerceCatalogAuditController;
use App\Http\Controllers\Audits\PerformanceAuditController;
use App\Http\Controllers\Audits\SecurityInfrastructureController;
use App\Http\Controllers\Audits\SeoSchemaAuditController;
use App\Http\Controllers\Audits\TrackingAuditController;
use App\Models\MassEmailContact;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProcessMassEmailContact implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 30;

    private const AUDITORS = [
        'seo_schema'         => SeoSchemaAuditController::class,
        'security'           => SecurityInfrastructureController::class,
        'catalog_integrity'  => EcommerceCatalogAuditController::class,
        'marketing_tracking' => TrackingAuditController::class,
        'broken_resources'   => BrokenResourceController::class,
        'performance'        => PerformanceAuditController::class,
        'accessibility'      => AccessibilityAuditController::class,
    ];

    public function __construct(public readonly int $contactId) {}

    public function handle(): void
    {
        $contact = MassEmailContact::find($this->contactId);
        if (! $contact || $contact->status !== 'pending') {
            return;
        }

        $siteUrl   = $contact->website;
        $shareUuid = (string) Str::uuid();

        // Create the audit record (same pattern as AuditController::store)
        $auditId = DB::table('full_audit_reports')->insertGetId([
            'user_id'       => null,
            'guest_ip'      => null,
            'guest_token'   => null,
            'name'          => 'Mass Email Scan — ' . parse_url($siteUrl, PHP_URL_HOST),
            'site_url'      => $siteUrl,
            'status'        => 'running',
            'share_uuid'    => $shareUuid,
            'share_enabled' => true,
            'executed_at'   => now(),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        $contact->markScanning($auditId, $shareUuid);

        // Dispatch all 7 module jobs (same pattern as AuditController)
        foreach (self::AUDITORS as $key => $controllerClass) {
            RunAuditorJob::dispatch($auditId, $key, $controllerClass, $siteUrl);
        }

        // Poll for completion — first check after 90 seconds
        FinalizeMassEmail::dispatch($this->contactId, $auditId)
            ->delay(now()->addSeconds(90));
    }

    public function failed(\Throwable $e): void
    {
        MassEmailContact::find($this->contactId)?->markFailed('Job dispatch failed: ' . $e->getMessage());
    }
}
