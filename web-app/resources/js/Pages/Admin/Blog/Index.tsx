import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Plus, Edit, Trash2, Eye, FileText } from 'lucide-react';

interface Author { id: number; name: string }
interface Post {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    published_at: string | null;
    created_at: string;
    author: Author;
}
interface PaginatedPosts {
    data: Post[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminBlogIndex({ posts }: { posts: PaginatedPosts }) {
    const destroy = (id: number, title: string) => {
        if (!confirm(`Delete "${title}"?`)) return;
        router.delete(`/admin/blog/${id}`);
    };

    return (
        <AppLayout>
            <Head title="Blog Management" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Management</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{posts.data.length} post{posts.data.length !== 1 ? 's' : ''} total</p>
                </div>
                <Link
                    href="/admin/blog/create"
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Post
                </Link>
            </div>

            {posts.data.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-gray-700" />
                    <p className="text-gray-600 dark:text-gray-400">No blog posts yet.</p>
                    <Link href="/admin/blog/create" className="mt-3 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
                        <Plus className="h-3.5 w-3.5" /> Create your first post
                    </Link>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left hidden md:table-cell">Published</th>
                                <th className="px-4 py-3 text-left hidden lg:table-cell">Author</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {posts.data.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-100/40 dark:hover:bg-gray-100/40 dark:bg-gray-800/40 transition-colors">
                                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-xs truncate">{post.title}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            post.status === 'published'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                                        }`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{formatDate(post.published_at)}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">{post.author.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            {post.status === 'published' && (
                                                <a
                                                    href={`/blog/${post.slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                                    title="View live"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                            )}
                                            <Link
                                                href={`/admin/blog/${post.id}/edit`}
                                                className="rounded p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => destroy(post.id, post.title)}
                                                className="rounded p-1.5 text-gray-600 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(posts.prev_page_url || posts.next_page_url) && (
                <div className="mt-6 flex items-center justify-center gap-4">
                    {posts.prev_page_url && (
                        <Link href={posts.prev_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 transition-colors">← Previous</Link>
                    )}
                    <span className="text-sm text-gray-500">Page {posts.current_page} of {posts.last_page}</span>
                    {posts.next_page_url && (
                        <Link href={posts.next_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 transition-colors">Next →</Link>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
