<?php

namespace App\Jobs;

use App\Mail\MassProspectMail;
use App\Models\MassEmailContact;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class FinalizeMassEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 60;

    private const MAX_POLLS    = 15; // 15 × 60s = 15 minutes max wait
    private const POLL_DELAY_S = 60;

    public function __construct(
        public readonly int $contactId,
        public readonly int $auditId,
        public readonly int $pollCount = 0,
    ) {}

    public function handle(): void
    {
        $contact = MassEmailContact::find($this->contactId);
        if (! $contact || $contact->status === 'sent') {
            return;
        }

        $audit = DB::table('full_audit_reports')->where('id', $this->auditId)->first();
        if (! $audit) {
            $contact->markScanFailed('Audit record not found.');
            return;
        }

        if ($audit->status !== 'completed') {
            if ($this->pollCount >= self::MAX_POLLS) {
                $contact->markScanFailed('Scan timed out after ' . self::MAX_POLLS . ' minutes.');
                return;
            }
            // Not done yet — re-queue after 60 seconds
            self::dispatch($this->contactId, $this->auditId, $this->pollCount + 1)
                ->delay(now()->addSeconds(self::POLL_DELAY_S));
            return;
        }

        // Audit complete — extract score and top observations
        $score      = (int) ($audit->health_score ?? 0);
        $deductions = json_decode($audit->score_deductions ?? '[]', true) ?: [];
        $shareUrl   = config('app.url') . '/shared/' . $audit->share_uuid;

        // Top 5 most impactful deductions (they already contain the point values)
        $topIssues = array_slice($deductions, 0, 5);

        $contact->update(['status' => 'sending']);

        try {
            Mail::to($contact->email)
                ->send(new MassProspectMail(
                    website:  $contact->website,
                    score:    $score,
                    issues:   $topIssues,
                    shareUrl: $shareUrl,
                    language: $contact->language,
                ));
            $contact->markSent($score);
        } catch (\Exception $e) {
            $contact->markFailed('Mail send failed: ' . $e->getMessage());
        }
    }

    public function failed(\Throwable $e): void
    {
        MassEmailContact::find($this->contactId)?->markFailed('Finalize job failed: ' . $e->getMessage());
    }
}
