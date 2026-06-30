<?php

namespace App\Http\Controllers;

use App\Models\MonitoredSite;
use App\Rules\PublicUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class BillingController extends Controller
{
    public function index(): InertiaResponse
    {
        $user         = auth()->user();
        $subscription = $user->subscription('default');
        $sites        = $user->monitoredSites()->orderBy('is_primary', 'desc')->orderBy('created_at')->get();
        $siteCount    = $sites->count();

        $plan          = $this->currentPlan($user);
        $basePrice     = $plan === 'yearly' ? 199.99 : 19.99;
        $extraPrice    = $plan === 'yearly' ? 99.99  : 9.99;
        $monthlyTotal  = $siteCount > 0
            ? $basePrice + max(0, $siteCount - 1) * $extraPrice
            : $basePrice;

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
                    'brand' => $user->pm_type,
                    'last4' => $user->pm_last_four,
                ],
            ] : null,
            'company_name'        => $user->company_name,
            'vat_number'          => $user->vat_number,
            'sites'               => $sites->map(fn($s) => [
                'id'         => $s->id,
                'url'        => $s->url,
                'label'      => $s->label,
                'is_primary' => $s->is_primary,
            ])->values(),
            'site_count'          => $siteCount,
            'current_plan'        => $plan,
            'monthly_total'       => $monthlyTotal,
            'extra_sites_enabled' => $user->is_unlimited
                                  || !empty(config('services.stripe.monthly_extra_site_price_id'))
                                  || !empty(config('services.stripe.yearly_extra_site_price_id')),
        ]);
    }

    public function subscribe(Request $request): Response
    {
        $validated = $request->validate([
            'plan'         => 'required|in:monthly,yearly',
            'company_name' => 'nullable|string|max:255',
            'vat_number'   => 'nullable|string|max:50',
        ]);

        $user = $request->user();

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
            'customer_update'            => ['address' => 'auto'],
        ];

        if (config('services.stripe.tax_enabled')) {
            $options['automatic_tax'] = ['enabled' => true];
        }

        $checkout = $user
            ->newSubscription('default', $priceId)
            ->checkout($options);

        return Inertia::location($checkout->url);
    }

    public function portal(Request $request): RedirectResponse
    {
        return $request->user()->redirectToBillingPortal(route('billing'));
    }

    public function addSite(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'url'   => ['required', 'url', 'max:255', new PublicUrl],
            'label' => 'nullable|string|max:255',
        ]);

        $user         = $request->user();
        $subscription = $user->subscription('default');

        if (! $user->is_unlimited) {
            abort_unless($subscription && $subscription->active(), 422, 'Active subscription required to add extra sites.');
        }

        $plan         = $this->currentPlan($user);
        $extraPriceId = $plan === 'yearly'
            ? config('services.stripe.yearly_extra_site_price_id')
            : config('services.stripe.monthly_extra_site_price_id');

        if (! $user->is_unlimited) {
            abort_if(empty($extraPriceId), 500, 'Extra site pricing not configured. Contact support.');

            // Stripe first; if it throws nothing is written to DB
            if ($subscription->hasPrice($extraPriceId)) {
                $freshItem = $subscription->fresh()->items()->where('stripe_price', $extraPriceId)->first();
                $subscription->updateQuantity(($freshItem?->quantity ?? 0) + 1, $extraPriceId);
            } else {
                $subscription->addPrice($extraPriceId);
            }
        }

        // DB write after Stripe; compensate Stripe if DB fails
        try {
            $user->monitoredSites()->create([
                'url'        => $validated['url'],
                'is_primary' => false,
                'label'      => $validated['label'] ?? null,
            ]);
        } catch (\Throwable $e) {
            if (! $user->is_unlimited && $extraPriceId) {
                try {
                    $freshSub  = $user->subscription('default');
                    $freshItem = $freshSub?->fresh()->items()->where('stripe_price', $extraPriceId)->first();
                    if ($freshItem && $freshItem->quantity > 1) {
                        $freshSub->updateQuantity($freshItem->quantity - 1, $extraPriceId);
                    } else {
                        $freshSub?->removePrice($extraPriceId);
                    }
                } catch (\Throwable) {
                    // Stripe rollback best-effort; log manually if needed
                }
            }
            throw $e;
        }

        return back()->with('success', 'Site added. Your billing has been updated.');
    }

    public function removeSite(Request $request, MonitoredSite $site): RedirectResponse
    {
        abort_unless($site->user_id === $request->user()->id, 403);
        abort_if($site->is_primary, 422, 'Your primary site cannot be removed while subscribed.');

        $user         = $request->user();
        $subscription = $user->subscription('default');

        // DB delete first so we can roll it back if Stripe fails
        $siteData = $site->only(['url', 'is_primary', 'label']);
        $site->delete();

        if ($subscription && $subscription->active()) {
            $plan         = $this->currentPlan($user);
            $extraPriceId = $plan === 'yearly'
                ? config('services.stripe.yearly_extra_site_price_id')
                : config('services.stripe.monthly_extra_site_price_id');

            if ($extraPriceId && $subscription->hasPrice($extraPriceId)) {
                try {
                    $freshItem = $subscription->fresh()->items()->where('stripe_price', $extraPriceId)->first();
                    if ($freshItem && $freshItem->quantity > 1) {
                        $subscription->updateQuantity($freshItem->quantity - 1, $extraPriceId);
                    } else {
                        $subscription->removePrice($extraPriceId);
                    }
                } catch (\Throwable $e) {
                    // Stripe failed — re-create the site record to keep DB in sync
                    $user->monitoredSites()->create($siteData);
                    throw $e;
                }
            }
        }

        return back()->with('success', 'Site removed. Your billing has been updated.');
    }

    private function currentPlan($user): string
    {
        $subscription = $user->subscription('default');
        if (! $subscription) {
            return 'monthly';
        }

        $yearlyPriceId      = config('services.stripe.yearly_price_id');
        $yearlyExtraPriceId = config('services.stripe.yearly_extra_site_price_id');

        // stripe_price is NULL on multi-item subscriptions; always use hasPrice()
        if ($yearlyPriceId && $subscription->hasPrice($yearlyPriceId)) {
            return 'yearly';
        }

        if ($yearlyExtraPriceId && $subscription->hasPrice($yearlyExtraPriceId)) {
            return 'yearly';
        }

        return 'monthly';
    }
}
