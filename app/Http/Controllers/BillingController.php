<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class BillingController extends Controller
{
    /**
     * GET /billing
     */
    public function index(): InertiaResponse
    {
        $user         = auth()->user();
        $subscription = $user->subscription('default');

        return Inertia::render('Billing/Index', [
            'subscribed'       => $user->subscribed('default'),
            'subscription'     => $subscription ? [
                'status'      => $subscription->stripe_status,
                'ends_at'     => $subscription->ends_at,
                'trial_ends'  => $subscription->trial_ends_at,
            ] : null,
            'is_unlimited'     => $user->is_unlimited,
            'payment_method'   => $user->pm_type ? [
                'type'         => $user->pm_type,
                'last_four'    => $user->pm_last_four,
            ] : null,
        ]);
    }

    /**
     * POST /billing/subscribe — create Stripe Checkout session
     */
    public function subscribe(Request $request): RedirectResponse
    {
        $priceId = config('services.stripe.price_id');
        abort_if(empty($priceId), 500, 'Stripe price not configured.');

        $checkout = $request->user()
            ->newSubscription('default', $priceId)
            ->checkout([
                'success_url' => route('billing') . '?success=1',
                'cancel_url'  => route('billing') . '?cancelled=1',
            ]);

        return redirect($checkout->url);
    }

    /**
     * POST /billing/portal — create Stripe Billing Portal session
     */
    public function portal(Request $request): RedirectResponse
    {
        return $request->user()->redirectToBillingPortal(route('billing'));
    }
}
