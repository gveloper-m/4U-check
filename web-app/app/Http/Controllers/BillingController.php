<?php

namespace App\Http\Controllers;

use App\Models\MonitoredSite;
use App\Rules\PublicUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class BillingController extends Controller
{
    public function index(): InertiaResponse
    {
        $user         = auth()->user();
        $subscription = $user->subscription();
        $sites        = $user->monitoredSites()->orderBy('is_primary', 'desc')->orderBy('created_at')->get();
        $siteCount    = $sites->count();

        $plan         = $this->currentPlan($user);
        $basePrice    = $plan === 'yearly' ? 199.99 : 19.99;
        $extraPrice   = $plan === 'yearly' ? 99.99  : 9.99;
        $monthlyTotal = $siteCount > 0
            ? $basePrice + max(0, $siteCount - 1) * $extraPrice
            : $basePrice;

        return Inertia::render('Billing/Index', [
            'subscribed'   => $user->subscribed(),
            'on_trial'     => $user->onCodeTrial(),
            'trial_ends_at'   => $user->trial_ends_at?->toISOString(),
            'trial_days_left' => $user->trialDaysLeft(),
            'subscription' => $subscription ? [
                'status'         => $subscription->status,
                'paused_at'      => $subscription->paused_at,
                'canceled_at'    => $subscription->canceled_at,
                'trial_ends_at'  => $subscription->trial_ends_at,
                'next_billed_at' => $subscription->next_billed_at,
            ] : null,
            'is_unlimited'        => $user->is_unlimited,
            'payment_method'      => null,
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
            'extra_sites_enabled' => $user->is_unlimited || $user->subscribed() || $user->onCodeTrial(),
            'paddle' => [
                'token'            => config('cashier.client_side_token'),
                'environment'      => config('cashier.sandbox') ? 'sandbox' : 'production',
                'monthly_price_id' => config('services.paddle.monthly_price_id'),
                'yearly_price_id'  => config('services.paddle.yearly_price_id'),
            ],
        ]);
    }

    public function subscribe(Request $request): \Illuminate\Http\JsonResponse
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

        // Ensure a Paddle customer record exists in our DB before checkout opens,
        // so that subscription.created webhooks can be linked back to this user.
        if (! $user->customer) {
            $isSandbox = (bool) config('cashier.sandbox');
            $apiBase   = $isSandbox ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';

            // Reuse existing Paddle customer by email rather than creating a duplicate.
            $existing = Http::withToken(config('cashier.api_key'))
                ->get("{$apiBase}/customers", ['email' => $user->email, 'per_page' => 1])
                ->json('data.0');

            if (! empty($existing['id'])) {
                $user->customer()->create([
                    'paddle_id'     => $existing['id'],
                    'trial_ends_at' => null,
                ]);
            } else {
                $user->createAsCustomer();
            }
        }

        $priceId = $validated['plan'] === 'yearly'
            ? config('services.paddle.yearly_price_id')
            : config('services.paddle.monthly_price_id');

        abort_if(empty($priceId), 500, 'Paddle price not configured for this plan.');

        return response()->json(['price_id' => $priceId]);
    }

    public function cancelSubscription(Request $request): RedirectResponse
    {
        $user         = $request->user();
        $subscription = $user->subscription();

        abort_unless($subscription && $subscription->valid(), 422, 'No active subscription found.');
        abort_if($subscription->ends_at, 422, 'Subscription is already scheduled for cancellation.');

        try {
            // Cancel at the end of the current billing period, not immediately —
            // this is what Refund.tsx, Terms.tsx, and the Pricing FAQ all promise
            // ("access until the end of the current billing period"). The
            // Cashier Paddle package's own cancel() sends
            // effective_from: 'next_billing_period' and updates ends_at from
            // Paddle's response — previously this hand-rolled a 24-hour cutoff
            // instead, contradicting every public-facing description of cancellation.
            $subscription->cancel();
        } catch (\Exception $e) {
            Log::error('[Paddle] Cancel subscription error', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return back()->with('error', 'Could not cancel subscription. Please try again or contact support.');
        }

        return back()->with('success', 'Subscription cancelled. You will keep access until the end of your current billing period.');
    }

    public function addSite(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'url'   => ['required', 'url', 'max:255', new PublicUrl],
            'label' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        abort_unless($user->is_unlimited || $user->onCodeTrial(), 403, 'Payment required to add extra sites.');

        $user->monitoredSites()->create([
            'url'        => $validated['url'],
            'is_primary' => false,
            'label'      => $validated['label'] ?? null,
        ]);

        return back()->with('success', 'Site added.');
    }

    public function extraSite(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'plan'  => 'required|in:monthly,yearly',
            'url'   => ['required', 'url', 'max:255', new PublicUrl],
            'label' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        abort_unless($user->subscribed(), 403, 'Active subscription required to add extra sites.');

        $priceId = $validated['plan'] === 'yearly'
            ? config('services.paddle.extra_yearly_price_id')
            : config('services.paddle.extra_monthly_price_id');

        abort_if(empty($priceId), 500, 'Extra site price not configured. Contact support.');

        return response()->json(['price_id' => $priceId]);
    }

    public function removeSite(Request $request, MonitoredSite $site): RedirectResponse
    {
        abort_unless($site->user_id === $request->user()->id, 403);
        abort_if($site->is_primary, 422, 'Your primary site cannot be removed.');

        $site->delete();

        return back()->with('success', 'Site removed.');
    }

    private function currentPlan($user): string
    {
        $yearlyPriceId = config('services.paddle.yearly_price_id');

        if (! $yearlyPriceId) {
            return 'monthly';
        }

        // Check ALL subscription items across all user subscriptions for the main yearly price.
        // We cannot rely on subscription() alone because subscriptions() is ordered by
        // created_at DESC, so an extra-site subscription created later would be returned first.
        $hasYearly = \Laravel\Paddle\SubscriptionItem::query()
            ->join('subscriptions', 'subscription_items.subscription_id', '=', 'subscriptions.id')
            ->where('subscriptions.billable_id', $user->id)
            ->where('subscriptions.billable_type', get_class($user))
            ->where('subscription_items.price_id', $yearlyPriceId)
            ->exists();

        return $hasYearly ? 'yearly' : 'monthly';
    }
}
