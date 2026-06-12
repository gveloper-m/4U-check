import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps, FullAuditReport } from '@/types';
import {
  FileSearch,
  Clock,
  CreditCard,
  Activity,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface DashboardProps extends PageProps {
  recentReports: FullAuditReport[];
  totalReports: number;
  scheduledScans: number;
  subscription: 'active' | 'inactive';
}

function healthColor(score?: number): string {
  if (score === undefined || score === null) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function healthBg(score?: number): string {
  if (score === undefined || score === null) return 'bg-gray-500/10 border-gray-500/20';
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
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

function avgHealthScore(reports: FullAuditReport[]): number | null {
  const scored = reports.filter((r) => r.health_score !== undefined && r.health_score !== null);
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, r) => acc + (r.health_score ?? 0), 0);
  return Math.round(sum / scored.length);
}

export default function Dashboard({
  recentReports,
  totalReports,
  scheduledScans,
  subscription,
}: DashboardProps) {
  const avg = avgHealthScore(recentReports);

  const stats = [
    {
      label: 'Total Scans',
      value: totalReports,
      icon: FileSearch,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      label: 'Active Scheduled',
      value: scheduledScans,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Subscription',
      value: subscription === 'active' ? 'Active' : 'Inactive',
      icon: CreditCard,
      color: subscription === 'active' ? 'text-emerald-400' : 'text-red-400',
      bg: subscription === 'active' ? 'bg-emerald-500/10' : 'bg-red-500/10',
      border: subscription === 'active' ? 'border-emerald-500/20' : 'border-red-500/20',
    },
    {
      label: 'Avg Health Score',
      value: avg !== null ? `${avg}` : 'N/A',
      icon: Activity,
      color: avg !== null ? healthColor(avg) : 'text-gray-400',
      bg: avg !== null ? healthBg(avg).split(' ')[0] : 'bg-gray-500/10',
      border: avg !== null ? healthBg(avg).split(' ')[1] : 'border-gray-500/20',
    },
  ];

  return (
    <AppLayout>
      <Head title="Dashboard" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-400">Overview of your website audits</p>
          </div>
          <Link
            href="/audits"
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            Start New Scan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-xl border ${stat.border} ${stat.bg} p-5`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg} border ${stat.border}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <p className={`mt-3 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Scans */}
        <div className="rounded-xl border border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
            <h2 className="text-base font-semibold text-white">Recent Scans</h2>
            <Link href="/audits" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              View all
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSearch className="mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-400">No scans yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Start your first audit to see results here.
              </p>
              <Link
                href="/audits"
                className="mt-4 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
              >
                Run your first scan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
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
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-white truncate max-w-[200px]">
                            {report.name ?? report.site_url}
                          </p>
                          {report.name && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
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
                          <span className={`text-base font-bold ${healthColor(report.health_score)}`}>
                            {report.health_score}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/audits/${report.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
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
