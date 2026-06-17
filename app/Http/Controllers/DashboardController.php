<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $quota = null;
        if (! $user->is_unlimited) {
            $used  = $user->scansThisMonth();
            $limit = $user->monthlyLimit();
            $quota = [
                'used'      => $used,
                'limit'     => $limit,
                'bonus'     => (int) ($user->crawl_quota_bonus ?? 0),
                'remaining' => max(0, $limit - $used),
                'resets_at' => now()->endOfMonth()->format('M j'),
                'percent'   => $limit > 0 ? min(100, (int) round($used / $limit * 100)) : 0,
            ];
        }

        return Inertia::render('Dashboard', [
            'recentReports'  => $user->auditReports()->latest()->limit(5)->get(),
            'totalReports'   => $user->auditReports()->count(),
            'scheduledScans' => $user->scheduledScans()->where('is_active', true)->count(),
            'subscription'   => $user->subscribed('default') ? 'active' : 'inactive',
            'quota'          => $quota,
        ]);
    }
}
