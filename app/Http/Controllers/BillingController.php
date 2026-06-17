<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class BillingController extends Controller
{
    public function index(): InertiaResponse
    {
        $user         = auth()->user();
        $subscription = $user->subscription('default');

        return Inertia::render('Billing/Index', [
            'subscribed'     => $user->subscribed('default'),
            'subscription'   => $subscription ? [
                'stripe_status' => $subscription->stripe_status,
                'ends_at'       => $subscription->ends_at,
                'trial_ends_at' => $subscription->trial_ends_at,
            ] : null,
            'is_unlimited'   => $user->is_unlimited,
            'payment_method' => $user->pm_type ? [
                'card' => [
                    'brand'     => $user->pm_type,
                    'last4'     => $user->pm_last_four,
                ],
            ] : null,
            'company_name'   => $user->company_name,
            'vat_number'     => $user->vat_number,
        ]);
    }

    public function subscribe(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'plan'         => 'required|in:monthly,yearly',
            'company_name' => 'nullable|string|max:255',
            'vat_number'   => 'nullable|string|max:50',
        ]);

        $user = $request->user();

        // Persist billing details
        $user->forceFill([
            'company_name' => $validated['company_name'] ?? $user->company_name,
            'vat_number'   => $validated['vat_number']   ?? null,
        ])->save();

        $priceId = $validated['plan'] === 'yearly'
            ? config('services.stripe.yearly_price_id')
            : config('services.stripe.monthly_price_id');

        abort_if(empty($priceId), 500, 'Stripe price not configured for this plan.');

        $options = [
            'success_url'                => route('billing') . '?success=1',
            'cancel_url'                 => route('billing') . '?cancelled=1',
            'billing_address_collection' => 'required',
            'tax_id_collection'          => ['enabled' => true],
        ];

        // Stripe Tax must be enabled in the Stripe dashboard for this to work.
        // Set STRIPE_TAX_ENABLED=true in .env once configured.
        if (config('services.stripe.tax_enabled')) {
            $options['automatic_tax'] = ['enabled' => true];
        }

        $checkout = $user
            ->newSubscription('default', $priceId)
            ->checkout($options);

        return redirect($checkout->url);
    }

    public function portal(Request $request): RedirectResponse
    {
        return $request->user()->redirectToBillingPortal(route('billing'));
    }
}
