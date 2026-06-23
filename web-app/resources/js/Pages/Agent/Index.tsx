import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
  Bot, Plus, Trash2, RefreshCw, UploadCloud, Copy, Check,
  CheckCircle2, XCircle, Clock, Cpu, HardDrive, MemoryStick,
  ChevronDown, ChevronUp, Terminal, Info, X, AlertTriangle,
} from 'lucide-react';

interface Site { id: number; url: string; is_primary: boolean; has_agent: boolean; }
interface AgentMetrics { cpu_percent?: number; ram_percent?: number; disk_percent?: number; }
interface Agent {
  id: number; name: string; token: string; is_online: boolean;
  last_ping_at: string | null; metrics: AgentMetrics | null;
  site: { id: number; url: string } | null;
}

interface Props extends PageProps {
  agents: Agent[];
  sites: Site[];
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function MetricBar({ label, value }: { label: string; value?: number }) {
  const v = value ?? 0;
  const color = v > 85 ? 'bg-red-500' : v > 60 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 text-gray-500">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-700">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(v, 100)}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-gray-400">{v.toFixed(0)}%</span>
    </div>
  );
}

function AgentCard({ agent, onDelete, onRegenerate, onSync }: {
  agent: Agent;
  onDelete: () => void;
  onRegenerate: () => void;
  onSync: () => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`rounded-xl border ${agent.is_online ? 'border-emerald-500/30' : 'border-gray-200 dark:border-gray-800'} bg-white dark:bg-gray-900 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${agent.is_online ? 'bg-emerald-500/15' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Bot className={`h-5 w-5 ${agent.is_online ? 'text-emerald-400' : 'text-gray-500'}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{agent.name}</p>
            {agent.site && (
              <p className="text-xs text-gray-500 truncate">{agent.site.url}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            agent.is_online
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${agent.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
            {agent.is_online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Metrics */}
      {agent.is_online && agent.metrics && (
        <div className="mt-4 space-y-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
          <MetricBar label="CPU"  value={agent.metrics.cpu_percent} />
          <MetricBar label="RAM"  value={agent.metrics.ram_percent} />
          <MetricBar label="Disk" value={agent.metrics.disk_percent} />
        </div>
      )}

      {!agent.is_online && (
        <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Last seen: {timeAgo(agent.last_ping_at)}
        </p>
      )}

      {/* Token */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Agent Token</span>
          <button onClick={() => setShowToken(v => !v)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2">
          <code className="flex-1 text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
            {showToken ? agent.token : '•'.repeat(32)}
          </code>
          <CopyButton text={agent.token} />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {agent.site && (
          <button
            onClick={onSync}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5" /> Push Latest Scan
          </button>
        )}
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate Token
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Are you sure?</span>
            <button onClick={onDelete} className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/25 transition-colors">Yes, delete</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

function SetupInstructions({ token, appUrl }: { token?: string; appUrl: string }) {
  const [open, setOpen] = useState(false);
  const envContent = `AGENT_TOKEN=${token ?? 'your-token-here'}
FOURTEST_API_URL=${appUrl}
MCP_SERVER_PORT=8765
MAX_BACKUPS=10`;

  const claudeConfig = JSON.stringify({
    mcpServers: {
      "4utest-agent": { url: "http://localhost:8765/sse" }
    }
  }, null, 2);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-violet-400" />
          Setup &amp; Connection Instructions
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-5 space-y-6 text-sm">

          {/* What it does */}
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="font-semibold text-violet-300 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" /> What does the MCP Agent do?
            </p>
            <ul className="space-y-1.5 text-gray-400 text-xs leading-relaxed list-disc list-inside">
              <li>Lets Claude Code read and edit files directly on your server — no manual copy-paste</li>
              <li>Gives Claude real-time server metrics (CPU, RAM, disk) so it understands server health</li>
              <li>Automatically receives your 4uTest audit results and makes them available to Claude</li>
              <li>Creates automatic ZIP backups of your project before Claude makes changes</li>
              <li>Claude can then fix SEO issues, security headers, or performance problems it discovered in the audit — directly on your server</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">Best for: agencies who want Claude to fix issues it finds, developers who want AI-assisted server management, and teams running scheduled audits who want automated remediation.</p>
          </div>

          {/* Step 1 */}
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Step 1 — SSH into your server</p>
            <div className="rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300">
              ssh user@your-server-ip
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Step 2 — Install Docker (if not already installed)</p>
            <div className="rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300">
              curl -fsSL https://get.docker.com | sh
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Step 3 — Download the agent</p>
            <div className="rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300 whitespace-pre">{`git clone https://github.com/gveloper-m/4U-check.git /opt/4utest-agent
cd /opt/4utest-agent/4u-test-agent
cp .env.example .env`}</div>
          </div>

          {/* Step 4 */}
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Step 4 — Configure <code className="text-violet-300">.env</code></p>
            <p className="text-xs text-gray-500 mb-2">Edit <code>/opt/4utest-agent/4u-test-agent/.env</code> with your values:</p>
            <div className="relative rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300 whitespace-pre">
              {envContent}
              <div className="absolute top-2 right-2"><CopyButton text={envContent} /></div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Change the left side of the workspace volume in <code>docker-compose.yml</code> to point to your project directory.</p>
          </div>

          {/* Step 5 */}
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Step 5 — Start the agent</p>
            <div className="rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300 whitespace-pre">{`docker compose up -d --build
docker compose logs -f   # watch for "Heartbeat OK"`}</div>
          </div>

          {/* Step 6 — Claude Code */}
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Step 6 — Connect Claude Code via SSH tunnel</p>
            <p className="text-xs text-gray-500 mb-2">On your local machine, open a tunnel so Claude Code can reach the agent:</p>
            <div className="rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300">
              ssh -L 8765:localhost:8765 user@your-server-ip -N
            </div>
            <p className="mt-3 text-xs text-gray-500 mb-2">Then add this to your Claude Code MCP settings (<code>~/.claude/settings.json</code>):</p>
            <div className="relative rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300 whitespace-pre">
              {claudeConfig}
              <div className="absolute top-2 right-2"><CopyButton text={claudeConfig} /></div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Restart Claude Code. You will see "4uTest Agent" in your MCP servers list with all tools available.</p>
          </div>

          {/* Step 7 */}
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Step 7 — Let Claude fix your audit issues</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Run a 4uTest audit on your site, then click <strong>Push Latest Scan</strong> on the agent card above. Claude now has access to the full audit report via the <code className="text-violet-300">get_audit_report</code> tool. Tell Claude:
            </p>
            <div className="mt-2 rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs text-gray-300 italic">
              "Check the latest 4uTest audit for my site and fix the top security and SEO issues you find."
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default function AgentIndex({ agents, sites, auth }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const form = useForm({ name: '', monitored_site_id: '' });

  const availableSites = sites.filter(s => !s.has_agent);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('agent.store'), {
      onSuccess: () => { form.reset(); setShowCreate(false); },
    });
  };

  const deleteAgent = (id: number) => router.delete(route('agent.destroy', id));
  const regenerate  = (id: number) => router.post(route('agent.regenerate', id));
  const sync        = (id: number) => router.post(route('agent.sync', id));

  const appUrl = window.location.origin;
  const firstToken = agents[0]?.token;

  return (
    <AppLayout>
      <Head title="MCP Agent" />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bot className="h-6 w-6 text-violet-400" /> MCP Agent
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              One agent per site — Claude Code connects to your server and can read files, check server health, and apply audit fixes directly.
            </p>
          </div>
          {availableSites.length > 0 && (
            <button
              onClick={() => setShowCreate(v => !v)}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Register Agent
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-xl border border-violet-500/30 bg-white dark:bg-gray-900 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Register a new agent</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Agent name</label>
                <input
                  type="text"
                  value={form.data.name}
                  onChange={e => form.setData('name', e.target.value)}
                  placeholder="e.g. Production Server"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                {form.errors.name && <p className="mt-1 text-xs text-red-400">{form.errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Link to site (optional)</label>
                <select
                  value={form.data.monitored_site_id}
                  onChange={e => form.setData('monitored_site_id', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="">No site linked (diagnostics only)</option>
                  {availableSites.map(s => (
                    <option key={s.id} value={s.id}>{s.url}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Linking to a site enables automatic scan data sync after each audit.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={form.processing}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                >
                  {form.processing ? 'Creating…' : 'Create Agent'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* No agents yet */}
        {agents.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
            <Bot className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No agents registered yet</p>
            <p className="mt-1 text-xs text-gray-500">Register an agent to connect Claude Code directly to your server.</p>
            {availableSites.length === 0 && (
              <p className="mt-3 text-xs text-amber-400 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Add a monitored site in Billing first to link it to an agent.
              </p>
            )}
          </div>
        )}

        {/* Agent cards */}
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onDelete={() => deleteAgent(agent.id)}
            onRegenerate={() => regenerate(agent.id)}
            onSync={() => sync(agent.id)}
          />
        ))}

        {/* Setup instructions */}
        <SetupInstructions token={firstToken} appUrl={appUrl} />
      </div>
    </AppLayout>
  );
}
