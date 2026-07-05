import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Plus, Edit, Trash2, Eye, FileText, Sparkles, X, Globe, Loader2, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { PageProps } from '@/types';

interface Author { id: number; name: string }
interface Post {
    id: number;
    title: string;
    slug: string;
    locale: string;
    status: 'draft' | 'published' | 'scheduled';
    published_at: string | null;
    scheduled_at: string | null;
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

const LANGUAGES = [
    { value: 'en', label: '🇬🇧 English' },
    { value: 'el', label: '🇬🇷 Greek' },
    { value: 'de', label: '🇩🇪 German' },
    { value: 'fr', label: '🇫🇷 French' },
    { value: 'es', label: '🇪🇸 Spanish' },
    { value: 'nl', label: '🇳🇱 Dutch' },
    { value: 'cs', label: '🇨🇿 Czech' },
];

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status }: { status: Post['status'] }) {
    if (status === 'published') return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Published
        </span>
    );
    if (status === 'scheduled') return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            <CalendarClock className="h-3 w-3" />
            Scheduled
        </span>
    );
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
            Draft
        </span>
    );
}

function AiGenerateModal({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        locale: 'en',
        topic: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.blog.ai-generate'), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <Sparkles className="h-5 w-5 text-violet-400" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Generate AI Article</h2>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="p-6 space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Language</span>
                        </label>
                        <select
                            value={data.locale}
                            onChange={e => setData('locale', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        >
                            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Topic <span className="text-xs font-normal text-gray-500">(optional — AI picks one if blank)</span>
                        </label>
                        <input
                            type="text"
                            value={data.topic}
                            onChange={e => setData('topic', e.target.value)}
                            placeholder="e.g. How to improve Core Web Vitals for e-commerce"
                            maxLength={300}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                        {errors.topic && <p className="mt-1 text-xs text-red-400">{errors.topic}</p>}
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                        <p className="font-medium text-violet-300 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> What the AI generates:</p>
                        <ul className="space-y-1 text-xs list-disc list-inside">
                            <li>SEO-optimised title + meta description</li>
                            <li>1400–1900 word article with images from Unsplash</li>
                            <li>Subtle 4uTest mention at the end</li>
                            <li>Auto-scheduled for optimal publish time</li>
                        </ul>
                        <p className="text-xs text-gray-500 pt-1">The post will open in the editor after generation so you can review and tweak before it goes live.</p>
                    </div>

                    {Object.keys(errors).length > 0 && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {Object.values(errors)[0]}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} disabled={processing}
                            className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                            {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Article</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminBlogIndex({ posts }: { posts: PaginatedPosts }) {
    const { props } = usePage<PageProps>();
    const flash = (props as any).flash as { success?: string; error?: string } | undefined;
    const [showAiModal, setShowAiModal] = useState(false);

    const destroy = (id: number, title: string) => {
        if (!confirm(`Delete "${title}"?`)) return;
        router.delete(`/admin/blog/${id}`);
    };

    return (
        <AppLayout>
            <Head title="Blog Management" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {flash.error}
                </div>
            )}

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Management</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{posts.data.length} post{posts.data.length !== 1 ? 's' : ''} total</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors"
                    >
                        <Sparkles className="h-4 w-4" />
                        Generate AI Article
                    </button>
                    <Link
                        href="/admin/blog/create"
                        className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Post
                    </Link>
                </div>
            </div>

            {posts.data.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-gray-700" />
                    <p className="text-gray-600 dark:text-gray-400">No blog posts yet.</p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                        <button onClick={() => setShowAiModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors">
                            <Sparkles className="h-3.5 w-3.5" /> Generate with AI
                        </button>
                        <Link href="/admin/blog/create" className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300">
                            <Plus className="h-3.5 w-3.5" /> Create manually
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left hidden sm:table-cell">Lang</th>
                                <th className="px-4 py-3 text-left hidden md:table-cell">Published / Scheduled</th>
                                <th className="px-4 py-3 text-left hidden lg:table-cell">Author</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {posts.data.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-xs truncate">{post.title}</td>
                                    <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                                    <td className="px-4 py-3 text-gray-500 text-xs uppercase hidden sm:table-cell">{post.locale}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                                        {post.status === 'scheduled'
                                            ? <span className="text-violet-400">{formatDate(post.scheduled_at)}</span>
                                            : formatDate(post.published_at)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">{post.author.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            {post.status === 'published' && (
                                                <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
                                                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" title="View live">
                                                    <Eye className="h-4 w-4" />
                                                </a>
                                            )}
                                            <Link href={`/admin/blog/${post.id}/edit`}
                                                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" title="Edit">
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                            <button onClick={() => destroy(post.id, post.title)}
                                                className="rounded p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Delete">
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

            {showAiModal && <AiGenerateModal onClose={() => setShowAiModal(false)} />}
        </AppLayout>
    );
}
