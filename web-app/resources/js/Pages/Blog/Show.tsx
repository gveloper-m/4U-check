import { Head, Link } from '@inertiajs/react';
import BlogLayout from '@/Layouts/BlogLayout';
import { Calendar, User, ArrowLeft } from 'lucide-react';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featured_image: string | null;
    published_at: string;
    author: { id: number; name: string };
}

interface Seo {
    title?: string;
    description?: string;
    canonical?: string;
    type?: string;
    image?: string;
    published_at?: string;
    author?: string;
    schema?: Record<string, unknown>;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogShow({ post, seo }: { post: Post; seo?: Seo }) {
    const title = seo?.title ?? `${post.title} — 4utest Blog`;
    const description = seo?.description ?? post.excerpt ?? '';
    const image = seo?.image ?? post.featured_image ?? '';
    const canonical = seo?.canonical ?? `/blog/${post.slug}`;

    return (
        <BlogLayout>
            <Head title={title}>
                {description && <meta name="description" content={description} />}
                {canonical && <link rel="canonical" href={canonical} />}

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={title} />
                {description && <meta property="og:description" content={description} />}
                {canonical && <meta property="og:url" content={canonical} />}
                {image && <meta property="og:image" content={image} />}
                {seo?.published_at && <meta property="article:published_time" content={seo.published_at} />}
                {seo?.author && <meta property="article:author" content={seo.author} />}

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                {description && <meta name="twitter:description" content={description} />}
                {image && <meta name="twitter:image" content={image} />}

                {/* JSON-LD */}
                {seo?.schema && (
                    <script type="application/ld+json">
                        {JSON.stringify(seo.schema)}
                    </script>
                )}
            </Head>

            <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Blog
            </Link>

            <article>
                {post.featured_image && (
                    <div className="mb-8 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                        <img src={post.featured_image} alt={post.title} className="w-full object-cover max-h-80" />
                    </div>
                )}

                <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl">{post.title}</h1>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {post.author.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(post.published_at)}
                    </span>
                </div>

                {post.excerpt && (
                    <p className="mt-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300 border-l-2 border-violet-500 pl-4">
                        {post.excerpt}
                    </p>
                )}

                {/* Rendered HTML from TipTap */}
                <div
                    className="prose-blog mt-8"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </article>
        </BlogLayout>
    );
}
