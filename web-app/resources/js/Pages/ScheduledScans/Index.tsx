import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { PageProps, ScheduledScan } from '@/types';
import { FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@inertiajs/react';
import {
  Clock, Play, Pause, Trash2, Plus, Loader2,
  CheckCircle2, XCircle, Mail, Globe, ExternalLink,
} from 'lucide-react';

function healthColor(score?: number | null): string {
  if (score == null) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function healthRingColor(score?: number | null): string {
  if (score == null) return 'border-gray-600';
  if (score >= 80) return 'border-emerald-500';
  if (score >= 50) return 'border-amber-500';
  return 'border-red-500';
}

interface SiteData {
  id: number;
  url: string;
  label: string | null;
  is_primary: boolean;
}

interface ScheduledScansProps extends PageProps {
  scans: ScheduledScan[];
  sites: SiteData[];
}

function formatDate(dateStr?: string | null, neverLabel?: string): string {
  if (!dateStr) return neverLabel ?? 'Never';
  return new Date(dateStr).toLocaleString();
}

export default function ScheduledScansIndex({ scans, flash, sites }: ScheduledScansProps) {
  const { t } = useTranslation();

  const intervalLabels: Record<ScheduledScan['interval'], string> = {
    hourly: t('scheduled.intervalOptions.hourly'),
    daily: t('scheduled.intervalOptions.daily'),
    weekly: t('scheduled.intervalOptions.weekly'),
    monthly: t('scheduled.intervalOptions.monthly'),
  };

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    site_url: '',
    interval: 'daily' as ScheduledScan['interval'],
    notify_email: false,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/scheduled-scans', {
      onSuccess: () => reset(),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm(t('scheduled.deleteConfirm'))) return;
    router.delete(`/scheduled-scans/${id}`);
  };

  const handleRunNow = (id: number) => {
    router.post(`/scheduled-scans/${id}/run-now`);
  };

  const handleToggle = (scan: ScheduledScan) => {
    router.post(`/scheduled-scans/${scan.id}/toggle`);
  };

  return (
    <AppLayout>
      <Head title={t('scheduled.title')} />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('scheduled.title')}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('scheduled.sub')}
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
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">{t('scheduled.createTitle')}</h2>
          <form onSubmit={submit} className="space-y-4">
            {sites.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">{t('audits.registeredSites')}</p>
                <div className="flex flex-wrap gap-2">
                  {sites.map(site => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => setData('site_url', site.url)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        data.site_url === site.url
                          ? 'border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-500 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Globe className="h-3 w-3" />
                      {site.label || new URL(site.url).hostname}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="sched_name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('scheduled.nameLabel')} <span className="text-red-400">*</span>
                </label>
                <input
                  id="sched_name"
                  type="text"
                  placeholder={t('scheduled.namePlaceholder')}
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="sched_url" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('scheduled.urlLabel')} <span className="text-red-400">*</span>
                </label>
                <input
                  id="sched_url"
                  type="url"
                  placeholder={t('scheduled.urlPlaceholder')}
                  value={data.site_url}
                  onChange={(e) => setData('site_url', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {errors.site_url && <p className="mt-1 text-xs text-red-400">{errors.site_url}</p>}
                {sites.length > 0 && <p className="mt-1 text-xs text-gray-500">{t('audits.urlRestricted')}</p>}
              </div>
              <div>
                <label htmlFor="sched_interval" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('scheduled.intervalLabel')}
                </label>
                <select
                  id="sched_interval"
                  value={data.interval}
                  onChange={(e) => setData('interval', e.target.value as ScheduledScan['interval'])}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={data.notify_email}
                onChange={(e) => setData('notify_email', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-violet-600 focus:ring-violet-500 focus:ring-offset-gray-900"
              />
              <span className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                <Mail className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                {t('scheduled.notifyEmail')}
              </span>
            </label>
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
                {t('scheduled.createBtn')}
              </button>
            </div>
          </form>
        </div>

        {/* Scans list */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('scheduled.title')}
              <span className="ml-2 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                {scans.length}
              </span>
            </h2>
          </div>

          {scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">{t('scheduled.noScans')}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t('scheduled.noScansSub')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('scheduled.name')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('scheduled.interval')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('scheduled.status')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('scheduled.lastRun')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Last Result
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('scheduled.nextRun')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('scheduled.notifyCol')}
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('scheduled.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-100/40 dark:hover:bg-gray-100/40 dark:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
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
                            {t('scheduled.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-400 dark:border-gray-500/20">
                            <XCircle className="h-3 w-3" />
                            {t('scheduled.paused')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(scan.last_run_at, t('scheduled.never'))}
                      </td>
                      <td className="px-5 py-3.5">
                        {scan.last_report ? (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${healthRingColor(scan.last_report.health_score)} ${healthColor(scan.last_report.health_score)}`}>
                              {scan.last_report.health_score ?? '—'}
                            </span>
                            <Link
                              href={`/audits/${scan.last_report.id}`}
                              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(scan.next_run_at, t('scheduled.never'))}
                      </td>
                      <td className="px-5 py-3.5">
                        {scan.notify_email ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400 border border-violet-500/20">
                            <Mail className="h-3 w-3" />
                            On
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRunNow(scan.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:border-violet-500/40 hover:text-violet-400 transition-colors"
                            title="Run now"
                          >
                            <Play className="h-3 w-3" />
                            {t('scheduled.runNow')}
                          </button>
                          <button
                            onClick={() => handleToggle(scan)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                              scan.is_active
                                ? 'border-amber-500/20 text-amber-400 hover:border-amber-500/40'
                                : 'border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40'
                            }`}
                            title={scan.is_active ? t('scheduled.pause') : t('scheduled.resume')}
                          >
                            {scan.is_active ? (
                              <>
                                <Pause className="h-3 w-3" />
                                {t('scheduled.pause')}
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                {t('scheduled.resume')}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(scan.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs text-red-400 hover:border-red-500/40 hover:text-red-300 transition-colors"
                            title={t('scheduled.delete')}
                          >
                            <Trash2 className="h-3 w-3" />
                            {t('scheduled.delete')}
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
