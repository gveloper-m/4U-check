import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Zap, Search, Shield, BarChart3, Link2, ShoppingCart, Tag, Clock, Download, ArrowRight, CheckCircle2, Star, XCircle, X, Accessibility, Bot, HelpCircle, Terminal, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CookieBanner from '@/Components/CookieBanner';
import { useEffect, useState } from 'react';

export default function Welcome({ auth }: PageProps) {
  const { t } = useTranslation();
  const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [agentTooltip, setAgentTooltip] = useState(false);

  useEffect(() => {
    if (flash?.success) setToast({ message: flash.success, type: 'success' });
    else if (flash?.error) setToast({ message: flash.error, type: 'error' });
  }, [flash]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const features = [
    { icon: Search, title: t('welcome.features.seo.title'), desc: t('welcome.features.seo.desc'), color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { icon: Shield, title: t('welcome.features.security.title'), desc: t('welcome.features.security.desc'), color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { icon: BarChart3, title: t('welcome.features.performance.title'), desc: t('welcome.features.performance.desc'), color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { icon: Link2, title: t('welcome.features.broken.title'), desc: t('welcome.features.broken.desc'), color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { icon: ShoppingCart, title: t('welcome.features.ecommerce.title'), desc: t('welcome.features.ecommerce.desc'), color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { icon: Tag, title: t('welcome.features.tracking.title'), desc: t('welcome.features.tracking.desc'), color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    { icon: Accessibility, title: t('welcome.features.accessibility.title'), desc: t('welcome.features.accessibility.desc'), color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  ];

  const planFeatures = t('welcome.planFeatures', { returnObjects: true }) as string[];

  return (
    <>
      <Head title="4utest — Website Audit Platform" />
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
        <section className="relative pt-32 pb-24 px-6 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full" />
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
              <Star className="h-3.5 w-3.5" />
              {t('welcome.badge')}
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              {t('welcome.headline1')}{' '}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                {t('welcome.headline2')}
              </span>{' '}
              {t('welcome.headline3')}
            </h1>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t('welcome.sub')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-base font-semibold text-gray-900 dark:text-white hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/25"
              >
                {t('welcome.cta')} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-gray-300 dark:border-gray-700 px-8 py-4 text-base font-medium text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('welcome.signin')}
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                {t('welcome.featuresTitle')}
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t('welcome.featuresSub')}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className={`rounded-2xl border ${f.border} ${f.bg} p-6 hover:scale-[1.02] transition-transform`}
                  >
                    <div
                      className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.bg} border ${f.border}`}
                    >
                      <Icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <h3 className={`text-base font-semibold ${f.color}`}>{f.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
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
              <div className="rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-left shadow-xl">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">{t('welcome.monthly')}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">€19.99</span>
                  <span className="mb-1 text-gray-600 dark:text-gray-400">{t('welcome.perMonth')}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">+ excl. VAT · {t('welcome.includesOneSite')}</p>
                <div className="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                  <p className="text-xs text-violet-300">
                    {t('welcome.extraSiteMonthly')}
                  </p>
                </div>
                <ul className="mt-5 space-y-3">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t('welcome.getStarted')} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Yearly */}
              <div className="rounded-2xl border border-violet-500/40 bg-white dark:bg-gray-900 p-8 text-left shadow-2xl shadow-violet-500/10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                    {t('welcome.twoMonthsFree')}
                  </span>
                </div>
                <p className="text-sm font-medium text-violet-400 mb-4">{t('welcome.yearly')}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">€199.99</span>
                  <span className="mb-1 text-gray-600 dark:text-gray-400">{t('welcome.perYear')}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">+ excl. VAT · {t('welcome.includesOneSite')}</p>
                <div className="mt-4 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                  <p className="text-xs text-violet-300">
                    {t('welcome.extraSiteYearly')}
                  </p>
                </div>
                <ul className="mt-5 space-y-3">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/25"
                >
                  {t('welcome.getStarted')} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Per-site expansion callout */}
            <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('welcome.agencyTitle')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('welcome.agencyBody')}</p>
            </div>

            <p className="mt-4 text-xs text-gray-600">{t('welcome.nofees')} All prices excl. VAT.</p>
          </div>
        </section>

        {/* MCP Agent Section */}
        <section className="px-6 py-20 border-t border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-8 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-2 items-center">
                {/* Left */}
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                    <Bot className="h-3.5 w-3.5" />
                    MCP Agent — included free
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-start gap-2">
                    Claude fixes what the audit finds
                    <div className="relative mt-1">
                      <button
                        onMouseEnter={() => setAgentTooltip(true)}
                        onMouseLeave={() => setAgentTooltip(false)}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                        aria-label="What is the MCP Agent?"
                      >
                        <HelpCircle className="h-5 w-5" />
                      </button>
                      {agentTooltip && (
                        <div className="absolute left-0 top-7 z-50 w-72 rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl text-xs text-gray-300 leading-relaxed">
                          <p className="font-semibold text-white mb-2">What is the MCP Agent?</p>
                          <p>The MCP Agent is a small Docker container you deploy on the same server as your website. It connects to Claude Code via the Model Context Protocol (MCP), giving Claude direct access to your server's files, system metrics, and your 4uTest audit results.</p>
                          <p className="mt-2">Claude can then read files, apply fixes, and verify changes — all on your live server, without any manual copy-paste.</p>
                        </div>
                      )}
                    </div>
                  </h2>
                  <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                    Deploy a lightweight agent on your server. Claude Code connects to it via MCP and gets instant access to your files, server health metrics, and your latest audit results — so it can fix broken headers, missing alt text, or slow response times directly on your site.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      { icon: Terminal, text: 'Read and edit server files — no copy-paste needed' },
                      { icon: Server,   text: 'Real-time CPU, RAM and disk monitoring' },
                      { icon: Bot,      text: 'Audit results auto-synced so Claude knows exactly what to fix' },
                      { icon: Clock,    text: 'Auto backup before every Claude session' },
                    ].map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/15">
                          <Icon className="h-3.5 w-3.5 text-violet-400" />
                        </div>
                        {text}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-gray-500">One agent per registered site. Included at no extra cost on every plan.</p>
                  <Link
                    href="/register"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                  >
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Right — terminal mockup */}
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

        {/* Extra features */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: t('welcome.extraFeatures.scheduled.title'),
                desc: t('welcome.extraFeatures.scheduled.desc'),
                color: 'text-emerald-400',
              },
              {
                icon: Download,
                title: t('welcome.extraFeatures.export.title'),
                desc: t('welcome.extraFeatures.export.desc'),
                color: 'text-blue-400',
              },
              {
                icon: BarChart3,
                title: t('welcome.extraFeatures.track.title'),
                desc: t('welcome.extraFeatures.track.desc'),
                color: 'text-violet-400',
              },
            ].map((item) => {
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
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('welcome.ctaSub')}
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-base font-semibold text-gray-900 dark:text-white hover:bg-violet-500 transition-colors"
            >
              {t('welcome.startFree')} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-6">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">4utest</span>
            </div>
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} 4utest. All rights reserved.</p>
          </div>
        </footer>
      </div>
      <CookieBanner />

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl text-sm font-medium ${
          toast.type === 'success'
            ? 'border-emerald-500/30 bg-white dark:bg-gray-900 text-emerald-300'
            : 'border-red-500/30 bg-white dark:bg-gray-900 text-red-300'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-5 w-5 shrink-0" />
            : <XCircle className="h-5 w-5 shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
