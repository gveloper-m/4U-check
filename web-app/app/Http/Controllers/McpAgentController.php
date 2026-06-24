<?php

namespace App\Http\Controllers;

use App\Models\McpAgent;
use App\Models\FullAuditReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use phpseclib3\Net\SFTP;
use phpseclib3\Crypt\PublicKeyLoader;

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

    public function autoSetup(Request $request, McpAgent $agent): JsonResponse
    {
        abort_unless($agent->user_id === auth()->id(), 403);

        $validated = $request->validate([
            'host'         => 'required|string|max:255',
            'port'         => 'nullable|integer|min:1|max:65535',
            'ssh_user'     => 'required|string|max:100',
            'auth_method'  => 'required|in:password,key',
            'password'     => 'nullable|string',
            'private_key'  => 'nullable|string',
            'project_path' => 'required|string|max:500',
        ]);

        try {
            // SFTP extends SSH2 — one connection for both file upload and exec
            $sftp = new SFTP($validated['host'], (int) ($validated['port'] ?? 22));
            $sftp->setTimeout(600); // docker build can take a few minutes on first run

            if ($validated['auth_method'] === 'password') {
                if (empty($validated['password'])) {
                    return response()->json(['error' => 'Password is required.'], 422);
                }
                $ok = $sftp->login($validated['ssh_user'], $validated['password']);
            } else {
                if (empty($validated['private_key'])) {
                    return response()->json(['error' => 'Private key is required.'], 422);
                }
                $key = PublicKeyLoader::load($validated['private_key']);
                $ok  = $sftp->login($validated['ssh_user'], $key);
            }

            if (! $ok) {
                return response()->json(['error' => 'SSH authentication failed. Check your credentials.'], 422);
            }

            // Agent source lives at resources/agent/ inside the production container
            // (copied there by the backend Dockerfile from 4u-test-agent/).
            $agentSrcDir = resource_path('agent');
            if (! is_dir($agentSrcDir) || ! file_exists("$agentSrcDir/server.py")) {
                return response()->json(['error' => 'Agent source files not found. Rebuild the backend container.'], 500);
            }

            // Upload source files to a temp directory on the user's server
            $buildDir = '/tmp/4utest-agent-' . substr(md5(uniqid('', true)), 0, 8);
            $sftp->mkdir($buildDir);
            $sftp->put("$buildDir/Dockerfile",       file_get_contents("$agentSrcDir/Dockerfile"));
            $sftp->put("$buildDir/requirements.txt", file_get_contents("$agentSrcDir/requirements.txt"));
            $sftp->put("$buildDir/server.py",        file_get_contents("$agentSrcDir/server.py"));

            $token       = escapeshellarg($agent->token);
            $projectPath = escapeshellarg($validated['project_path']);
            $buildDirEsc = escapeshellarg($buildDir);

            $script = <<<BASH
set -e
echo '→ Creating /opt/4utest-agent/backups directory...'
mkdir -p /opt/4utest-agent/backups

echo '→ Building 4utest/mcp-agent image from source...'
docker build -t 4utest/mcp-agent:latest {$buildDirEsc}
rm -rf {$buildDirEsc}

if docker ps -a --format '{{.Names}}' | grep -q '^4utest-agent$'; then
  echo '→ Replacing existing 4utest-agent container (no other containers are affected)...'
  docker stop 4utest-agent
  docker rm   4utest-agent
else
  echo '→ No existing 4utest-agent container found, creating fresh...'
fi

docker run -d \
  --name 4utest-agent \
  --restart unless-stopped \
  -p 8765:8765 \
  -e AGENT_TOKEN={$token} \
  -v {$projectPath}:/workspace \
  -v /opt/4utest-agent/backups:/backups \
  4utest/mcp-agent:latest

echo '→ Opening port 8765 on firewall...'
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q 'Status: active'; then
  ufw allow 8765/tcp
  echo '  ufw: port 8765 allowed'
elif command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port=8765/tcp
  firewall-cmd --reload
  echo '  firewalld: port 8765 allowed'
else
  echo '  No active ufw or firewalld detected — port 8765 may need to be opened manually in your cloud provider firewall/security group'
fi

echo '→ Done! Container state:'
docker inspect 4utest-agent --format '{{.State.Status}}'
BASH;

            $output   = $sftp->exec($script);
            $exitCode = $sftp->getExitStatus();

            if ($exitCode !== 0) {
                return response()->json(['error' => 'Setup script failed.', 'output' => $output], 422);
            }

            return response()->json(['success' => true, 'output' => $output]);

        } catch (\phpseclib3\Exception\UnableToConnectException $e) {
            return response()->json(['error' => 'Cannot connect to server: ' . $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
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
