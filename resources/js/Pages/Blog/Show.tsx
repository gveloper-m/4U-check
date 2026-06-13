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

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogShow({ post }: { post: Post }) {
    return (
        <BlogLayout>
            <Head title={`${post.title} — 4utest Blog`} />

            <Link href="/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Blog
            </Link>

            <article>
                {post.featured_image && (
                    <div className="mb-8 overflow-hidden rounded-xl bg-gray-800">
                        <img src={post.featured_image} alt={post.title} className="w-full object-cover max-h-80" />
                    </div>
                )}

                <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{post.title}</h1>

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
                    <p className="mt-6 text-lg leading-relaxed text-gray-300 border-l-2 border-violet-500 pl-4">
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
