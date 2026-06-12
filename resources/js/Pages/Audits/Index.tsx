import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PageProps, FullAuditReport, PaginatedData } from '@/types';
import { FormEventHandler } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  FileDown,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AuditsIndexProps extends PageProps {
  reports: PaginatedData<FullAuditReport>;
}

function StatusBadge({ status }: { status: FullAuditReport['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400 border border-violet-500/20">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
      <XCircle className="h-3 w-3" />
      Failed
    </span>
  );
}

function healthColor(score?: number): string {
  if (score === undefined || score === null) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function healthRingColor(score?: number): string {
  if (score === undefined || score === null) return 'border-gray-600';
  if (score >= 80) return 'border-emerald-500';
  if (score >= 50) return 'border-amber-500';
  return 'border-red-500';
}

export default function AuditsIndex({ reports, flash }: AuditsIndexProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    site_url: '',
    name: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/audits', {
      onSuccess: () => reset(),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this scan?')) return;
    router.delete(`/audits/${id}`);
  };

  return (
    <AppLayout>
      <Head title="Scan History" />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Audits</h1>
          <p className="mt-1 text-sm text-gray-400">Run a new scan or view past results</p>
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

        {/* New Scan Panel */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">New Scan</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="site_url" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Website URL <span className="text-red-400">*</span>
                </label>
                <input
                  id="site_url"
                  type="url"
                  placeholder="https://example.com"
                  value={data.site_url}
                  onChange={(e) => setData('site_url', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {errors.site_url && (
                  <p className="mt-1 text-xs text-red-400">{errors.site_url}</p>
                )}
              </div>
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Name <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Homepage audit"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Run Audit
              </button>
            </div>
          </form>
        </div>

        {/* Scan History Table */}
        <div className="rounded-xl border border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
            <h2 className="text-base font-semibold text-white">
              Scan History
              <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                {reports.total}
              </span>
            </h2>
          </div>

          {reports.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-400">No scans yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Run your first audit above to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Site
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Health
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Date
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {reports.data.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-medium text-white truncate max-w-[220px]">
                              {report.name ?? report.site_url}
                            </p>
                            {report.name && (
                              <p className="text-xs text-gray-500 truncate max-w-[220px]">
                                {report.site_url}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          {report.health_score !== undefined && report.health_score !== null ? (
                            <div
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 ${healthRingColor(report.health_score)} text-xs font-bold ${healthColor(report.health_score)}`}
                            >
                              {report.health_score}
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/audits/${report.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Link>
                            {report.status === 'completed' && (
                              <>
                                <a
                                  href={`/audits/${report.id}/export/pdf`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                                >
                                  <FileDown className="h-3 w-3" />
                                  PDF
                                </a>
                                <a
                                  href={`/audits/${report.id}/export/csv`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                                >
                                  <FileDown className="h-3 w-3" />
                                  CSV
                                </a>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(report.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 hover:border-red-500/40 hover:text-red-300 transition-colors"
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

              {/* Pagination */}
              {reports.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-gray-800 px-5 py-4">
                  <p className="text-xs text-gray-500">
                    Showing {reports.from}–{reports.to} of {reports.total}
                  </p>
                  <div className="flex items-center gap-1">
                    {reports.links.map((link, index) => {
                      if (link.label === '&laquo; Previous') {
                        return (
                          <Link
                            key={index}
                            href={link.url ?? '#'}
                            className={`rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Link>
                        );
                      }
                      if (link.label === 'Next &raquo;') {
                        return (
                          <Link
                            key={index}
                            href={link.url ?? '#'}
                            className={`rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        );
                      }
                      return (
                        <Link
                          key={index}
                          href={link.url ?? '#'}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            link.active
                              ? 'bg-violet-600 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
