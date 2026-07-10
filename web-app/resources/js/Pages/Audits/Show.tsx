import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { PageProps, FullAuditReport } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InfoTooltip from '@/Components/InfoTooltip';
import ScreenshotGallery, { GalleryItem } from '@/Components/ScreenshotGallery';
import { screenshotUrl } from '@/lib/screenshot';
import { Image as ImageIcon } from 'lucide-react';

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
  Share2,
  Copy,
  Check,
  Bug,
  Bot,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

interface ShowProps extends PageProps {
  report: FullAuditReport;
  matchedSiteId?: number | null;
  siteAgent?: { id: number; is_online: boolean } | null;
}

function healthColor(score?: number): string {
  if (score === undefined || score === null) return 'text-gray-600 dark:text-gray-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function healthRingColor(score?: number): string {
  if (score === undefined || score === null) return 'border-gray-300 dark:border-gray-600';
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
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
  help?: string;
}

function Section({ title, icon: Icon, color, bg, border, children, defaultOpen = false, help }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className="flex w-full items-center justify-between bg-white dark:bg-gray-900 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
            {title}
            {help && <InfoTooltip text={help} align="left" />}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        )}
      </div>
      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
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

function MetaRow({ label, value, ok, help }: { label: string; value: React.ReactNode; ok?: boolean; help?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-200 dark:border-gray-800 last:border-0">
      <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 shrink-0">
        {label}
        {help && <InfoTooltip text={help} />}
      </span>
      <div className="flex items-center gap-1.5 text-right">
        {ok === true && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
        {ok === false && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
        <span className="text-sm text-gray-800 dark:text-gray-200">{value ?? 'N/A'}</span>
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

function FixWithAiCard({
  variant, siteAgent, matchedSiteId, reportId, t,
}: {
  variant: 'compact' | 'banner';
  siteAgent: { id: number; is_online: boolean } | null | undefined;
  matchedSiteId: number | null | undefined;
  reportId: number;
  t: (key: string) => string;
}) {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done'>('idle');
  const [copied, setCopied] = useState(false);
  const claudePrompt = t('show.fixWithAi.claudePrompt');

  const setupHref = matchedSiteId
    ? `/agent?site_id=${matchedSiteId}&from_report=${reportId}`
    : `/agent?from_report=${reportId}`;
  const reconnectHref = `/agent?site_id=${matchedSiteId ?? ''}`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(claudePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const doSync = () => {
    if (!siteAgent) return;
    setSyncState('syncing');
    router.post(`/agent/${siteAgent.id}/sync`, { report_id: reportId }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => setSyncState('done'),
      onError: () => setSyncState('idle'),
    });
  };

  // State A — no agent registered yet for this site
  if (!siteAgent) {
    if (variant === 'compact') {
      return (
        <Link href={setupHref} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors">
          <Bot className="h-4 w-4" /> {t('show.fixWithAi.cta')}
        </Link>
      );
    }
    return (
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t('show.fixWithAi.title')}</p>
              <p className="text-xs text-violet-600/80 dark:text-violet-400/80">{t('show.fixWithAi.setupHint')}</p>
            </div>
          </div>
          <Link href={setupHref} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors shrink-0">
            <Bot className="h-4 w-4" /> {t('show.fixWithAi.cta')}
          </Link>
        </div>
      </div>
    );
  }

  // State C — agent registered but offline
  if (!siteAgent.is_online) {
    if (variant === 'compact') {
      return (
        <Link href={reconnectHref} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors">
          <WifiOff className="h-4 w-4" /> {t('show.fixWithAi.offlineTitle')}
        </Link>
      );
    }
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/5 p-5">
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t('show.fixWithAi.offlineTitle')}</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-500/80">{t('show.fixWithAi.offlineHint')}</p>
            </div>
          </div>
          <Link href={reconnectHref} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors shrink-0">
            {t('show.fixWithAi.reconnectCta')}
          </Link>
        </div>
      </div>
    );
  }

  // State B — agent online, already synced this session
  if (syncState === 'done') {
    if (variant === 'compact') {
      return (
        <button onClick={copyPrompt} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {t('show.fixWithAi.syncedHint')}
        </button>
      );
    }
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('show.fixWithAi.syncedHint')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2">
          <code className="flex-1 text-xs font-mono text-gray-300">{claudePrompt}</code>
          <button onClick={copyPrompt} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // State B — agent online, not yet synced this session
  if (variant === 'compact') {
    return (
      <button onClick={doSync} disabled={syncState === 'syncing'}
        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors">
        {syncState === 'syncing' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
        {t('show.fixWithAi.syncCta')}
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-violet-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t('show.fixWithAi.title')}</p>
            <p className="text-xs text-violet-600/80 dark:text-violet-400/80">{t('show.fixWithAi.onlineHint')}</p>
          </div>
        </div>
        <button onClick={doSync} disabled={syncState === 'syncing'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors shrink-0">
          {syncState === 'syncing' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          {t('show.fixWithAi.syncCta')}
        </button>
      </div>
    </div>
  );
}

export default function AuditShow({ report, matchedSiteId, siteAgent }: ShowProps) {
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
  const fuzz = report.fuzz_testing_result;

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
  const perfCompressionMatters = getBool(perfPageAnalysis, 'compression_worth_flagging');

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

  // Screenshot gallery — visual evidence captured during the scan
  const perfScreenshots = getObj(perf, 'screenshots');
  const perfPageShots = getArr(perfScreenshots, 'pages');
  const legacyHomepageScreenshot = perfScreenshots && typeof perfScreenshots['homepage'] === 'string' ? String(perfScreenshots['homepage']) : null;
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

  const user = (usePage().props as PageProps).auth.user;
  const isAgency = user?.is_agency === true;

  const { post: toggleSharePost, processing: shareProcessing } = useForm({});
  const [copied, setCopied] = useState(false);

  const shareUrl = report.share_uuid
    ? `${window.location.origin}/shared/${report.share_uuid}`
    : null;

  const copyShareUrl = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AppLayout>
      <Head title={`Audit — ${report.site_url}`} />

      <div className="space-y-6">
        {/* Back */}
        <Link
          href="/audits"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('show.backToAudits')}
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:flex-row sm:items-center sm:justify-between">
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white break-all">
                {report.name ?? report.site_url}
              </h1>
              {report.name && (
                <a
                  href={report.site_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-violet-400 transition-colors"
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
              <FixWithAiCard variant="compact" siteAgent={siteAgent} matchedSiteId={matchedSiteId} reportId={report.id} t={t} />
              <a
                href={`/audits/${report.id}/export/pdf`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <FileDown className="h-4 w-4" />
                {t('show.pdf')}
              </a>
              <a
                href={`/audits/${report.id}/export/csv`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <FileDown className="h-4 w-4" />
                {t('show.csv')}
              </a>
            </div>
          )}
        </div>

        {/* Share link — agency users only */}
        {isAgency && report.status === 'completed' && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">{t('show.shareTitle')}</p>
                  <p className="text-xs text-amber-300/60 mt-0.5">{t('show.shareSub')}</p>
                </div>
              </div>
              <button
                onClick={() => toggleSharePost(route('audits.share.toggle', report.id))}
                disabled={shareProcessing}
                className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                  report.share_enabled
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-amber-500 text-white hover:bg-amber-400'
                }`}
              >
                <Share2 className="h-4 w-4" />
                {report.share_enabled ? t('show.shareDisable') : t('show.shareEnable')}
              </button>
            </div>

            {report.share_enabled && shareUrl && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono select-all"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyShareUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    {copied ? t('show.shareCopied') : t('show.shareCopy')}
                  </button>
                </div>
                <p className="text-xs text-amber-300/50">{t('show.shareNote')}</p>
              </div>
            )}
          </div>
        )}

        {/* Running state — live progress */}
        {report.status === 'running' && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500 dark:text-gray-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('show.running')} — {progress ? `${progress.completed}/${progress.total}` : '0/6'} {t('show.runningModules')}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-1.5 rounded-full bg-violet-600 transition-all duration-500"
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
                ...(report.fuzz_requested ? [{ key: 'fuzz_testing', label: t('show.sections.fuzz') }] : []),
              ].map(({ key, label }) => {
                const done = progress?.auditors?.[key] === 'done';
                return (
                  <div key={key} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border ${done ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
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
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('show.deductionsTitle')}</h3>
            </div>
            <ul className="space-y-1">
              {report.score_deductions.map((d, i) => (
                <li key={i} className="text-sm text-amber-700 dark:text-amber-400">
                  • {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fix with AI banner — natural next step right after seeing what's wrong */}
        {report.status === 'completed' && report.score_deductions && report.score_deductions.length > 0 && (
          <FixWithAiCard variant="banner" siteAgent={siteAgent} matchedSiteId={matchedSiteId} reportId={report.id} t={t} />
        )}

        {/* Screenshot gallery */}
        {galleryItems.length > 0 && (
          <Section
            title={t('show.gallery.title')}
            icon={ImageIcon}
            color="text-fuchsia-400"
            bg="bg-fuchsia-500/10"
            border="border-fuchsia-500/20"
            defaultOpen={true}
            help={t('explain.gallery')}
          >
            <ScreenshotGallery items={galleryItems} />
          </Section>
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
            help={t('explain.sections.seo')}
          >
            {seo ? (
              <div className="divide-y divide-gray-800">
                <MetaRow
                  label={t('show.seo.metaTitle')}
                  help={t('explain.seo.metaTitle')}
                  value={getStr(seoMeta, 'status')}
                  ok={getStr(seoMeta, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.metaDesc')}
                  help={t('explain.seo.metaDesc')}
                  value={getStr(seoDesc, 'status')}
                  ok={getStr(seoDesc, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.h1')}
                  help={t('explain.seo.h1')}
                  value={`${getNum(seoH1, 'count') ?? '?'} (${getStr(seoH1, 'status')})`}
                  ok={getStr(seoH1, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.canonical')}
                  help={t('explain.seo.canonical')}
                  value={getStr(seoCanonical, 'status')}
                  ok={getStr(seoCanonical, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.schema')}
                  help={t('explain.seo.schema')}
                  value={getBool(seoSchema, 'has_valid_schema') ? t('common.valid') : t('common.invalid')}
                  ok={getBool(seoSchema, 'has_valid_schema') ?? undefined}
                />
                <MetaRow
                  label={t('show.seo.og')}
                  help={t('explain.seo.og')}
                  value={getStr(seoOg, 'status')}
                  ok={getStr(seoOg, 'status') === 'OK'}
                />
                <MetaRow
                  label={t('show.seo.images')}
                  help={t('explain.seo.images')}
                  value={seoAlt
                    ? `${getNum(seoAlt, 'missing_alt') ?? 0} missing / ${getNum(seoAlt, 'total_images') ?? '?'} total`
                    : t('common.na')}
                  ok={seoAlt ? getStr(seoAlt, 'status') === 'OK' : undefined}
                />
                <MetaRow
                  label={t('show.seo.robots')}
                  help={t('explain.seo.robots')}
                  value={getBool(seoRobots, 'exists') === true ? t('common.found') : getBool(seoRobots, 'exists') === false ? t('common.missing') : t('common.na')}
                  ok={getBool(seoRobots, 'exists') ?? undefined}
                />
                <MetaRow
                  label={t('show.seo.sitemap')}
                  help={t('explain.seo.sitemap')}
                  value={getBool(seoSitemap, 'exists') === true ? t('common.found') : getBool(seoSitemap, 'exists') === false ? t('common.missing') : t('common.na')}
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
            help={t('explain.sections.security')}
          >
            {sec ? (
              <div className="divide-y divide-gray-800">
                {/* SSL */}
                <MetaRow
                  label={t('show.security.ssl')}
                  help={t('explain.security.ssl')}
                  value={
                    getBool(secSsl, 'ssl_valid')
                      ? `${t('common.valid')} — ${getStr(secSsl, 'ssl_issuer')} (${getNum(secSsl, 'ssl_days_left')} days left, expires ${getStr(secSsl, 'ssl_expiry')})`
                      : getStr(secSsl, 'error') || t('common.na')
                  }
                  ok={getBool(secSsl, 'ssl_valid') ?? undefined}
                />
                {/* HTTPS redirect */}
                <MetaRow
                  label={t('show.security.redirect')}
                  help={t('explain.security.httpsRedirect')}
                  value={getBool(secRedirect, 'redirects_to_https') === true ? t('common.yes') : getBool(secRedirect, 'redirects_to_https') === false ? t('common.no') : t('common.na')}
                  ok={getBool(secRedirect, 'redirects_to_https') ?? undefined}
                />
                {/* Mixed content */}
                <MetaRow
                  label={t('show.security.mixed')}
                  help={t('explain.security.mixed')}
                  value={getBool(secMixed, 'has_mixed_content') ? t('common.detected') : t('common.none')}
                  ok={getBool(secMixed, 'has_mixed_content') === false}
                />
                {/* Security headers — headers_present only contains headers that ARE present */}
                <MetaRow
                  label={t('show.security.hsts')}
                  help={t('explain.security.hsts')}
                  value={hasKey(secHdrsPresent, 'Strict-Transport-Security')
                    ? String(secHdrsPresent!['Strict-Transport-Security'])
                    : t('common.missing')}
                  ok={hasKey(secHdrsPresent, 'Strict-Transport-Security')}
                />
                <MetaRow
                  label={t('show.security.csp')}
                  help={t('explain.security.csp')}
                  value={hasKey(secHdrsPresent, 'Content-Security-Policy') ? t('common.present') : t('common.missing')}
                  ok={hasKey(secHdrsPresent, 'Content-Security-Policy')}
                />
                <MetaRow
                  label={t('show.security.xFrameOptions')}
                  help={t('explain.security.xFrameOptions')}
                  value={hasKey(secHdrsPresent, 'X-Frame-Options')
                    ? String(secHdrsPresent!['X-Frame-Options'])
                    : t('common.missing')}
                  ok={hasKey(secHdrsPresent, 'X-Frame-Options')}
                />
                {/* DNS */}
                <MetaRow
                  label={t('show.security.spf')}
                  help={t('explain.security.spf')}
                  value={getBool(secDns, 'spf_record_exists') ? getStr(secDns, 'spf_record') : t('common.missing')}
                  ok={getBool(secDns, 'spf_record_exists') ?? undefined}
                />
                <MetaRow
                  label={t('show.security.dmarc')}
                  help={t('explain.security.dmarc')}
                  value={getBool(secDns, 'dmarc_record_exists') ? t('common.present') : t('common.missing')}
                  ok={getBool(secDns, 'dmarc_record_exists') ?? undefined}
                />
                <MetaRow
                  label={t('show.security.dkim')}
                  help={t('explain.security.dkim')}
                  value={getBool(secDns, 'dkim_found') ? t('show.security.dkimFound', { selector: getStr(secDns, 'dkim_selector') }) : t('show.security.dkimNotFound')}
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
            help={t('explain.sections.performance')}
          >
            {perf ? (
              <div className="space-y-2">
                <ModuleError result={perf} />
                <div className="divide-y divide-gray-800">
                <MetaRow label={t('show.performance.pages')} help={t('explain.performance.pages')} value={perfPages ?? t('common.na')} />
                <MetaRow
                  label={t('show.performance.ttfb')}
                  help={t('explain.performance.ttfb')}
                  value={perfTtfb !== null ? `${perfTtfb} ms` : t('common.na')}
                  ok={perfTtfb !== null ? perfTtfb < 800 : undefined}
                />
                <MetaRow
                  label={`${t('show.performance.fcp')} (Desktop)`}
                  help={t('explain.performance.fcp')}
                  value={perfFcp !== null ? `${perfFcp} ms` : t('common.na')}
                  ok={perfFcp !== null ? perfFcp < 1800 : undefined}
                />
                {perfMobile && getNum(perfMobile, 'fcp_ms') !== null && (
                  <MetaRow
                    label={`${t('show.performance.fcp')} (Mobile)`}
                    help={t('explain.performance.fcp')}
                    value={`${getNum(perfMobile, 'fcp_ms')} ms`}
                    ok={(getNum(perfMobile, 'fcp_ms') ?? 9999) < 1800}
                  />
                )}
                <MetaRow
                  label={`${t('show.performance.lcp')} (Desktop)`}
                  help={t('explain.performance.lcp')}
                  value={perfLcp !== null ? `${perfLcp} ms` : t('common.na')}
                  ok={perfLcp !== null ? perfLcp < 2500 : undefined}
                />
                {perfMobile && getNum(perfMobile, 'lcp_ms') !== null && (
                  <MetaRow
                    label={`${t('show.performance.lcp')} (Mobile)`}
                    help={t('explain.performance.lcp')}
                    value={`${getNum(perfMobile, 'lcp_ms')} ms`}
                    ok={(getNum(perfMobile, 'lcp_ms') ?? 9999) < 2500}
                  />
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
                  <MetaRow
                    label={t('show.performance.renderBlocking')}
                    help={t('explain.performance.renderBlocking')}
                    value={`${getNum(perfPageAnalysis, 'total_render_blocking') ?? 0} ${t('show.performance.resources')}`}
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
            help={t('explain.sections.broken')}
          >
            {broken ? (
              <div className="space-y-4">
                <ModuleError result={broken} />
                <div className="divide-y divide-gray-800">
                  <MetaRow
                    label={t('show.broken.totalLinks')}
                    help={t('explain.broken.totalLinks')}
                    value={getNum(brokenSummary, 'total_links_checked') ?? t('common.na')}
                  />
                  <MetaRow
                    label={t('show.broken.brokenLinks')}
                    help={t('explain.broken.brokenLinks')}
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
                    help={t('explain.broken.totalImages')}
                    value={getNum(brokenSummary, 'total_images_checked') ?? t('common.na')}
                  />
                  <MetaRow
                    label={t('show.broken.brokenImages')}
                    help={t('explain.broken.brokenImages')}
                    value={getNum(brokenSummary, 'broken_images_count') ?? t('common.na')}
                    ok={(getNum(brokenSummary, 'broken_images_count') ?? 1) === 0}
                  />
                </div>

                {brokenLinks.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('show.broken.topBroken')} ({brokenLinks.length})
                      <InfoTooltip text={t('explain.broken.brokenLinks')} align="left" />
                    </p>
                    <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-800">
                      {brokenLinks.map((link, i) => {
                        const l = link as Record<string, unknown>;
                        return (
                          <div key={i} className="px-3 py-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <span className="break-all text-xs text-gray-700 dark:text-gray-300">{String(l.url ?? link)}</span>
                              {l.status_code != null && (
                                <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-400">
                                  {String(l.status_code)}
                                </span>
                              )}
                            </div>
                            {l.found_on != null && (
                              <p className="mt-1 text-xs text-gray-600 break-all">
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
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t('show.broken.brokenImages')} ({brokenImages.length})
                      <InfoTooltip text={t('explain.broken.brokenImages')} align="left" />
                    </p>
                    <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-800">
                      {brokenImages.map((img, i) => {
                        const im = img as Record<string, unknown>;
                        return (
                          <div key={i} className="px-3 py-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <span className="break-all text-xs text-gray-700 dark:text-gray-300">{String(im.url ?? img)}</span>
                              {im.status_code != null && (
                                <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-400">
                                  {String(im.status_code)}
                                </span>
                              )}
                            </div>
                            {im.found_on != null && (
                              <p className="mt-1 text-xs text-gray-600 break-all">
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
            help={t('explain.sections.catalog')}
          >
            {catalog ? (
              <div className="space-y-2">
                <ModuleError result={catalog} />
                <div className="divide-y divide-gray-800">
                <MetaRow label={t('show.catalog.crawled')} help={t('explain.catalog.crawled')} value={getNum(catalog, 'pages_crawled') ?? t('common.na')} />
                <MetaRow label={t('show.catalog.productPages')} help={t('explain.catalog.productPages')} value={getNum(catalog, 'product_pages_found') ?? t('common.na')} />
                <MetaRow label={t('show.catalog.products')} help={t('explain.catalog.products')} value={getNum(catalog, 'products_audited') ?? t('common.na')} />
                <MetaRow
                  label={t('show.catalog.broken')}
                  help={t('explain.catalog.broken')}
                  value={getNum(catalog, 'broken_products_count') ?? t('common.na')}
                  ok={(getNum(catalog, 'broken_products_count') ?? 1) === 0}
                />
                <MetaRow
                  label={t('show.catalog.pct')}
                  help={t('explain.catalog.pct')}
                  value={catalogBrokenPct !== null ? `${catalogBrokenPct}%` : t('common.na')}
                  ok={catalogBrokenPct !== null ? catalogBrokenPct === 0 : undefined}
                />
                {catalogResults.length > 0 && (
                  <>
                    <MetaRow
                      label={t('show.catalog.priceIssues')}
                      help={t('explain.catalog.priceIssues')}
                      value={catalogPriceIssues}
                      ok={catalogPriceIssues === 0}
                    />
                    <MetaRow
                      label={t('show.catalog.stockMismatches')}
                      help={t('explain.catalog.stockMismatches')}
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
            help={t('explain.sections.tracking')}
          >
            {tracking ? (
              <div className="space-y-2">
                <ModuleError result={tracking} />
                <div className="divide-y divide-gray-800">
                <MetaRow
                  label={t('show.tracking.ga4')}
                  help={t('explain.tracking.ga4')}
                  value={(() => {
                    if (!trackGa4) return t('common.na');
                    const ids = getArr(trackGa4, 'ids');
                    return getBool(trackGa4, 'detected') ? `${t('common.yes')}${ids.length ? ` (${ids.join(', ')})` : ''}` : t('common.notDetected');
                  })()}
                  ok={getBool(trackGa4, 'detected') ?? undefined}
                />
                <MetaRow
                  label={t('show.tracking.fb')}
                  help={t('explain.tracking.fb')}
                  value={(() => {
                    if (!trackFb) return t('common.na');
                    const ids = getArr(trackFb, 'ids');
                    return getBool(trackFb, 'detected') ? `${t('common.yes')}${ids.length ? ` (${ids.join(', ')})` : ''}` : t('common.notDetected');
                  })()}
                  ok={getBool(trackFb, 'detected') ?? undefined}
                />
                <MetaRow
                  label={t('show.tracking.tt')}
                  help={t('explain.tracking.tt')}
                  value={(() => {
                    if (!trackTt) return t('common.na');
                    const ids = getArr(trackTt, 'ids');
                    return getBool(trackTt, 'detected') ? `${t('common.yes')}${ids.length ? ` (${ids.join(', ')})` : ''}` : t('common.notDetected');
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
            help={t('explain.sections.accessibility')}
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
                          <span className="flex items-center gap-1.5 text-sm font-medium text-cyan-300">
                            {t('show.accessibility.score')}
                            <InfoTooltip text={t('explain.accessibility.score')} align="left" />
                          </span>
                          <span className={`text-lg font-bold ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{score}/100</span>
                        </div>
                      )}

                      <div className="divide-y divide-gray-800">
                        {/* Form labels */}
                        <MetaRow
                          label={t('show.accessibility.formLabels')}
                          help={t('explain.accessibility.formLabels')}
                          value={formLbl ? `${getNum(formLbl,'pass') ?? 0} pass, ${getNum(formLbl,'fail') ?? 0} fail` : t('common.na')}
                          ok={statusOk(getStr(formLbl, 'status'))}
                        />
                        {/* Image alt */}
                        <MetaRow
                          label={t('show.accessibility.imageAlt')}
                          help={t('explain.accessibility.imageAlt')}
                          value={imgAlt ? `${getNum(imgAlt,'missing_count') ?? 0} missing of ${getNum(imgAlt,'total') ?? '?'}` : t('common.na')}
                          ok={statusOk(getStr(imgAlt, 'status'))}
                        />
                        {/* ARIA */}
                        <MetaRow
                          label={t('show.accessibility.ariaLabels')}
                          help={t('explain.accessibility.ariaLabels')}
                          value={ariaLbl ? `${getNum(ariaLbl,'fail') ?? 0} violation(s)` : t('common.na')}
                          ok={statusOk(getStr(ariaLbl, 'status'))}
                        />
                        {/* Heading hierarchy */}
                        <MetaRow
                          label={t('show.accessibility.headings')}
                          help={t('explain.accessibility.headings')}
                          value={headings ? `${getNum(headings,'total_headings') ?? 0} headings, ${getArr(headings,'issues').length} issue(s)` : t('common.na')}
                          ok={statusOk(getStr(headings, 'status'))}
                        />
                        {/* Link text */}
                        <MetaRow
                          label={t('show.accessibility.linkText')}
                          help={t('explain.accessibility.linkText')}
                          value={linkTxt ? `${getNum(linkTxt,'fail') ?? 0} vague link(s)` : t('common.na')}
                          ok={statusOk(getStr(linkTxt, 'status'))}
                        />
                        {/* Landmarks */}
                        <MetaRow
                          label={t('show.accessibility.langAttr')}
                          help={t('explain.accessibility.langAttr')}
                          value={lmarks ? (getBool(lmarks,'has_lang') ? getStr(lmarks,'lang') : t('common.missing')) : t('common.na')}
                          ok={getBool(lmarks,'has_lang') ?? undefined}
                        />
                        <MetaRow
                          label={t('show.accessibility.mainLandmark')}
                          help={t('explain.accessibility.mainLandmark')}
                          value={lmarks ? (getBool(lmarks,'has_main') ? t('common.present') : t('common.missing')) : t('common.na')}
                          ok={getBool(lmarks,'has_main') ?? undefined}
                        />
                        <MetaRow
                          label={t('show.accessibility.skipNav')}
                          help={t('explain.accessibility.skipNav')}
                          value={lmarks ? (getBool(lmarks,'has_skip_nav') ? t('common.found') : t('common.notFound')) : t('common.na')}
                          ok={getBool(lmarks,'has_skip_nav') ?? undefined}
                        />
                        {/* Color contrast */}
                        <MetaRow
                          label={t('show.accessibility.colorContrast')}
                          help={t('explain.accessibility.colorContrast')}
                          value={contrast ? `${getNum(contrast,'fail') ?? 0} violation(s) found` : t('common.na')}
                          ok={statusOk(getStr(contrast, 'status'))}
                        />
                      </div>

                      {/* Heading issues */}
                      {getArr(headings, 'issues').length > 0 && (
                        <div>
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('show.accessibility.headingIssues')}
                            <InfoTooltip text={t('explain.accessibility.headings')} align="left" />
                          </p>
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
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('show.accessibility.unlabeledInputs')} ({getArr(formLbl,'violations').length})
                            <InfoTooltip text={t('explain.accessibility.formLabels')} align="left" />
                          </p>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
                            {getArr(formLbl, 'violations').map((v, i) => {
                              const vv = v as Record<string,unknown>;
                              return (
                                <div key={i} className="border-b border-gray-200 dark:border-gray-800 px-3 py-2 last:border-0 text-xs text-gray-600 dark:text-gray-400">
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
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('show.accessibility.ariaViolations')} ({getArr(ariaLbl,'violations').length})
                            <InfoTooltip text={t('explain.accessibility.ariaLabels')} align="left" />
                          </p>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
                            {getArr(ariaLbl, 'violations').map((v, i) => {
                              const vv = v as Record<string,unknown>;
                              return (
                                <div key={i} className="border-b border-gray-200 dark:border-gray-800 px-3 py-2 last:border-0">
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
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                            {t('show.accessibility.contrastViolations')} ({getArr(contrast,'violations').length})
                            <InfoTooltip text={t('explain.accessibility.colorContrast')} align="left" />
                          </p>
                          {contrast && <p className="mb-2 text-xs text-gray-600">{getStr(contrast,'note')}</p>}
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
                            {getArr(contrast, 'violations').map((v, i) => {
                              const vv = v as Record<string,unknown>;
                              return (
                                <div key={i} className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-3 py-2 last:border-0">
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="inline-block h-4 w-4 rounded border border-gray-300 dark:border-gray-700" style={{ background: String(vv.bg_color ?? '#000') }} />
                                    <span className="inline-block h-4 w-4 rounded border border-gray-300 dark:border-gray-700" style={{ background: String(vv.fg_color ?? '#fff') }} />
                                  </div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{vv.selector ? String(vv.selector) : String(vv.element ?? '')}</span>
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

          {/* Fuzz Testing (opt-in) */}
          {report.fuzz_requested && (
            <Section
              title={t('show.sections.fuzz')}
              icon={Bug}
              color="text-orange-400"
              bg="bg-orange-500/10"
              border="border-orange-500/20"
              help={t('explain.fuzz.section')}
            >
              {fuzz ? (
                <div className="space-y-4">
                  <ModuleError result={fuzz} />
                  {(() => {
                    const fuzzSummary  = getObj(fuzz, 'summary');
                    const fuzzFindings = getArr(fuzz, 'findings');
                    const fuzzTargets  = getNum(fuzz, 'targets_tested') ?? 0;
                    const severityColor = (sev: string) =>
                      sev === 'high' ? 'text-red-400 border-red-500/20 bg-red-500/5'
                      : sev === 'medium' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5'
                      : 'text-gray-400 border-gray-500/20 bg-gray-500/5';

                    return (
                      <>
                        <div className="divide-y divide-gray-800">
                          <MetaRow
                            label={t('show.fuzz.targetsTested')}
                            help={t('explain.fuzz.targetsTested')}
                            value={getNum(fuzz, 'targets_tested') ?? t('common.na')}
                          />
                          <MetaRow
                            label={t('show.fuzz.requestsSent')}
                            help={t('explain.fuzz.requestsSent')}
                            value={getNum(fuzz, 'requests_sent') ?? t('common.na')}
                          />
                          <MetaRow
                            label={t('show.fuzz.totalFindings')}
                            help={t('explain.fuzz.totalFindings')}
                            value={getNum(fuzzSummary, 'total_findings') ?? 0}
                            ok={(getNum(fuzzSummary, 'total_findings') ?? 0) === 0}
                          />
                        </div>

                        {fuzzFindings.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            {fuzzTargets === 0 ? t('show.fuzz.noTargets') : t('show.fuzz.noFindings')}
                          </p>
                        ) : (
                          <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                              {t('show.fuzz.findingsTitle')} ({fuzzFindings.length})
                              <InfoTooltip text={t('explain.fuzz.findings')} align="left" />
                            </p>
                            <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-800">
                              {fuzzFindings.map((finding, i) => {
                                const f = finding as Record<string, unknown>;
                                return (
                                  <div key={i} className={`px-3 py-2.5 border-l-2 ${severityColor(String(f.severity ?? ''))}`}>
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-xs font-semibold">{t(`show.fuzz.types.${String(f.type ?? '')}`, String(f.type ?? ''))}</span>
                                      <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">{String(f.status_code ?? '')}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{String(f.evidence ?? '')}</p>
                                    <p className="mt-1 break-all font-mono text-[11px] text-gray-500">
                                      {t('show.fuzz.param')}: <span className="text-gray-700 dark:text-gray-300">{String(f.param ?? '')}</span>
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
              ) : (
                <p className="text-sm text-gray-500">{t('show.noData')}</p>
              )}
            </Section>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
