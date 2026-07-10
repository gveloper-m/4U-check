import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import BlogLayout from '@/Layouts/BlogLayout';

interface ChecklistSection {
    heading: string;
    items: string[];
}

interface Checklist {
    slug: string;
    name: string;
    intro: string;
    sections: ChecklistSection[];
}

interface Seo {
    title?: string;
    description?: string;
    canonical?: string;
    image?: string;
}

export default function Checklist({ checklist, seo }: { checklist: Checklist; seo?: Seo }) {
    const title = seo?.title ?? `${checklist.name} Website Audit Checklist — 4utest`;
    const totalItems = checklist.sections.reduce((sum, s) => sum + s.items.length, 0);

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
                    {checklist.name} checklist · {totalItems} items
                </span>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    The {checklist.name} Website Audit Checklist
                </h1>
                <p className="mt-3 text-gray-600 dark:text-gray-400">{checklist.intro}</p>
            </div>

            <div className="mt-10 max-w-2xl mx-auto space-y-6">
                {checklist.sections.map((section, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{section.heading}</h2>
                        <ul className="space-y-2.5">
                            {section.items.map((item, j) => (
                                <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-violet-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-10 max-w-2xl mx-auto rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 px-6 py-6 text-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Run every check on this list automatically — 4uTest scans for all of it in a single pass and gives you one health score to track over time.
                </p>
                <Link
                    href="/"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                    Run a free audit <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </BlogLayout>
    );
}
