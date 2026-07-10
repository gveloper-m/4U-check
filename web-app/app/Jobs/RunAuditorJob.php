<?php

namespace App\Jobs;

use App\Mail\ScanCompletedMail;
use App\Models\McpAgent;
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
        'accessibility'      => 'accessibility_result',
    ];

    // Opt-in modules — only expected/counted for reports that requested them
    // (currently just fuzz testing, gated behind full_audit_reports.fuzz_requested).
    public const OPTIONAL_COLUMN_MAP = [
        'fuzz_testing' => 'fuzz_testing_result',
    ];

    public function __construct(
        public readonly int    $reportId,
        public readonly string $auditorKey,
        public readonly string $controllerClass,
        public readonly string $pageUrl,
    ) {}

    public function handle(): void
    {
        $column = (self::COLUMN_MAP + self::OPTIONAL_COLUMN_MAP)[$this->auditorKey];

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

    public function failed(\Throwable $_exception): void
    {
        // Write a timeout/error marker so the finalization check can still count this auditor as done.
        $column = (self::COLUMN_MAP + self::OPTIONAL_COLUMN_MAP)[$this->auditorKey];
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

            $expectedColumns = self::COLUMN_MAP;
            if ($record->fuzz_requested ?? false) {
                $expectedColumns = $expectedColumns + self::OPTIONAL_COLUMN_MAP;
            }

            $doneCount = 0;
            foreach ($expectedColumns as $col) {
                if ($record->$col !== null) {
                    $doneCount++;
                }
            }

            if ($doneCount < count($expectedColumns)) {
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
                $locale    = $scan->user->language ?? 'en';
                Mail::to($scan->user->email)
                    ->queue((new ScanCompletedMail($scan, $score, $reportUrl, $record, $deductions))->locale($locale));
            }

        });

        // MCP agent push is outside the transaction — a failure here must not roll back the score.
        $reportRecord = DB::table('full_audit_reports')->find($this->reportId);
        if ($reportRecord && $reportRecord->status === 'completed') {
            $agent = McpAgent::whereHas('monitoredSite', fn ($q) => $q->where('url', $reportRecord->site_url))
                ->first();

            if ($agent) {
                $agent->update([
                    'latest_report_json' => json_encode([
                        'report_id'    => $this->reportId,
                        'url'          => $reportRecord->site_url,
                        'health_score' => $reportRecord->health_score,
                        'status'       => 'completed',
                        'scanned_at'   => now()->toIso8601String(),
                        'modules'      => [
                            'seo_schema'         => json_decode($reportRecord->seo_schema_result         ?? 'null', true),
                            'security'           => json_decode($reportRecord->security_result           ?? 'null', true),
                            'performance'        => json_decode($reportRecord->performance_result        ?? 'null', true),
                            'broken_resources'   => json_decode($reportRecord->broken_resources_result   ?? 'null', true),
                            'catalog_integrity'  => json_decode($reportRecord->catalog_result            ?? 'null', true),
                            'marketing_tracking' => json_decode($reportRecord->tracking_result           ?? 'null', true),
                            'accessibility'      => json_decode($reportRecord->accessibility_result      ?? 'null', true),
                            'fuzz_testing'       => ($reportRecord->fuzz_requested ?? false)
                                ? json_decode($reportRecord->fuzz_testing_result ?? 'null', true)
                                : null,
                        ],
                    ], JSON_UNESCAPED_UNICODE),
                ]);
            }
        }
    }

    private function computeHealthScore(object $record): array
    {
        $audits = [];
        foreach (self::COLUMN_MAP as $key => $col) {
            $raw = $record->$col;
            $audits[$key] = $raw !== null ? json_decode($raw, true) : ['status' => 'running'];
        }

        $fuzzResult = ($record->fuzz_testing_result ?? null) !== null
            ? json_decode($record->fuzz_testing_result, true)
            : null;

        return \App\Support\HealthScore::compute(
            $audits,
            (bool) ($record->fuzz_requested ?? false),
            $fuzzResult,
        );
    }
}
