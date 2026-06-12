import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Zap, Search, Shield, BarChart3, Link2, ShoppingCart, Tag, Clock, Download, ArrowRight, CheckCircle2, Star } from 'lucide-react';

const features = [
  { icon: Search, title: 'SEO & Schema', desc: 'Meta tags, structured data, Open Graph, canonical URLs, image alt text.', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { icon: Shield, title: 'Security Audit', desc: 'SSL, HTTP security headers, mixed content, CSP, HSTS, X-Frame-Options.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { icon: BarChart3, title: 'Performance', desc: 'FCP, LCP, TTFB, compression, resource analysis, Core Web Vitals.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { icon: Link2, title: 'Broken Resources', desc: 'Find all broken links and missing images across every page.', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { icon: ShoppingCart, title: 'E-commerce Catalog', desc: 'Price integrity, stock mismatches, disabled cart buttons on product pages.', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { icon: Tag, title: 'Marketing Tracking', desc: 'Detect GA4, Facebook Pixel, TikTok Pixel across all site pages.', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
];

const planFeatures = [
  'Unlimited website scans',
  'All 6 audit modules',
  'Scheduled automatic scans',
  'Full scan history & comparisons',
  'PDF & CSV exports',
  'Priority queue processing',
];

export default function Welcome({ auth }: PageProps) {
  return (
    <>
      <Head title="4utest — Website Audit Platform" />
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Navbar */}
        <header className="fixed top-0 z-50 w-full border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                4u<span className="text-violet-400">test</span>
              </span>
            </div>
            <nav className="flex items-center gap-3">
              {auth.user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                >
                  Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                  >
                    Get Started
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
              Complete website health analysis
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Know exactly what&apos;s{' '}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                broken
              </span>{' '}
              on your site
            </h1>
            <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              4utest runs 6 deep audits in parallel — SEO, security, performance, broken links,
              e-commerce catalog, and marketing tracking — giving you a complete health score in minutes.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-base font-semibold text-white hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/25"
              >
                Start auditing free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-gray-700 px-8 py-4 text-base font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                6 audit modules in every scan
              </h2>
              <p className="mt-4 text-lg text-gray-400">Run concurrently. Results in minutes.</p>
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
                    <p className="mt-2 text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-20 bg-gray-900/50">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-3xl font-bold text-white">Simple pricing</h2>
            <p className="mt-4 text-gray-400">One plan. Everything included.</p>
            <div className="mt-10 rounded-2xl border border-violet-500/30 bg-gray-900 p-8 shadow-2xl shadow-violet-500/10">
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-extrabold text-white">€19.99</span>
                <span className="mb-2 text-gray-400">/month</span>
              </div>
              <ul className="mt-8 space-y-3 text-left">
                {planFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 text-base font-semibold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/25"
              >
                Get started <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-3 text-xs text-gray-500">No setup fees. Cancel anytime.</p>
            </div>
          </div>
        </section>

        {/* Extra features */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: 'Automated Scans',
                desc: 'Schedule hourly, daily, weekly, or monthly scans. Never miss a regression.',
                color: 'text-emerald-400',
              },
              {
                icon: Download,
                title: 'Export Results',
                desc: 'Download PDF reports for clients or CSV data for your own analysis.',
                color: 'text-blue-400',
              },
              {
                icon: BarChart3,
                title: 'Track Progress',
                desc: 'Compare any two scans side by side to see your health score improve.',
                color: 'text-violet-400',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-800">
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 border-t border-gray-800">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">Ready to audit your site?</h2>
            <p className="mt-4 text-gray-400">
              Create an account and run your first audit in under 2 minutes.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-base font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              Start for free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <footer className="border-t border-gray-800 py-8 px-6">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">4utest</span>
            </div>
            <p className="text-xs text-gray-600">&copy; 2024 4utest. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
