<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\McpAgent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class McpAgentController extends Controller
{
    /**
     * POST /api/agent/heartbeat
     * Called by the Python agent every 60 s.
     * Returns the queued report payload (if any) so the agent can write it to disk.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $agent = $this->resolveAgent($request);
        if (! $agent) {
            return response()->json(['error' => 'Unauthorised'], 401);
        }

        $validated = $request->validate([
            'metrics'              => 'nullable|array',
            'metrics.cpu_percent'  => 'nullable|numeric',
            'metrics.ram_percent'  => 'nullable|numeric',
            'metrics.disk_percent' => 'nullable|numeric',
        ]);

        // Grab the queued report and clear it so it's only sent once
        $reportJson = $agent->latest_report_json;

        $agent->update([
            'last_ping_at'       => now(),
            'metrics'            => $validated['metrics'] ?? null,
            'latest_report_json' => null,   // consumed
        ]);

        return response()->json([
            'status'             => 'ok',
            'latest_report_json' => $reportJson ? json_decode($reportJson, true) : null,
        ]);
    }

    private function resolveAgent(Request $request): ?McpAgent
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }
        return McpAgent::where('token', $token)->first();
    }
}
