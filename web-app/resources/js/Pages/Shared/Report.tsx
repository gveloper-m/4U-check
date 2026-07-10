import { Head } from '@inertiajs/react';
import { FullAuditReport } from '@/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import InfoTooltip from '@/Components/InfoTooltip';
import ScreenshotGallery, { GalleryItem } from '@/Components/ScreenshotGallery';
import TopFixes from '@/Components/TopFixes';
import { screenshotUrl } from '@/lib/screenshot';
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
  Image as ImageIcon,
  Bug,
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
function MetaRow({ label, value, ok, help }: { label: string; value: unknown; ok?: boolean | null; help?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="flex items-center gap-1.5 text-sm text-gray-500 shrink-0">
        {label}
        {help && <InfoTooltip text={help} />}
      </span>
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
  help?: string;
}

function Section({ title, icon: Icon, color, bg, border, defaultOpen = false, children, primaryColor, help }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`overflow-hidden rounded-xl border bg-white shadow-sm ${border}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((p) => !p);
          }
        }}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-gray-900">
            {title}
            {help && <InfoTooltip text={help} align="left" />}
          </span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
      </div>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ── score helpers ──────────────────────────────────────────────────────────
function healthColor(score?: number, primary?: string): string {
  if (score === undefined || score === null) return 'text-gray-600 dark:text-gray-400';
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
  const { t } = useTranslation();
  const primary   = agency?.primary_color   ?? '#7c3aed';
  const secondary = agency?.secondary_color ?? '#1e1b4b';

  const seo     = report.seo_schema_result;
  const sec     = report.security_result;
  const perf    = report.performance_result;
  const broken  = report.broken_resources_result;
  const catalog = report.catalog_result;
  const tracking = report.tracking_result;
  const a11y    = report.accessibility_result;
  const fuzz    = report.fuzz_testing_result;

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
  const perfCompressionMatters = getBool(perfPageAnalysis, 'compression_worth_flagging');

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

  // Screenshot gallery — visual evidence captured during the scan
  const perfScreenshots = getObj(perf, 'screenshots');
  const perfPageShots = getArr(perfScreenshots, 'pages');
  const legacyHomepageScreenshot = perfScreenshots && typeof (perfScreenshots as Record<string, unknown>)['homepage'] === 'string'
    ? String((perfScreenshots as Record<string, unknown>)['homepage'])
    : null;
  const a11yChecksForGallery = getObj(a11y, 'checks');
  const contrastForGallery = getObj(a11yChecksForGallery, 'color_contrast');

  const galleryItems: GalleryItem[] = [];
  if (perfPageShots.length > 0) {
    perfPageShots.forEach((p) => {
      const pp = p as Record<string, unknown>;
      const src = typeof pp.screenshot === 'string' ? screenshotUrl(pp.screenshot) : null;
      if (!src) return;
      const pageUrl = String(pp.url ?? report.site_url);
      const isHomepage = pageUrl === report.site_url;
      galleryItems.push({
        src,
        caption: isHomepage ? t('show.gallery.homepage') : pageUrl,
        code: pageUrl,
        badge: isHomepage ? t('show.gallery.badgeOverview') : t('show.gallery.badgePage'),
      });
    });
  } else if (legacyHomepageScreenshot) {
    // Older reports generated before per-page screenshots existed
    const src = screenshotUrl(legacyHomepageScreenshot);
    if (src) {
      galleryItems.push({ src, caption: t('show.gallery.homepage'), code: report.site_url, badge: t('show.gallery.badgeOverview') });
    }
  }
  brokenLinks.forEach((link) => {
    const l = link as Record<string, unknown>;
    const src = typeof l.screenshot === 'string' ? screenshotUrl(l.screenshot) : null;
    if (src) {
      galleryItems.push({
        src,
        caption: String(l.url ?? ''),
        code: l.found_on ? `${t('show.broken.foundOn')}: ${String(l.found_on)}` : undefined,
        badge: t('show.gallery.badgeBrokenLink'),
      });
    }
  });
  brokenImages.forEach((img) => {
    const im = img as Record<string, unknown>;
    const src = typeof im.screenshot === 'string' ? screenshotUrl(im.screenshot) : null;
    if (src) {
      galleryItems.push({
        src,
        caption: String(im.url ?? ''),
        code: im.found_on ? `${t('show.broken.foundOn')}: ${String(im.found_on)}` : undefined,
        badge: t('show.gallery.badgeBrokenImage'),
      });
    }
  });
  getArr(contrastForGallery, 'violations').forEach((v) => {
    const vv = v as Record<string, unknown>;
    const src = typeof vv.screenshot === 'string' ? screenshotUrl(vv.screenshot) : null;
    if (src) {
      galleryItems.push({
        src,
        caption: t('show.accessibility.colorContrast'),
        code: vv.selector ? String(vv.selector) : undefined,
        badge: t('show.gallery.badgeContrast'),
      });
    }
  });

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
              <span className="text-lg font-bold text-gray-900 dark:text-white">{agency?.name ?? 'Website Audit'}</span>
            )}
          </div>
          <a
            href={`/shared/${report.share_uuid}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            {t('show.downloadPdf')}
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
                <span className="text-[10px] text-gray-600 dark:text-gray-400">{t('show.score')}</span>
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
                    className="mt-0.5 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 transition-colors"
                  >
                    {report.site_url} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Score deductions — prioritized "top fixes" list */}
          {report.score_deductions && report.score_deductions.length > 0 && (
            <TopFixes deductions={report.score_deductions} t={t} />
          )}

          {/* Screenshot gallery */}
          {galleryItems.length > 0 && (
            <Section title={t('show.gallery.title')} icon={ImageIcon} color="text-fuchsia-600" bg="bg-fuchsia-100" border="border-fuchsia-200" defaultOpen={true} help={t('explain.gallery')}>
              <div className="p-4">
                <ScreenshotGallery items={galleryItems} />
              </div>
            </Section>
          )}

          {/* Audit sections */}
          <div className="space-y-3">

            {/* SEO */}
            <Section title={t('show.sections.seo')} icon={Search} color="text-violet-600" bg="bg-violet-100" border="border-violet-200" defaultOpen={true} help={t('explain.sections.seo')}>
              {seo ? (
                <div className="divide-y divide-gray-100">
                  <MetaRow label={t('show.seo.metaTitle')} help={t('explain.seo.metaTitle')} value={getStr(seoMeta, 'status')} ok={getStr(seoMeta, 'status') === 'OK'} />
                  <MetaRow label={t('show.seo.metaDesc')} help={t('explain.seo.metaDesc')} value={getStr(seoDesc, 'status')} ok={getStr(seoDesc, 'status') === 'OK'} />
                  <MetaRow label={t('show.seo.h1')} help={t('explain.seo.h1')} value={`${getNum(seoH1, 'count') ?? '?'} (${getStr(seoH1, 'status')})`} ok={getStr(seoH1, 'status') === 'OK'} />
                  <MetaRow label={t('show.seo.canonical')} help={t('explain.seo.canonical')} value={getStr(seoCanonical, 'status')} ok={getStr(seoCanonical, 'status') === 'OK'} />
                  <MetaRow label={t('show.seo.schema')} help={t('explain.seo.schema')} value={getBool(seoSchema, 'has_valid_schema') ? t('common.valid') : t('common.invalid')} ok={getBool(seoSchema, 'has_valid_schema') ?? undefined} />
                  <MetaRow label={t('show.seo.og')} help={t('explain.seo.og')} value={getStr(seoOg, 'status')} ok={getStr(seoOg, 'status') === 'OK'} />
                  <MetaRow label={t('show.seo.images')} help={t('explain.seo.images')} value={seoAlt ? `${getNum(seoAlt, 'missing_alt') ?? 0} missing / ${getNum(seoAlt, 'total_images') ?? '?'} total` : t('common.na')} ok={seoAlt ? getStr(seoAlt, 'status') === 'OK' : undefined} />
                  <MetaRow label={t('show.seo.robots')} help={t('explain.seo.robots')} value={getBool(seoRobots, 'exists') === true ? t('common.found') : getBool(seoRobots, 'exists') === false ? t('common.missing') : t('common.na')} ok={getBool(seoRobots, 'exists') ?? undefined} />
                  <MetaRow label={t('show.seo.sitemap')} help={t('explain.seo.sitemap')} value={getBool(seoSitemap, 'exists') === true ? t('common.found') : getBool(seoSitemap, 'exists') === false ? t('common.missing') : t('common.na')} ok={getBool(seoSitemap, 'exists') ?? undefined} />
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t('show.noData')}</p>}
            </Section>

            {/* Security */}
            <Section title={t('show.sections.security')} icon={Shield} color="text-blue-600" bg="bg-blue-100" border="border-blue-200" help={t('explain.sections.security')}>
              {sec ? (
                <div className="divide-y divide-gray-100">
                  <MetaRow label={t('show.security.ssl')} help={t('explain.security.ssl')} value={getBool(secSsl, 'ssl_valid') ? `${t('common.valid')} — ${getStr(secSsl, 'ssl_issuer')} (${getNum(secSsl, 'ssl_days_left')} days left, expires ${getStr(secSsl, 'ssl_expiry')})` : getStr(secSsl, 'error') || t('common.na')} ok={getBool(secSsl, 'ssl_valid') ?? undefined} />
                  <MetaRow label={t('show.security.redirect')} help={t('explain.security.httpsRedirect')} value={getBool(secRedirect, 'redirects_to_https') === true ? t('common.yes') : getBool(secRedirect, 'redirects_to_https') === false ? t('common.no') : t('common.na')} ok={getBool(secRedirect, 'redirects_to_https') ?? undefined} />
                  <MetaRow label={t('show.security.mixed')} help={t('explain.security.mixed')} value={getBool(secMixed, 'has_mixed_content') ? t('common.detected') : t('common.none')} ok={getBool(secMixed, 'has_mixed_content') === false} />
                  <MetaRow label={t('show.security.hsts')} help={t('explain.security.hsts')} value={hasKey(secHdrsPresent, 'Strict-Transport-Security') ? String(secHdrsPresent!['Strict-Transport-Security']) : t('common.missing')} ok={hasKey(secHdrsPresent, 'Strict-Transport-Security')} />
                  <MetaRow label={t('show.security.csp')} help={t('explain.security.csp')} value={hasKey(secHdrsPresent, 'Content-Security-Policy') ? t('common.present') : t('common.missing')} ok={hasKey(secHdrsPresent, 'Content-Security-Policy')} />
                  <MetaRow label={t('show.security.xFrameOptions')} help={t('explain.security.xFrameOptions')} value={hasKey(secHdrsPresent, 'X-Frame-Options') ? String(secHdrsPresent!['X-Frame-Options']) : t('common.missing')} ok={hasKey(secHdrsPresent, 'X-Frame-Options')} />
                  <MetaRow label={t('show.security.spf')} help={t('explain.security.spf')} value={getBool(secDns, 'spf_record_exists') ? getStr(secDns, 'spf_record') : t('common.missing')} ok={getBool(secDns, 'spf_record_exists') ?? undefined} />
                  <MetaRow label={t('show.security.dmarc')} help={t('explain.security.dmarc')} value={getBool(secDns, 'dmarc_record_exists') ? t('common.present') : t('common.missing')} ok={getBool(secDns, 'dmarc_record_exists') ?? undefined} />
                  <MetaRow label={t('show.security.dkim')} help={t('explain.security.dkim')} value={getBool(secDns, 'dkim_found') ? t('show.security.dkimFound', { selector: getStr(secDns, 'dkim_selector') }) : t('show.security.dkimNotFound')} ok={getBool(secDns, 'dkim_found') ?? undefined} />
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t('show.noData')}</p>}
            </Section>

            {/* Performance */}
            <Section title={t('show.sections.performance')} icon={BarChart3} color="text-emerald-600" bg="bg-emerald-100" border="border-emerald-200" help={t('explain.sections.performance')}>
              {perf ? (
                <div className="space-y-2 p-4">
                  <ModuleError result={perf} />
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    <MetaRow label={t('show.performance.pages')} help={t('explain.performance.pages')} value={perfPages ?? t('common.na')} />
                    <MetaRow label={t('show.performance.ttfb')} help={t('explain.performance.ttfb')} value={perfTtfb !== null ? `${perfTtfb} ms` : t('common.na')} ok={perfTtfb !== null ? perfTtfb < 800 : undefined} />
                    <MetaRow label={`${t('show.performance.fcp')} (Desktop)`} help={t('explain.performance.fcp')} value={perfFcp !== null ? `${perfFcp} ms` : t('common.na')} ok={perfFcp !== null ? perfFcp < 1800 : undefined} />
                    {perfMobile && getNum(perfMobile, 'fcp_ms') !== null && (
                      <MetaRow label={`${t('show.performance.fcp')} (Mobile)`} help={t('explain.performance.fcp')} value={`${getNum(perfMobile, 'fcp_ms')} ms`} ok={(getNum(perfMobile, 'fcp_ms') ?? 9999) < 1800} />
                    )}
                    <MetaRow label={`${t('show.performance.lcp')} (Desktop)`} help={t('explain.performance.lcp')} value={perfLcp !== null ? `${perfLcp} ms` : t('common.na')} ok={perfLcp !== null ? perfLcp < 2500 : undefined} />
                    {perfMobile && getNum(perfMobile, 'lcp_ms') !== null && (
                      <MetaRow label={`${t('show.performance.lcp')} (Mobile)`} help={t('explain.performance.lcp')} value={`${getNum(perfMobile, 'lcp_ms')} ms`} ok={(getNum(perfMobile, 'lcp_ms') ?? 9999) < 2500} />
                    )}
                    <MetaRow
                      label={t('show.performance.compression')}
                      help={t('explain.performance.compression')}
                      value={
                        perfCompression === true
                          ? t('show.performance.enabled')
                          : perfCompression === false
                            ? (perfCompressionMatters ? t('show.performance.disabled') : `${t('show.performance.disabled')} — ${t('show.performance.compressionNotNeeded')}`)
                            : t('common.na')
                      }
                      ok={perfCompression === false && !perfCompressionMatters ? true : (perfCompression ?? undefined)}
                    />
                    {perfPageAnalysis && (getArr(perfPageAnalysis, 'render_blocking_scripts').length + getArr(perfPageAnalysis, 'render_blocking_styles').length) > 0 && (
                      <MetaRow label={t('show.performance.renderBlocking')} help={t('explain.performance.renderBlocking')} value={`${getNum(perfPageAnalysis, 'total_render_blocking') ?? 0} ${t('show.performance.resources')}`} ok={getNum(perfPageAnalysis, 'total_render_blocking') === 0} />
                    )}
                    {perfPageAnalysis && getArr(perfPageAnalysis, 'unminified_assets').length > 0 && (
                      <MetaRow label={t('show.performance.minification')} help={t('explain.performance.minification')} value={`${getArr(perfPageAnalysis, 'unminified_assets').length} ${t('show.performance.filesOver10kb')}`} ok={false} />
                    )}
                  </div>
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t('show.noData')}</p>}
            </Section>

            {/* Broken Resources */}
            <Section title={t('show.sections.broken')} icon={Link2} color="text-red-500" bg="bg-red-100" border="border-red-200" help={t('explain.sections.broken')}>
              {broken ? (
                <div className="space-y-4 p-4">
                  <ModuleError result={broken} />
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    <MetaRow label={t('show.broken.totalLinks')} help={t('explain.broken.totalLinks')} value={getNum(brokenSummary, 'total_links_checked') ?? t('common.na')} />
                    <MetaRow label={t('show.broken.brokenLinks')} help={t('explain.broken.brokenLinks')} value={(() => { const count = getNum(brokenSummary, 'broken_links_count'); const total = getNum(brokenSummary, 'total_links_checked'); if (count === null) return t('common.na'); if (total && total > 0) return `${count} (${Math.round((count / total) * 100)}%)`; return String(count); })()} ok={(getNum(brokenSummary, 'broken_links_count') ?? 1) === 0} />
                    <MetaRow label={t('show.broken.totalImages')} help={t('explain.broken.totalImages')} value={getNum(brokenSummary, 'total_images_checked') ?? t('common.na')} />
                    <MetaRow label={t('show.broken.brokenImages')} help={t('explain.broken.brokenImages')} value={getNum(brokenSummary, 'broken_images_count') ?? t('common.na')} ok={(getNum(brokenSummary, 'broken_images_count') ?? 1) === 0} />
                  </div>
                  {brokenLinks.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        {t('show.broken.topBroken')} ({brokenLinks.length})
                        <InfoTooltip text={t('explain.broken.brokenLinks')} align="left" />
                      </p>
                      <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                        {brokenLinks.map((link, i) => {
                          const l = link as Record<string, unknown>;
                          return (
                            <div key={i} className="px-3 py-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <span className="break-all text-xs text-gray-700">{String(l.url ?? link)}</span>
                                {l.status_code != null && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">{String(l.status_code)}</span>}
                              </div>
                              {l.found_on != null && (
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">
                                  {t('show.broken.foundOn')}: <span className="text-gray-500">{String(l.found_on)}</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {brokenImages.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        {t('show.broken.brokenImages')} ({brokenImages.length})
                        <InfoTooltip text={t('explain.broken.brokenImages')} align="left" />
                      </p>
                      <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                        {brokenImages.map((img, i) => {
                          const im = img as Record<string, unknown>;
                          return (
                            <div key={i} className="px-3 py-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <span className="break-all text-xs text-gray-700">{String(im.url ?? img)}</span>
                                {im.status_code != null && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">{String(im.status_code)}</span>}
                              </div>
                              {im.found_on != null && (
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">
                                  {t('show.broken.foundOn')}: <span className="text-gray-500">{String(im.found_on)}</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t('show.noData')}</p>}
            </Section>

            {/* Catalog */}
            <Section title={t('show.sections.catalog')} icon={ShoppingCart} color="text-amber-600" bg="bg-amber-100" border="border-amber-200" help={t('explain.sections.catalog')}>
              {catalog ? (
                <div className="space-y-2 p-4">
                  <ModuleError result={catalog} />
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    <MetaRow label={t('show.catalog.crawled')} help={t('explain.catalog.crawled')} value={getNum(catalog, 'pages_crawled') ?? t('common.na')} />
                    <MetaRow label={t('show.catalog.productPages')} help={t('explain.catalog.productPages')} value={getNum(catalog, 'product_pages_found') ?? t('common.na')} />
                    <MetaRow label={t('show.catalog.products')} help={t('explain.catalog.products')} value={getNum(catalog, 'products_audited') ?? t('common.na')} />
                    <MetaRow label={t('show.catalog.broken')} help={t('explain.catalog.broken')} value={getNum(catalog, 'broken_products_count') ?? t('common.na')} ok={(getNum(catalog, 'broken_products_count') ?? 1) === 0} />
                    <MetaRow label={t('show.catalog.pct')} help={t('explain.catalog.pct')} value={catalogBrokenPct !== null ? `${catalogBrokenPct}%` : t('common.na')} ok={catalogBrokenPct !== null ? catalogBrokenPct === 0 : undefined} />
                    {catalogResults.length > 0 && (
                      <>
                        <MetaRow label={t('show.catalog.priceIssues')} help={t('explain.catalog.priceIssues')} value={catalogPriceIssues} ok={catalogPriceIssues === 0} />
                        <MetaRow label={t('show.catalog.stockMismatches')} help={t('explain.catalog.stockMismatches')} value={catalogStockMismatches} ok={catalogStockMismatches === 0} />
                      </>
                    )}
                  </div>
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t('show.noData')}</p>}
            </Section>

            {/* Tracking */}
            <Section title={t('show.sections.tracking')} icon={Tag} color="text-pink-500" bg="bg-pink-100" border="border-pink-200" help={t('explain.sections.tracking')}>
              {tracking ? (
                <div className="space-y-2 p-4">
                  <ModuleError result={tracking} />
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    <MetaRow label={t('show.tracking.ga4')} help={t('explain.tracking.ga4')} value={(() => { if (!trackGa4) return t('common.na'); const ids = getArr(trackGa4, 'ids'); return getBool(trackGa4, 'detected') ? `${t('common.yes')}${ids.length ? ` (${ids.join(', ')})` : ''}` : t('common.notDetected'); })()} ok={getBool(trackGa4, 'detected') ?? undefined} />
                    <MetaRow label={t('show.tracking.fb')} help={t('explain.tracking.fb')} value={(() => { if (!trackFb) return t('common.na'); const ids = getArr(trackFb, 'ids'); return getBool(trackFb, 'detected') ? `${t('common.yes')}${ids.length ? ` (${ids.join(', ')})` : ''}` : t('common.notDetected'); })()} ok={getBool(trackFb, 'detected') ?? undefined} />
                    <MetaRow label={t('show.tracking.tt')} help={t('explain.tracking.tt')} value={(() => { if (!trackTt) return t('common.na'); const ids = getArr(trackTt, 'ids'); return getBool(trackTt, 'detected') ? `${t('common.yes')}${ids.length ? ` (${ids.join(', ')})` : ''}` : t('common.notDetected'); })()} ok={getBool(trackTt, 'detected') ?? undefined} />
                  </div>
                </div>
              ) : <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t('show.noData')}</p>}
            </Section>

            {/* Accessibility */}
            <Section title={t('show.sections.accessibility')} icon={Accessibility} color="text-cyan-600" bg="bg-cyan-100" border="border-cyan-200" help={t('explain.sections.accessibility')}>
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
                            <span className="flex items-center gap-1.5 text-sm font-medium text-cyan-700">
                              {t('show.accessibility.score')}
                              <InfoTooltip text={t('explain.accessibility.score')} align="left" />
                            </span>
                            <span className={`text-lg font-bold ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{score}/100</span>
                          </div>
                        )}
                        <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                          <MetaRow label={t('show.accessibility.formLabels')} help={t('explain.accessibility.formLabels')} value={formLbl ? `${getNum(formLbl,'pass') ?? 0} pass, ${getNum(formLbl,'fail') ?? 0} fail` : t('common.na')} ok={statusOk(getStr(formLbl, 'status'))} />
                          <MetaRow label={t('show.accessibility.imageAlt')} help={t('explain.accessibility.imageAlt')} value={imgAlt ? `${getNum(imgAlt,'missing_count') ?? 0} missing of ${getNum(imgAlt,'total') ?? '?'}` : t('common.na')} ok={statusOk(getStr(imgAlt, 'status'))} />
                          <MetaRow label={t('show.accessibility.ariaLabels')} help={t('explain.accessibility.ariaLabels')} value={ariaLbl ? `${getNum(ariaLbl,'fail') ?? 0} violation(s)` : t('common.na')} ok={statusOk(getStr(ariaLbl, 'status'))} />
                          <MetaRow label={t('show.accessibility.headings')} help={t('explain.accessibility.headings')} value={headings ? `${getNum(headings,'total_headings') ?? 0} headings, ${getArr(headings,'issues').length} issue(s)` : t('common.na')} ok={statusOk(getStr(headings, 'status'))} />
                          <MetaRow label={t('show.accessibility.linkText')} help={t('explain.accessibility.linkText')} value={linkTxt ? `${getNum(linkTxt,'fail') ?? 0} vague link(s)` : t('common.na')} ok={statusOk(getStr(linkTxt, 'status'))} />
                          <MetaRow label={t('show.accessibility.langAttr')} help={t('explain.accessibility.langAttr')} value={lmarks ? (getBool(lmarks,'has_lang') ? getStr(lmarks,'lang') : t('common.missing')) : t('common.na')} ok={getBool(lmarks,'has_lang') ?? undefined} />
                          <MetaRow label={t('show.accessibility.mainLandmark')} help={t('explain.accessibility.mainLandmark')} value={lmarks ? (getBool(lmarks,'has_main') ? t('common.present') : t('common.missing')) : t('common.na')} ok={getBool(lmarks,'has_main') ?? undefined} />
                          <MetaRow label={t('show.accessibility.skipNav')} help={t('explain.accessibility.skipNav')} value={lmarks ? (getBool(lmarks,'has_skip_nav') ? t('common.found') : t('common.notFound')) : t('common.na')} ok={getBool(lmarks,'has_skip_nav') ?? undefined} />
                          <MetaRow label={t('show.accessibility.colorContrast')} help={t('explain.accessibility.colorContrast')} value={contrast ? `${getNum(contrast,'fail') ?? 0} violation(s) found` : t('common.na')} ok={statusOk(getStr(contrast, 'status'))} />
                        </div>

                        {getArr(headings, 'issues').length > 0 && (
                          <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                              {t('show.accessibility.headingIssues')}
                              <InfoTooltip text={t('explain.accessibility.headings')} align="left" />
                            </p>
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
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                              {t('show.accessibility.unlabeledInputs')} ({getArr(formLbl,'violations').length})
                              <InfoTooltip text={t('explain.accessibility.formLabels')} align="left" />
                            </p>
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                              {getArr(formLbl, 'violations').map((v, i) => {
                                const vv = v as Record<string,unknown>;
                                return (
                                  <div key={i} className="border-b border-gray-100 px-3 py-2 last:border-0 text-xs text-gray-500">
                                    <span className="text-red-500 font-mono">{String(vv.element ?? '')}{vv.type ? `[type=${String(vv.type)}]` : ''}</span>
                                    {!!vv.name && <span className="ml-2 text-gray-600 dark:text-gray-400">name="{String(vv.name)}"</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {getArr(ariaLbl, 'violations').length > 0 && (
                          <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                              {t('show.accessibility.ariaViolations')} ({getArr(ariaLbl,'violations').length})
                              <InfoTooltip text={t('explain.accessibility.ariaLabels')} align="left" />
                            </p>
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                              {getArr(ariaLbl, 'violations').map((v, i) => {
                                const vv = v as Record<string,unknown>;
                                return (
                                  <div key={i} className="border-b border-gray-100 px-3 py-2 last:border-0">
                                    <p className="text-xs text-red-500">{String(vv.issue ?? '')}</p>
                                    {!!vv.href && <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{String(vv.href ?? '')}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {getArr(contrast, 'violations').length > 0 && (
                          <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                              {t('show.accessibility.contrastViolations')} ({getArr(contrast,'violations').length})
                              <InfoTooltip text={t('explain.accessibility.colorContrast')} align="left" />
                            </p>
                            {contrast && <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{getStr(contrast,'note')}</p>}
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
              ) : <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t('show.noData')}</p>}
            </Section>

            {/* Fuzz Testing (opt-in) */}
            {report.fuzz_requested && (
              <Section title={t('show.sections.fuzz')} icon={Bug} color="text-orange-600" bg="bg-orange-100" border="border-orange-200" help={t('explain.fuzz.section')}>
                {fuzz ? (
                  <div className="space-y-4 p-4">
                    <ModuleError result={fuzz} />
                    {(() => {
                      const fuzzSummary  = getObj(fuzz, 'summary');
                      const fuzzFindings = getArr(fuzz, 'findings');
                      const fuzzTargets  = getNum(fuzz, 'targets_tested') ?? 0;
                      const severityColor = (sev: string) =>
                        sev === 'high' ? 'text-red-600 border-red-200 bg-red-50'
                        : sev === 'medium' ? 'text-amber-600 border-amber-200 bg-amber-50'
                        : 'text-gray-500 border-gray-200 bg-gray-50';

                      return (
                        <>
                          <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                            <MetaRow label={t('show.fuzz.targetsTested')} help={t('explain.fuzz.targetsTested')} value={getNum(fuzz, 'targets_tested') ?? 'N/A'} />
                            <MetaRow label={t('show.fuzz.requestsSent')} help={t('explain.fuzz.requestsSent')} value={getNum(fuzz, 'requests_sent') ?? 'N/A'} />
                            <MetaRow
                              label={t('show.fuzz.totalFindings')}
                              help={t('explain.fuzz.totalFindings')}
                              value={getNum(fuzzSummary, 'total_findings') ?? 0}
                              ok={(getNum(fuzzSummary, 'total_findings') ?? 0) === 0}
                            />
                          </div>

                          {fuzzFindings.length === 0 ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {fuzzTargets === 0 ? t('show.fuzz.noTargets') : t('show.fuzz.noFindings')}
                            </p>
                          ) : (
                            <div>
                              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                {t('show.fuzz.findingsTitle')} ({fuzzFindings.length})
                                <InfoTooltip text={t('explain.fuzz.findings')} align="left" />
                              </p>
                              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                                {fuzzFindings.map((finding, i) => {
                                  const f = finding as Record<string, unknown>;
                                  return (
                                    <div key={i} className={`px-3 py-2.5 border-l-2 ${severityColor(String(f.severity ?? ''))}`}>
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-semibold">{t(`show.fuzz.types.${String(f.type ?? '')}`, String(f.type ?? ''))}</span>
                                        <span className="shrink-0 rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">{String(f.status_code ?? '')}</span>
                                      </div>
                                      <p className="mt-1 text-xs text-gray-600">{String(f.evidence ?? '')}</p>
                                      <p className="mt-1 break-all font-mono text-[11px] text-gray-500">
                                        {t('show.fuzz.param')}: <span className="text-gray-700">{String(f.param ?? '')}</span>
                                      </p>
                                      <p className="mt-0.5 break-all font-mono text-[11px] text-gray-500">{String(f.url ?? '')}</p>
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
                ) : <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t('show.noData')}</p>}
              </Section>
            )}

          </div>
        </div>
      </main>

      {/* Agency footer */}
      <footer style={{ backgroundColor: secondary }} className="py-6 text-center">
        <p className="text-sm text-gray-600 dark:text-white/70">
          {agency?.footer_text ?? (agency?.name ? `Report by ${agency.name}` : 'Website Audit Report')}
        </p>
      </footer>
    </>
  );
}
