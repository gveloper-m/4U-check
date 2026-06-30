<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User   $user,
        public readonly int    $amountPaid,
        public readonly string $currency,
        public readonly string $invoiceDate,
        public readonly string $invoiceNumber,
        public readonly ?string $invoicePdfUrl,
        public readonly string $description,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Payment receipt — 4uTest');
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.payment-receipt',
            with: [
                'user'          => $this->user,
                'amount'        => number_format($this->amountPaid / 100, 2),
                'currency'      => strtoupper($this->currency),
                'invoiceDate'   => $this->invoiceDate,
                'invoiceNumber' => $this->invoiceNumber,
                'invoicePdfUrl' => $this->invoicePdfUrl,
                'description'   => $this->description,
            ],
        );
    }
}
