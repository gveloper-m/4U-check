<?php

namespace App\Http\Controllers;

use App\Mail\PaymentReceiptMail;
use App\Models\User;
use App\Services\ElorusService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;
use Symfony\Component\HttpFoundation\Response;

/**
 * Extends Cashier's webhook controller to hook into invoice.paid events
 * and create the corresponding Elorus document (invoice or receipt).
 *
 * All Elorus errors are caught and logged — they never block the 200 OK
 * response that Stripe expects from a webhook endpoint.
 */
class StripeWebhookController extends CashierWebhookController
{
    public function handleInvoicePaid(array $payload): Response
    {
        // Always run Cashier's own processing first
        $response = parent::handleInvoicePaid($payload);

        $invoice  = $payload['data']['object'] ?? [];
        $stripeId = $invoice['customer'] ?? null;

        // Skip $0 invoices (trials, 100%-off coupons, etc.)
        if (! $stripeId || (int) ($invoice['amount_paid'] ?? 0) === 0) {
            return $response;
        }

        $user = User::where('stripe_id', $stripeId)->first();

        if (! $user) {
            Log::warning('[Elorus] invoice.paid — no local user for Stripe customer', [
                'stripe_id'  => $stripeId,
                'invoice_id' => $invoice['id'] ?? null,
            ]);
            return $response;
        }

        (new ElorusService())->createDocumentFromInvoice($user, $invoice);

        if ($user->notify_payment) {
            $lines       = $invoice['lines']['data'] ?? [];
            $description = $lines[0]['description'] ?? '4uTest subscription';
            $pdfUrl      = $invoice['invoice_pdf'] ?? null;

            Mail::to($user->email)->queue(new PaymentReceiptMail(
                user:          $user,
                amountPaid:    (int) ($invoice['amount_paid'] ?? 0),
                currency:      $invoice['currency'] ?? 'eur',
                invoiceDate:   date('d M Y', $invoice['created'] ?? time()),
                invoiceNumber: $invoice['number'] ?? '',
                invoicePdfUrl: $pdfUrl,
                description:   $description,
            ));
        }

        return $response;
    }
}
