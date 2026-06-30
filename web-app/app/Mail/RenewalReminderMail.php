<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RenewalReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User   $user,
        public readonly string $plan,
        public readonly string $renewalDate,
        public readonly string $amount,
        public readonly string $billingUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your 4uTest subscription renews in 7 days');
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.renewal-reminder',
            with: [
                'user'        => $this->user,
                'plan'        => $this->plan,
                'renewalDate' => $this->renewalDate,
                'amount'      => $this->amount,
                'billingUrl'  => $this->billingUrl,
            ],
        );
    }
}
