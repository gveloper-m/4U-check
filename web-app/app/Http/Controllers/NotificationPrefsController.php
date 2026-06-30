<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationPrefsController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'notify_payment'          => 'boolean',
            'notify_monthly_report'   => 'boolean',
            'notify_renewal_reminder' => 'boolean',
        ]);

        $request->user()->update([
            'notify_payment'          => $validated['notify_payment']          ?? false,
            'notify_monthly_report'   => $validated['notify_monthly_report']   ?? false,
            'notify_renewal_reminder' => $validated['notify_renewal_reminder'] ?? false,
        ]);

        return back()->with('notifications_saved', true);
    }
}
