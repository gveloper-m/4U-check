import { Panel, StatCard, StatGrid, Row, SectionTitle, EmptyGood, IssueList } from '../Shared';

interface DeviceMetrics {
    fcp_ms: number | null;
    lcp_ms: number | null;
    cls_score: number | null;
}

interface UnminifiedAsset {
    url: string;
    size_kb: number;
    type: 'css' | 'js';
}

interface PageAnalysis {
    html_size_kb: number | null;
    compression_enabled: boolean;
    compression_worth_flagging: boolean;
    content_encoding: string | null;
    render_blocking_scripts: string[];
    render_blocking_styles: string[];
    total_render_blocking: number;
    unminified_assets: UnminifiedAsset[];
    assets_checked: number;
    issues: string[];
}

interface PageScreenshot {
    url: string;
    screenshot: string;
}

interface Data {
    site_url: string;
    pages_tested: number;
    metrics: {
        ttfb_ms: number | null;
        desktop: DeviceMetrics;
        mobile: DeviceMetrics;
    };
    page_analysis: PageAnalysis;
    screenshots: {
        homepage: string | null;
        pages: PageScreenshot[];
    };
    executed_at: string;
}

type Tone = 'good' | 'bad' | 'warn' | 'neutral';

function fmtMs(value: number | null): string {
    return value === null || value === undefined ? 'N/A' : `${Math.round(value)}ms`;
}

function fmtCls(value: number | null): string {
    return value === null || value === undefined ? 'N/A' : value.toFixed(2);
}

function fmtKb(value: number | null): string {
    return value === null || value === undefined ? 'N/A' : `${value.toFixed(1)}KB`;
}

function lcpTone(value: number | null): Tone {
    if (value === null || value === undefined) return 'neutral';
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'warn';
    return 'bad';
}

function clsTone(value: number | null): Tone {
    if (value === null || value === undefined) return 'neutral';
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'warn';
    return 'bad';
}

function fcpTone(value: number | null): Tone {
    if (value === null || value === undefined) return 'neutral';
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'warn';
    return 'bad';
}

function ttfbTone(value: number | null): Tone {
    if (value === null || value === undefined) return 'neutral';
    if (value < 200) return 'good';
    if (value < 600) return 'warn';
    return 'bad';
}

function screenshotSrc(path: string): string {
    return path.startsWith('http') ? path : `/storage/${path}`;
}

export default function PerformanceResult({ data }: { data: Data }) {
    const primary = data.metrics.desktop;
    const secondary = data.metrics.mobile;
    const pa = data.page_analysis;
    const flagCompression = pa.compression_worth_flagging && !pa.compression_enabled;

    return (
        <div>
            <SectionTitle>Core Web Vitals — Desktop</SectionTitle>
            <StatGrid>
                <StatCard label="LCP" value={fmtMs(primary.lcp_ms)} tone={lcpTone(primary.lcp_ms)} />
                <StatCard label="CLS" value={fmtCls(primary.cls_score)} tone={clsTone(primary.cls_score)} />
                <StatCard label="FCP" value={fmtMs(primary.fcp_ms)} tone={fcpTone(primary.fcp_ms)} />
                <StatCard label="TTFB" value={fmtMs(data.metrics.ttfb_ms)} tone={ttfbTone(data.metrics.ttfb_ms)} />
                <StatCard label="Pages tested" value={data.pages_tested} />
            </StatGrid>

            <SectionTitle>Core Web Vitals — Mobile</SectionTitle>
            <StatGrid>
                <StatCard label="LCP" value={fmtMs(secondary.lcp_ms)} tone={lcpTone(secondary.lcp_ms)} />
                <StatCard label="CLS" value={fmtCls(secondary.cls_score)} tone={clsTone(secondary.cls_score)} />
                <StatCard label="FCP" value={fmtMs(secondary.fcp_ms)} tone={fcpTone(secondary.fcp_ms)} />
            </StatGrid>

            {data.screenshots.homepage && (
                <>
                    <SectionTitle>Homepage screenshot</SectionTitle>
                    <img
                        src={screenshotSrc(data.screenshots.homepage)}
                        alt={`Screenshot of ${data.site_url}`}
                        className="max-w-[320px] rounded-xl border border-gray-200 dark:border-gray-800"
                    />
                </>
            )}

            <SectionTitle>Page weight & compression</SectionTitle>
            <Panel>
                <Row label="HTML size" value={fmtKb(pa.html_size_kb)} />
                <Row
                    label="Compression"
                    value={pa.compression_enabled ? (pa.content_encoding ?? 'Enabled') : 'Not enabled'}
                    ok={pa.compression_enabled}
                />
                <Row label="Render-blocking resources" value={pa.total_render_blocking} ok={pa.total_render_blocking === 0} />
                <Row label="Assets checked" value={pa.assets_checked} />
                <Row label="Unminified assets" value={pa.unminified_assets.length} ok={pa.unminified_assets.length === 0} />
            </Panel>

            {flagCompression && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                    Compression is not enabled on this page, even though it would meaningfully reduce transfer size. Enabling
                    gzip/brotli is recommended.
                </div>
            )}

            {pa.render_blocking_scripts.length > 0 && (
                <>
                    <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                        Render-blocking scripts ({pa.render_blocking_scripts.length})
                    </h3>
                    <ul className="space-y-1.5">
                        {pa.render_blocking_scripts.map((url, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 break-all">
                                {url}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {pa.render_blocking_styles.length > 0 && (
                <>
                    <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                        Render-blocking stylesheets ({pa.render_blocking_styles.length})
                    </h3>
                    <ul className="space-y-1.5">
                        {pa.render_blocking_styles.map((url, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 break-all">
                                {url}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                Unminified assets ({pa.unminified_assets.length})
            </h3>
            {pa.unminified_assets.length === 0 ? (
                <EmptyGood text="All checked assets are minified." />
            ) : (
                <div className="space-y-2">
                    {pa.unminified_assets.map((asset, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                            <span className="text-sm text-gray-900 dark:text-white break-all">{asset.url}</span>
                            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                {asset.type.toUpperCase()} — {fmtKb(asset.size_kb)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <SectionTitle>Issues</SectionTitle>
            <IssueList issues={pa.issues} />
        </div>
    );
}
