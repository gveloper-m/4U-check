<?php

namespace App\Mail;

use App\Models\ScheduledScan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ScanCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ScheduledScan $scan,
        public readonly ?int $score,
        public readonly string $reportUrl,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->score !== null
            ? __('mail.scan_completed', ['name' => $this->scan->name, 'score' => $this->score])
            : __('mail.scan_completed_no_score', ['name' => $this->scan->name]);

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.scan-completed',
            with: [
                'scan'      => $this->scan,
                'score'     => $this->score,
                'reportUrl' => $this->reportUrl,
            ],
        );
    }
}
