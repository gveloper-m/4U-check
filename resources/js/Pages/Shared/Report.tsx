import { Head } from '@inertiajs/react';
import { FullAuditReport } from '@/types';
import { useState } from 'react';
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
  FileDown,
  ExternalLink,
} from 'lucide-react';

interface Agency {
  name?: string | null;
  logo_url?: string | null;
  primary_color: string;
  secondary_color: string;
  footer_text?: string | null;
}

interface SharedReportProps {
  report: FullAuditReport;
  agency: Agency | null;
}

// ── helpers ────────────────────────────────────────────────────────────────
function getObj(o: unknown, k: string): Record<string, unknown> | null {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    const v = (o as Record<string, unknown>)[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  }
  return null;
}
function getStr(o: unknown, k: string): string | null {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    const v = (o as Record<string, unknown>)[k];
    return typeof v === 'string' ? v : null;
  }
  return null;
}
function getNum(o: unknown, k: string): number | null {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    const v = (o as Record<string, unknown>)[k];
    return typeof v === 'number' ? v : null;
  }
  return null;
}
function getBool(o: unknown, k: string): boolean | null {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    const v = (o as Record<string, unknown>)[k];
    return typeof v === 'boolean' ? v : null;
  }
  return null;
}
function getArr(o: unknown, k: string): unknown[] {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    const v = (o as Record<string, unknown>)[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}
function hasKey(o: unknown, k: string): boolean {
  return o !== null && typeof o === 'object' && !Array.isArray(o) && k in (o as object);
}

// ── MetaRow ────────────────────────────────────────────────────────────────
function MetaRow({ label, value, ok }: { label: string; value: unknown; ok?: boolean | null }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right break-all flex items-center gap-1.5 ${ok === true ? 'text-emerald-600' : ok === false ? 'text-red-500' : 'text-gray-700'}`}>
        {ok === true && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
        {ok === false && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
        {String(value ?? 'N/A')}
      </span>
    </div>
  );
}

// ── ModuleError ────────────────────────────────────────────────────────────
function ModuleError({ result }: { result: unknown }) {
  const err = getStr(result, 'error');
  if (!err) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      {err}
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  primaryColor?: string;
}

function Section({ title, icon: Icon, color, bg, border, defaultOpen = false, children, primaryColor }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`overflow-hidden rounded-xl border bg-white shadow-sm ${border}`}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </span>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ── score helpers ──────────────────────────────────────────────────────────
function healthColor(score?: number, primary?: string): string {
  if (score === undefined || score === null) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}
function healthRingStyle(score?: number, primary?: string): React.CSSProperties {
  if (score === undefined || score === null) return { borderColor: '#9ca3af' };
  if (score >= 80) return { borderColor: '#10b981' };
  if (score >= 50) return { borderColor: '#f59e0b' };
  return { borderColor: '#ef4444' };
}

// ── Main component ─────────────────────────────────────────────────────────
export default function SharedReport({ report, agency }: SharedReportProps) {
  const primary   = agency?.primary_color   ?? '#7c3aed';
  const secondary = agency?.secondary_color ?? '#1e1b4b';

  const seo     = report.seo_schema_result;
  const sec     = report.security_result;
  const perf    = report.performance_result;
  const broken  = report.broken_resources_result;
  const catalog = report.catalog_result;
  const tracking = report.tracking_result;
  const a11y    = report.accessibility_result;

  // SEO
  const seoMeta     = getObj(seo, 'meta_title');
  const seoDesc     = getObj(seo, 'meta_description');
  const seoH1       = getObj(seo, 'h1_tags');
  const seoCanonical = getObj(seo, 'canonical');
  const seoSchema   = getObj(seo, 'schema_validation');
  const seoOg       = getObj(seo, 'open_graph');
  const seoAlt      = getObj(seo, 'image_alt_text');
  const seoTech     = getObj(seo, 'technical_seo');
  const seoRobots   = getObj(seoTech, 'robots_txt');
  const seoSitemap  = getObj(seoTech, 'sitemap_xml');

  // Security
  const secSsl         = getObj(sec, 'ssl');
  const secMixed       = getObj(sec, 'mixed_content');
  const secHeaders     = getObj(sec, 'security_headers');
  const secDns         = getObj(sec, 'dns_security');
  const secRedirect    = getObj(sec, 'https_redirect');
  const secHdrsPresent = getObj(secHeaders, 'headers_present');

  // Performance
  const perfMetrics     = getObj(perf, 'metrics');
  const perfDesktop     = getObj(perfMetrics, 'desktop');
  const perfMobile      = getObj(perfMetrics, 'mobile');
  const perfPageAnalysis = getObj(perf, 'page_analysis');
  const perfPages       = getNum(perf, 'pages_tested');
  const perfTtfb        = getNum(perfMetrics, 'ttfb_ms');
  const perfFcp         = getNum(perfDesktop, 'fcp_ms') ?? getNum(perfMobile, 'fcp_ms');
  const perfLcp         = getNum(perfDesktop, 'lcp_ms') ?? getNum(perfMobile, 'lcp_ms');
  const perfCompression = getBool(perfPageAnalysis, 'compression_enabled');

  // Broken
  const brokenSummary = getObj(broken, 'summary');
  const brokenLinks   = getArr(broken, 'broken_links');
  const brokenImages  = getArr(broken, 'broken_images');

  // Catalog
  const catalogBrokenPct       = getNum(catalog, 'broken_percentage');
  const catalogResults         = getArr(catalog, 'results') as Record<string, unknown>[];
  const catalogPriceIssues     = catalogResults.filter(r => r.has_price_error).length;
  const catalogStockMismatches = catalogResults.filter(r => r.stock_mismatch).length;

  // Tracking
  const trackScripts = getObj(tracking, 'tracking_scripts');
  const trackGa4 = getObj(trackScripts, 'ga4');
  const trackFb  = getObj(trackScripts, 'facebook_pixel');
  const trackTt  = getObj(trackScripts, 'tiktok_pixel');

  return (
    <>
      <Head title={`${agency?.name ?? 'Website'} Audit — ${report.site_url}`} />

      {/* Agency header */}
      <header style={{ backgroundColor: primary }} className="sticky top-0 z-10 shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {agency?.logo_url ? (
              <img src={agency.logo_url} alt={agency.name ?? ''} className="h-8 max-w-[140px] object-contain" />
            ) : (
              <span className="text-lg font-bold text-white">{agency?.name ?? 'Website Audit'}</span>
            )}
          </div>
          <a
            href={`/shared/${report.share_uuid}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Download PDF
          </a>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

          {/* Report header card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {/* Health score circle */}
              <div
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4"
                style={healthRingStyle(report.health_score)}
              >
                <span className={`text-lg font-extrabold leading-none ${healthColor(report.health_score)}`}>
                  {report.health_score ?? '?'}
                </span>
                <span className="text-[10px] text-gray-400">score</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 break-all">
                  {report.name ?? report.site_url}
                </h1>
                {report.name && (
                  <a
                    href={report.site_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 flex items-center gap-1 text-sm text-gray-400 hover:text-violet-600 transition-colors"
                  >
                    {report.site_url} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Score deductions */}
          {report.score_deductions && report.score_deductions.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-amber-700">Score Deductions</h3>
              </div>
              <ul className="space-y-1">
                {report.score_deductions.map((d, i) => (
                  <li key={i} className="text-sm text-amber-700/80">• {d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Audit sections */}
          <div className="space-y-3">

            {/* SEO */}
            <Section title="SEO & Schema" icon={Search} color="text-violet-600" bg="bg-violet-100" border="border-violet-200" defaultOpen={true}>
              {seo ? (
                <div className="divide-y divide-gray-100">
                  <MetaRow label="Meta Title" value={getStr(seoMeta, 'status')} ok={getStr(seoMeta, 'status') === 'OK'} />
                  <MetaRow label="Meta Description" value={getStr(seoDesc, 'status')} ok={getStr(seoDesc, 'status') === 'OK'} />
                  <MetaRow label="H1 Tags" value={`${getNum(seoH1, 'count') ?? '?'} (${getStr(seoH1, 'status')})`} ok={getStr(seoH1, 'status') === 'OK'} />
                  <MetaRow label="Canonical URL" value={getStr(seoCanonical, 'status')} ok={getStr(seoCanonical, 'status') === 'OK'} />
                  <MetaRow label="Schema Markup" value={getBool(seoSchema, 'has_valid_schema') ? 'Valid' : 'Missing/Invalid'} ok={getBool(seoSchema, 'has_valid_schema') ?? undefined} />
                  <MetaRow label="Open Graph" value={getStr(seoOg, 'status')} ok={getStr(seoOg, 'status') === 'OK'} />
                  <MetaRow label="Image Alt Text" value={seoAlt ? `${getNum(seoAlt, 'missing_alt') ?? 0} missing / ${getNum(seoAlt, 'total_images') ?? '?'} total` : 'N/A'} ok={seoAlt ? getStr(seoAlt, 'status') === 'OK' : undefined} />
                  <MetaRow label="robots.txt" value={getBool(seoRobots, 'exists') === true ? 'Found' : getBool(seoRobots, 'exists') === false ? 'Missing' : 'N/A'} ok={getBool(seoRobots, 'exists') ?? undefined} />
                  <MetaRow label="sitemap.xml" value={getBool(seoSitemap, 'exists') === true ? 'Found' : getBool(seoSitemap, 'exists') === false ? 'Missing' : 'N/A'} ok={getBool(seoSitemap, 'exists') ?? undefined} />
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-400">No data available.</p>}
            </Section>

            {/* Security */}
            <Section title="Security Audit" icon={Shield} color="text-blue-600" bg="bg-blue-100" border="border-blue-200">
              {sec ? (
                <div className="divide-y divide-gray-100">
                  <MetaRow label="SSL Certificate" value={getBool(secSsl, 'ssl_valid') ? `Valid — ${getStr(secSsl, 'ssl_issuer')} (${getNum(secSsl, 'ssl_days_left')} days left, expires ${getStr(secSsl, 'ssl_expiry')})` : getStr(secSsl, 'error') || 'N/A'} ok={getBool(secSsl, 'ssl_valid') ?? undefined} />
                  <MetaRow label="HTTPS Redirect" value={getBool(secRedirect, 'redirects_to_https') === true ? 'Yes' : getBool(secRedirect, 'redirects_to_https') === false ? 'No' : 'N/A'} ok={getBool(secRedirect, 'redirects_to_https') ?? undefined} />
                  <MetaRow label="Mixed Content" value={getBool(secMixed, 'has_mixed_content') ? 'Detected' : 'None'} ok={getBool(secMixed, 'has_mixed_content') === false} />
                  <MetaRow label="HSTS" value={hasKey(secHdrsPresent, 'Strict-Transport-Security') ? String(secHdrsPresent!['Strict-Transport-Security']) : 'Missing'} ok={hasKey(secHdrsPresent, 'Strict-Transport-Security')} />
                  <MetaRow label="CSP" value={hasKey(secHdrsPresent, 'Content-Security-Policy') ? 'Present' : 'Missing'} ok={hasKey(secHdrsPresent, 'Content-Security-Policy')} />
                  <MetaRow label="X-Frame-Options" value={hasKey(secHdrsPresent, 'X-Frame-Options') ? String(secHdrsPresent!['X-Frame-Options']) : 'Missing'} ok={hasKey(secHdrsPresent, 'X-Frame-Options')} />
                  <MetaRow label="SPF" value={getBool(secDns, 'spf_record_exists') ? getStr(secDns, 'spf_record') : 'Missing'} ok={getBool(secDns, 'spf_record_exists') ?? undefined} />
                  <MetaRow label="DMARC" value={getBool(secDns, 'dmarc_record_exists') ? 'Present' : 'Missing'} ok={getBool(secDns, 'dmarc_record_exists') ?? undefined} />
                  <MetaRow label="DKIM" value={getBool(secDns, 'dkim_found') ? `Found (selector: ${getStr(secDns, 'dkim_selector')})` : 'Not found'} ok={getBool(secDns, 'dkim_found') ?? undefined} />
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-400">No data available.</p>}
            </Section>

            {/* Performance */}
            <Section title="Performance" icon={BarChart3} color="text-emerald-600" bg="bg-emerald-100" border="border-emerald-200">
              {perf ? (
                <div className="space-y-2 p-4">
                  <ModuleError result={perf} />
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    <MetaRow label="Pages Tested" value={perfPages ?? 'N/A'} />
                    <MetaRow label="Avg. TTFB" value={perfTtfb !== null ? `${perfTtfb} ms` : 'N/A'} ok={perfTtfb !== null ? perfTtfb < 800 : undefined} />
                    <MetaRow label="FCP (Desktop)" value={perfFcp !== null ? `${perfFcp} ms` : 'N/A'} ok={perfFcp !== null ? perfFcp < 1800 : undefined} />
                    {perfMobile && getNum(perfMobile, 'fcp_ms') !== null && (
                      <MetaRow label="FCP (Mobile)" value={`${getNum(perfMobile, 'fcp_ms')} ms`} ok={(getNum(perfMobile, 'fcp_ms') ?? 9999) < 1800} />
                    )}
                    <MetaRow label="LCP (Desktop)" value={perfLcp !== null ? `${perfLcp} ms` : 'N/A'} ok={perfLcp !== null ? perfLcp < 2500 : undefined} />
                    {perfMobile && getNum(perfMobile, 'lcp_ms') !== null && (
                      <MetaRow label="LCP (Mobile)" value={`${getNum(perfMobile, 'lcp_ms')} ms`} ok={(getNum(perfMobile, 'lcp_ms') ?? 9999) < 2500} />
                    )}
                    <MetaRow label="Compression" value={perfCompression === true ? 'Enabled' : perfCompression === false ? 'Disabled' : 'N/A'} ok={perfCompression ?? undefined} />
                    {perfPageAnalysis && (getArr(perfPageAnalysis, 'render_blocking_scripts').length + getArr(perfPageAnalysis, 'render_blocking_styles').length) > 0 && (
                      <MetaRow label="Render Blocking" value={`${getNum(perfPageAnalysis, 'total_render_blocking') ?? 0} resources`} ok={getNum(perfPageAnalysis, 'total_render_blocking') === 0} />
                    )}
                  </div>
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-400">No data available.</p>}
            </Section>

            {/* Broken Resources */}
            <Section title="Broken Resources" icon={Link2} color="text-red-500" bg="bg-red-100" border="border-red-200">
              {broken ? (
                <div className="space-y-4 p-4">
                  <ModuleError result={broken} />
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    <MetaRow label="Total Links Checked" value={getNum(brokenSummary, 'total_links_checked') ?? 'N/A'} />
                    <MetaRow label="Broken Links" value={(() => { const count = getNum(brokenSummary, 'broken_links_count'); const total = getNum(brokenSummary, 'total_links_checked'); if (count === null) return 'N/A'; if (total && total > 0) return `${count} (${Math.round((count / total) * 100)}%)`; return String(count); })()} ok={(getNum(brokenSummary, 'broken_links_count') ?? 1) === 0} />
                    <MetaRow label="Total Images Checked" value={getNum(brokenSummary, 'total_images_checked') ?? 'N/A'} />
                    <MetaRow label="Broken Images" value={getNum(brokenSummary, 'broken_images_count') ?? 'N/A'} ok={(getNum(brokenSummary, 'broken_images_count') ?? 1) === 0} />
                  </div>
                  {brokenLinks.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Top Broken Links ({brokenLinks.length})</p>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                        {brokenLinks.map((link, i) => {
                          const l = link as Record<string, unknown>;
                          return (
                            <div key={i} className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 last:border-0">
                              <span className="truncate text-xs text-gray-500">{String(l.url ?? link)}</span>
                              {l.status_code != null && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">{String(l.status_code)}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {brokenImages.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Broken Images ({brokenImages.length})</p>
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                        {brokenImages.map((img, i) => {
                          const im = img as Record<string, unknown>;
                          return (
                            <div key={i} className="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 last:border-0">
                              <span className="truncate text-xs text-gray-500">{String(im.url ?? img)}</span>
                              {im.status_code != null && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">{String(im.status_code)}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-400">No data available.</p>}
            </Section>

            {/* Catalog */}
            <Section title="E-commerce Catalog" icon={ShoppingCart} color="text-amber-600" bg="bg-amber-100" border="border-amber-200">
              {catalog ? (
                <div className="space-y-2 p-4">
                  <ModuleError result={catalog} />
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    <MetaRow label="Pages Crawled" value={getNum(catalog, 'pages_crawled') ?? 'N/A'} />
                    <MetaRow label="Product Pages Found" value={getNum(catalog, 'product_pages_found') ?? 'N/A'} />
                    <MetaRow label="Products Audited" value={getNum(catalog, 'products_audited') ?? 'N/A'} />
                    <MetaRow label="Broken Products" value={getNum(catalog, 'broken_products_count') ?? 'N/A'} ok={(getNum(catalog, 'broken_products_count') ?? 1) === 0} />
                    <MetaRow label="Broken %" value={catalogBrokenPct !== null ? `${catalogBrokenPct}%` : 'N/A'} ok={catalogBrokenPct !== null ? catalogBrokenPct === 0 : undefined} />
                    {catalogResults.length > 0 && (
                      <>
                        <MetaRow label="Price Issues" value={catalogPriceIssues} ok={catalogPriceIssues === 0} />
                        <MetaRow label="Stock Mismatches" value={catalogStockMismatches} ok={catalogStockMismatches === 0} />
                      </>
                    )}
                  </div>
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-400">No data available.</p>}
            </Section>

            {/* Tracking */}
            <Section title="Marketing Tracking" icon={Tag} color="text-pink-500" bg="bg-pink-100" border="border-pink-200">
              {tracking ? (
                <div className="space-y-2 p-4">
                  <ModuleError result={tracking} />
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    <MetaRow label="Google Analytics 4" value={(() => { if (!trackGa4) return 'N/A'; const ids = getArr(trackGa4, 'ids'); return getBool(trackGa4, 'detected') ? `Yes${ids.length ? ` (${ids.join(', ')})` : ''}` : 'Not detected'; })()} ok={getBool(trackGa4, 'detected') ?? undefined} />
                    <MetaRow label="Facebook Pixel" value={(() => { if (!trackFb) return 'N/A'; const ids = getArr(trackFb, 'ids'); return getBool(trackFb, 'detected') ? `Yes${ids.length ? ` (${ids.join(', ')})` : ''}` : 'Not detected'; })()} ok={getBool(trackFb, 'detected') ?? undefined} />
                    <MetaRow label="TikTok Pixel" value={(() => { if (!trackTt) return 'N/A'; const ids = getArr(trackTt, 'ids'); return getBool(trackTt, 'detected') ? `Yes${ids.length ? ` (${ids.join(', ')})` : ''}` : 'Not detected'; })()} ok={getBool(trackTt, 'detected') ?? undefined} />
                  </div>
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-400">No data available.</p>}
            </Section>

            {/* Accessibility */}
            <Section title="Accessibility (WCAG)" icon={Accessibility} color="text-cyan-600" bg="bg-cyan-100" border="border-cyan-200">
              {a11y ? (
                <div className="space-y-4 p-4">
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
                          <div className="flex items-center gap-3 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3">
                            <span className="text-sm font-medium text-cyan-700">Accessibility Score</span>
                            <span className={`text-lg font-bold ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{score}/100</span>
                          </div>
                        )}
                        <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                          <MetaRow label="Form Labels" value={formLbl ? `${getNum(formLbl,'pass') ?? 0} pass, ${getNum(formLbl,'fail') ?? 0} fail` : 'N/A'} ok={statusOk(getStr(formLbl, 'status'))} />
                          <MetaRow label="Image Alt Text" value={imgAlt ? `${getNum(imgAlt,'missing_count') ?? 0} missing of ${getNum(imgAlt,'total') ?? '?'}` : 'N/A'} ok={statusOk(getStr(imgAlt, 'status'))} />
                          <MetaRow label="ARIA Labels" value={ariaLbl ? `${getNum(ariaLbl,'fail') ?? 0} violation(s)` : 'N/A'} ok={statusOk(getStr(ariaLbl, 'status'))} />
                          <MetaRow label="Heading Hierarchy" value={headings ? `${getNum(headings,'total_headings') ?? 0} headings, ${getArr(headings,'issues').length} issue(s)` : 'N/A'} ok={statusOk(getStr(headings, 'status'))} />
                          <MetaRow label="Link Text" value={linkTxt ? `${getNum(linkTxt,'fail') ?? 0} vague link(s)` : 'N/A'} ok={statusOk(getStr(linkTxt, 'status'))} />
                          <MetaRow label="HTML lang attribute" value={lmarks ? (getBool(lmarks,'has_lang') ? getStr(lmarks,'lang') : 'Missing') : 'N/A'} ok={getBool(lmarks,'has_lang') ?? undefined} />
                          <MetaRow label="<main> landmark" value={lmarks ? (getBool(lmarks,'has_main') ? 'Present' : 'Missing') : 'N/A'} ok={getBool(lmarks,'has_main') ?? undefined} />
                          <MetaRow label="Skip navigation link" value={lmarks ? (getBool(lmarks,'has_skip_nav') ? 'Found' : 'Not found') : 'N/A'} ok={getBool(lmarks,'has_skip_nav') ?? undefined} />
                          <MetaRow label="Color Contrast" value={contrast ? `${getNum(contrast,'fail') ?? 0} violation(s) found` : 'N/A'} ok={statusOk(getStr(contrast, 'status'))} />
                        </div>

                        {getArr(headings, 'issues').length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Heading Issues</p>
                            <div className="space-y-1">
                              {getArr(headings, 'issues').map((issue, i) => (
                                <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                  {String(issue)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {getArr(formLbl, 'violations').length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Unlabeled Inputs ({getArr(formLbl,'violations').length})</p>
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                              {getArr(formLbl, 'violations').map((v, i) => {
                                const vv = v as Record<string,unknown>;
                                return (
                                  <div key={i} className="border-b border-gray-100 px-3 py-2 last:border-0 text-xs text-gray-500">
                                    <span className="text-red-500 font-mono">{String(vv.element ?? '')}{vv.type ? `[type=${String(vv.type)}]` : ''}</span>
                                    {!!vv.name && <span className="ml-2 text-gray-400">name="{String(vv.name)}"</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {getArr(ariaLbl, 'violations').length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">ARIA Violations ({getArr(ariaLbl,'violations').length})</p>
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                              {getArr(ariaLbl, 'violations').map((v, i) => {
                                const vv = v as Record<string,unknown>;
                                return (
                                  <div key={i} className="border-b border-gray-100 px-3 py-2 last:border-0">
                                    <p className="text-xs text-red-500">{String(vv.issue ?? '')}</p>
                                    {!!vv.href && <p className="text-xs text-gray-400 truncate">{String(vv.href ?? '')}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {getArr(contrast, 'violations').length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Contrast Violations ({getArr(contrast,'violations').length})</p>
                            {contrast && <p className="mb-2 text-xs text-gray-400">{getStr(contrast,'note')}</p>}
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                              {getArr(contrast, 'violations').map((v, i) => {
                                const vv = v as Record<string,unknown>;
                                return (
                                  <div key={i} className="flex items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-0">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="inline-block h-4 w-4 rounded border border-gray-200" style={{ background: String(vv.bg_color ?? '#000') }} />
                                      <span className="inline-block h-4 w-4 rounded border border-gray-200" style={{ background: String(vv.fg_color ?? '#fff') }} />
                                    </div>
                                    <span className="text-xs text-gray-500 flex-1 truncate">{vv.selector ? String(vv.selector) : String(vv.element ?? '')}</span>
                                    <span className="shrink-0 text-xs text-red-500 font-mono">{String(vv.ratio ?? '')}:1</span>
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
              ) : <p className="px-4 py-3 text-sm text-gray-400">No data available.</p>}
            </Section>

          </div>
        </div>
      </main>

      {/* Agency footer */}
      <footer style={{ backgroundColor: secondary }} className="py-6 text-center">
        <p className="text-sm text-white/70">
          {agency?.footer_text ?? (agency?.name ? `Report by ${agency.name}` : 'Website Audit Report')}
        </p>
      </footer>
    </>
  );
}
