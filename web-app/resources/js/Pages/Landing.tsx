import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Zap, Search, Lock, ArrowRight, CheckCircle2, AlertTriangle,
    Shield, Globe, FileText, Calendar, Activity, ShoppingBag,
    BarChart2, Loader2, XCircle, RefreshCw, Mail, Clock,
    History, LayoutDashboard, Building2,
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

export default function Landing({ alreadyScanned }: { alreadyScanned: boolean }) {
    const { t } = useTranslation();

    const CATEGORY_META = [
        { key: 'seo',              label: t('landing.catSeo'),           icon: Search      },
        { key: 'security',         label: t('landing.catSecurity'),      icon: Shield      },
        { key: 'performance',      label: t('landing.catPerformance'),   icon: Activity    },
        { key: 'broken_resources', label: t('landing.catBroken'),        icon: XCircle     },
        { key: 'accessibility',    label: t('landing.catAccessibility'), icon: Globe       },
        { key: 'catalog',          label: t('landing.catEcommerce'),     icon: ShoppingBag },
        { key: 'tracking',         label: t('landing.catTracking'),      icon: BarChart2   },
    ];

    const FEATURES = [
        { icon: FileText,       title: t('landing.featFullReport'),  desc: t('landing.featFullReportDesc')  },
        { icon: FileText,       title: t('landing.featPdf'),         desc: t('landing.featPdfDesc')         },
        { icon: Calendar,       title: t('landing.featScheduled'),   desc: t('landing.featScheduledDesc')   },
        { icon: Clock,          title: t('landing.featIntervals'),   desc: t('landing.featIntervalsDesc')   },
        { icon: Mail,           title: t('landing.featEmail'),       desc: t('landing.featEmailDesc')       },
        { icon: History,        title: t('landing.featHistory'),     desc: t('landing.featHistoryDesc')     },
        { icon: LayoutDashboard,title: t('landing.featMultisite'),   desc: t('landing.featMultisiteDesc')   },
        { icon: Building2,      title: t('landing.featAgency'),      desc: t('landing.featAgencyDesc')      },
    ];

    const scoreStyle = (score: number) => {
        if (score >= 70) return {
            ring: 'border-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10',
            badge: t('landing.badgeGood'), summary: t('landing.summaryGood'),
        };
        if (score >= 40) return {
            ring: 'border-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10',
            badge: t('landing.badgeWork'), summary: t('landing.summaryWork'),
        };
        return {
            ring: 'border-red-400', text: 'text-red-400', bg: 'bg-red-400/10',
            badge: t('landing.badgeCritical'), summary: t('landing.summaryCritical'),
        };
    };

    const [phase, setPhase]     = useState<'idle' | 'scanning' | 'done' | 'blocked'>(alreadyScanned ? 'blocked' : 'idle');
    const [siteUrl, setSiteUrl] = useState('');
    const [uuid, setUuid]       = useState<string | null>(null);
    const [report, setReport]   = useState<GuestReport | null>(null);
    const [error, setError]     = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    useEffect(() => {
        if (!uuid) return;
        const poll = async () => {
            try {
                const res = await fetch(`/scan/${uuid}/status`);
                if (!res.ok) return;
                const data: GuestReport = await res.json();
                setReport(data);
                if (data.status === 'completed' || data.status === 'failed') {
                    setPhase('done');
                    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                }
            } catch { /* retry next tick */ }
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
                setError(data.errors?.site_url?.[0] ?? t('landing.errInvalidUrl'));
                setPhase('idle');
                return;
            }
            if (!res.ok) { setError(t('landing.errGeneric')); setPhase('idle'); return; }
            const data = await res.json();
            setUuid(data.uuid);
        } catch {
            setError(t('landing.errConnection'));
            setPhase('idle');
        }
    }

    const progressPct = report ? Math.round((report.progress.completed / report.progress.total) * 100) : 0;

    const RegisterCTA = ({ className = '' }: { className?: string }) => (
        <Link
            href="/register"
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3.5 text-base font-semibold text-white transition-colors ${className}`}
        >
            {t('landing.ctaBtn')}
            <ArrowRight className="h-4 w-4" />
        </Link>
    );

    return (
        <>
            <Head title="4uTest — Free Website Audit in 30 Seconds" />

            {/* Nav */}
            <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-3.5 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-white tracking-tight">4u<span className="text-violet-400">test</span></span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/login" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">
                        {t('landing.navSignIn')}
                    </Link>
                    <Link href="/register" className="text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors">
                        {t('landing.navGetStarted')}
                    </Link>
                </div>
            </nav>

            <div className="min-h-screen bg-gray-950 text-white">

                {/* ── IDLE / SCANNING ─────────────────────────────── */}
                {(phase === 'idle' || phase === 'scanning') && (
                    <section className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-12">
                        <div className="w-full max-w-2xl text-center">
                            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                                <Zap className="h-3 w-3" />
                                {t('landing.badge')}
                            </div>
                            <h1 className="mb-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                                {t('landing.headline1')}<br />
                                <span className="text-violet-400">{t('landing.headline2')}</span> {t('landing.headline3')}
                            </h1>
                            <p className="mb-10 text-gray-400 text-lg max-w-lg mx-auto">
                                {t('landing.sub')}
                            </p>

                            <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                                <div className="relative flex-1">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                                    <input
                                        type="url"
                                        value={siteUrl}
                                        onChange={e => setSiteUrl(e.target.value)}
                                        placeholder={t('landing.placeholder')}
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
                                        ? <><Loader2 className="h-4 w-4 animate-spin" />{t('landing.scanning')}</>
                                        : <><Search className="h-4 w-4" />{t('landing.scanBtn')}</>
                                    }
                                </button>
                            </form>

                            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

                            {phase === 'scanning' && (
                                <div className="mt-8 max-w-xl mx-auto">
                                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                                        <span>{t('landing.progressLabel', { done: report?.progress.completed ?? 0 })}</span>
                                        <span>{progressPct}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-800">
                                        <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${Math.max(progressPct, 4)}%` }} />
                                    </div>
                                    <p className="mt-3 text-xs text-gray-600">{t('landing.progressChecking')}</p>
                                </div>
                            )}

                            {phase === 'idle' && (
                                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gray-700" />{t('landing.trustNoAccount')}</span>
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gray-700" />{t('landing.trust1scan')}</span>
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-gray-700" />{t('landing.trustTime')}</span>
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
                        <section className="pt-24 pb-20 px-4">
                            <div className="max-w-2xl mx-auto">

                                {/* Score circle */}
                                <p className="text-center text-sm text-gray-500 mb-5 truncate">{report.site_url}</p>
                                <div className="flex flex-col items-center mb-8">
                                    <div className={`flex flex-col items-center justify-center h-44 w-44 rounded-full border-4 ${style.ring} ${style.bg}`}>
                                        <span className={`text-6xl font-extrabold tabular-nums ${style.text}`}>{score}</span>
                                        <span className="text-gray-400 text-sm">/100</span>
                                    </div>
                                    <span className={`mt-3 inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} border ${style.ring}`}>
                                        {style.badge}
                                    </span>
                                    <p className="mt-3 text-gray-400 text-sm text-center max-w-sm">{style.summary}</p>
                                </div>

                                {/* Issues teaser */}
                                {issues > 0 && (
                                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                                        <span className="text-sm text-amber-200">
                                            {issues === 1
                                                ? t('landing.issuesTeaserOne')
                                                : t('landing.issuesTeaserMany', { n: issues })
                                            }
                                            {' '}{t('landing.issuesTeaserCta')}
                                        </span>
                                    </div>
                                )}

                                {/* Category grid — locked */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
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
                                                <div className="space-y-1.5">
                                                    <div className="h-2.5 rounded bg-gray-700/60 blur-sm w-3/4" />
                                                    <div className="h-2.5 rounded bg-gray-700/40 blur-sm w-1/2" />
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60 backdrop-blur-[1px]">
                                                    <div className="flex items-center gap-1.5 rounded-lg bg-gray-900 border border-gray-700 px-3 py-1.5">
                                                        <Lock className="h-3 w-3 text-violet-400" />
                                                        <span className="text-xs text-gray-400">{t('landing.categoryUnlock')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Locked issues list */}
                                {issues > 0 && (
                                    <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                                            <span className="text-sm font-medium text-gray-300">{t('landing.issuesTitle', { n: issues })}</span>
                                            <Lock className="h-3.5 w-3.5 text-gray-600" />
                                        </div>
                                        <div className="relative">
                                            <ul className="divide-y divide-gray-800/50 blur-sm select-none pointer-events-none">
                                                {report.deductions.slice(0, 5).map((d, i) => (
                                                    <li key={i} className="px-4 py-2.5 text-sm text-gray-400 truncate">{d}</li>
                                                ))}
                                                {issues > 5 && (
                                                    <li className="px-4 py-2.5 text-sm text-gray-500">+{issues - 5} more…</li>
                                                )}
                                            </ul>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-700 px-4 py-2 shadow-lg">
                                                    <Lock className="h-4 w-4 text-violet-400" />
                                                    <span className="text-sm text-white font-medium">{t('landing.issuesCta')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── FEATURES SECTION ─────────────────────── */}
                                <div className="mb-10">
                                    <h2 className="text-xl font-bold text-center text-white mb-1">
                                        {t('landing.featuresHeadline')}
                                    </h2>
                                    <p className="text-center text-sm text-gray-500 mb-7">
                                        {t('landing.featuresSubheadline')}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                        {FEATURES.map((f, i) => {
                                            const Icon = f.icon;
                                            return (
                                                <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                                                        <Icon className="h-4 w-4 text-violet-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                                                        <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Mid-page CTA */}
                                    <div className="text-center">
                                        <RegisterCTA />
                                    </div>
                                </div>

                                {/* How intervals work — visual strip */}
                                <div className="mb-10 rounded-xl border border-gray-800 bg-gray-900/40 px-5 py-5">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
                                        {t('landing.featIntervals')}
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['Hourly', 'Daily', 'Weekly', 'Monthly'] as const).map(label => (
                                            <div key={label} className="flex flex-col items-center rounded-lg border border-gray-700 bg-gray-800/60 py-3">
                                                <Clock className="h-4 w-4 text-violet-400 mb-1.5" />
                                                <span className="text-xs font-medium text-gray-300">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                                        <Mail className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-600" />
                                        <span>{t('landing.featEmailDesc')}</span>
                                    </div>
                                </div>

                                {/* Final CTA card */}
                                <div className="rounded-2xl border border-violet-500/30 bg-violet-600/10 p-7 text-center">
                                    <h2 className="text-2xl font-bold text-white mb-2">{t('landing.ctaTitle')}</h2>
                                    <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">{t('landing.ctaSub')}</p>
                                    <RegisterCTA className="w-full sm:w-auto" />
                                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
                                        <span className="flex items-center justify-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {t('landing.featPdf')}</span>
                                        <span className="flex items-center justify-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {t('landing.featScheduled')}</span>
                                        <span className="flex items-center justify-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {t('landing.featEmail')}</span>
                                        <span className="flex items-center justify-center gap-1.5"><History className="h-3.5 w-3.5" /> {t('landing.featHistory')}</span>
                                    </div>
                                </div>

                                <p className="mt-5 text-center text-sm text-gray-600">
                                    {t('landing.ctaFooter')}{' '}
                                    <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                                        {t('landing.ctaSignIn')}
                                    </Link>
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
                            <h2 className="text-2xl font-bold text-white mb-3">{t('landing.blockedTitle')}</h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">{t('landing.blockedBody')}</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors">
                                    {t('landing.blockedCta')} <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 hover:border-gray-600 bg-gray-900 hover:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-300 transition-colors">
                                    {t('landing.blockedSignIn')}
                                </Link>
                            </div>

                            {/* Features teaser even for blocked users */}
                            <div className="mt-10 text-left space-y-3">
                                {FEATURES.slice(0, 4).map((f, i) => {
                                    const Icon = f.icon;
                                    return (
                                        <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                                            <Icon className="h-4 w-4 shrink-0 text-violet-400" />
                                            <div>
                                                <span className="text-sm font-medium text-gray-300">{f.title}</span>
                                                <span className="ml-2 text-xs text-gray-600">{f.desc}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="mt-6 text-xs text-gray-700 flex items-center justify-center gap-1.5">
                                <RefreshCw className="h-3 w-3" />
                                {t('landing.blockedReset')}
                            </p>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
