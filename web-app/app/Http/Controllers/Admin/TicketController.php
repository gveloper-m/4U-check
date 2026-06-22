<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\TicketReplyMail;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');

        $query = Ticket::with(['user:id,name,email,company_name', 'messages' => fn($q) => $q->latest()->limit(1)])
            ->latest();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $tickets = $query->paginate(20)->withQueryString();

        $counts = [
            'all'         => Ticket::count(),
            'open'        => Ticket::where('status', 'open')->count(),
            'in_progress' => Ticket::where('status', 'in_progress')->count(),
            'resolved'    => Ticket::where('status', 'resolved')->count(),
            'closed'      => Ticket::where('status', 'closed')->count(),
        ];

        return Inertia::render('Admin/Tickets/Index', [
            'tickets'       => $tickets,
            'currentStatus' => $status,
            'counts'        => $counts,
        ]);
    }

    public function show(Ticket $ticket): Response
    {
        $ticket->load(['user:id,name,email,company_name', 'messages.user:id,name,is_admin', 'messages.attachments']);

        return Inertia::render('Admin/Tickets/Show', [
            'ticket' => $ticket,
        ]);
    }

    public function reply(Request $request, Ticket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'body'     => 'required|string|max:5000',
            'images'   => 'sometimes|array|max:3',
            'images.*' => 'mimetypes:image/jpeg,image/png,image/gif,image/webp|max:5120',
        ]);

        $msg = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id'   => auth()->id(),
            'body'      => $validated['body'],
            'is_admin'  => true,
        ]);

        foreach ($request->file('images', []) as $file) {
            $path = $file->store("ticket-attachments/{$ticket->id}", 'public');
            TicketAttachment::create([
                'ticket_message_id' => $msg->id,
                'filename'          => $file->getClientOriginalName(),
                'path'              => $path,
            ]);
        }

        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        Mail::to($ticket->user->email)->queue(new TicketReplyMail($ticket, $msg));

        return back()->with('success', 'Reply sent and user notified by email.');
    }

    public function updateStatus(Request $request, Ticket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $ticket->update(['status' => $validated['status']]);

        return back()->with('success', 'Status updated.');
    }
}
