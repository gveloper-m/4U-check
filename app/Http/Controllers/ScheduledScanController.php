<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessScheduledScan;
use App\Models\ScheduledScan;
use Illuminate\Http\JsonResponse;
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
        $scans = auth()->user()
            ->scheduledScans()
            ->with('lastReport')
            ->latest()
            ->paginate(15);

        return Inertia::render('ScheduledScans/Index', ['scans' => $scans]);
    }

    /**
     * POST /scheduled-scans
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'site_url' => 'required|url',
            'interval' => 'required|in:hourly,daily,weekly,monthly',
        ]);

        auth()->user()->scheduledScans()->create([
            'name'        => $validated['name'],
            'site_url'    => $validated['site_url'],
            'interval'    => $validated['interval'],
            'is_active'   => true,
            'next_run_at' => ScheduledScan::computeNextRun($validated['interval']),
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
            'name'     => 'sometimes|string|max:255',
            'site_url' => 'sometimes|url',
            'interval' => 'sometimes|in:hourly,daily,weekly,monthly',
        ]);

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
    public function runNow(ScheduledScan $scheduledScan): JsonResponse
    {
        abort_unless($scheduledScan->user_id === auth()->id(), 403);

        ProcessScheduledScan::dispatch($scheduledScan);

        return response()->json(['success' => true, 'message' => 'Scan dispatched.']);
    }

    /**
     * POST /scheduled-scans/{scan}/toggle
     */
    public function toggle(ScheduledScan $scheduledScan): JsonResponse
    {
        abort_unless($scheduledScan->user_id === auth()->id(), 403);

        $scheduledScan->update(['is_active' => ! $scheduledScan->is_active]);

        return response()->json([
            'success'   => true,
            'is_active' => $scheduledScan->is_active,
        ]);
    }
}
