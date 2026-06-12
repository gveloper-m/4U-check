import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps, FullAuditReport } from '@/types';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CompareProps extends PageProps {
  reports: FullAuditReport[];
}

function healthColor(score?: number): string {
  if (score === undefined || score === null) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function getNum(obj: Record<string, unknown> | undefined | null, key: string): number | null {
  if (!obj) return null;
  const v = obj[key];
  if (typeof v === 'number') return v;
  return null;
}

function getStr(obj: Record<string, unknown> | undefined | null, key: string): string {
  if (!obj) return 'N/A';
  const v = obj[key];
  if (v === null || v === undefined) return 'N/A';
  return String(v);
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

interface CellValue {
  display: string;
  numeric: number | null;
}

function DeltaIcon({ best, current, higherIsBetter }: { best: number; current: number; higherIsBetter: boolean }) {
  if (current === best) return <Minus className="h-3.5 w-3.5 text-gray-500" />;
  if ((higherIsBetter && current > best) || (!higherIsBetter && current < best)) {
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  }
  return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
}

function CellStyle({ value, best, higherIsBetter }: { value: CellValue; best: number | null; higherIsBetter: boolean }) {
  if (value.numeric === null || best === null) {
    return <span className="text-gray-300">{value.display}</span>;
  }
  const isBest = value.numeric === best;
  const isGood = higherIsBetter ? value.numeric >= best : value.numeric <= best;
  return (
    <div className="flex items-center justify-center gap-1">
      <DeltaIcon best={best} current={value.numeric} higherIsBetter={higherIsBetter} />
      <span className={isBest ? 'text-emerald-400 font-semibold' : isGood ? 'text-emerald-400' : 'text-red-400'}>
        {value.display}
      </span>
    </div>
  );
}

export default function Compare({ reports }: CompareProps) {
  const extractRow = (report: FullAuditReport): Record<string, CellValue> => {
    const perf = report.performance_result;
    const broken = report.broken_resources_result;
    const brokenSummary = getObj(broken, 'summary') ?? broken;
    const catalog = report.catalog_result;
    const tracking = report.tracking_result;
    const seo = report.seo_schema_result;
    const sec = report.security_result;

    const brokenCount = getNum(brokenSummary, 'broken_links_count') ?? getNum(broken, 'broken_links_count');
    const brokenLinks = getArr(broken, 'broken_links');
    const brokenLinksCount = brokenCount ?? brokenLinks.length;

    const ga4 = getObj(tracking, 'ga4');
    const fb = getObj(tracking, 'facebook_pixel');
    const tt = getObj(tracking, 'tiktok_pixel');
    const trackingDetected = [ga4, fb, tt].filter(
      (t) => t && (t.detected === true || t.detected === 'true')
    ).length;

    const sslOk =
      getStr(sec, 'ssl_status') === 'ok' || getStr(sec, 'ssl_status') === 'valid' ? 1 : 0;
    const metaTitleOk =
      getStr(getObj(seo, 'meta_title'), 'status') === 'ok' ||
      getStr(seo, 'meta_title_status') === 'ok'
        ? 1
        : 0;

    return {
      health: {
        display: report.health_score !== undefined ? String(report.health_score) : 'N/A',
        numeric: report.health_score ?? null,
      },
      seo_meta_title: {
        display: metaTitleOk ? 'OK' : 'Issue',
        numeric: metaTitleOk,
      },
      security_ssl: {
        display: sslOk ? 'OK' : 'Issue',
        numeric: sslOk,
      },
      avg_ttfb: {
        display: getNum(perf, 'avg_ttfb') !== null ? `${getNum(perf, 'avg_ttfb')} ms` : 'N/A',
        numeric: getNum(perf, 'avg_ttfb'),
      },
      broken_links: {
        display: String(brokenLinksCount),
        numeric: brokenLinksCount,
      },
      catalog_broken_pct: {
        display: getNum(catalog, 'broken_percentage') !== null ? `${getNum(catalog, 'broken_percentage')}%` : 'N/A',
        numeric: getNum(catalog, 'broken_percentage'),
      },
      tracking_detected: {
        display: `${trackingDetected}/3`,
        numeric: trackingDetected,
      },
    };
  };

  const rows: Array<{
    key: string;
    label: string;
    higherIsBetter: boolean;
  }> = [
    { key: 'health', label: 'Health Score', higherIsBetter: true },
    { key: 'seo_meta_title', label: 'SEO Meta Title', higherIsBetter: true },
    { key: 'security_ssl', label: 'SSL Status', higherIsBetter: true },
    { key: 'avg_ttfb', label: 'Avg TTFB', higherIsBetter: false },
    { key: 'broken_links', label: 'Broken Links', higherIsBetter: false },
    { key: 'catalog_broken_pct', label: 'Catalog Broken %', higherIsBetter: false },
    { key: 'tracking_detected', label: 'Tracking Pixels', higherIsBetter: true },
  ];

  const extracted = reports.map(extractRow);

  const getBestForRow = (key: string, higherIsBetter: boolean): number | null => {
    const nums = extracted.map((r) => r[key]?.numeric).filter((v): v is number => v !== null);
    if (nums.length === 0) return null;
    return higherIsBetter ? Math.max(...nums) : Math.min(...nums);
  };

  return (
    <AppLayout>
      <Head title="Compare Audits" />

      <div className="space-y-6">
        <Link
          href="/audits"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to audits
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white">Compare Audits</h1>
          <p className="mt-1 text-sm text-gray-400">
            Side-by-side comparison of {reports.length} scans
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="sticky left-0 bg-gray-900 px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-44">
                  Metric
                </th>
                {reports.map((report) => (
                  <th
                    key={report.id}
                    className="px-5 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-300 min-w-[180px]"
                  >
                    <div>
                      <Link
                        href={`/audits/${report.id}`}
                        className="text-violet-400 hover:text-violet-300 transition-colors truncate block max-w-[160px] mx-auto"
                      >
                        {report.name ?? report.site_url}
                      </Link>
                      <span className="mt-1 block text-[10px] text-gray-500 normal-case font-normal">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((row) => {
                const best = getBestForRow(row.key, row.higherIsBetter);
                return (
                  <tr key={row.key} className="hover:bg-gray-800/40 transition-colors">
                    <td className="sticky left-0 bg-gray-900 px-5 py-3.5 text-sm text-gray-400">
                      {row.label}
                    </td>
                    {extracted.map((data, i) => {
                      const val = data[row.key];
                      return (
                        <td key={i} className="px-5 py-3.5 text-center">
                          {row.key === 'health' && val.numeric !== null ? (
                            <span className={`text-lg font-bold ${healthColor(val.numeric)}`}>
                              {val.display}
                            </span>
                          ) : (
                            <CellStyle value={val} best={best} higherIsBetter={row.higherIsBetter} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Individual report links */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/audits/${report.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 hover:border-gray-700 transition-colors"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{report.name ?? report.site_url}</p>
                <p className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString()}</p>
              </div>
              <div
                className={`ml-3 shrink-0 text-xl font-bold ${healthColor(report.health_score)}`}
              >
                {report.health_score ?? '?'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
