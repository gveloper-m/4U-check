<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MonthlyReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User   $user,
        public readonly string $monthLabel,
        public readonly int    $totalScans,
        public readonly int    $sitesMonitored,
        public readonly ?float $avgScore,
        public readonly ?array $bestSite,
        public readonly ?array $worstSite,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your {$this->monthLabel} audit summary — 4uTest");
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.monthly-report',
            with: [
                'user'           => $this->user,
                'monthLabel'     => $this->monthLabel,
                'totalScans'     => $this->totalScans,
                'sitesMonitored' => $this->sitesMonitored,
                'avgScore'       => $this->avgScore !== null ? round($this->avgScore) : null,
                'bestSite'       => $this->bestSite,
                'worstSite'      => $this->worstSite,
                'dashboardUrl'   => config('app.url') . '/dashboard',
            ],
        );
    }
}
