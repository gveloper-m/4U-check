<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Ticket $ticket,
        public readonly TicketMessage $message,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Ticket #{$this->ticket->id}] Re: {$this->ticket->subject}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.ticket-reply',
            with: [
                'ticket'     => $this->ticket,
                'message'    => $this->message,
                'ticketUrl'  => url("/tickets/{$this->ticket->id}"),
            ],
        );
    }
}
