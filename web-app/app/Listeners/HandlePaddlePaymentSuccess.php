<?php

namespace App\Listeners;

use App\Mail\PaymentReceiptMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Laravel\Paddle\Events\TransactionCompleted;

class HandlePaddlePaymentSuccess
{
    public function handle(TransactionCompleted $event): void
    {
        $transaction = $event->transaction;
        $user        = $transaction->billable;

        if (! $user instanceof User) {
            Log::warning('[Paddle] TransactionCompleted — billable is not a User', [
                'billable_type' => get_class($user),
            ]);
            return;
        }

        // Skip $0 transactions (trials, fully-discounted, etc.)
        if ((int) $transaction->total === 0) {
            return;
        }

        if (! $user->notify_payment) {
            return;
        }

        try {
            Mail::to($user->email)->queue(new PaymentReceiptMail(
                user:          $user,
                amountPaid:    (int) $transaction->total,
                currency:      strtolower($transaction->currency),
                invoiceDate:   $transaction->billed_at->format('d M Y'),
                invoiceNumber: $transaction->invoice_number ?? $transaction->paddle_id,
                invoicePdfUrl: null,
                description:   '4uTest subscription',
            ));
        } catch (\Throwable $e) {
            Log::error('[Paddle] Failed to queue PaymentReceiptMail: ' . $e->getMessage(), [
                'user_id' => $user->id,
            ]);
        }
    }
}
