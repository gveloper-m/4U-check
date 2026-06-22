<?php

namespace App\Http\Controllers;

use App\Mail\TicketNewMail;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(): Response
    {
        $tickets = Ticket::where('user_id', auth()->id())
            ->with(['messages' => fn($q) => $q->latest()->limit(1)])
            ->latest()
            ->paginate(15);

        return Inertia::render('Tickets/Index', [
            'tickets' => $tickets,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject'    => 'required|string|max:200',
            'body'       => 'required|string|max:5000',
            'images'     => 'sometimes|array|max:3',
            'images.*'   => 'mimetypes:image/jpeg,image/png,image/gif,image/webp|max:5120',
        ]);

        $ticket = Ticket::create([
            'user_id' => auth()->id(),
            'subject' => $validated['subject'],
            'status'  => 'open',
        ]);

        $msg = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id'   => auth()->id(),
            'body'      => $validated['body'],
            'is_admin'  => false,
        ]);

        $this->storeAttachments($request, $msg, $ticket->id);

        $adminEmail = config('support.admin_email', config('mail.from.address'));
        if ($adminEmail) {
            Mail::to($adminEmail)->queue(new TicketNewMail($ticket, $msg, auth()->user()));
        }

        return redirect()->route('tickets.show', $ticket)->with('success', 'Ticket submitted. We\'ll reply by email.');
    }

    public function show(Ticket $ticket): Response
    {
        abort_unless($ticket->user_id === auth()->id(), 403);

        $ticket->load(['messages.user', 'messages.attachments']);

        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket,
        ]);
    }

    public function reply(Request $request, Ticket $ticket): RedirectResponse
    {
        abort_unless($ticket->user_id === auth()->id(), 403);
        abort_if(in_array($ticket->status, ['resolved', 'closed']), 422, 'This ticket is closed.');

        $validated = $request->validate([
            'body'     => 'required|string|max:5000',
            'images'   => 'sometimes|array|max:3',
            'images.*' => 'mimetypes:image/jpeg,image/png,image/gif,image/webp|max:5120',
        ]);

        $msg = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id'   => auth()->id(),
            'body'      => $validated['body'],
            'is_admin'  => false,
        ]);

        $this->storeAttachments($request, $msg, $ticket->id);

        if ($ticket->status === 'resolved') {
            $ticket->update(['status' => 'open']);
        }

        return back()->with('success', 'Reply sent.');
    }

    private function storeAttachments(Request $request, TicketMessage $msg, int $ticketId): void
    {
        foreach ($request->file('images', []) as $file) {
            $path = $file->store("ticket-attachments/{$ticketId}", 'public');
            TicketAttachment::create([
                'ticket_message_id' => $msg->id,
                'filename'          => $file->getClientOriginalName(),
                'path'              => $path,
            ]);
        }
    }
}
