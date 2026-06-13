import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import RichTextEditor from '@/Components/RichTextEditor';
import { ArrowLeft, Save, Eye, Loader2, CheckCircle2 } from 'lucide-react';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featured_image: string | null;
    status: 'draft' | 'published';
}

const inputCls = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500';
const labelCls = 'mb-1.5 block text-sm font-medium text-gray-300';

export default function AdminBlogEdit({ post }: { post: Post | null }) {
    const isNew = !post;

    const { data, setData, post: submit, patch, processing, errors, recentlySuccessful } = useForm({
        title:          post?.title          ?? '',
        excerpt:        post?.excerpt        ?? '',
        content:        post?.content        ?? '',
        featured_image: post?.featured_image ?? '',
        status:         post?.status         ?? 'draft' as 'draft' | 'published',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isNew) {
            submit('/admin/blog', { preserveScroll: true });
        } else {
            patch(`/admin/blog/${post.id}`, { preserveScroll: true });
        }
    };

    return (
        <AppLayout>
            <Head title={isNew ? 'New Post' : `Edit: ${post.title}`} />

            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/admin/blog" className="rounded-lg border border-gray-700 p-2 text-gray-400 hover:border-gray-600 hover:text-gray-200 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">{isNew ? 'New Post' : 'Edit Post'}</h1>
                </div>

                {!isNew && post.status === 'published' && (
                    <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-200 transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                        View live
                    </a>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main content - 2/3 */}
                <div className="space-y-5 lg:col-span-2">
                    <div>
                        <label className={labelCls}>Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            placeholder="Your post title"
                            className={inputCls}
                            required
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>Excerpt <span className="text-xs text-gray-500">(shown on blog index, max 500 chars)</span></label>
                        <textarea
                            value={data.excerpt}
                            onChange={e => setData('excerpt', e.target.value)}
                            rows={3}
                            placeholder="A short summary of this post…"
                            className={inputCls}
                            maxLength={500}
                        />
                        {errors.excerpt && <p className="mt-1 text-xs text-red-400">{errors.excerpt}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>Content</label>
                        <RichTextEditor
                            value={data.content}
                            onChange={val => setData('content', val)}
                        />
                        {errors.content && <p className="mt-1 text-xs text-red-400">{errors.content}</p>}
                    </div>
                </div>

                {/* Sidebar - 1/3 */}
                <div className="space-y-5">
                    {/* Publish panel */}
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                        <h3 className="mb-4 text-sm font-semibold text-white">Publish</h3>

                        <div className="mb-4">
                            <label className={labelCls}>Status</label>
                            <select
                                value={data.status}
                                onChange={e => setData('status', e.target.value as 'draft' | 'published')}
                                className={inputCls}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isNew ? 'Create Post' : 'Save Changes'}
                        </button>

                        {recentlySuccessful && (
                            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                            </p>
                        )}
                    </div>

                    {/* Featured image */}
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                        <h3 className="mb-4 text-sm font-semibold text-white">Featured Image</h3>
                        <label className={labelCls}>Image URL</label>
                        <input
                            type="url"
                            value={data.featured_image}
                            onChange={e => setData('featured_image', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className={inputCls}
                        />
                        {errors.featured_image && <p className="mt-1 text-xs text-red-400">{errors.featured_image}</p>}
                        {data.featured_image && (
                            <img
                                src={data.featured_image}
                                alt="Preview"
                                className="mt-3 w-full rounded-lg object-cover max-h-40"
                                onError={e => (e.currentTarget.style.display = 'none')}
                            />
                        )}
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
