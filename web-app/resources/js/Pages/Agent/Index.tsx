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

function ClaudeCodeStep({ serverIp }: { serverIp: string }) {
  const tunnelCmd = `ssh -L 8765:localhost:8765 user@${serverIp || 'your-server-ip'} -N`;
  const claudeConfig = JSON.stringify(
    { mcpServers: { "4utest-agent": { url: "http://localhost:8765/sse" } } },
    null, 2,
  );
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
      <p className="text-sm font-semibold text-violet-300">Last step — Connect Claude Code (on your local machine)</p>
      <div>
        <p className="text-xs text-gray-400 mb-1.5">1. Open a permanent SSH tunnel so Claude Code can reach the agent:</p>
        <div className="relative rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300">
          {tunnelCmd}
          <div className="absolute top-2 right-2"><CopyButton text={tunnelCmd} /></div>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1.5">2. Add this to <code className="text-violet-300">~/.claude/settings.json</code> and restart Claude Code:</p>
        <div className="relative rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300 whitespace-pre">
          {claudeConfig}
          <div className="absolute top-2 right-2"><CopyButton text={claudeConfig} /></div>
        </div>
      </div>
      <p className="text-xs text-gray-500">You will see <strong className="text-gray-300">4utest-agent</strong> in Claude Code's MCP server list. Tell Claude: <em>"Check my 4uTest audit and fix the top issues."</em></p>
    </div>
  );
}

function SetupInstructions({ agentId, token }: { agentId?: number; token?: string }) {
  const [tab, setTab]             = useState<'auto' | 'manual'>('auto');
  const [host, setHost]           = useState('');
  const [port, setPort]           = useState('22');
  const [sshUser, setSshUser]     = useState('root');
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
  const [password, setPassword]   = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [projectPath, setProjectPath] = useState('/var/www/html');
  const [status, setStatus]       = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [output, setOutput]       = useState('');
  const [errMsg, setErrMsg]       = useState('');

  const manualCmd = [
    'docker run -d \\',
    '  --name 4utest-agent \\',
    '  --restart unless-stopped \\',
    '  -p 8765:8765 \\',
    `  -e AGENT_TOKEN=${token ?? 'your-token-here'} \\`,
    `  -v ${projectPath}:/workspace \\`,
    '  -v /opt/4utest-agent/backups:/backups \\',
    '  4utest/mcp-agent:latest',
  ].join('\n');

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId) return;
    setStatus('running');
    setOutput('');
    setErrMsg('');
    try {
      const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
      const res  = await fetch(`/agent/${agentId}/auto-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
        body: JSON.stringify({
          host, port: parseInt(port) || 22, ssh_user: sshUser,
          auth_method: authMethod,
          password:    authMethod === 'password' ? password    : undefined,
          private_key: authMethod === 'key'      ? privateKey  : undefined,
          project_path: projectPath,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setStatus('success'); setOutput(data.output ?? ''); }
      else { setStatus('error'); setErrMsg(data.error ?? 'Unknown error'); setOutput(data.output ?? ''); }
    } catch (err) {
      setStatus('error');
      setErrMsg('Network error: ' + String(err));
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['auto', 'manual'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-xs font-semibold transition-colors ${
              tab === t
                ? 'border-b-2 border-violet-500 text-violet-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t === 'auto' ? 'Auto Deploy (Recommended)' : 'Manual'}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 space-y-5 text-sm">
        {tab === 'auto' ? (
          <>
            <p className="text-xs text-gray-500">
              Enter your server details and we'll SSH in and deploy the agent for you.{' '}
              <span className="text-gray-400">Your credentials are used once and never stored.</span>
            </p>

            {status === 'success' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                  <p className="text-sm font-medium text-green-300">Agent deployed successfully!</p>
                </div>
                {output && (
                  <pre className="rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">{output}</pre>
                )}
                <ClaudeCodeStep serverIp={host} />
              </div>
            ) : (
              <form onSubmit={handleDeploy} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>Server IP / Hostname</label>
                    <input className={inputCls} value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.1 or example.com" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3 col-span-2 sm:col-span-1">
                    <div>
                      <label className={labelCls}>SSH Port</label>
                      <input className={inputCls} value={port} onChange={e => setPort(e.target.value)} placeholder="22" />
                    </div>
                    <div>
                      <label className={labelCls}>SSH User</label>
                      <input className={inputCls} value={sshUser} onChange={e => setSshUser(e.target.value)} placeholder="root" required />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Project path on server</label>
                  <input className={inputCls} value={projectPath} onChange={e => setProjectPath(e.target.value)} placeholder="/var/www/html" required />
                  <p className="mt-1 text-xs text-gray-500">The folder the agent should have access to (mounted as /workspace inside the container).</p>
                </div>

                <div>
                  <label className={labelCls}>Authentication</label>
                  <div className="flex gap-4 mt-1">
                    {(['password', 'key'] as const).map(m => (
                      <label key={m} className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                        <input type="radio" checked={authMethod === m} onChange={() => setAuthMethod(m)} className="accent-violet-500" />
                        {m === 'password' ? 'Password' : 'SSH Private Key'}
                      </label>
                    ))}
                  </div>
                </div>

                {authMethod === 'password' ? (
                  <div>
                    <label className={labelCls}>Password</label>
                    <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                ) : (
                  <div>
                    <label className={labelCls}>Private Key (PEM / OpenSSH)</label>
                    <textarea rows={5} className={inputCls + ' font-mono resize-none'} value={privateKey} onChange={e => setPrivateKey(e.target.value)} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" required />
                  </div>
                )}

                {status === 'error' && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
                    <p className="text-xs font-medium text-red-400 mb-1">{errMsg}</p>
                    {output && <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto">{output}</pre>}
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <button type="submit" disabled={status === 'running' || !agentId}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {status === 'running' ? <><RefreshCw className="h-4 w-4 animate-spin" /> Deploying…</> : <><Terminal className="h-4 w-4" /> Deploy Agent</>}
                  </button>
                  <p className="text-xs text-gray-500 leading-relaxed pt-0.5">
                    Your SSH credentials are transmitted over HTTPS, used once to run the setup, and are never stored.{' '}
                    <a href="/terms" target="_blank" className="text-violet-400 hover:underline">See §9 of our Terms</a> for full details.
                  </p>
                </div>
              </form>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500">SSH into your server manually and run the command below. Docker must already be installed.</p>
            <div>
              <label className={labelCls}>Your project path on the server</label>
              <input className={inputCls} value={projectPath} onChange={e => setProjectPath(e.target.value)} placeholder="/var/www/html" />
            </div>
            <div>
              <p className={labelCls}>Run this command on your server</p>
              <div className="relative rounded-lg bg-gray-900 border border-gray-700 p-3 text-xs font-mono text-gray-300 whitespace-pre">
                {manualCmd}
                <div className="absolute top-2 right-2"><CopyButton text={manualCmd} /></div>
              </div>
            </div>
            <ClaudeCodeStep serverIp="" />
          </>
        )}
      </div>
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

  const firstAgent = agents[0];
  const firstToken = firstAgent?.token;

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
        <SetupInstructions agentId={firstAgent?.id} token={firstToken} />
      </div>
    </AppLayout>
  );
}
