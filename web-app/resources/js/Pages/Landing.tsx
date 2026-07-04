import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Zap, Search, Lock, ArrowRight, CheckCircle2, AlertTriangle,
    Shield, Globe, FileText, Calendar, Activity, ShoppingBag,
    BarChart2, Loader2, XCircle, RefreshCw,
} from 'lucide-react';

interface GuestReport {
    status: string;
    health_score: number | null;
    site_url: string;
    progress: { completed: number; total: number };
    deductions: string[];
    categories: {
        seo: boolean;
        security: boolean;
        performance: boolean;
        broken_resources: boolean;
        accessibility: boolean;
        catalog: boolean;
        tracking: boolean;
    };
}

const CATEGORY_META = [
    { key: 'seo',              label: 'SEO & Schema',        icon: Search,      color: 'violet' },
    { key: 'security',         label: 'Security',            icon: Shield,      color: 'red'    },
    { key: 'performance',      label: 'Performance',         icon: Activity,    color: 'amber'  },
    { key: 'broken_resources', label: 'Broken Links',        icon: XCircle,     color: 'orange' },
    { key: 'accessibility',    label: 'Accessibility',       icon: Globe,       color: 'blue'   },
    { key: 'catalog',          label: 'E-commerce',          icon: ShoppingBag, color: 'emerald'},
    { key: 'tracking',         label: 'Marketing Tracking',  icon: BarChart2,   color: 'pink'   },
];

function scoreStyle(score: number) {
    if (score >= 70) return { ring: 'border-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10', badge: 'Good', summary: "Your site is in decent shape. There are still improvements that could boost traffic and conversions." };
    if (score >= 40) return { ring: 'border-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/10',   badge: 'Needs Work', summary: "Several issues are holding your site back. Fixing them could significantly improve rankings and user experience." };
    return               { ring: 'border-red-400',     text: 'text-red-400',     bg: 'bg-red-400/10',     badge: 'Critical', summary: "Serious problems detected. These issues are actively costing you traffic, trust, and revenue." };
}

export default function Landing({ alreadyScanned }: { alreadyScanned: boolean }) {
    const [phase, setPhase]   = useState<'idle' | 'scanning' | 'done' | 'blocked'>(alreadyScanned ? 'blocked' : 'idle');
    const [siteUrl, setSiteUrl] = useState('');
    const [uuid, setUuid]     = useState<string | null>(null);
    const [report, setReport] = useState<GuestReport | null>(null);
    const [error, setError]   = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    useEffect(() => {
        if (!uuid) return;

        const poll = async () => {
            try {
                const res = await fetch(`/scan/${uuid}/status`);
                if (!res.ok) return;
                const data: GuestReport = await res.json();
                if (data.status === 'completed' || data.status === 'failed') {
                    setReport(data);
                    setPhase('done');
                    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                } else {
                    // update progress while scanning
                    setReport(data);
                }
            } catch { /* network blip — retry next tick */ }
        };

        pollRef.current = setInterval(poll, 2000);
        poll();
        return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
    }, [uuid]);

    async function handleScan(e: React.FormEvent) {
        e.preventDefault();
        const url = siteUrl.trim();
        if (!url) return;

        setPhase('scanning');
        setError(null);

        try {
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch('/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ site_url: url }),
            });

            if (res.status === 429) { setPhase('blocked'); return; }

            if (res.status === 422) {
                const data = await res.json();
                setError(data.errors?.site_url?.[0] ?? 'Enter a valid public URL.');
                setPhase('idle');
                return;
            }

            if (!res.ok) { setError('Something went wrong. Please try again.'); setPhase('idle'); return; }

            const data = await res.json();
            setUuid(data.uuid);
        } catch {
            setError('Connection error. Please try again.');
            setPhase('idle');
        }
    }

    const progressPct = report ? Math.round((report.progress.completed / report.progress.total) * 100) : 0;

    return (
        <>
            <Head title="4uTest — Free Website Audit in 30 Seconds" />

            {/* Sticky nav */}
            <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-3.5 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-white tracking-tight">4u<span className="text-violet-400">test</span></span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/login" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
                    <Link href="/register" className="text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors">
                        Get Started Free
                    </Link>
                </div>
            </nav>

            <div className="min-h-screen bg-gray-950 text-white">

                {/* ── IDLE / SCANNING ─────────────────────────────── */}
                {(phase === 'idle' || phase === 'scanning') && (
                    <section className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-12">
                        <div className="w-full max-w-2xl text-center">
                            {/* Badge */}
                            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                                <Zap className="h-3 w-3" />
                                7 audits · 30 seconds · free
                            </div>

                            <h1 className="mb-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                                Drop your URL.<br />
                                <span className="text-violet-400">See what's broken</span> in 30 seconds.
                            </h1>
                            <p className="mb-10 text-gray-400 text-lg max-w-lg mx-auto">
                                SEO, security, performance, broken links, accessibility — all in one free scan. No account needed.
                            </p>

                            {/* URL form */}
                            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                                <div className="relative flex-1">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                    <input
                                        type="url"
                                        value={siteUrl}
                                        onChange={e => setSiteUrl(e.target.value)}
                                        placeholder="https://yoursite.com"
                                        disabled={phase === 'scanning'}
                                        required
                                        className="w-full rounded-xl border border-gray-700 bg-gray-900 pl-12 pr-4 py-4 text-base text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={phase === 'scanning'}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed px-6 py-4 text-base font-semibold text-white transition-colors whitespace-nowrap"
                                >
                                    {phase === 'scanning'
                                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning…</>
                                        : <><Search className="h-4 w-4" /> Scan for Free</>
                                    }
                                </button>
                            </form>

                            {error && (
                                <p className="mt-3 text-sm text-red-400">{error}</p>
                            )}

                            {/* Progress bar while scanning */}
                            {phase === 'scanning' && (
                                <div className="mt-8 max-w-xl mx-auto">
                                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                                        <span>Running {report?.progress.completed ?? 0} of 7 auditors…</span>
                                        <span>{progressPct}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-800">
                                        <div
                                            className="h-full rounded-full bg-violet-500 transition-all duration-700"
                                            style={{ width: `${Math.max(progressPct, 4)}%` }}
                                        />
                                    </div>
                                    <p className="mt-3 text-xs text-gray-600">
                                        Checking SEO · Security · Performance · Broken links · Accessibility · E-commerce · Tracking
                                    </p>
                                </div>
                            )}

                            {/* Trust strip */}
                            {phase === 'idle' && (
                                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gray-700" /> No account needed</span>
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gray-700" /> 1 free scan per visitor</span>
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gray-700" /> Results in ~30 seconds</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── RESULTS ─────────────────────────────────────── */}
                {phase === 'done' && report && (() => {
                    const score  = report.health_score ?? 0;
                    const style  = scoreStyle(score);
                    const issues = report.deductions.length;

                    return (
                        <section className="min-h-screen pt-24 pb-16 px-4">
                            <div className="max-w-2xl mx-auto">
                                {/* Site label */}
                                <p className="text-center text-sm text-gray-500 mb-6 truncate">
                                    {report.site_url}
                                </p>

                                {/* Score circle */}
                                <div className="flex flex-col items-center mb-8">
                                    <div className={`flex flex-col items-center justify-center h-44 w-44 rounded-full border-4 ${style.ring} ${style.bg}`}>
                                        <span className={`text-6xl font-extrabold tabular-nums ${style.text}`}>{score}</span>
                                        <span className="text-gray-400 text-sm">/100</span>
                                    </div>
                                    <span className={`mt-3 inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} border ${style.ring.replace('border-', 'border-')}`}>
                                        {style.badge}
                                    </span>
                                    <p className="mt-3 text-gray-400 text-sm text-center max-w-sm">{style.summary}</p>
                                </div>

                                {/* Issue count teaser */}
                                <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                                    <span className="text-sm text-amber-200">
                                        We found <strong>{issues}</strong> issue{issues !== 1 ? 's' : ''} affecting your site's score.
                                        Create a free account to see all of them.
                                    </span>
                                </div>

                                {/* Category grid — all locked */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                    {CATEGORY_META.map(cat => {
                                        const Icon = cat.icon;
                                        const done = report.categories[cat.key as keyof typeof report.categories];
                                        return (
                                            <div key={cat.key} className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-800">
                                                        <Icon className="h-3.5 w-3.5 text-gray-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-300">{cat.label}</span>
                                                    {done && <CheckCircle2 className="h-3.5 w-3.5 text-gray-600 ml-auto" />}
                                                </div>
                                                {/* Blurred fake content */}
                                                <div className="space-y-1.5">
                                                    <div className="h-2.5 rounded bg-gray-700/60 blur-sm w-3/4" />
                                                    <div className="h-2.5 rounded bg-gray-700/40 blur-sm w-1/2" />
                                                </div>
                                                {/* Lock overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60 backdrop-blur-[1px]">
                                                    <div className="flex items-center gap-1.5 rounded-lg bg-gray-900 border border-gray-700 px-3 py-1.5">
                                                        <Lock className="h-3 w-3 text-violet-400" />
                                                        <span className="text-xs text-gray-400">Sign up to unlock</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Locked deductions list */}
                                {issues > 0 && (
                                    <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                                            <span className="text-sm font-medium text-gray-300">Issues found ({issues})</span>
                                            <Lock className="h-3.5 w-3.5 text-gray-600" />
                                        </div>
                                        <div className="relative">
                                            <ul className="divide-y divide-gray-800/50 blur-sm select-none pointer-events-none">
                                                {report.deductions.slice(0, 5).map((d, i) => (
                                                    <li key={i} className="px-4 py-2.5 text-sm text-gray-400 truncate">{d}</li>
                                                ))}
                                                {issues > 5 && (
                                                    <li className="px-4 py-2.5 text-sm text-gray-500">+{issues - 5} more issues…</li>
                                                )}
                                            </ul>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-700 px-4 py-2 shadow-lg">
                                                    <Lock className="h-4 w-4 text-violet-400" />
                                                    <span className="text-sm text-white font-medium">Create a free account to see all issues</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CTA card */}
                                <div className="rounded-2xl border border-violet-500/30 bg-violet-600/10 p-6 text-center">
                                    <h2 className="text-xl font-bold text-white mb-2">See the full report — it's free</h2>
                                    <p className="text-gray-400 text-sm mb-5">
                                        Get the complete breakdown, download a PDF, and keep monitoring your site every month.
                                    </p>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3.5 text-base font-semibold text-white transition-colors"
                                    >
                                        Create Free Account
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> PDF export</span>
                                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Monthly monitoring</span>
                                        <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Scheduled scans</span>
                                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> 100% free to start</span>
                                    </div>
                                </div>

                                {/* Already have account */}
                                <p className="mt-5 text-center text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in to view your reports</Link>
                                </p>
                            </div>
                        </section>
                    );
                })()}

                {/* ── BLOCKED ─────────────────────────────────────── */}
                {phase === 'blocked' && (
                    <section className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-12 text-center">
                        <div className="w-full max-w-md">
                            <div className="mb-6 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/20">
                                <AlertTriangle className="h-8 w-8 text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">You've used your free scan</h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Each visitor gets one free scan. Create a free account to unlock unlimited scans,
                                PDF exports, and monthly monitoring.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
                                >
                                    Create Free Account
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 hover:border-gray-600 bg-gray-900 hover:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-300 transition-colors"
                                >
                                    Sign In
                                </Link>
                            </div>
                            <p className="mt-6 text-xs text-gray-700 flex items-center justify-center gap-1.5">
                                <RefreshCw className="h-3 w-3" />
                                Free scans reset after 30 days
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
