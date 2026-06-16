<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketNewMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Ticket $ticket,
        public readonly TicketMessage $message,
        public readonly User $submitter,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[New Ticket #{$this->ticket->id}] {$this->ticket->subject}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.ticket-new',
            with: [
                'ticket'    => $this->ticket,
                'message'   => $this->message,
                'submitter' => $this->submitter,
                'adminUrl'  => url("/admin/tickets/{$this->ticket->id}"),
            ],
        );
    }
}
