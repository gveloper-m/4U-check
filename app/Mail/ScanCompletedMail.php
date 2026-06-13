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
        return new Envelope(
            subject: 'Scan complete: ' . $this->scan->name . ($this->score !== null ? ' — score ' . $this->score . '/100' : ''),
        );
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
