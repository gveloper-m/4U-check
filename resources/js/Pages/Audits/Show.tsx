import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, FullAuditReport } from '@/types';
import { useEffect, useState } from 'react';
import {
  Search,
  Shield,
  BarChart3,
  Link2,
  ShoppingCart,
  Tag,
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
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-4 w-4" />
        Completed
      </span>
    );
  }
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-400 border border-violet-500/20">
        <Loader2 className="h-4 w-4 animate-spin" />
        Running
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400 border border-red-500/20">
      <XCircle className="h-4 w-4" />
      Failed
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

export default function AuditShow({ report: initialReport }: ShowProps) {
  const [report, setReport] = useState<FullAuditReport>(initialReport);

  useEffect(() => {
    if (report.status !== 'running') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/audits/${report.id}/status`, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!res.ok) return;
        const data = (await res.json()) as FullAuditReport;
        setReport(data);
        if (data.status !== 'running') {
          clearInterval(interval);
          // Full reload to get all module data
          router.reload({ only: ['report'] });
        }
      } catch {
        // ignore network errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [report.id, report.status]);

  const seo = report.seo_schema_result;
  const sec = report.security_result;
  const perf = report.performance_result;
  const broken = report.broken_resources_result;
  const catalog = report.catalog_result;
  const tracking = report.tracking_result;

  // SEO helpers
  const seoMeta = getObj(seo, 'meta_title') ?? getObj(seo, 'meta');
  const seoDesc = getObj(seo, 'meta_description');
  const seoH1 = getObj(seo, 'h1_tags') ?? seo;
  const seoCanonical = getObj(seo, 'canonical');
  const seoSchema = getObj(seo, 'schema_validation') ?? getObj(seo, 'schema');
  const seoOg = getObj(seo, 'open_graph');

  // Security helpers
  const secHeaders = getObj(sec, 'security_headers');

  // Performance helpers
  const perfPages = getNum(perf, 'pages_tested');
  const perfTtfb = getNum(perf, 'avg_ttfb');
  const perfFcp = getNum(perf, 'fcp') ?? getNum(perf, 'avg_fcp');
  const perfLcp = getNum(perf, 'lcp') ?? getNum(perf, 'avg_lcp');
  const perfCompression = getBool(perf, 'compression_detected');

  // Broken resources helpers
  const brokenSummary = getObj(broken, 'summary') ?? broken;
  const brokenLinks = getArr(broken, 'broken_links');

  // Catalog helpers
  const catalogBrokenPct = getNum(catalog, 'broken_percentage');

  // Tracking helpers
  const trackGa4 = getObj(tracking, 'ga4');
  const trackFb = getObj(tracking, 'facebook_pixel');
  const trackTt = getObj(tracking, 'tiktok_pixel');

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
          Back to audits
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
              <span className="text-[10px] text-gray-500">score</span>
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
                PDF
              </a>
              <a
                href={`/audits/${report.id}/export/csv`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
              >
                <FileDown className="h-4 w-4" />
                CSV
              </a>
            </div>
          )}
        </div>

        {/* Running state notice */}
        {report.status === 'running' && (
          <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/10 px-5 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            <p className="text-sm text-violet-300">
              Audit is running — results will appear automatically when ready.
            </p>
          </div>
        )}

        {/* Score deductions */}
        {report.score_deductions && report.score_deductions.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">Score Deductions</h3>
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
            title="SEO & Schema"
            icon={Search}
            color="text-violet-400"
            bg="bg-violet-500/10"
            border="border-violet-500/20"
            defaultOpen={true}
          >
            {seo ? (
              <div className="divide-y divide-gray-800">
                <MetaRow
                  label="Meta Title"
                  value={getStr(seoMeta, 'status') || getStr(seo, 'meta_title_status') || getStr(seo, 'meta_title')}
                  ok={getStr(seoMeta, 'status') === 'ok' || getStr(seo, 'meta_title_status') === 'ok'}
                />
                <MetaRow
                  label="Meta Description"
                  value={getStr(seoDesc, 'status') || getStr(seo, 'meta_description_status')}
                  ok={getStr(seoDesc, 'status') === 'ok' || getStr(seo, 'meta_description_status') === 'ok'}
                />
                <MetaRow
                  label="H1 Tags"
                  value={getNum(seo, 'h1_count') ?? getNum(seoH1, 'count') ?? getStr(seo, 'h1_tags')}
                />
                <MetaRow
                  label="Canonical URL"
                  value={getStr(seoCanonical, 'status') || getStr(seo, 'canonical_status')}
                  ok={getStr(seoCanonical, 'status') === 'ok' || getStr(seo, 'canonical_status') === 'ok'}
                />
                <MetaRow
                  label="Schema Markup"
                  value={getBool(seoSchema, 'has_valid_schema') ? 'Valid' : getBool(seoSchema, 'has_valid_schema') === false ? 'Missing/Invalid' : getStr(seo, 'schema_status')}
                  ok={getBool(seoSchema, 'has_valid_schema') ?? undefined}
                />
                <MetaRow
                  label="Open Graph"
                  value={getStr(seoOg, 'status') || getStr(seo, 'open_graph_status')}
                  ok={getStr(seoOg, 'status') === 'ok' || getStr(seo, 'open_graph_status') === 'ok'}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available.</p>
            )}
          </Section>

          {/* Security */}
          <Section
            title="Security"
            icon={Shield}
            color="text-blue-400"
            bg="bg-blue-500/10"
            border="border-blue-500/20"
          >
            {sec ? (
              <div className="divide-y divide-gray-800">
                <MetaRow
                  label="SSL Status"
                  value={getStr(sec, 'ssl_status')}
                  ok={getStr(sec, 'ssl_status') === 'ok' || getStr(sec, 'ssl_status') === 'valid'}
                />
                <MetaRow
                  label="Mixed Content"
                  value={getBool(sec, 'mixed_content') ? 'Detected' : 'None'}
                  ok={!getBool(sec, 'mixed_content')}
                />
                {secHeaders && (
                  <>
                    <MetaRow label="HSTS" value={getStr(secHeaders, 'hsts') || getStr(secHeaders, 'Strict-Transport-Security')} ok={!!getStr(secHeaders, 'hsts')} />
                    <MetaRow label="CSP" value={getStr(secHeaders, 'csp') || getStr(secHeaders, 'Content-Security-Policy')} ok={!!getStr(secHeaders, 'csp')} />
                    <MetaRow label="X-Frame-Options" value={getStr(secHeaders, 'x_frame_options') || getStr(secHeaders, 'X-Frame-Options')} ok={!!getStr(secHeaders, 'x_frame_options')} />
                  </>
                )}
                {!secHeaders && (
                  <MetaRow label="Security Headers" value={getStr(sec, 'security_headers_summary') || 'See details'} />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available.</p>
            )}
          </Section>

          {/* Performance */}
          <Section
            title="Performance"
            icon={BarChart3}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
            border="border-emerald-500/20"
          >
            {perf ? (
              <div className="divide-y divide-gray-800">
                <MetaRow label="Pages Tested" value={perfPages ?? 'N/A'} />
                <MetaRow
                  label="Avg TTFB"
                  value={perfTtfb !== null ? `${perfTtfb} ms` : 'N/A'}
                  ok={perfTtfb !== null ? perfTtfb < 800 : undefined}
                />
                <MetaRow
                  label="FCP"
                  value={perfFcp !== null ? `${perfFcp} ms` : 'N/A'}
                  ok={perfFcp !== null ? perfFcp < 1800 : undefined}
                />
                <MetaRow
                  label="LCP"
                  value={perfLcp !== null ? `${perfLcp} ms` : 'N/A'}
                  ok={perfLcp !== null ? perfLcp < 2500 : undefined}
                />
                <MetaRow
                  label="Compression"
                  value={perfCompression === true ? 'Enabled' : perfCompression === false ? 'Not detected' : 'N/A'}
                  ok={perfCompression ?? undefined}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available.</p>
            )}
          </Section>

          {/* Broken Resources */}
          <Section
            title="Broken Resources"
            icon={Link2}
            color="text-red-400"
            bg="bg-red-500/10"
            border="border-red-500/20"
          >
            {broken ? (
              <div className="space-y-4">
                <div className="divide-y divide-gray-800">
                  <MetaRow
                    label="Total Links Checked"
                    value={getNum(brokenSummary, 'total_links_checked') ?? getNum(broken, 'total_links_checked') ?? 'N/A'}
                  />
                  <MetaRow
                    label="Broken Links"
                    value={(() => {
                      const count = getNum(brokenSummary, 'broken_links_count') ?? getNum(broken, 'broken_links_count');
                      const total = getNum(brokenSummary, 'total_links_checked') ?? getNum(broken, 'total_links_checked');
                      if (count === null) return 'N/A';
                      if (total && total > 0) return `${count} (${Math.round((count / total) * 100)}%)`;
                      return String(count);
                    })()}
                    ok={(getNum(brokenSummary, 'broken_links_count') ?? getNum(broken, 'broken_links_count') ?? 1) === 0}
                  />
                  <MetaRow
                    label="Total Images Checked"
                    value={getNum(brokenSummary, 'total_images_checked') ?? getNum(broken, 'total_images_checked') ?? 'N/A'}
                  />
                  <MetaRow
                    label="Broken Images"
                    value={getNum(brokenSummary, 'broken_images_count') ?? getNum(broken, 'broken_images_count') ?? 'N/A'}
                    ok={(getNum(brokenSummary, 'broken_images_count') ?? getNum(broken, 'broken_images_count') ?? 1) === 0}
                  />
                </div>

                {brokenLinks.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Broken Links ({brokenLinks.length})
                    </p>
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-800">
                      {brokenLinks.map((link, i) => {
                        const l = link as Record<string, unknown>;
                        return (
                          <div key={i} className="flex items-center justify-between gap-3 border-b border-gray-800 px-3 py-2 last:border-0">
                            <span className="truncate text-xs text-gray-400">{String(l.url ?? l.href ?? link)}</span>
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
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available.</p>
            )}
          </Section>

          {/* Catalog */}
          <Section
            title="E-commerce Catalog"
            icon={ShoppingCart}
            color="text-amber-400"
            bg="bg-amber-500/10"
            border="border-amber-500/20"
          >
            {catalog ? (
              <div className="divide-y divide-gray-800">
                <MetaRow label="Pages Crawled" value={getNum(catalog, 'pages_crawled') ?? 'N/A'} />
                <MetaRow label="Products Audited" value={getNum(catalog, 'products_audited') ?? 'N/A'} />
                <MetaRow
                  label="Broken %"
                  value={catalogBrokenPct !== null ? `${catalogBrokenPct}%` : 'N/A'}
                  ok={catalogBrokenPct !== null ? catalogBrokenPct === 0 : undefined}
                />
                <MetaRow label="Price Issues" value={getNum(catalog, 'price_issues') ?? getStr(catalog, 'price_status')} />
                <MetaRow label="Stock Mismatches" value={getNum(catalog, 'stock_mismatches') ?? getStr(catalog, 'stock_status')} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available.</p>
            )}
          </Section>

          {/* Marketing Tracking */}
          <Section
            title="Marketing Tracking"
            icon={Tag}
            color="text-pink-400"
            bg="bg-pink-500/10"
            border="border-pink-500/20"
          >
            {tracking ? (
              <div className="divide-y divide-gray-800">
                <MetaRow
                  label="GA4 Detected"
                  value={getBool(trackGa4, 'detected') ? `Yes (${getStr(trackGa4 ?? {}, 'id') || 'ID found'})` : getBool(trackGa4, 'detected') === false ? 'No' : getStr(tracking, 'ga4_status')}
                  ok={getBool(trackGa4, 'detected') ?? undefined}
                />
                <MetaRow
                  label="Facebook Pixel"
                  value={getBool(trackFb, 'detected') ? `Yes (${getStr(trackFb ?? {}, 'id') || 'ID found'})` : getBool(trackFb, 'detected') === false ? 'No' : getStr(tracking, 'facebook_pixel_status')}
                  ok={getBool(trackFb, 'detected') ?? undefined}
                />
                <MetaRow
                  label="TikTok Pixel"
                  value={getBool(trackTt, 'detected') ? `Yes (${getStr(trackTt ?? {}, 'id') || 'ID found'})` : getBool(trackTt, 'detected') === false ? 'No' : getStr(tracking, 'tiktok_pixel_status')}
                  ok={getBool(trackTt, 'detected') ?? undefined}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available.</p>
            )}
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}
