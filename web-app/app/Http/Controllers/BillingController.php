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
            'subscription' => $subscription ? [
                'status'       => $subscription->status,
                'ends_at'      => $subscription->ends_at,
                'trial_ends_at'=> $subscription->trial_ends_at,
                'renews_at'    => $subscription->renews_at,
            ] : null,
            'is_unlimited'   => $user->is_unlimited,
            'payment_method' => $subscription?->card_brand ? [
                'card' => [
                    'brand' => $subscription->card_brand,
                    'last4' => $subscription->card_last_four,
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
            'extra_sites_enabled' => $user->is_unlimited || $user->subscribed(),
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

        $variantId = $validated['plan'] === 'yearly'
            ? config('lemon-squeezy.yearly_variant_id')
            : config('lemon-squeezy.monthly_variant_id');

        abort_if(empty($variantId), 500, 'Lemon Squeezy variant not configured for this plan.');

        $checkout = $user
            ->subscribe($variantId)
            ->withEmail($user->email)
            ->withName($user->name)
            ->withTaxNumber($user->vat_number ?? '')
            ->redirectTo(route('billing') . '?success=1');

        return Inertia::location($checkout->url);
    }

    public function portal(Request $request): Response
    {
        return Inertia::location($request->user()->customerPortalUrl());
    }

    public function addSite(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'url'   => ['required', 'url', 'max:255', new PublicUrl],
            'label' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        if (! $user->is_unlimited) {
            abort_unless($user->subscribed(), 422, 'Active subscription required to add extra sites.');
        }

        $user->monitoredSites()->create([
            'url'        => $validated['url'],
            'is_primary' => false,
            'label'      => $validated['label'] ?? null,
        ]);

        return back()->with('success', 'Site added.');
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
        $subscription    = $user->subscription();
        $yearlyVariantId = config('lemon-squeezy.yearly_variant_id');

        if ($subscription && $yearlyVariantId && $subscription->variant_id === (string) $yearlyVariantId) {
            return 'yearly';
        }

        return 'monthly';
    }
}
