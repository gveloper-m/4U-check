<?php

namespace App\Listeners;

use App\Mail\PaymentReceiptMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use LemonSqueezy\Laravel\Events\SubscriptionPaymentSuccess;

/**
 * Fires on every successful subscription payment from Lemon Squeezy.
 * Sends a payment receipt email to the user (if opted in).
 *
 * Elorus invoice creation is skipped for now — it needs adapting to
 * the LS order payload format. All errors are caught and logged so
 * they never block the 200 OK response LS expects from the webhook.
 */
class HandleLSPaymentSuccess
{
    public function handle(SubscriptionPaymentSuccess $event): void
    {
        /** @var User $user */
        $user    = $event->billable;
        $payload = $event->payload;

        $attrs = $payload['data']['attributes'] ?? [];

        // Skip $0 orders (trial activations, fully-discounted, etc.)
        if ((int) ($attrs['total'] ?? 0) === 0) {
            return;
        }

        if (! $user instanceof User) {
            Log::warning('[LS] SubscriptionPaymentSuccess — billable is not a User', [
                'billable_type' => get_class($user),
            ]);
            return;
        }

        if (! $user->notify_payment) {
            return;
        }

        try {
            Mail::to($user->email)->queue(new PaymentReceiptMail(
                user:          $user,
                amountPaid:    (int) ($attrs['total'] ?? 0),
                currency:      strtolower($attrs['currency'] ?? 'eur'),
                invoiceDate:   now()->format('d M Y'),
                invoiceNumber: (string) ($attrs['order_number'] ?? ''),
                invoicePdfUrl: null,
                description:   $attrs['first_order_item']['product_name'] ?? '4uTest subscription',
            ));
        } catch (\Throwable $e) {
            Log::error('[LS] Failed to queue PaymentReceiptMail: ' . $e->getMessage(), [
                'user_id' => $user->id,
            ]);
        }
    }
}
