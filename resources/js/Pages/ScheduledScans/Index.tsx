import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { PageProps, ScheduledScan } from '@/types';
import { FormEventHandler } from 'react';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ScheduledScansProps extends PageProps {
  scans: ScheduledScan[];
}

const intervalLabels: Record<ScheduledScan['interval'], string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString();
}

export default function ScheduledScansIndex({ scans, flash }: ScheduledScansProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    site_url: '',
    interval: 'daily' as ScheduledScan['interval'],
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/scheduled-scans', {
      onSuccess: () => reset(),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete this scheduled scan?')) return;
    router.delete(`/scheduled-scans/${id}`);
  };

  const handleRunNow = (id: number) => {
    router.post(`/scheduled-scans/${id}/run`);
  };

  const handleToggle = (scan: ScheduledScan) => {
    router.patch(`/scheduled-scans/${scan.id}`, {
      is_active: !scan.is_active,
    });
  };

  return (
    <AppLayout>
      <Head title="Scheduled Scans" />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Scheduled Scans</h1>
          <p className="mt-1 text-sm text-gray-400">
            Automatically audit your sites on a recurring schedule
          </p>
        </div>

        {/* Flash messages */}
        {flash?.success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {flash.error}
          </div>
        )}

        {/* Create form */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">New Scheduled Scan</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="sched_name" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="sched_name"
                  type="text"
                  placeholder="e.g. Production site"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="sched_url" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Website URL <span className="text-red-400">*</span>
                </label>
                <input
                  id="sched_url"
                  type="url"
                  placeholder="https://example.com"
                  value={data.site_url}
                  onChange={(e) => setData('site_url', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {errors.site_url && <p className="mt-1 text-xs text-red-400">{errors.site_url}</p>}
              </div>
              <div>
                <label htmlFor="sched_interval" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Interval
                </label>
                <select
                  id="sched_interval"
                  value={data.interval}
                  onChange={(e) => setData('interval', e.target.value as ScheduledScan['interval'])}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {Object.entries(intervalLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {errors.interval && <p className="mt-1 text-xs text-red-400">{errors.interval}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Schedule
              </button>
            </div>
          </form>
        </div>

        {/* Scans list */}
        <div className="rounded-xl border border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
            <h2 className="text-base font-semibold text-white">
              Scheduled Scans
              <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                {scans.length}
              </span>
            </h2>
          </div>

          {scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-400">No scheduled scans yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Create a schedule above to automate your audits.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name / URL
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Interval
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Last Run
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Next Run
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-white truncate max-w-[200px]">
                            {scan.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {scan.site_url}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
                          <Clock className="h-3 w-3" />
                          {intervalLabels[scan.interval]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {scan.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-400 border border-gray-500/20">
                            <XCircle className="h-3 w-3" />
                            Paused
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(scan.last_run_at)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(scan.next_run_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRunNow(scan.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:border-violet-500/40 hover:text-violet-400 transition-colors"
                            title="Run now"
                          >
                            <Play className="h-3 w-3" />
                            Run
                          </button>
                          <button
                            onClick={() => handleToggle(scan)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                              scan.is_active
                                ? 'border-amber-500/20 text-amber-400 hover:border-amber-500/40'
                                : 'border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40'
                            }`}
                            title={scan.is_active ? 'Pause' : 'Resume'}
                          >
                            {scan.is_active ? (
                              <>
                                <Pause className="h-3 w-3" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                Resume
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(scan.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 hover:border-red-500/40 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
