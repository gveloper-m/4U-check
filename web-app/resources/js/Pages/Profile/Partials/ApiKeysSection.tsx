import { useForm } from '@inertiajs/react';
import { Key, Plus, Trash2, Copy, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

interface ApiKeyProps {
  apiKeys: ApiKeyItem[];
  newApiKey?: string | null;
  hasSubscription: boolean;
}

const inputCls =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50';
const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-400 hover:bg-violet-500/20 transition-colors"
    >
      {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy key'}
    </button>
  );
}

function RevokeButton({ id }: { id: number }) {
  const { delete: destroy, processing } = useForm({});

  const revoke = () => {
    if (!confirm('Revoke this API key? Any integrations using it will stop working.')) return;
    destroy(route('api-keys.destroy', id));
  };

  return (
    <button
      type="button"
      onClick={revoke}
      disabled={processing}
      className="flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      Revoke
    </button>
  );
}

function CreateForm() {
  const { data, setData, post, processing, errors, reset } = useForm({ name: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('api-keys.store'), { onSuccess: () => reset() });
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-3">
      <div className="flex-1">
        <label htmlFor="api_key_name" className={labelCls}>Key name</label>
        <input
          id="api_key_name"
          type="text"
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          placeholder="e.g. CI pipeline, Zapier integration"
          maxLength={60}
          required
          className={inputCls}
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>
      <button
        type="submit"
        disabled={processing}
        className="flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
      >
        {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        Create key
      </button>
    </form>
  );
}

export default function ApiKeysSection({ apiKeys, newApiKey, hasSubscription }: ApiKeyProps) {
  if (!hasSubscription) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Key className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">API Keys</h2>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">REST API access for paid accounts</p>
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          API access requires an active subscription.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Key className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">API Keys</h2>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            Authenticate API requests with a Bearer token. Up to 5 keys per account.
          </p>
        </div>
      </div>

      {newApiKey && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-300">API key created — copy it now</p>
          </div>
          <p className="mb-3 text-xs text-gray-500">This key is shown only once. Store it in a secure location.</p>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
            <code className="flex-1 break-all text-xs font-mono text-gray-900 dark:text-gray-100">{newApiKey}</code>
            <CopyButton text={newApiKey} />
          </div>
        </div>
      )}

      {apiKeys.length > 0 && (
        <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {apiKeys.map((key, idx) => (
            <div
              key={key.id}
              className={`flex items-center gap-4 px-4 py-3 ${idx < apiKeys.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''}`}
            >
              <Key className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{key.name}</p>
                <p className="text-xs text-gray-500 font-mono">{key.key_prefix}···</p>
              </div>
              <div className="hidden sm:block text-right">
                {key.last_used_at ? (
                  <p className="text-xs text-gray-500">Last used {new Date(key.last_used_at).toLocaleDateString()}</p>
                ) : (
                  <p className="text-xs text-gray-400">Never used</p>
                )}
                <p className="text-xs text-gray-500">Created {new Date(key.created_at).toLocaleDateString()}</p>
              </div>
              <RevokeButton id={key.id} />
            </div>
          ))}
        </div>
      )}

      {apiKeys.length === 0 && !newApiKey && (
        <p className="mb-5 text-sm text-gray-500">No API keys yet.</p>
      )}

      {apiKeys.length < 5 ? (
        <CreateForm />
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 text-sm text-gray-500">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          Maximum 5 keys reached. Revoke one to create a new key.
        </div>
      )}

      <div className="mt-5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">Quick start</p>
        <code className="block text-xs font-mono text-gray-600 dark:text-gray-400 leading-relaxed">
          curl -H "Authorization: Bearer YOUR_KEY" \<br />
          &nbsp;&nbsp;https://app.4utest.com/api/v1/me
        </code>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>GET /api/v1/me</span>
          <span>GET /api/v1/sites</span>
          <span>POST /api/v1/scans</span>
          <span>GET /api/v1/scans/{'{id}'}/pdf</span>
          <span>GET /api/v1/scans/{'{id}'}/csv</span>
        </div>
      </div>
    </div>
  );
}
