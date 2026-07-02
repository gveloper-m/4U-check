import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, PaginatedData } from '@/types';
import { useState } from 'react';
import {
    Users, Globe, BarChart2, Search, ChevronRight,
    CheckCircle2, XCircle, ShieldCheck, Infinity,
    TrendingUp, Ticket, ScanLine, Star, Download,
} from 'lucide-react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    created_at: string;
    is_admin: boolean;
    is_unlimited: boolean;
    is_agency: boolean;
    status: string | null;
    total_crawls: number;
    month_crawls: number;
    distinct_sites: number;
    avg_score: number | null;
    last_crawl_at: string | null;
}

interface Stats {
    total_users: number;
    subscribed: number;
    unlimited: number;
    month_crawls: number;
    total_crawls: number;
    open_tickets: number;
}

interface Props extends PageProps {
    users: PaginatedData<UserRow>;
    stats: Stats;
    search: string;
}

function StatCard({ icon: Icon, label, value, sub, color = 'violet' }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
}) {
    const colors: Record<string, string> = {
        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        blue:    'bg-blue-500/10   border-blue-500/20   text-blue-400',
        amber:   'bg-amber-500/10  border-amber-500/20  text-amber-400',
        rose:    'bg-rose-500/10   border-rose-500/20   text-rose-400',
        sky:     'bg-sky-500/10    border-sky-500/20    text-sky-400',
    };
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border ${colors[color]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{label}</div>
            {sub && <div className="mt-1 text-xs text-gray-600">{sub}</div>}
        </div>
    );
}

function statusBadge(status: string | null, is_unlimited: boolean) {
    if (is_unlimited) return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400"><Infinity className="h-3 w-3" />Unlimited</span>;
    if (status === 'active')   return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Active</span>;
    if (status === 'on_trial') return <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-400">Trial</span>;
    if (status === 'past_due') return <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">Past due</span>;
    if (status === 'cancelled' || status === 'paused') return <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">{status}</span>;
    return <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">Free</span>;
}

function scoreColor(score: number | null) {
    if (score === null) return 'text-gray-600';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
}

export default function AdminUsersIndex({ users, stats, search: initSearch }: Props) {
    const [search, setSearch] = useState(initSearch);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/users', { search }, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="User Management" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Platform-wide overview of all users and their activity</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard icon={Users}    label="Total users"      value={stats.total_users}   color="violet" />
                    <StatCard icon={CheckCircle2} label="Subscribed"   value={stats.subscribed}    color="emerald" />
                    <StatCard icon={Infinity}  label="Unlimited"        value={stats.unlimited}     color="blue" />
                    <StatCard icon={ScanLine}  label="Crawls this month" value={stats.month_crawls} color="sky" />
                    <StatCard icon={BarChart2} label="Total crawls"    value={stats.total_crawls}   color="amber" />
                    <StatCard icon={Ticket}    label="Open tickets"    value={stats.open_tickets}   color="rose" />
                </div>

                {/* Table */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">All Users</h2>
                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search users…"
                                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-8 pr-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-600 focus:border-violet-500 focus:outline-none w-56"
                                />
                            </form>
                            <a
                                href="/admin/users/export"
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <Download className="h-3.5 w-3.5" /> Export CSV
                            </a>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500">
                                    <th className="px-5 py-3 text-left font-medium">User</th>
                                    <th className="px-4 py-3 text-left font-medium">Plan</th>
                                    <th className="px-4 py-3 text-right font-medium">Sites</th>
                                    <th className="px-4 py-3 text-right font-medium">Total crawls</th>
                                    <th className="px-4 py-3 text-right font-medium">This month</th>
                                    <th className="px-4 py-3 text-right font-medium">Avg score</th>
                                    <th className="px-4 py-3 text-right font-medium">Last crawl</th>
                                    <th className="px-4 py-3 text-center font-medium">Flags</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                                {users.data.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-100/40 dark:hover:bg-gray-100/40 dark:bg-gray-800/40 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                            <div className="text-xs text-gray-600 mt-0.5">
                                                Joined {new Date(u.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">{statusBadge(u.status, u.is_unlimited)}</td>
                                        <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">{u.distinct_sites ?? 0}</td>
                                        <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">{u.total_crawls ?? 0}</td>
                                        <td className="px-4 py-3.5 text-right text-gray-700 dark:text-gray-300">{u.month_crawls ?? 0}</td>
                                        <td className={`px-4 py-3.5 text-right font-semibold ${scoreColor(u.avg_score)}`}>
                                            {u.avg_score !== null ? `${u.avg_score}` : '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-right text-xs text-gray-500">
                                            {u.last_crawl_at ? new Date(u.last_crawl_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {u.is_admin && (
                                                    <span title="Admin"><ShieldCheck className="h-3.5 w-3.5 text-violet-400" /></span>
                                                )}
                                                {u.is_agency && (
                                                    <span title="Agency"><Star className="h-3.5 w-3.5 text-amber-400" /></span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <Link
                                                href={`/admin/users/${u.id}`}
                                                className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            >
                                                View <ChevronRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-sm text-gray-600">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {(users.prev_page_url || users.next_page_url) && (
                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-5 py-3">
                            <span className="text-xs text-gray-500">
                                {users.from}–{users.to} of {users.total} users
                            </span>
                            <div className="flex gap-2">
                                {users.prev_page_url && (
                                    <Link href={users.prev_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors">
                                        Previous
                                    </Link>
                                )}
                                {users.next_page_url && (
                                    <Link href={users.next_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors">
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
