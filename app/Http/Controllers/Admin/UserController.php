<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FullAuditReport;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search', '');

        $users = DB::table('users')
            ->leftJoin('full_audit_reports as far', 'far.user_id', '=', 'users.id')
            ->leftJoin('subscriptions as sub', function ($j) {
                $j->on('sub.user_id', '=', 'users.id')->whereRaw("sub.type = 'default'");
            })
            ->select([
                'users.id', 'users.name', 'users.email', 'users.created_at',
                'users.is_admin', 'users.is_unlimited', 'users.is_agency',
                'sub.stripe_status',
                DB::raw('COUNT(far.id) as total_crawls'),
                DB::raw('SUM(CASE WHEN YEAR(far.created_at) = YEAR(NOW()) AND MONTH(far.created_at) = MONTH(NOW()) THEN 1 ELSE 0 END) as month_crawls'),
                DB::raw('COUNT(DISTINCT far.site_url) as distinct_sites'),
                DB::raw('ROUND(AVG(far.health_score), 0) as avg_score'),
                DB::raw('MAX(far.created_at) as last_crawl_at'),
            ])
            ->when($search, fn($q) => $q->where(function ($q2) use ($search) {
                $q2->where('users.name', 'like', "%{$search}%")
                   ->orWhere('users.email', 'like', "%{$search}%");
            }))
            ->groupBy(
                'users.id', 'users.name', 'users.email', 'users.created_at',
                'users.is_admin', 'users.is_unlimited', 'users.is_agency',
                'sub.stripe_status'
            )
            ->orderByDesc('users.created_at')
            ->paginate(30)
            ->withQueryString();

        $stats = [
            'total_users'    => User::count(),
            'subscribed'     => DB::table('subscriptions')
                ->whereIn('stripe_status', ['active', 'trialing'])
                ->where('type', 'default')
                ->distinct('user_id')->count('user_id'),
            'unlimited'      => User::where('is_unlimited', true)->count(),
            'month_crawls'   => FullAuditReport::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)->count(),
            'total_crawls'   => FullAuditReport::count(),
            'open_tickets'   => Ticket::whereIn('status', ['open', 'in_progress'])->count(),
        ];

        return Inertia::render('Admin/Users/Index', [
            'users'  => $users,
            'stats'  => $stats,
            'search' => $search,
        ]);
    }

    public function show(User $user): Response
    {
        // Monthly crawls last 6 months
        $raw = DB::table('full_audit_reports')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        $monthlyCrawls = [];
        for ($i = 5; $i >= 0; $i--) {
            $key = now()->subMonths($i)->format('Y-m');
            $label = now()->subMonths($i)->format('M Y');
            $monthlyCrawls[] = ['month' => $label, 'count' => (int) ($raw[$key]->count ?? 0)];
        }

        // Top crawled sites
        $topSites = DB::table('full_audit_reports')
            ->where('user_id', $user->id)
            ->select([
                'site_url',
                DB::raw('COUNT(*) as crawls'),
                DB::raw('ROUND(AVG(health_score), 0) as avg_score'),
                DB::raw('MAX(created_at) as last_crawl'),
            ])
            ->groupBy('site_url')
            ->orderByDesc('crawls')
            ->limit(10)
            ->get();

        // Recent reports
        $recentReports = FullAuditReport::where('user_id', $user->id)
            ->select(['id', 'site_url', 'name', 'health_score', 'status', 'created_at'])
            ->latest()
            ->limit(10)
            ->get();

        // Aggregate stats
        $totalCrawls   = FullAuditReport::where('user_id', $user->id)->count();
        $monthCrawls   = FullAuditReport::where('user_id', $user->id)
            ->whereYear('created_at', now()->year)->whereMonth('created_at', now()->month)->count();
        $distinctSites = FullAuditReport::where('user_id', $user->id)->distinct('site_url')->count('site_url');
        $avgScore      = (int) round(FullAuditReport::where('user_id', $user->id)->whereNotNull('health_score')->avg('health_score') ?? 0);
        $openTickets   = Ticket::where('user_id', $user->id)->whereIn('status', ['open', 'in_progress'])->count();

        // Subscription
        $subscription = $user->subscription('default');

        // Stripe live data
        $stripeData = null;
        try {
            if ($subscription && in_array($subscription->stripe_status, ['active', 'trialing'])) {
                $stripeSub  = $subscription->asStripeSubscription();
                $item       = $stripeSub->items->data[0] ?? null;
                $stripeData = [
                    'current_period_end' => $stripeSub->current_period_end,
                    'interval'           => $item?->plan->interval ?? null,
                    'amount'             => $item?->plan->amount ?? null,
                    'currency'           => $item?->plan->currency ?? 'eur',
                ];
            }
            $invoices = $user->invoices();
            if (! $invoices->isEmpty()) {
                $last = $invoices->first();
                $stripeData['last_invoice_date']   = $last->date()->timestamp;
                $stripeData['last_invoice_amount'] = $last->rawTotal();
                $stripeData['last_invoice_status'] = $last->status;
            }
        } catch (\Throwable) {
            // Stripe not configured or unavailable
        }

        return Inertia::render('Admin/Users/Show', [
            'adminUser' => array_merge($user->only([
                'id', 'name', 'email', 'phone', 'company_name', 'company_site',
                'is_admin', 'is_unlimited', 'is_agency', 'created_at', 'email_verified_at',
            ]), [
                'stats' => [
                    'total_crawls'   => $totalCrawls,
                    'month_crawls'   => $monthCrawls,
                    'distinct_sites' => $distinctSites,
                    'avg_score'      => $avgScore,
                    'open_tickets'   => $openTickets,
                ],
            ]),
            'subscription'  => $subscription ? [
                'stripe_status' => $subscription->stripe_status,
                'ends_at'       => $subscription->ends_at,
                'trial_ends_at' => $subscription->trial_ends_at,
            ] : null,
            'stripeData'    => $stripeData,
            'monthlyCrawls' => $monthlyCrawls,
            'topSites'      => $topSites,
            'recentReports' => $recentReports,
        ]);
    }

    public function toggleAdmin(User $user): RedirectResponse
    {
        abort_if($user->id === auth()->id(), 422, 'Cannot modify your own admin status.');
        $user->forceFill(['is_admin' => ! $user->is_admin])->save();
        return back()->with('success', 'Admin status updated.');
    }

    public function toggleUnlimited(User $user): RedirectResponse
    {
        $user->forceFill(['is_unlimited' => ! $user->is_unlimited])->save();
        return back()->with('success', 'Unlimited status updated.');
    }
}
