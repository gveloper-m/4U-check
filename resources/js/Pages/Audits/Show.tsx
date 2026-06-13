import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, FullAuditReport } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StatusResponse {
  status: string;
  progress: {
    completed: number;
    total: number;
    auditors: Record<string, 'done' | 'running'>;
  };
}
import {
  Search,
  Shield,
  BarChart3,
  Link2,
  ShoppingCart,
  Tag,
  Accessibility,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileDown,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface ShowProps extends PageProps {
  report: FullAuditReport;
}

function healthColor(score?: number): string {
  if (score === undefined || score === null) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function healthRingColor(score?: number): string {
  if (score === undefined || score === null) return 'border-gray-600';
  if (score >= 80) return 'border-emerald-500';
  if (score >= 50) return 'border-amber-500';
  return 'border-red-500';
}

function StatusBadge({ status }: { status: FullAuditReport['status'] }) {
  const { t } = useTranslation();
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-4 w-4" />
        {t('audits.completed')}
      </span>
    );
  }
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-400 border border-violet-500/20">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('audits.running')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400 border border-red-500/20">
      <XCircle className="h-4 w-4" />
      {t('audits.failed')}
    </span>
  );
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon: Icon, color, bg, border, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl border ${border} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between ${bg} px-5 py-4 text-left hover:brightness-110 transition-all`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} border ${border}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <span className={`font-semibold ${color}`}>{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-gray-800 bg-gray-900 p-5">
          {children}
        </div>
      )}
    </div>
  );
}

function ModuleError({ result }: { result: Record<string, unknown> | undefined | null }) {
  if (!result) return null;
  const status = result['status'];
  if (status === 'error' || status === 'timeout') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <XCircle className="h-4 w-4 shrink-0" />
        {status === 'timeout' ? 'Module timed out — try re-running the scan.' : `Module error: ${String(result['error'] ?? 'unknown')}`}
      </div>
    );
  }
  return null;
}

function MetaRow({ label, value, ok }: { label: string; value: React.ReactNode; ok?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-800 last:border-0">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 text-right">
        {ok === true && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
        {ok === false && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
        <span className="text-sm text-gray-200">{value ?? 'N/A'}</span>
      </div>
    </div>
  );
}

function getStr(obj: Record<string, unknown> | undefined | null, key: string): string {
  if (!obj) return 'N/A';
  const v = obj[key];
  if (v === null || v === undefined) return 'N/A';
  return String(v);
}

function getNum(obj: Record<string, unknown> | undefined | null, key: string): number | null {
  if (!obj) return null;
  const v = obj[key];
  if (typeof v === 'number') return v;
  return null;
}

function getBool(obj: Record<string, unknown> | undefined | null, key: string): boolean | null {
  if (!obj) return null;
  const v = obj[key];
  if (typeof v === 'boolean') return v;
  return null;
}

function getObj(obj: Record<string, unknown> | undefined | null, key: string): Record<string, unknown> | null {
  if (!obj) return null;
  const v = obj[key];
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function getArr(obj: Record<string, unknown> | undefined | null, key: string): unknown[] {
  if (!obj) return [];
  const v = obj[key];
  if (Array.isArray(v)) return v;
  return [];
}

function hasKey(obj: Record<string, unknown> | null | undefined, key: string): boolean {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

export default function AuditShow({ report }: ShowProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<StatusResponse['progress'] | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (report.status !== 'running') return;

    const poll = async () => {
      try {
        const res = await fetch(`/audits/${report.id}/status`, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!res.ok) return;
        const data = (await res.json()) as StatusResponse;
        setProgress(data.progress);
        if (data.status !== 'running') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          router.reload({ only: ['report'] });
        }
      } catch {
        // ignore transient network errors
      }
    };

    poll(); // immediate first check
    intervalRef.current = setInterval(poll, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [report.id, report.status]);

  const seo = report.seo_schema_result;
  const sec = report.security_result;
  const perf = report.performance_result;
  const broken = report.broken_resources_result;
  const catalog = report.catalog_result;
  const tracking = report.tracking_result;
  const a11y = report.accessibility_result;

  // SEO helpers
  const seoMeta = getObj(seo, 'meta_title');
  const seoDesc = getObj(seo, 'meta_description');
  const seoH1 = getObj(seo, 'h1_tags');
  const seoCanonical = getObj(seo, 'canonical');
  const seoSchema = getObj(seo, 'schema_validation');
  const seoOg = getObj(seo, 'open_graph');
  const seoAlt = getObj(seo, 'image_alt_text');
  const seoTech = getObj(seo, 'technical_seo');
  const seoRobots = getObj(seoTech, 'robots_txt');
  const seoSitemap = getObj(seoTech, 'sitemap_xml');

  // Security helpers — data lives in nested objects
  const secSsl      = getObj(sec, 'ssl');
  const secMixed    = getObj(sec, 'mixed_content');
  const secHeaders  = getObj(sec, 'security_headers');
  const secDns      = getObj(sec, 'dns_security');
  const secRedirect = getObj(sec, 'https_redirect');
  const secHdrsPresent = getObj(secHeaders, 'headers_present');

  // Performance helpers — real keys: metrics.ttfb_ms, metrics.desktop.fcp_ms, page_analysis.*
  const perfMetrics     = getObj(perf, 'metrics');
  const perfDesktop     = getObj(perfMetrics, 'desktop');
  const perfMobile      = getObj(perfMetrics, 'mobile');
  const perfPageAnalysis = getObj(perf, 'page_analysis');
  const perfPages       = getNum(perf, 'pages_tested');
  const perfTtfb        = getNum(perfMetrics, 'ttfb_ms');
  const perfFcp         = getNum(perfDesktop, 'fcp_ms') ?? getNum(perfMobile, 'fcp_ms');
  const perfLcp         = getNum(perfDesktop, 'lcp_ms') ?? getNum(perfMobile, 'lcp_ms');
  const perfCompression = getBool(perfPageAnalysis, 'compression_enabled');

  // Broken resources helpers
  const brokenSummary = getObj(broken, 'summary');
  const brokenLinks   = getArr(broken, 'broken_links');
  const brokenImages  = getArr(broken, 'broken_images');

  // Catalog helpers
  const catalogBrokenPct    = getNum(catalog, 'broken_percentage');
  const catalogResults      = getArr(catalog, 'results') as Record<string, unknown>[];
  const catalogPriceIssues  = catalogResults.filter(r => r.has_price_error).length;
  const catalogStockMismatches = catalogResults.filter(r => r.stock_mismatch).length;

  // Tracking helpers — data lives under tracking_scripts
  const trackScripts = getObj(tracking, 'tracking_scripts');
  const trackGa4 = getObj(trackScripts, 'ga4');
  const trackFb  = getObj(trackScripts, 'facebook_pixel');
  const trackTt  = getObj(trackScripts, 'tiktok_pixel');

  return (
    <AppLayout>
      <Head title={`Audit — ${report.site_url}`} />

      <div className="space-y-6">
        {/* Back */}
        <Link
          href="/audits"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('show.backToAudits')}
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Health score circle */}
            <div
              className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4 ${healthRingColor(report.health_score)}`}
            >
              <span className={`text-lg font-extrabold leading-none ${healthColor(report.health_score)}`}>
                {report.health_score ?? '?'}
              </span>
              <span className="text-[10px] text-gray-500">{t('show.score')}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white break-all">
                {report.name ?? report.site_url}
              </h1>
              {report.name && (
                <a
                  href={report.site_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 flex items-center gap-1 text-sm text-gray-400 hover:text-violet-400 transition-colors"
                >
                  {report.site_url} <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StatusBadge status={report.status} />
                <span className="text-xs text-gray-500">
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Export buttons */}
          {report.status === 'completed' && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/audits/${report.id}/export/pdf`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
              >
                <FileDown className="h-4 w-4" />
                {t('show.pdf')}
              </a>
              <a
                href={`/audits/${report.id}/export/csv`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
              >
                <FileDown className="h-4 w-4" />
                {t('show.csv')}
              </a>
            </div>
          )}
        </div>

        {/* Running state — live progress */}
        {report.status === 'running' && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-violet-300">
                  {t('show.running')} — {progress ? `${progress.completed}/${progress.total}` : '0/6'} {t('show.runningModules')}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-violet-900/40">
                  <div
                    className="h-1.5 rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${progress ? (progress.completed / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { key: 'seo_schema',         label: t('show.sections.seo') },
                { key: 'security',           label: t('show.sections.security') },
                { key: 'performance',        label: t('show.sections.performance') },
                { key: 'broken_resources',   label: t('show.sections.broken') },
                { key: 'catalog_integrity',  label: t('show.sections.catalog') },
                { key: 'marketing_tracking', label: t('show.sections.tracking') },
                { key: 'accessibility',      label: t('show.sections.accessibility') },
              ].map(({ key, label }) => {
                const done = progress?.auditors?.[key] === 'done';
                return (
                  <div key={key} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border ${done ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-gray-800/50 border-gray-700 text-gray-500'}`}>
                    {done
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      : <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Score deductions */}
        {report.score_deductions && report.score_deductions.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">{t('show.deductionsTitle')}</h3>
            </div>
            <ul className="space-y-1">
              {report.score_deductions.map((d, i) => (
                <li key={i} className="text-sm text-amber-300/80">
                  • {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Audit sections */}
        <div className="space-y-3">
          {/* SEO & Schema */}
          <Section
            title={t('show.sections.seo')}
            icon={Search}
            color="text-violet-400"
            bg="bg-violet-500/10"
            border="border-violet-500/20"
            defaultOpen={true}
          >
            {seo ? (
              <div className="divide-y divide-gray-800">
                <MetaRow
                  label={t('show.seo.metaTitle')}
                  value={getStr(seoMeta, 'status')}
                  ok={getStr(seoMeta, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.metaDesc')}
                  value={getStr(seoDesc, 'status')}
                  ok={getStr(seoDesc, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.h1')}
                  value={`${getNum(seoH1, 'count') ?? '?'} (${getStr(seoH1, 'status')})`}
                  ok={getStr(seoH1, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.canonical')}
                  value={getStr(seoCanonical, 'status')}
                  ok={getStr(seoCanonical, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.schema')}
                  value={getBool(seoSchema, 'has_valid_schema') ? 'Valid' : 'Missing/Invalid'}
                  ok={getBool(seoSchema, 'has_valid_schema') ?? undefined}
                />
                <MetaRow
                  label={t('show.seo.og')}
                  value={getStr(seoOg, 'status')}
                  ok={getStr(seoOg, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.images')}
                  value={seoAlt
                    ? `${getNum(seoAlt, 'missing_alt') ?? 0} missing / ${getNum(seoAlt, 'total_images') ?? '?'} total`
                    : t('common.na')}
                  ok={seoAlt ? getStr(seoAlt, 'status') === 'OK' : undefined}
                />
                <MetaRow
                  label={t('show.seo.robots')}
                  value={getBool(seoRobots, 'exists') === true ? 'Found' : getBool(seoRobots, 'exists') === false ? 'Missing' : t('common.na')}
                  ok={getBool(seoRobots, 'exists') ?? undefined}
                />
                <MetaRow
                  label={t('show.seo.sitemap')}
                  value={getBool(seoSitemap, 'exists') === true ? 'Found' : getBool(seoSitemap, 'exists') === false ? 'Missing' : t('common.na')}
                  ok={getBool(seoSitemap, 'exists') ?? undefined}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('show.noData')}</p>
            )}
          </Section>

          {/* Security */}
          <Section
            title={t('show.sections.security')}
            icon={Shield}
            color="text-blue-400"
            bg="bg-blue-500/10"
            border="border-blue-500/20"
          >
            {sec ? (
              <div className="divide-y divide-gray-800">
                {/* SSL */}
                <MetaRow
                  label={t('show.security.ssl')}
                  value={
                    getBool(secSsl, 'ssl_valid')
                      ? `Valid — ${getStr(secSsl, 'ssl_issuer')} (${getNum(secSsl, 'ssl_days_left')} days left, expires ${getStr(secSsl, 'ssl_expiry')})`
                      : getStr(secSsl, 'error') || 'N/A'
                  }
                  ok={getBool(secSsl, 'ssl_valid') ?? undefined}
                />
                {/* HTTPS redirect */}
                <MetaRow
                  label="HTTPS Redirect"
                  value={getBool(secRedirect, 'redirects_to_https') === true ? 'Yes' : getBool(secRedirect, 'redirects_to_https') === false ? 'No' : 'N/A'}
                  ok={getBool(secRedirect, 'redirects_to_https') ?? undefined}
                />
                {/* Mixed content */}
                <MetaRow
                  label={t('show.security.mixed')}
                  value={getBool(secMixed, 'has_mixed_content') ? 'Detected' : 'None'}
                  ok={getBool(secMixed, 'has_mixed_content') === false}
                />
                {/* Security headers — headers_present only contains headers that ARE present */}
                <MetaRow
                  label="HSTS"
                  value={hasKey(secHdrsPresent, 'Strict-Transport-Security')
                    ? String(secHdrsPresent!['Strict-Transport-Security'])
                    : 'Missing'}
                  ok={hasKey(secHdrsPresent, 'Strict-Transport-Security')}
                />
                <MetaRow
                  label="CSP"
                  value={hasKey(secHdrsPresent, 'Content-Security-Policy') ? 'Present' : 'Missing'}
                  ok={hasKey(secHdrsPresent, 'Content-Security-Policy')}
                />
                <MetaRow
                  label="X-Frame-Options"
                  value={hasKey(secHdrsPresent, 'X-Frame-Options')
                    ? String(secHdrsPresent!['X-Frame-Options'])
                    : 'Missing'}
                  ok={hasKey(secHdrsPresent, 'X-Frame-Options')}
                />
                {/* DNS */}
                <MetaRow
                  label="SPF"
                  value={getBool(secDns, 'spf_record_exists') ? getStr(secDns, 'spf_record') : 'Missing'}
                  ok={getBool(secDns, 'spf_record_exists') ?? undefined}
                />
                <MetaRow
                  label="DMARC"
                  value={getBool(secDns, 'dmarc_record_exists') ? 'Present' : 'Missing'}
                  ok={getBool(secDns, 'dmarc_record_exists') ?? undefined}
                />
                <MetaRow
                  label="DKIM"
                  value={getBool(secDns, 'dkim_found') ? `Found (selector: ${getStr(secDns, 'dkim_selector')})` : 'Not found'}
                  ok={getBool(secDns, 'dkim_found') ?? undefined}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('show.noData')}</p>
            )}
          </Section>

          {/* Performance */}
          <Section
            title={t('show.sections.performance')}
            icon={BarChart3}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
            border="border-emerald-500/20"
          >
            {perf ? (
              <div className="space-y-2">
                <ModuleError result={perf} />
                <div className="divide-y divide-gray-800">
                <MetaRow label={t('show.performance.pages')} value={perfPages ?? t('common.na')} />
                <MetaRow
                  label={t('show.performance.ttfb')}
                  value={perfTtfb !== null ? `${perfTtfb} ms` : t('common.na')}
                  ok={perfTtfb !== null ? perfTtfb < 800 : undefined}
                />
                <MetaRow
                  label={`${t('show.performance.fcp')} (Desktop)`}
                  value={perfFcp !== null ? `${perfFcp} ms` : t('common.na')}
                  ok={perfFcp !== null ? perfFcp < 1800 : undefined}
                />
                {perfMobile && getNum(perfMobile, 'fcp_ms') !== null && (
                  <MetaRow
                    label={`${t('show.performance.fcp')} (Mobile)`}
                    value={`${getNum(perfMobile, 'fcp_ms')} ms`}
                    ok={(getNum(perfMobile, 'fcp_ms') ?? 9999) < 1800}
                  />
                )}
                <MetaRow
                  label={`${t('show.performance.lcp')} (Desktop)`}
                  value={perfLcp !== null ? `${perfLcp} ms` : t('common.na')}
                  ok={perfLcp !== null ? perfLcp < 2500 : undefined}
                />
                {perfMobile && getNum(perfMobile, 'lcp_ms') !== null && (
                  <MetaRow
                    label={`${t('show.performance.lcp')} (Mobile)`}
                    value={`${getNum(perfMobile, 'lcp_ms')} ms`}
                    ok={(getNum(perfMobile, 'lcp_ms') ?? 9999) < 2500}
                  />
                )}
                <MetaRow
                  label={t('show.performance.compression')}
                  value={perfCompression === true ? t('show.performance.enabled') : perfCompression === false ? t('show.performance.disabled') : t('common.na')}
                  ok={perfCompression ?? undefined}
                />
                {perfPageAnalysis && (getArr(perfPageAnalysis, 'render_blocking_scripts').length + getArr(perfPageAnalysis, 'render_blocking_styles').length) > 0 && (
                  <MetaRow
                    label="Render Blocking"
                    value={`${getNum(perfPageAnalysis, 'total_render_blocking') ?? 0} resources`}
                    ok={getNum(perfPageAnalysis, 'total_render_blocking') === 0}
                  />
                )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('show.noData')}</p>
            )}
          </Section>

          {/* Broken Resources */}
          <Section
            title={t('show.sections.broken')}
            icon={Link2}
            color="text-red-400"
            bg="bg-red-500/10"
            border="border-red-500/20"
          >
            {broken ? (
              <div className="space-y-4">
                <ModuleError result={broken} />
                <div className="divide-y divide-gray-800">
                  <MetaRow
                    label={t('show.broken.totalLinks')}
                    value={getNum(brokenSummary, 'total_links_checked') ?? t('common.na')}
                  />
                  <MetaRow
                    label={t('show.broken.brokenLinks')}
                    value={(() => {
                      const count = getNum(brokenSummary, 'broken_links_count');
                      const total = getNum(brokenSummary, 'total_links_checked');
                      if (count === null) return t('common.na');
                      if (total && total > 0) return `${count} (${Math.round((count / total) * 100)}%)`;
                      return String(count);
                    })()}
                    ok={(getNum(brokenSummary, 'broken_links_count') ?? 1) === 0}
                  />
                  <MetaRow
                    label={t('show.broken.totalImages')}
                    value={getNum(brokenSummary, 'total_images_checked') ?? t('common.na')}
                  />
                  <MetaRow
                    label={t('show.broken.brokenImages')}
                    value={getNum(brokenSummary, 'broken_images_count') ?? t('common.na')}
                    ok={(getNum(brokenSummary, 'broken_images_count') ?? 1) === 0}
                  />
                </div>

                {brokenLinks.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('show.broken.topBroken')} ({brokenLinks.length})
                    </p>
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-800">
                      {brokenLinks.map((link, i) => {
                        const l = link as Record<string, unknown>;
                        return (
                          <div key={i} className="flex items-center justify-between gap-3 border-b border-gray-800 px-3 py-2 last:border-0">
                            <span className="truncate text-xs text-gray-400">{String(l.url ?? link)}</span>
                            {l.status_code != null && (
                              <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                                {String(l.status_code)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {brokenImages.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('show.broken.brokenImages')} ({brokenImages.length})
                    </p>
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-800">
                      {brokenImages.map((img, i) => {
                        const im = img as Record<string, unknown>;
                        return (
                          <div key={i} className="flex items-center justify-between gap-3 border-b border-gray-800 px-3 py-2 last:border-0">
                            <span className="truncate text-xs text-gray-400">{String(im.url ?? img)}</span>
                            {im.status_code != null && (
                              <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">
                                {String(im.status_code)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('show.noData')}</p>
            )}
          </Section>

          {/* Catalog */}
          <Section
            title={t('show.sections.catalog')}
            icon={ShoppingCart}
            color="text-amber-400"
            bg="bg-amber-500/10"
            border="border-amber-500/20"
          >
            {catalog ? (
              <div className="space-y-2">
                <ModuleError result={catalog} />
                <div className="divide-y divide-gray-800">
                <MetaRow label={t('show.catalog.crawled')} value={getNum(catalog, 'pages_crawled') ?? t('common.na')} />
                <MetaRow label="Product Pages Found" value={getNum(catalog, 'product_pages_found') ?? t('common.na')} />
                <MetaRow label={t('show.catalog.products')} value={getNum(catalog, 'products_audited') ?? t('common.na')} />
                <MetaRow
                  label={t('show.catalog.broken')}
                  value={getNum(catalog, 'broken_products_count') ?? t('common.na')}
                  ok={(getNum(catalog, 'broken_products_count') ?? 1) === 0}
                />
                <MetaRow
                  label={t('show.catalog.pct')}
                  value={catalogBrokenPct !== null ? `${catalogBrokenPct}%` : t('common.na')}
                  ok={catalogBrokenPct !== null ? catalogBrokenPct === 0 : undefined}
                />
                {catalogResults.length > 0 && (
                  <>
                    <MetaRow
                      label="Price Issues"
                      value={catalogPriceIssues}
                      ok={catalogPriceIssues === 0}
                    />
                    <MetaRow
                      label="Stock Mismatches"
                      value={catalogStockMismatches}
                      ok={catalogStockMismatches === 0}
                    />
                  </>
                )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('show.noData')}</p>
            )}
          </Section>

          {/* Marketing Tracking */}
          <Section
            title={t('show.sections.tracking')}
            icon={Tag}
            color="text-pink-400"
            bg="bg-pink-500/10"
            border="border-pink-500/20"
          >
            {tracking ? (
              <div className="space-y-2">
                <ModuleError result={tracking} />
                <div className="divide-y divide-gray-800">
                <MetaRow
                  label={t('show.tracking.ga4')}
                  value={(() => {
                    if (!trackGa4) return t('common.na');
                    const ids = getArr(trackGa4, 'ids');
                    return getBool(trackGa4, 'detected') ? `Yes${ids.length ? ` (${ids.join(', ')})` : ''}` : 'Not detected';
                  })()}
                  ok={getBool(trackGa4, 'detected') ?? undefined}
                />
                <MetaRow
                  label={t('show.tracking.fb')}
                  value={(() => {
                    if (!trackFb) return t('common.na');
                    const ids = getArr(trackFb, 'ids');
                    return getBool(trackFb, 'detected') ? `Yes${ids.length ? ` (${ids.join(', ')})` : ''}` : 'Not detected';
                  })()}
                  ok={getBool(trackFb, 'detected') ?? undefined}
                />
                <MetaRow
                  label={t('show.tracking.tt')}
                  value={(() => {
                    if (!trackTt) return t('common.na');
                    const ids = getArr(trackTt, 'ids');
                    return getBool(trackTt, 'detected') ? `Yes${ids.length ? ` (${ids.join(', ')})` : ''}` : 'Not detected';
                  })()}
                  ok={getBool(trackTt, 'detected') ?? undefined}
                />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('show.noData')}</p>
            )}
          </Section>

          {/* Accessibility */}
          <Section
            title={t('show.sections.accessibility')}
            icon={Accessibility}
            color="text-cyan-400"
            bg="bg-cyan-500/10"
            border="border-cyan-500/20"
          >
            {a11y ? (
              <div className="space-y-4">
                <ModuleError result={a11y} />
                {(() => {
                  const checks   = getObj(a11y, 'checks');
                  const score    = getNum(a11y, 'score');
                  const formLbl  = getObj(checks, 'form_labels');
                  const imgAlt   = getObj(checks, 'image_alt');
                  const ariaLbl  = getObj(checks, 'aria_labels');
                  const headings = getObj(checks, 'heading_hierarchy');
                  const linkTxt  = getObj(checks, 'link_text');
                  const lmarks   = getObj(checks, 'landmarks');
                  const contrast = getObj(checks, 'color_contrast');

                  const statusOk = (s: string | null | undefined) => s === 'pass' ? true : s === 'fail' ? false : undefined;

                  return (
                    <>
                      {score !== null && (
                        <div className="flex items-center gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
                          <span className="text-sm font-medium text-cyan-300">{t('show.accessibility.score')}</span>
                          <span className={`text-lg font-bold ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{score}/100</span>
                        </div>
                      )}

                      <div className="divide-y divide-gray-800">
                        {/* Form labels */}
                        <MetaRow
                          label={t('show.accessibility.formLabels')}
                          value={formLbl ? `${getNum(formLbl,'pass') ?? 0} pass, ${getNum(formLbl,'fail') ?? 0} fail` : t('common.na')}
                          ok={statusOk(getStr(formLbl, 'status'))}
                        />
                        {/* Image alt */}
                        <MetaRow
                          label={t('show.accessibility.imageAlt')}
                          value={imgAlt ? `${getNum(imgAlt,'missing_count') ?? 0} missing of ${getNum(imgAlt,'total') ?? '?'}` : t('common.na')}
                          ok={statusOk(getStr(imgAlt, 'status'))}
                        />
                        {/* ARIA */}
                        <MetaRow
                          label={t('show.accessibility.ariaLabels')}
                          value={ariaLbl ? `${getNum(ariaLbl,'fail') ?? 0} violation(s)` : t('common.na')}
                          ok={statusOk(getStr(ariaLbl, 'status'))}
                        />
                        {/* Heading hierarchy */}
                        <MetaRow
                          label={t('show.accessibility.headings')}
                          value={headings ? `${getNum(headings,'total_headings') ?? 0} headings, ${getArr(headings,'issues').length} issue(s)` : t('common.na')}
                          ok={statusOk(getStr(headings, 'status'))}
                        />
                        {/* Link text */}
                        <MetaRow
                          label={t('show.accessibility.linkText')}
                          value={linkTxt ? `${getNum(linkTxt,'fail') ?? 0} vague link(s)` : t('common.na')}
                          ok={statusOk(getStr(linkTxt, 'status'))}
                        />
                        {/* Landmarks */}
                        <MetaRow
                          label={t('show.accessibility.langAttr')}
                          value={lmarks ? (getBool(lmarks,'has_lang') ? getStr(lmarks,'lang') : 'Missing') : t('common.na')}
                          ok={getBool(lmarks,'has_lang') ?? undefined}
                        />
                        <MetaRow
                          label={t('show.accessibility.mainLandmark')}
                          value={lmarks ? (getBool(lmarks,'has_main') ? 'Present' : 'Missing') : t('common.na')}
                          ok={getBool(lmarks,'has_main') ?? undefined}
                        />
                        <MetaRow
                          label={t('show.accessibility.skipNav')}
                          value={lmarks ? (getBool(lmarks,'has_skip_nav') ? 'Found' : 'Not found') : t('common.na')}
                          ok={getBool(lmarks,'has_skip_nav') ?? undefined}
                        />
                        {/* Color contrast */}
                        <MetaRow
                          label={t('show.accessibility.colorContrast')}
                          value={contrast ? `${getNum(contrast,'fail') ?? 0} violation(s) found` : t('common.na')}
                          ok={statusOk(getStr(contrast, 'status'))}
                        />
                      </div>

                      {/* Heading issues */}
                      {getArr(headings, 'issues').length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">{t('show.accessibility.headingIssues')}</p>
                          <div className="space-y-1">
                            {getArr(headings, 'issues').map((issue, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                {String(issue)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Form label violations */}
                      {getArr(formLbl, 'violations').length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">{t('show.accessibility.unlabeledInputs')} ({getArr(formLbl,'violations').length})</p>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-800">
                            {getArr(formLbl, 'violations').map((v, i) => {
                              const vv = v as Record<string,unknown>;
                              return (
                                <div key={i} className="border-b border-gray-800 px-3 py-2 last:border-0 text-xs text-gray-400">
                                  <span className="text-red-400 font-mono">{String(vv.element ?? '')}{vv.type ? `[type=${String(vv.type)}]` : ''}</span>
                                  {!!vv.name && <span className="ml-2 text-gray-500">name="{String(vv.name)}"</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ARIA violations */}
                      {getArr(ariaLbl, 'violations').length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">{t('show.accessibility.ariaViolations')} ({getArr(ariaLbl,'violations').length})</p>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-800">
                            {getArr(ariaLbl, 'violations').map((v, i) => {
                              const vv = v as Record<string,unknown>;
                              return (
                                <div key={i} className="border-b border-gray-800 px-3 py-2 last:border-0">
                                  <p className="text-xs text-red-400">{String(vv.issue ?? '')}</p>
                                  {!!vv.href && <p className="text-xs text-gray-500 truncate">{String(vv.href ?? '')}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Color contrast violations */}
                      {getArr(contrast, 'violations').length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">{t('show.accessibility.contrastViolations')} ({getArr(contrast,'violations').length})</p>
                          {contrast && <p className="mb-2 text-xs text-gray-600">{getStr(contrast,'note')}</p>}
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-800">
                            {getArr(contrast, 'violations').map((v, i) => {
                              const vv = v as Record<string,unknown>;
                              return (
                                <div key={i} className="flex items-center gap-3 border-b border-gray-800 px-3 py-2 last:border-0">
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="inline-block h-4 w-4 rounded border border-gray-700" style={{ background: String(vv.bg_color ?? '#000') }} />
                                    <span className="inline-block h-4 w-4 rounded border border-gray-700" style={{ background: String(vv.fg_color ?? '#fff') }} />
                                  </div>
                                  <span className="text-xs text-gray-400 flex-1 truncate">{vv.selector ? String(vv.selector) : String(vv.element ?? '')}</span>
                                  <span className="shrink-0 text-xs text-red-400 font-mono">{String(vv.ratio ?? '')}:1</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('show.noData')}</p>
            )}
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}
