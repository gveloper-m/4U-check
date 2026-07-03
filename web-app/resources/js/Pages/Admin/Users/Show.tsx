import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
    ArrowLeft, ShieldCheck, Infinity, Star, Globe, ScanLine, BarChart2,
    TrendingUp, Ticket, CreditCard, Calendar, Clock, CheckCircle2,
    XCircle, AlertTriangle, ChevronRight, Loader2, ExternalLink,
    Gift, Mail,
} from 'lucide-react';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    phone?: string;
    company_name?: string;
    company_site?: string;
    is_admin: boolean;
    is_unlimited: boolean;
    is_agency: boolean;
    created_at: string;
    email_verified_at: string | null;
    stats: {
        total_crawls: number;
        month_crawls: number;
        distinct_sites: number;
        avg_score: number;
        open_tickets: number;
    };
}

interface Subscription {
    status: string;
    trial_ends_at: string | null;
    next_billed_at: string | null;
    canceled_at: string | null;
    plan: 'monthly' | 'yearly';
}

interface MonthlyCrawl {
    month: string;
    count: number;
}

interface TopSite {
    site_url: string;
    crawls: number;
    avg_score: number;
    last_crawl: string;
}

interface RecentReport {
    id: number;
    site_url: string;
    name: string | null;
    health_score: number | null;
    status: string;
    created_at: string;
}

interface Props extends PageProps {
    adminUser: AdminUser;
    subscription: Subscription | null;
    monthlyCrawls: MonthlyCrawl[];
    topSites: TopSite[];
    recentReports: RecentReport[];
}

function scoreColor(score: number | null) {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
}

function scoreBg(score: number | null) {
    if (score === null) return 'bg-gray-200 dark:bg-gray-700';
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
}

function SubscriptionBadge({ sub, unlimited }: { sub: Subscription | null; unlimited: boolean }) {
    if (unlimited) return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-sm font-medium text-emerald-400">
            <Infinity className="h-4 w-4" /> Unlimited
        </span>
    );
    if (!sub) return (
        <span className="rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">Free</span>
    );
    const map: Record<string, string> = {
        active:    'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        trialing:  'bg-violet-500/15 border-violet-500/30 text-violet-400',
        past_due:  'bg-amber-500/15 border-amber-500/30 text-amber-400',
        canceled: 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400',
        paused:    'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400',
        expired:   'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400',
    };
    const cls = map[sub.status] ?? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400';
    return (
        <span className={`rounded-full border px-3 py-1 text-sm font-medium capitalize ${cls}`}>
            {sub.status.replace('_', ' ')}
        </span>
    );
}

function BarChart({ data }: { data: MonthlyCrawl[] }) {
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end gap-2 h-28">
            {data.map(d => (
                <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.count || ''}</span>
                    <div className="w-full rounded-t-sm bg-violet-500/80" style={{ height: `${Math.max((d.count / max) * 80, d.count > 0 ? 4 : 0)}px` }} />
                    <span className="text-[10px] text-gray-600 text-center">{d.month.split(' ')[0]}</span>
                </div>
            ))}
        </div>
    );
}

export default function AdminUsersShow({ adminUser: u, subscription, monthlyCrawls, topSites, recentReports }: Props) {
    const [togglingAdmin, setTogglingAdmin] = useState(false);
    const [togglingUnlimited, setTogglingUnlimited] = useState(false);

    const crawlForm = useForm({ amount: '' });
    const emailForm = useForm({ subject: '', body: '' });

    const toggleAdmin = () => {
        setTogglingAdmin(true);
        router.post(`/admin/users/${u.id}/toggle-admin`, {}, {
            preserveScroll: true,
            onFinish: () => setTogglingAdmin(false),
        });
    };

    const toggleUnlimited = () => {
        setTogglingUnlimited(true);
        router.post(`/admin/users/${u.id}/toggle-unlimited`, {}, {
            preserveScroll: true,
            onFinish: () => setTogglingUnlimited(false),
        });
    };

    const formatDate = (ts?: number | string | null) => {
        if (!ts) return '—';
        const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <AppLayout>
            <Head title={`User: ${u.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/users" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> All users
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{u.name}</h1>
                                {u.is_admin && <span title="Admin"><ShieldCheck className="h-5 w-5 text-violet-400" /></span>}
                                {u.is_agency && <span title="Agency"><Star className="h-5 w-5 text-amber-400" /></span>}
                            </div>
                            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{u.email}</p>
                            {u.company_name && (
                                <p className="text-xs text-gray-500 mt-0.5">{u.company_name}{u.company_site ? ` — ${u.company_site}` : ''}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleUnlimited}
                            disabled={togglingUnlimited}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                        >
                            {togglingUnlimited ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Infinity className="h-3.5 w-3.5" />}
                            {u.is_unlimited ? 'Remove unlimited' : 'Grant unlimited'}
                        </button>
                        <button
                            onClick={toggleAdmin}
                            disabled={togglingAdmin}
                            className="flex items-center gap-1.5 rounded-lg border border-violet-700/50 bg-violet-600/10 px-3 py-2 text-sm text-violet-400 hover:bg-violet-600/20 disabled:opacity-50 transition-colors"
                        >
                            {togglingAdmin ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                            {u.is_admin ? 'Remove admin' : 'Make admin'}
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {[
                        { icon: ScanLine,  label: 'Total crawls',   value: u.stats.total_crawls,   color: 'text-violet-400' },
                        { icon: TrendingUp,label: 'This month',     value: u.stats.month_crawls,   color: 'text-sky-400' },
                        { icon: Globe,     label: 'Distinct sites', value: u.stats.distinct_sites, color: 'text-emerald-400' },
                        { icon: BarChart2, label: 'Avg score',      value: u.stats.avg_score || '—', color: scoreColor(u.stats.avg_score) },
                        { icon: Ticket,    label: 'Open tickets',   value: u.stats.open_tickets,   color: u.stats.open_tickets > 0 ? 'text-rose-400' : 'text-gray-500' },
                    ].map(s => (
                        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                            <s.icon className={`mb-2 h-5 w-5 ${s.color}`} />
                            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left col (2/3) */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* 6-month bar chart */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Crawls — last 6 months</h2>
                            <BarChart data={monthlyCrawls} />
                        </div>

                        {/* Top sites */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-3">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Top crawled sites</h2>
                            </div>
                            <div className="divide-y divide-gray-800/60">
                                {topSites.length === 0 && (
                                    <p className="py-8 text-center text-sm text-gray-600">No crawls yet.</p>
                                )}
                                {topSites.map((s, i) => (
                                    <div key={s.site_url} className="flex items-center gap-4 px-5 py-3">
                                        <span className="w-5 text-xs text-gray-600 text-right">{i + 1}</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm text-gray-800 dark:text-gray-200">{s.site_url}</div>
                                            <div className="text-xs text-gray-500">Last: {formatDate(s.last_crawl)}</div>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{s.crawls} crawls</div>
                                        <div className={`text-sm font-semibold ${scoreColor(s.avg_score)}`}>
                                            {s.avg_score ?? '—'}
                                        </div>
                                        {/* score bar */}
                                        <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                                            <div className={`h-1.5 rounded-full ${scoreBg(s.avg_score)}`} style={{ width: `${s.avg_score ?? 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent reports */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-3">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent reports</h2>
                            </div>
                            <div className="divide-y divide-gray-800/60">
                                {recentReports.length === 0 && (
                                    <p className="py-8 text-center text-sm text-gray-600">No reports yet.</p>
                                )}
                                {recentReports.map(r => (
                                    <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm text-gray-800 dark:text-gray-200">{r.name || r.site_url}</div>
                                            <div className="text-xs text-gray-500 truncate">{r.site_url}</div>
                                        </div>
                                        <div className={`text-sm font-semibold ${scoreColor(r.health_score)}`}>
                                            {r.health_score ?? '—'}
                                        </div>
                                        <div className="text-xs text-gray-500">{formatDate(r.created_at)}</div>
                                        <Link
                                            href={`/audits/${r.id}`}
                                            className="text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right col (1/3) */}
                    <div className="space-y-4">
                        {/* Account info */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Account</h2>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-xs text-gray-500">Joined</dt>
                                    <dd className="text-gray-700 dark:text-gray-300">{formatDate(u.created_at)}</dd>
                                </div>
                                {u.phone && (
                                    <div>
                                        <dt className="text-xs text-gray-500">Phone</dt>
                                        <dd className="text-gray-700 dark:text-gray-300">{u.phone}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-xs text-gray-500">Email verified</dt>
                                    <dd className="flex items-center gap-1">
                                        {u.email_verified_at
                                            ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Verified</span></>
                                            : <><XCircle className="h-3.5 w-3.5 text-rose-400" /><span className="text-rose-400">Not verified</span></>
                                        }
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-gray-500">Roles</dt>
                                    <dd className="flex flex-wrap gap-1.5 mt-0.5">
                                        {u.is_admin && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-400">Admin</span>}
                                        {u.is_agency && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">Agency</span>}
                                        {!u.is_admin && !u.is_agency && <span className="text-xs text-gray-500">Standard</span>}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Subscription */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Subscription</h2>
                                <SubscriptionBadge sub={subscription} unlimited={u.is_unlimited} />
                            </div>
                            {subscription ? (
                                <dl className="space-y-3 text-sm">
                                    <div>
                                        <dt className="text-xs text-gray-500">Billing cycle</dt>
                                        <dd className="capitalize text-gray-700 dark:text-gray-300">{subscription.plan}</dd>
                                    </div>
                                    {subscription.next_billed_at && (
                                        <div>
                                            <dt className="text-xs text-gray-500">Renews on</dt>
                                            <dd className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                                <Calendar className="h-3 w-3 text-gray-500" />
                                                {formatDate(subscription.next_billed_at)}
                                            </dd>
                                        </div>
                                    )}
                                    {subscription.trial_ends_at && (
                                        <div>
                                            <dt className="text-xs text-gray-500">Trial ends</dt>
                                            <dd className="flex items-center gap-1 text-violet-400">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(subscription.trial_ends_at)}
                                            </dd>
                                        </div>
                                    )}
                                    {subscription.canceled_at && (
                                        <div>
                                            <dt className="text-xs text-gray-500">Cancels on</dt>
                                            <dd className="flex items-center gap-1 text-amber-400">
                                                <AlertTriangle className="h-3 w-3" />
                                                {formatDate(subscription.canceled_at)}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            ) : (
                                <p className="text-xs text-gray-600">No active subscription</p>
                            )}
                        </div>

                        {/* Quick links */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Quick actions</h2>
                            <div className="space-y-2">
                                <Link
                                    href={`/admin/tickets?user=${u.id}`}
                                    className="flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    View tickets <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Grant extra crawls */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Gift className="h-4 w-4 text-violet-400" />
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Grant extra crawls</h2>
                            </div>
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    crawlForm.post(`/admin/users/${u.id}/grant-crawls`, {
                                        preserveScroll: true,
                                        onSuccess: () => crawlForm.reset(),
                                    });
                                }}
                                className="space-y-3"
                            >
                                <input
                                    type="number"
                                    min={1}
                                    max={9999}
                                    placeholder="Number of crawls…"
                                    value={crawlForm.data.amount}
                                    onChange={e => crawlForm.setData('amount', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-600 focus:border-violet-500 focus:outline-none"
                                />
                                {crawlForm.errors.amount && (
                                    <p className="text-xs text-rose-400">{crawlForm.errors.amount}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={crawlForm.processing || !crawlForm.data.amount}
                                    className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                                >
                                    {crawlForm.processing ? 'Granting…' : 'Grant crawls'}
                                </button>
                            </form>
                        </div>

                        {/* Send email */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-sky-400" />
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Send email</h2>
                            </div>
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    emailForm.post(`/admin/users/${u.id}/send-email`, {
                                        preserveScroll: true,
                                        onSuccess: () => emailForm.reset(),
                                    });
                                }}
                                className="space-y-3"
                            >
                                <input
                                    type="text"
                                    placeholder="Subject…"
                                    value={emailForm.data.subject}
                                    onChange={e => emailForm.setData('subject', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-600 focus:border-violet-500 focus:outline-none"
                                />
                                {emailForm.errors.subject && (
                                    <p className="text-xs text-rose-400">{emailForm.errors.subject}</p>
                                )}
                                <textarea
                                    rows={5}
                                    placeholder="Message…"
                                    value={emailForm.data.body}
                                    onChange={e => emailForm.setData('body', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none"
                                />
                                {emailForm.errors.body && (
                                    <p className="text-xs text-rose-400">{emailForm.errors.body}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={emailForm.processing || !emailForm.data.subject || !emailForm.data.body}
                                    className="w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
                                >
                                    {emailForm.processing ? 'Sending…' : 'Send email'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
