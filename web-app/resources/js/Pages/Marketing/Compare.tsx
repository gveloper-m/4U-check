import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, Minus } from 'lucide-react';
import BlogLayout from '@/Layouts/BlogLayout';

interface Row {
    criterion: string;
    us: string;
    them: string;
}

interface Compare {
    slug: string;
    competitor: string;
    intro: string;
    rows: Row[];
    verdict: string;
}

interface Seo {
    title?: string;
    description?: string;
    canonical?: string;
    image?: string;
}

function cellTone(value: string): 'good' | 'bad' | 'neutral' {
    const v = value.toLowerCase();
    if (v.startsWith('no')) return 'bad';
    if (v.startsWith('yes')) return 'good';
    return 'neutral';
}

function Cell({ value }: { value: string }) {
    const tone = cellTone(value);
    return (
        <div className="flex items-start gap-2">
            {tone === 'good' && <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />}
            {tone === 'bad' && <Minus className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />}
            <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
        </div>
    );
}

export default function Compare({ compare, seo }: { compare: Compare; seo?: Seo }) {
    const title = seo?.title ?? `4uTest vs ${compare.competitor}`;

    return (
        <BlogLayout>
            <Head title={title}>
                {seo?.description && <meta name="description" content={seo.description} />}
                {seo?.canonical && <link rel="canonical" href={seo.canonical} />}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={title} />
                {seo?.description && <meta property="og:description" content={seo.description} />}
                {seo?.canonical && <meta property="og:url" content={seo.canonical} />}
                {seo?.image && <meta property="og:image" content={seo.image} />}
            </Head>

            <div className="max-w-2xl mx-auto text-center">
                <span className="inline-block rounded-full bg-violet-100 dark:bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                    Comparison
                </span>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    4uTest vs {compare.competitor}
                </h1>
                <p className="mt-3 text-gray-600 dark:text-gray-400">{compare.intro}</p>
            </div>

            <div className="mt-10 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full min-w-[560px] text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/60">
                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Criterion</th>
                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">4uTest</th>
                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{compare.competitor}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {compare.rows.map((row, i) => (
                            <tr key={i} className="border-t border-gray-200 dark:border-gray-800">
                                <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.criterion}</td>
                                <td className="px-5 py-3"><Cell value={row.us} /></td>
                                <td className="px-5 py-3"><Cell value={row.them} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 max-w-2xl mx-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Bottom line</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{compare.verdict}</p>
            </div>

            <div className="mt-10 text-center">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
                >
                    Try 4uTest free <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </BlogLayout>
    );
}
