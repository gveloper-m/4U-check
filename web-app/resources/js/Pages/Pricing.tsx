import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
  Zap, ArrowRight, CheckCircle2, XCircle, Search, Shield, BarChart3, Link2,
  ShoppingCart, Tag, Accessibility, Clock, Download, Globe, Bot,
  HelpCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const MONTHLY_PRICE  = 19.99;
const YEARLY_PRICE   = 199.99;
const EXTRA_MONTHLY  = 9.99;
const EXTRA_YEARLY   = 99.99;

const AUDIT_MODULES = [
  { icon: Search,       label: 'SEO Audit',           color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20',
    desc: 'Meta tags, headings, canonical URLs, structured data, sitemap, Open Graph, keyword density, and 30+ more checks.' },
  { icon: Shield,       label: 'Security Audit',       color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',
    desc: 'HTTPS, HSTS, CSP, X-Frame-Options, mixed content, exposed config files, cookie flags, and vulnerability headers.' },
  { icon: BarChart3,    label: 'Performance Audit',    color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',
    desc: 'Core Web Vitals (LCP, CLS, FID), page size, render-blocking resources, image optimisation, caching, and TTFB.' },
  { icon: Link2,        label: 'Broken Links',         color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',
    desc: 'Full crawl of internal and external links, anchors, images, scripts, and stylesheets — with HTTP status codes.' },
  { icon: ShoppingCart, label: 'E-commerce Audit',     color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',
    desc: 'Product schema, checkout UX, cart abandonment signals, payment trust indicators, and conversion-rate blockers.' },
  { icon: Tag,          label: 'Marketing Tracking',   color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20',
    desc: 'GA4, GTM, Meta Pixel, LinkedIn Insight, TikTok — detect missing tags, misfires, and duplicate tracking.' },
  { icon: Accessibility,label: 'Accessibility (WCAG)', color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20',
    desc: 'WCAG 2.1 AA — alt text, colour contrast, keyboard navigation, ARIA labels, form labels, and focus management.' },
];

const PLAN_FEATURES = [
  'All 7 audit modules in every scan',
  'Full health score (0–100) with detailed breakdown',
  '30 scans per site per month',
  'Scheduled automatic scans (daily, weekly, monthly)',
  'PDF & CSV export of every report',
  'Shareable public report links',
  'Historical trend tracking',
  'MCP Agent — Claude fixes what the audit finds',
  'Priority email support',
  'Paddle-secured billing — EU VAT handled automatically',
];

const COMPARISON_ROWS = [
  { label: 'Audit modules',          monthly: '7 modules',  yearly: '7 modules' },
  { label: 'Sites included',         monthly: '1',           yearly: '1' },
  { label: 'Extra sites',            monthly: '€9.99/mo each', yearly: '€99.99/yr each' },
  { label: 'Scans per site/month',   monthly: '30',          yearly: '30' },
  { label: 'Scheduled scans',        monthly: true,          yearly: true },
  { label: 'PDF / CSV export',       monthly: true,          yearly: true },
  { label: 'Shareable report links', monthly: true,          yearly: true },
  { label: 'Historical trends',      monthly: true,          yearly: true },
  { label: 'MCP Agent',               monthly: true,          yearly: true },
  { label: 'Priority support',       monthly: true,          yearly: true },
  { label: 'Savings vs monthly',     monthly: '—',           yearly: '2 months free (~€40)' },
];

const FAQS = [
  {
    q: 'What counts as a "site"?',
    a: 'A site is a root domain or subdomain you register in your account (e.g. example.com or blog.example.com). Your base plan includes one site. You can add additional sites at €9.99/mo or €99.99/yr each.',
  },
  {
    q: 'How does billing work?',
    a: 'Payments are processed securely by Paddle, our Merchant of Record. Paddle handles EU VAT automatically — you never need to worry about VAT compliance. You can pay by card and receive a proper VAT invoice.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your billing dashboard at any time. Your subscription remains active until the end of the current billing period — no pro-rata charges.',
  },
  {
    q: 'What is a "scan"?',
    a: 'One scan = one full audit run across all 7 modules for one site. Each site gets 30 scans per month. Scheduled scans and manual scans both count toward this quota.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 7-day money-back guarantee if you\'re not satisfied. Contact support within 7 days of your first charge.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — register for free and run your first audit at no cost. We may offer limited trial codes via our newsletter. Paid plans unlock unlimited scheduled scans and full monthly quota.',
  },
  {
    q: 'Can I use 4utest for client sites?',
    a: 'Absolutely. Add each client domain as an extra site. Shareable public links let you send clients a clean report URL without giving them account access.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {q}
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />}
      </button>
      {open && (
        <p className="pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

function CellValue({ v }: { v: string | boolean }) {
  if (v === true)  return <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400" />;
  if (v === false) return <XCircle className="mx-auto h-5 w-5 text-gray-500" />;
  return <span className="text-sm text-gray-700 dark:text-gray-300">{v as string}</span>;
}

export default function Pricing({ auth }: PageProps) {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  const price  = billing === 'yearly' ? YEARLY_PRICE  : MONTHLY_PRICE;
  const extra  = billing === 'yearly' ? EXTRA_YEARLY  : EXTRA_MONTHLY;
  const period = billing === 'yearly' ? '/year' : '/month';

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <Head title="Pricing — 4utest Website Audit Platform">
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

        {/* Navbar */}
        <header className="fixed top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                4u<span className="text-violet-400">test</span>
              </span>
            </Link>
            <nav className="flex items-center gap-3">
              <Link href="/pricing" className="rounded-lg px-4 py-2 text-sm font-medium text-violet-400 transition-colors">
                Pricing
              </Link>
              {auth?.user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                >
                  {t('nav.dashboard')} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Sign in
                  </Link>
                  <Link href="/register" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="pt-16">

          {/* Hero */}
          <section className="px-6 pt-20 pb-12 text-center">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-5">Merchant of Record — EU VAT handled by Paddle</p>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                Simple, transparent pricing
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                One site included. Pay only for the extra sites you need. No hidden fees, no per-scan limits beyond your monthly quota.
              </p>

              {/* Billing toggle */}
              <div className="mt-8 inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1">
                <button
                  type="button"
                  onClick={() => setBilling('monthly')}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-violet-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling('yearly')}
                  className={`relative rounded-lg px-5 py-2 text-sm font-medium transition-colors ${billing === 'yearly' ? 'bg-violet-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Yearly
                  <span className="absolute -top-2.5 -right-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-17%</span>
                </button>
              </div>
            </div>
          </section>

          {/* Plan cards */}
          <section className="px-6 pb-20">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-6 sm:grid-cols-2">

                {/* Base plan */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
                  <div className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Pro Plan</div>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">€{price.toFixed(2)}</span>
                    <span className="mb-1.5 text-gray-500">{period}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">VAT incl. · 1 site included</p>
                  {billing === 'yearly' && (
                    <p className="mt-1 text-xs text-emerald-400 font-medium">≈ €16.67/month · 2 months free</p>
                  )}

                  <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Need more sites?</p>
                    <p className="text-xs text-gray-500">
                      Add extra sites at <strong className="text-gray-700 dark:text-gray-300">€{extra.toFixed(2)}{period}</strong> each.
                      Each site gets its own 30 scans/month.
                    </p>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {PLAN_FEATURES.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={auth?.user ? '/billing' : '/register'}
                    className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {auth?.user ? 'Manage Subscription' : 'Get Started'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Yearly highlight */}
                <div className="relative rounded-xl border-2 border-gray-900 dark:border-gray-100 bg-white dark:bg-gray-900 p-8">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white shadow">
                      Best Value — 2 months free
                    </span>
                  </div>

                  <div className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pro Yearly</div>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">€199.99</span>
                    <span className="mb-1.5 text-gray-500">/year</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">VAT incl. · 1 site included</p>
                  <p className="mt-1 text-xs text-emerald-400 font-medium">≈ €16.67/month · save ~€40 vs monthly</p>

                  <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Extra sites</p>
                    <p className="text-xs text-gray-500">
                      <strong className="text-gray-700 dark:text-gray-300">€99.99/year</strong> per additional site (save vs €9.99 × 12 = €119.88).
                    </p>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {PLAN_FEATURES.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={auth?.user ? '/billing' : '/register'}
                    className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-3.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                  >
                    {auth?.user ? 'Upgrade to Yearly' : 'Get Started — Yearly'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-gray-500">
                No contracts. Cancel anytime. 7-day money-back guarantee.
              </p>
            </div>
          </section>

          {/* What's in every scan */}
          <section className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-6 py-20">
            <div className="mx-auto max-w-7xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">7 audit modules in every scan</h2>
                <p className="mt-3 text-gray-600 dark:text-gray-400">All modules run in parallel. Full results in minutes.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {AUDIT_MODULES.slice(0, 7).map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Icon className={`h-5 w-5 ${m.color}`} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{m.label}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{m.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Comparison table */}
          <section className="px-6 py-20">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">Monthly vs Yearly</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/2">Feature</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide bg-gray-50 dark:bg-gray-800">Yearly ★</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {COMPARISON_ROWS.map(row => (
                      <tr key={row.label} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-3.5 text-gray-700 dark:text-gray-300 font-medium">{row.label}</td>
                        <td className="px-6 py-3.5 text-center"><CellValue v={row.monthly} /></td>
                        <td className="px-6 py-3.5 text-center bg-gray-50 dark:bg-gray-800"><CellValue v={row.yearly} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Extra features / platform */}
          <section className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 px-6 py-20">
            <div className="mx-auto max-w-7xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">Everything included — no add-ons</h2>
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  { icon: Clock,    color: 'text-emerald-500 dark:text-emerald-400',
                    title: 'Scheduled scans',
                    desc: 'Set it and forget it. Schedule daily, weekly, or monthly audits. Get notified when your score drops.' },
                  { icon: Download, color: 'text-blue-500 dark:text-blue-400',
                    title: 'PDF & CSV export',
                    desc: 'Download polished PDF reports to share with clients or management. Export raw data to CSV for custom analysis.' },
                  { icon: Globe,    color: 'text-violet-600 dark:text-violet-400',
                    title: 'Public shareable links',
                    desc: 'Generate a public link to any audit report. Share with clients without giving them account access.' },
                  { icon: BarChart3,color: 'text-amber-500 dark:text-amber-400',
                    title: 'Historical trends',
                    desc: 'Track your health score over time. See how changes you make improve — or hurt — your site\'s performance.' },
                  { icon: Bot,      color: 'text-pink-500 dark:text-pink-400',
                    title: 'MCP Agent',
                    desc: 'Deploy a lightweight agent on your server. Claude Code connects via MCP to read files, apply fixes, and verify changes — no copy-pasting.' },
                  { icon: HelpCircle,color:'text-teal-500 dark:text-teal-400',
                    title: 'Priority support',
                    desc: 'Email support with priority queue for paid subscribers. We aim to respond within 1 business day.' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-6 py-20">
            <div className="mx-auto max-w-3xl">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently asked questions</h2>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8">
                {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="border-t border-gray-200 dark:border-gray-800 px-6 py-20 bg-white/50 dark:bg-gray-900/50">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Ready to audit your site?</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Run 7 parallel audits on your site — SEO, security, performance, broken links, e-commerce, tracking, and accessibility — and get a full health score in minutes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={auth?.user ? '/billing' : '/register'}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-4 text-base font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                  {auth?.user ? 'Go to Billing' : 'Start free'} <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-8 py-4 text-base font-medium text-gray-700 dark:text-gray-300 hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Learn more
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-500">No credit card required to sign up. 7-day money-back guarantee on paid plans.</p>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-8">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">4u<span className="text-violet-400">test</span></span>
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-400">
                <Link href="/"        className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Home</Link>
                <Link href="/blog"    className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Blog</Link>
                <Link href="/terms"   className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</Link>
                <Link href="/refund"  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Refunds</Link>
              </div>
              <p className="text-xs text-gray-500">© {new Date().getFullYear()} 4utest. All rights reserved.</p>
            </div>
          </footer>

        </main>
      </div>
    </>
  );
}
