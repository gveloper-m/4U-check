import { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useTranslation } from 'react-i18next';
import CookieBanner from '@/Components/CookieBanner';
import {
    Zap, Search, Shield, BarChart3, Link2, ShoppingCart, Tag, Clock, Download,
    ArrowRight, CheckCircle2, XCircle, X, Accessibility, Bot, HelpCircle,
    Terminal, Server, AlertTriangle, Globe, FileText, Calendar, Activity,
    ShoppingBag, BarChart2, Loader2, Mail, History, LayoutDashboard, Building2,
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
    const { auth, flash } = usePage().props as PageProps & { flash?: { success?: string; error?: string } };

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [agentTooltip, setAgentTooltip] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle');
    const [siteUrl, setSiteUrl] = useState('');
    const [uuid, setUuid] = useState<string | null>(null);
    const [report, setReport] = useState<GuestReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (flash?.success) setToast({ message: flash.success, type: 'success' });
        else if (flash?.error) setToast({ message: flash.error, type: 'error' });
    }, [flash]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

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
            } catch { /* retry */ }
        };
        pollRef.current = setInterval(poll, 2000);
        poll();
        return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
    }, [uuid]);

    async function handleScan(e: React.FormEvent) {
        e.preventDefault();
        if (alreadyScanned) {
            setError(`${t('landing.alreadyUsed')} ${t('landing.alreadyUsedCta')}`);
            return;
        }
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
            if (res.status === 429) {
                setError(`${t('landing.alreadyUsed')} ${t('landing.alreadyUsedCta')}`);
                setPhase('idle');
                return;
            }
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

    const scoreStyle = (score: number) => {
        if (score >= 70) return { ring: 'border-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10', badge: t('landing.badgeGood'), summary: t('landing.summaryGood') };
        if (score >= 40) return { ring: 'border-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10', badge: t('landing.badgeWork'), summary: t('landing.summaryWork') };
        return { ring: 'border-red-400', text: 'text-red-400', bg: 'bg-red-400/10', badge: t('landing.badgeCritical'), summary: t('landing.summaryCritical') };
    };

    const features = [
        { icon: Search,       title: t('welcome.features.seo.title'),           desc: t('welcome.features.seo.desc'),           color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
        { icon: Shield,       title: t('welcome.features.security.title'),       desc: t('welcome.features.security.desc'),       color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
        { icon: BarChart3,    title: t('welcome.features.performance.title'),    desc: t('welcome.features.performance.desc'),    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { icon: Link2,        title: t('welcome.features.broken.title'),         desc: t('welcome.features.broken.desc'),         color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
        { icon: ShoppingCart, title: t('welcome.features.ecommerce.title'),      desc: t('welcome.features.ecommerce.desc'),      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
        { icon: Tag,          title: t('welcome.features.tracking.title'),       desc: t('welcome.features.tracking.desc'),       color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20'    },
        { icon: Accessibility,title: t('welcome.features.accessibility.title'),  desc: t('welcome.features.accessibility.desc'),  color: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20'    },
    ];

    const planFeatures = t('welcome.planFeatures', { returnObjects: true }) as string[];

    const CATEGORY_META = [
        { key: 'seo',              label: t('landing.catSeo'),           icon: Search      },
        { key: 'security',         label: t('landing.catSecurity'),      icon: Shield      },
        { key: 'performance',      label: t('landing.catPerformance'),   icon: Activity    },
        { key: 'broken_resources', label: t('landing.catBroken'),        icon: XCircle     },
        { key: 'accessibility',    label: t('landing.catAccessibility'), icon: Globe       },
        { key: 'catalog',          label: t('landing.catEcommerce'),     icon: ShoppingBag },
        { key: 'tracking',         label: t('landing.catTracking'),      icon: BarChart2   },
    ];

    const PREMIUM_FEATURES = [
        { icon: FileText,         text: t('landing.resultsPremiumPdf')       },
        { icon: History,          text: t('landing.resultsPremiumHistory')    },
        { icon: Calendar,         text: t('landing.resultsPremiumScheduled')  },
        { icon: Mail,             text: t('landing.resultsPremiumEmail')      },
        { icon: LayoutDashboard,  text: t('landing.resultsPremiumMultisite')  },
        { icon: Building2,        text: t('landing.resultsPremiumAgency')     },
    ];

    return (
        <>
            <Head title="4uTest — Website Audit Platform" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

                {/* Navbar */}
                <header className="fixed top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                                <Zap className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                                4u<span className="text-violet-400">test</span>
                            </span>
                        </div>
                        <nav className="flex items-center gap-3">
                            <Link
                                href="/pricing"
                                className="rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                {t('welcome.pricingNav')}
                            </Link>
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                                >
                                    {t('nav.dashboard')} <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        {t('welcome.signin')}
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                                    >
                                        {t('welcome.getStarted')}
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="pt-32 pb-24 px-6">
                    <div className="mx-auto max-w-4xl text-center">
                        <p className="mb-5 text-sm font-medium text-violet-600 dark:text-violet-400">
                            {auth.user ? t('welcome.badge') : t('landing.badge')}
                        </p>
                        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
                            {auth.user ? (
                                <>
                                    {t('welcome.headline1')}{' '}
                                    <span className="text-violet-600 dark:text-violet-400">
                                        {t('welcome.headline2')}
                                    </span>{' '}
                                    {t('welcome.headline3')}
                                </>
                            ) : (
                                <>
                                    {t('landing.headline1')}<br />
                                    <span className="text-violet-600 dark:text-violet-400">
                                        {t('landing.headline2')}
                                    </span>{' '}
                                    {t('landing.headline3')}
                                </>
                            )}
                        </h1>
                        <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            {auth.user ? t('welcome.sub') : t('landing.sub')}
                        </p>

                        {auth.user ? (
                            /* Authenticated: Dashboard CTA */
                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-4 text-base font-semibold text-white hover:bg-violet-500 transition-colors"
                                >
                                    {t('nav.dashboard')} <ArrowRight className="h-5 w-5" />
                                </Link>
                                <Link
                                    href="/audits"
                                    className="rounded-lg border border-gray-300 dark:border-gray-700 px-8 py-4 text-base font-medium text-gray-700 dark:text-gray-300 hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    {t('welcome.cta')}
                                </Link>
                            </div>
                        ) : (
                            /* Guest: URL scanner */
                            <div className="mt-10">
                                <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                                    <div className="relative flex-1">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        <input
                                            type="url"
                                            value={siteUrl}
                                            onChange={e => setSiteUrl(e.target.value)}
                                            placeholder={t('landing.placeholder')}
                                            disabled={phase === 'scanning'}
                                            required
                                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-12 pr-4 py-4 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 shadow-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={phase === 'scanning'}
                                        className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed px-6 py-4 text-base font-semibold text-white transition-colors whitespace-nowrap"
                                    >
                                        {phase === 'scanning'
                                            ? <><Loader2 className="h-4 w-4 animate-spin" />{t('landing.scanning')}</>
                                            : <><Search className="h-4 w-4" />{t('landing.scanBtn')}</>
                                        }
                                    </button>
                                </form>

                                {error && (
                                    <div className="mt-4 max-w-xl mx-auto rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 text-center">
                                        {error}{' '}
                                        <Link href="/register" className="font-semibold underline hover:no-underline">
                                            {t('landing.navGetStarted')}
                                        </Link>
                                    </div>
                                )}

                                {phase === 'scanning' && (
                                    <div className="mt-6 max-w-xl mx-auto">
                                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                                            <span>{t('landing.progressLabel', { done: report?.progress.completed ?? 0 })}</span>
                                            <span>{progressPct}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800">
                                            <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${Math.max(progressPct, 4)}%` }} />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-400">{t('landing.progressChecking')}</p>
                                    </div>
                                )}

                                {phase === 'idle' && !error && (
                                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />{t('landing.trustNoAccount')}</span>
                                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />{t('landing.trust1scan')}</span>
                                        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />{t('landing.trustTime')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Scan Results — shown inline after scanning */}
                {phase === 'done' && report && (() => {
                    const score  = report.health_score ?? 0;
                    const style  = scoreStyle(score);
                    const issues = report.deductions.length;

                    return (
                        <section className="px-6 py-16 bg-gray-100/50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
                            <div className="max-w-3xl mx-auto">
                                <p className="text-center text-sm text-gray-500 mb-6 truncate">{report.site_url}</p>

                                {/* Score circle */}
                                <div className="flex flex-col items-center mb-10">
                                    <div className={`flex flex-col items-center justify-center h-44 w-44 rounded-full border-4 ${style.ring} ${style.bg}`}>
                                        <span className={`text-6xl font-extrabold tabular-nums ${style.text}`}>{score}</span>
                                        <span className="text-gray-400 text-sm">/100</span>
                                    </div>
                                    <span className={`mt-3 inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} border ${style.ring}`}>
                                        {style.badge}
                                    </span>
                                    <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm">{style.summary}</p>
                                </div>

                                {/* 7 category cards — all visible, no blur */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                    {CATEGORY_META.map(cat => {
                                        const Icon = cat.icon;
                                        const done = report.categories[cat.key as keyof typeof report.categories];
                                        return (
                                            <div key={cat.key} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 px-4 py-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                </div>
                                                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                                                {done
                                                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                                    : <Loader2 className="h-4 w-4 text-gray-400 shrink-0 animate-spin" />
                                                }
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Issues list — fully visible */}
                                {issues > 0 && (
                                    <div className="mb-8 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 overflow-hidden">
                                        <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 dark:border-amber-800">
                                            <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                                            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                                {issues === 1
                                                    ? t('landing.issuesTeaserOne')
                                                    : t('landing.issuesTeaserMany', { n: issues })}
                                            </span>
                                        </div>
                                        <ul className="divide-y divide-amber-500/10">
                                            {report.deductions.map((d, i) => (
                                                <li key={i} className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{d}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Premium callout */}
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('landing.resultsPremiumTitle')}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('landing.resultsPremiumSub')}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                                        {PREMIUM_FEATURES.map((f, i) => {
                                            const Icon = f.icon;
                                            return (
                                                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                                    <Icon className="h-4 w-4 text-violet-400 shrink-0" />
                                                    <span>{f.text}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Link
                                            href="/register"
                                            className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
                                        >
                                            {t('landing.ctaBtn')} <ArrowRight className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href="/login"
                                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-gray-400 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                                        >
                                            {t('landing.ctaSignIn')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>
                    );
                })()}

                {/* Features grid — 7 audit modules */}
                <section className="px-6 py-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-12 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                                {t('welcome.featuresTitle')}
                            </h2>
                            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t('welcome.featuresSub')}</p>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map(f => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.title}
                                        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
                                    >
                                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Icon className={`h-5 w-5 ${f.color}`} />
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* MCP Agent Section */}
                <section className="px-6 py-20 border-t border-gray-200 dark:border-gray-800">
                    <div className="mx-auto max-w-6xl">
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 lg:p-12">
                            <div className="grid gap-10 lg:grid-cols-2 items-center">
                                <div>
                                    <p className="mb-4 flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                                        <Bot className="h-4 w-4" />
                                        {t('welcome.agent.badge')}
                                    </p>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-start gap-2">
                                        {t('welcome.agent.title')}
                                        <div className="relative mt-1">
                                            <button
                                                onMouseEnter={() => setAgentTooltip(true)}
                                                onMouseLeave={() => setAgentTooltip(false)}
                                                className="text-gray-400 hover:text-gray-300 transition-colors"
                                                aria-label={t('welcome.agent.tooltipTitle')}
                                            >
                                                <HelpCircle className="h-5 w-5" />
                                            </button>
                                            {agentTooltip && (
                                                <div className="absolute left-0 top-7 z-50 w-72 rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl text-xs text-gray-300 leading-relaxed">
                                                    <p className="font-semibold text-white mb-2">{t('welcome.agent.tooltipTitle')}</p>
                                                    <p>{t('welcome.agent.tooltipBody1')}</p>
                                                    <p className="mt-2">{t('welcome.agent.tooltipBody2')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </h2>
                                    <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{t('welcome.agent.sub')}</p>
                                    <ul className="mt-6 space-y-3">
                                        {(t('welcome.agent.bullets', { returnObjects: true }) as string[]).map((text, i) => {
                                            const icons = [Terminal, Server, Bot, Clock];
                                            const Icon = icons[i] ?? Bot;
                                            return (
                                                <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                                                        <Icon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                                    </div>
                                                    {text}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <p className="mt-4 text-xs text-gray-500">{t('welcome.agent.note')}</p>
                                    <Link
                                        href="/register"
                                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                                    >
                                        {t('welcome.getStarted')} <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>

                                {/* Terminal mockup */}
                                <div className="rounded-xl border border-gray-700 bg-gray-950 overflow-hidden shadow-2xl">
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900">
                                        <span className="h-3 w-3 rounded-full bg-red-500/70" />
                                        <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                                        <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
                                        <span className="ml-2 text-xs text-gray-500 font-mono">Claude Code — 4uTest Agent</span>
                                    </div>
                                    <div className="p-5 font-mono text-xs space-y-2 text-left">
                                        <p><span className="text-violet-400">Claude:</span> <span className="text-gray-300">get_audit_report()</span></p>
                                        <p className="text-gray-500 pl-4">→ Health score: 61 · 8 issues found</p>
                                        <p className="text-gray-500 pl-4">→ Missing HSTS header · No SPF record</p>
                                        <p className="text-gray-500 pl-4">→ TTFB 1240ms · 3 broken links</p>
                                        <p className="mt-3"><span className="text-violet-400">Claude:</span> <span className="text-gray-300">create_session_backup()</span></p>
                                        <p className="text-gray-500 pl-4">→ Backup created: backup_20260623_142301.zip</p>
                                        <p className="mt-3"><span className="text-violet-400">Claude:</span> <span className="text-gray-300">read_file(".htaccess")</span></p>
                                        <p className="mt-1"><span className="text-violet-400">Claude:</span> <span className="text-gray-300">write_file(".htaccess", ...)</span></p>
                                        <p className="text-gray-500 pl-4">→ Added: Strict-Transport-Security header</p>
                                        <p className="text-gray-500 pl-4">→ Added: Referrer-Policy header</p>
                                        <p className="mt-3 text-emerald-400">✓ Security score improved from 61 → 79</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section className="px-6 py-20 bg-white/50 dark:bg-gray-900/50">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('welcome.pricingTitle')}</h2>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('welcome.pricingSub')}</p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2">
                            {/* Monthly */}
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-left">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">{t('welcome.monthly')}</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">€19.99</span>
                                    <span className="mb-1 text-gray-600 dark:text-gray-400">{t('welcome.perMonth')}</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">VAT incl. · {t('welcome.includesOneSite')}</p>
                                <div className="mt-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('welcome.extraSiteMonthly')}</p>
                                </div>
                                <ul className="mt-5 space-y-3">
                                    {planFeatures.map(f => (
                                        <li key={f} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/register"
                                    className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    {t('welcome.getStarted')} <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {/* Yearly */}
                            <div className="rounded-xl border-2 border-gray-900 dark:border-gray-100 bg-white dark:bg-gray-900 p-8 text-left relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                                        {t('welcome.twoMonthsFree')}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">{t('welcome.yearly')}</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">€199.99</span>
                                    <span className="mb-1 text-gray-600 dark:text-gray-400">{t('welcome.perYear')}</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">VAT incl. · {t('welcome.includesOneSite')}</p>
                                <div className="mt-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('welcome.extraSiteYearly')}</p>
                                </div>
                                <ul className="mt-5 space-y-3">
                                    {planFeatures.map(f => (
                                        <li key={f} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/register"
                                    className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                                >
                                    {t('welcome.getStarted')} <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Agency callout */}
                        <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 text-left">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('welcome.agencyTitle')}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome.agencyBody')}</p>
                        </div>
                        <p className="mt-4 text-xs text-gray-600">{t('welcome.nofees')}</p>
                    </div>
                </section>

                {/* Extra features */}
                <section className="px-6 py-20">
                    <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-3">
                        {[
                            { icon: Clock,     title: t('welcome.extraFeatures.scheduled.title'), desc: t('welcome.extraFeatures.scheduled.desc'), color: 'text-emerald-400' },
                            { icon: Download,  title: t('welcome.extraFeatures.export.title'),    desc: t('welcome.extraFeatures.export.desc'),    color: 'text-blue-400'    },
                            { icon: BarChart3, title: t('welcome.extraFeatures.track.title'),     desc: t('welcome.extraFeatures.track.desc'),     color: 'text-violet-400'  },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="text-center">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                                        <Icon className={`h-6 w-6 ${item.color}`} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* CTA */}
                <section className="px-6 py-20 border-t border-gray-200 dark:border-gray-800">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('welcome.ctaTitle')}</h2>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('welcome.ctaSub')}</p>
                        <Link
                            href="/register"
                            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-4 text-base font-semibold text-white hover:bg-violet-500 transition-colors"
                        >
                            {t('welcome.startFree')} <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-6">
                    <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">4utest</span>
                        </div>
                        <nav className="flex items-center gap-5 text-xs text-gray-400">
                            <Link href="/terms"   className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</Link>
                            <Link href="/refund"  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Refunds</Link>
                        </nav>
                        <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} 4utest. All rights reserved.</p>
                    </div>
                </footer>
            </div>
            <CookieBanner />

            {toast && (
                <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow text-sm font-medium text-gray-900 dark:text-white">
                    {toast.type === 'success'
                        ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                        : <XCircle className="h-5 w-5 shrink-0 text-red-500" />}
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </>
    );
}
