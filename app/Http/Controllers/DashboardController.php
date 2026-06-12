<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('Dashboard', [
            'recentReports'   => $user->auditReports()->latest()->limit(5)->get(),
            'totalReports'    => $user->auditReports()->count(),
            'scheduledScans'  => $user->scheduledScans()->where('is_active', true)->count(),
            'subscription'    => $user->subscribed('default') ? 'active' : 'inactive',
        ]);
    }
}
