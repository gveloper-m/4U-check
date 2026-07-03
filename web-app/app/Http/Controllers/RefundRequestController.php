<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class RefundRequestController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:150',
            'email'          => 'required|email|max:255',
            'transaction_id' => 'required|string|max:200',
            'plan'           => 'required|in:monthly,yearly',
            'purchase_date'  => 'required|date|before_or_equal:today',
            'scans_used'     => 'nullable|integer|min:0|max:9999',
            'reason'         => 'required|string|min:10|max:2000',
        ]);

        $adminEmail = config('mail.from.address', 'admin@4utest.com');

        Mail::send([], [], function ($message) use ($validated, $adminEmail) {
            $subject = "[Refund Request] {$validated['name']} — {$validated['plan']} plan";
            $body    = implode("\n\n", [
                "A refund request has been submitted via 4utest.com/refund.",
                "Name:           {$validated['name']}",
                "Email:          {$validated['email']}",
                "Plan:           {$validated['plan']}",
                "Transaction ID: {$validated['transaction_id']}",
                "Purchase date:  {$validated['purchase_date']}",
                "Scans used:     " . ($validated['scans_used'] ?? 'not provided'),
                "Reason:\n{$validated['reason']}",
            ]);

            $message
                ->to($adminEmail)
                ->replyTo($validated['email'], $validated['name'])
                ->subject($subject)
                ->text($body);
        });

        // Confirmation to the requester
        Mail::send([], [], function ($message) use ($validated) {
            $body = implode("\n\n", [
                "Hi {$validated['name']},",
                "We have received your refund request for transaction {$validated['transaction_id']}.",
                "Our team will review it and reply to this email within 3 business days.",
                "If you have any questions in the meantime, reply to this email.",
                "— The 4utest team",
            ]);

            $message
                ->to($validated['email'], $validated['name'])
                ->subject('Your refund request has been received — 4utest')
                ->text($body);
        });

        return back()->with('success', 'Your refund request has been submitted. We will reply within 3 business days.');
    }
}
