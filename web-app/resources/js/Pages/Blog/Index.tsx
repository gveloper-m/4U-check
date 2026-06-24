import { Head, Link } from '@inertiajs/react';
import BlogLayout from '@/Layouts/BlogLayout';
import { Calendar, User, ArrowRight } from 'lucide-react';

interface Author { id: number; name: string }
interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    published_at: string;
    author: Author;
}
interface PaginatedPosts {
    data: Post[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogIndex({ posts }: { posts: PaginatedPosts }) {
    return (
        <BlogLayout>
            <Head title="Blog — 4utest">
                <meta name="description" content="Tips, guides, and updates on website auditing, SEO, security, and performance." />
            </Head>

            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blog</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Tips, updates, and guides on website auditing.</p>
            </div>

            {posts.data.length === 0 ? (
                <p className="text-gray-500">No posts published yet. Check back soon.</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.data.map((post) => (
                        <Link
                            key={post.id}
                            href={`/blog/${post.slug}`}
                            className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-violet-500/50 transition-colors"
                        >
                            {post.featured_image && (
                                <div className="h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={post.featured_image}
                                        alt={post.title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                            )}
                            {!post.featured_image && (
                                <div className="h-2 bg-gradient-to-r from-violet-600 to-violet-400" />
                            )}

                            <div className="flex flex-1 flex-col p-5">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-300 transition-colors line-clamp-2">
                                    {post.title}
                                </h2>
                                {post.excerpt && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3 flex-1">{post.excerpt}</p>
                                )}
                                <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {post.author.name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(post.published_at)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {(posts.prev_page_url || posts.next_page_url) && (
                <div className="mt-10 flex items-center justify-center gap-4">
                    {posts.prev_page_url && (
                        <Link href={posts.prev_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            ← Previous
                        </Link>
                    )}
                    <span className="text-sm text-gray-500">Page {posts.current_page} of {posts.last_page}</span>
                    {posts.next_page_url && (
                        <Link href={posts.next_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Next →
                        </Link>
                    )}
                </div>
            )}
        </BlogLayout>
    );
}
