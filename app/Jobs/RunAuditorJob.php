<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

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
    }
}
