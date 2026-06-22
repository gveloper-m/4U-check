<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessScheduledScan;
use App\Models\ScheduledScan;
use App\Rules\PublicUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ScheduledScanController extends Controller
{
    /**
     * GET /scheduled-scans
     */
    public function index(): InertiaResponse
    {
        $user  = auth()->user();
        $scans = $user->scheduledScans()->with('lastReport')->latest()->get();
        $sites = $user->monitoredSites()->orderBy('is_primary', 'desc')->orderBy('created_at')->get();

        return Inertia::render('ScheduledScans/Index', [
            'scans' => $scans,
            'sites' => $sites->map(fn($s) => [
                'id'         => $s->id,
                'url'        => $s->url,
                'label'      => $s->label,
                'is_primary' => $s->is_primary,
            ])->values(),
        ]);
    }

    /**
     * POST /scheduled-scans
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'site_url'     => ['required', 'url', new PublicUrl],
            'interval'     => 'required|in:hourly,daily,weekly,monthly',
            'notify_email' => 'boolean',
        ]);

        $user      = auth()->user();
        $userSites = $user->monitoredSites()->pluck('url')->toArray();
        if (! empty($userSites)) {
            $scanHost     = strtolower(parse_url($validated['site_url'], PHP_URL_HOST) ?? '');
            $allowedHosts = array_map(
                fn($s) => strtolower(parse_url($s, PHP_URL_HOST) ?? ''),
                $userSites
            );
            if (! in_array($scanHost, $allowedHosts, true)) {
                return back()->withErrors([
                    'site_url' => 'You can only schedule scans for websites registered in your plan.',
                ]);
            }
        }

        $user->scheduledScans()->create([
            'name'         => $validated['name'],
            'site_url'     => $validated['site_url'],
            'interval'     => $validated['interval'],
            'is_active'    => true,
            'notify_email' => $validated['notify_email'] ?? false,
            'next_run_at'  => ScheduledScan::computeNextRun($validated['interval']),
        ]);

        return redirect()->route('scheduled-scans.index')
            ->with('success', 'Scheduled scan created.');
    }

    /**
     * PUT /scheduled-scans/{scan}
     */
    public function update(Request $request, ScheduledScan $scheduledScan): RedirectResponse
    {
        abort_unless($scheduledScan->user_id === auth()->id(), 403);

        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'site_url'     => ['sometimes', 'url', new PublicUrl],
            'interval'     => 'sometimes|in:hourly,daily,weekly,monthly',
            'notify_email' => 'sometimes|boolean',
        ]);

        if (isset($validated['site_url'])) {
            $user      = auth()->user();
            $userSites = $user->monitoredSites()->pluck('url')->toArray();
            if (! empty($userSites)) {
                $scanHost     = strtolower(parse_url($validated['site_url'], PHP_URL_HOST) ?? '');
                $allowedHosts = array_map(
                    fn($s) => strtolower(parse_url($s, PHP_URL_HOST) ?? ''),
                    $userSites
                );
                if (! in_array($scanHost, $allowedHosts, true)) {
                    return back()->withErrors([
                        'site_url' => 'You can only schedule scans for websites registered in your plan.',
                    ]);
                }
            }
        }

        if (isset($validated['interval']) && $validated['interval'] !== $scheduledScan->interval) {
            $validated['next_run_at'] = ScheduledScan::computeNextRun($validated['interval']);
        }

        $scheduledScan->update($validated);

        return redirect()->route('scheduled-scans.index')
            ->with('success', 'Scheduled scan updated.');
    }

    /**
     * DELETE /scheduled-scans/{scan}
     */
    public function destroy(ScheduledScan $scheduledScan): RedirectResponse
    {
        abort_unless($scheduledScan->user_id === auth()->id(), 403);

        $scheduledScan->delete();

        return redirect()->route('scheduled-scans.index')
            ->with('success', 'Scheduled scan deleted.');
    }

    /**
     * POST /scheduled-scans/{scan}/run-now
     */
    public function runNow(ScheduledScan $scheduledScan): RedirectResponse
    {
        abort_unless($scheduledScan->user_id === auth()->id(), 403);

        $user = auth()->user();
        if ($user->hasReachedScanLimit()) {
            $used  = $user->scansThisMonth();
            $limit = $user->monthlyLimit();
            return back()->with('error', "Monthly scan limit reached ({$used}/{$limit}). Your quota resets on the 1st of next month.");
        }

        ProcessScheduledScan::dispatch($scheduledScan);

        return redirect()->route('scheduled-scans.index')
            ->with('success', 'Scan dispatched.');
    }

    /**
     * POST /scheduled-scans/{scan}/toggle
     */
    public function toggle(ScheduledScan $scheduledScan): RedirectResponse
    {
        abort_unless($scheduledScan->user_id === auth()->id(), 403);

        $scheduledScan->update(['is_active' => ! $scheduledScan->is_active]);

        return redirect()->route('scheduled-scans.index');
    }
}
