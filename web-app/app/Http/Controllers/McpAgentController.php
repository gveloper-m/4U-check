<?php

namespace App\Http\Controllers;

use App\Models\McpAgent;
use App\Models\FullAuditReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class McpAgentController extends Controller
{
    public function index(): InertiaResponse
    {
        $user  = auth()->user();
        $sites = $user->monitoredSites()->orderBy('is_primary', 'desc')->get();

        $agents = McpAgent::where('user_id', $user->id)
            ->with('monitoredSite')
            ->latest()
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'name'          => $a->name,
                'token'         => $a->token,
                'is_online'     => $a->isOnline(),
                'last_ping_at'  => $a->last_ping_at?->toIso8601String(),
                'metrics'       => $a->metrics,
                'site'          => $a->monitoredSite ? [
                    'id'  => $a->monitoredSite->id,
                    'url' => $a->monitoredSite->url,
                ] : null,
            ]);

        return Inertia::render('Agent/Index', [
            'agents' => $agents,
            'sites'  => $sites->map(fn($s) => [
                'id'         => $s->id,
                'url'        => $s->url,
                'is_primary' => $s->is_primary,
                'has_agent'  => McpAgent::where('monitored_site_id', $s->id)->exists(),
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'               => 'required|string|max:100',
            'monitored_site_id'  => 'nullable|integer|exists:monitored_sites,id',
        ]);

        $user = $request->user();

        // Ensure the site belongs to this user
        if ($validated['monitored_site_id']) {
            abort_unless(
                $user->monitoredSites()->where('id', $validated['monitored_site_id'])->exists(),
                403,
            );
            // One agent per site
            abort_if(
                McpAgent::where('monitored_site_id', $validated['monitored_site_id'])->exists(),
                422,
                'This site already has an agent registered.',
            );
        }

        McpAgent::create([
            'user_id'            => $user->id,
            'monitored_site_id'  => $validated['monitored_site_id'] ?? null,
            'name'               => $validated['name'],
            'token'              => McpAgent::generateToken(),
        ]);

        return back()->with('success', 'Agent registered. Copy the token and configure your server.');
    }

    public function destroy(McpAgent $agent): RedirectResponse
    {
        abort_unless($agent->user_id === auth()->id(), 403);
        $agent->delete();
        return back()->with('success', 'Agent removed.');
    }

    public function regenerate(McpAgent $agent): RedirectResponse
    {
        abort_unless($agent->user_id === auth()->id(), 403);
        $agent->update(['token' => McpAgent::generateToken()]);
        return back()->with('success', 'Token regenerated. Update your .env on the server.');
    }

    public function sync(McpAgent $agent): RedirectResponse
    {
        abort_unless($agent->user_id === auth()->id(), 403);

        if (! $agent->monitored_site_id) {
            return back()->with('error', 'Agent has no linked site — nothing to sync.');
        }

        // Find latest completed report for this site
        $report = FullAuditReport::where('user_id', auth()->id())
            ->where('url', $agent->monitoredSite->url)
            ->where('status', 'completed')
            ->latest()
            ->first();

        if (! $report) {
            return back()->with('error', 'No completed scan found for this site. Run a scan first.');
        }

        $agent->update(['latest_report_json' => $this->buildReportPayload($report)]);

        return back()->with('success', 'Latest scan queued for the agent. It will be delivered on the next heartbeat (within 60 s).');
    }

    private function buildReportPayload(FullAuditReport $report): string
    {
        return json_encode([
            'report_id'    => $report->id,
            'url'          => $report->url,
            'health_score' => $report->health_score,
            'status'       => $report->status,
            'scanned_at'   => $report->updated_at?->toIso8601String(),
            'deductions'   => json_decode($report->score_deductions ?? '[]', true),
            'modules'      => [
                'seo_schema'         => json_decode($report->seo_schema_result         ?? 'null', true),
                'security'           => json_decode($report->security_result           ?? 'null', true),
                'performance'        => json_decode($report->performance_result        ?? 'null', true),
                'broken_resources'   => json_decode($report->broken_resources_result   ?? 'null', true),
                'catalog_integrity'  => json_decode($report->catalog_result            ?? 'null', true),
                'marketing_tracking' => json_decode($report->tracking_result           ?? 'null', true),
                'accessibility'      => json_decode($report->accessibility_result      ?? 'null', true),
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
}
