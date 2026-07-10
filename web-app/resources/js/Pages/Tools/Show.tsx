import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Globe, Loader2, Search, AlertCircle, ArrowRight } from 'lucide-react';
import BlogLayout from '@/Layouts/BlogLayout';
import BrokenLinksResult from './results/BrokenLinksResult';
import SchemaResult from './results/SchemaResult';
import PerformanceResult from './results/PerformanceResult';
import SecurityResult from './results/SecurityResult';
import TrackingResult from './results/TrackingResult';
import AccessibilityResult from './results/AccessibilityResult';
import CatalogResult from './results/CatalogResult';

interface ToolConfig {
    slug: string;
    title: string;
    tagline: string;
    description: string;
}

interface Seo {
    title?: string;
    description?: string;
    canonical?: string;
    type?: string;
    image?: string;
}

const RESULT_COMPONENTS: Record<string, React.ComponentType<{ data: any }>> = {
    'broken-link-checker': BrokenLinksResult,
    'schema-validator': SchemaResult,
    'core-web-vitals-test': PerformanceResult,
    'security-headers-checker': SecurityResult,
    'tracking-pixel-checker': TrackingResult,
    'accessibility-checker': AccessibilityResult,
    'ecommerce-catalog-checker': CatalogResult,
};

export default function ToolsShow({ tool, seo }: { tool: ToolConfig; seo?: Seo }) {
    const [url, setUrl] = useState('');
    const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleScan(e: React.FormEvent) {
        e.preventDefault();
        setPhase('scanning');
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/tools/${tool.slug}/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                },
                body: JSON.stringify({ url: url.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Something went wrong scanning that URL. Please try again.');
                setPhase('idle');
                return;
            }

            setResult(data);
            setPhase('done');
        } catch {
            setError('Could not reach the scanner. Please try again in a moment.');
            setPhase('idle');
        }
    }

    const ResultComponent = RESULT_COMPONENTS[tool.slug];

    return (
        <BlogLayout>
            <Head title={seo?.title ?? tool.title}>
                {seo?.description && <meta name="description" content={seo.description} />}
                {seo?.canonical && <link rel="canonical" href={seo.canonical} />}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={seo?.title ?? tool.title} />
                {seo?.description && <meta property="og:description" content={seo.description} />}
                {seo?.canonical && <meta property="og:url" content={seo.canonical} />}
                {seo?.image && <meta property="og:image" content={seo.image} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={seo?.title ?? tool.title} />
            </Head>

            <div className="text-center max-w-2xl mx-auto">
                <span className="inline-block rounded-full bg-violet-100 dark:bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                    Free tool
                </span>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{tool.title}</h1>
                <p className="mt-3 text-gray-600 dark:text-gray-400">{tool.tagline}</p>
            </div>

            <form onSubmit={handleScan} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        disabled={phase === 'scanning'}
                        required
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-12 pr-4 py-4 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 shadow-sm"
                    />
                </div>
                <button
                    type="submit"
                    disabled={phase === 'scanning'}
                    className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed px-6 py-4 text-base font-semibold text-white transition-colors whitespace-nowrap"
                >
                    {phase === 'scanning'
                        ? <><Loader2 className="h-4 w-4 animate-spin" />Scanning…</>
                        : <><Search className="h-4 w-4" />Run free check</>
                    }
                </button>
            </form>

            {error && (
                <div className="mt-6 max-w-xl mx-auto flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {phase === 'scanning' && (
                <div className="mt-10 flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                    <p className="text-sm">Fetching and analyzing the page — this can take a few seconds.</p>
                </div>
            )}

            {result && ResultComponent && (
                <div className="mt-10">
                    <ResultComponent data={result} />
                </div>
            )}

            <div className="mt-14 rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 px-6 py-6 text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    This checks one dimension. 4uTest runs this plus 6 more — SEO, performance, security, broken links, tracking pixels, accessibility, and e-commerce integrity — in a single scan with one health score.
                </p>
                <Link
                    href="/"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                    Run a full free audit <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </BlogLayout>
    );
}
