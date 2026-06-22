import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Ticket, PaginatedData } from '@/types';
import { MessageCircle, Plus, ChevronRight, Clock, CheckCircle2, AlertCircle, XCircle, Paperclip, X } from 'lucide-react';
import { useRef, useState } from 'react';

function StatusBadge({ status }: { status: Ticket['status'] }) {
    const map = {
        open:        { label: 'Open',        cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        in_progress: { label: 'In Progress',  cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        resolved:    { label: 'Resolved',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        closed:      { label: 'Closed',       cls: 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700' },
    };
    const { label, cls } = map[status] ?? map.closed;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${cls}`}>
            {label}
        </span>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TicketsIndex({ tickets }: { tickets: PaginatedData<Ticket> }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm<{
        subject: string;
        body: string;
        images: File[];
    }>({ subject: '', body: '', images: [] });

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const arr = Array.from(files).slice(0, 3);
        setData('images', arr);
        setPreviews(arr.map(f => URL.createObjectURL(f)));
    };

    const removeImage = (i: number) => {
        const next = data.images.filter((_, idx) => idx !== i);
        setData('images', next);
        setPreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tickets.store'), {
            forceFormData: true,
            onSuccess: () => { reset(); setPreviews([]); },
        });
    };

    return (
        <AppLayout>
            <Head title="Support" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Open a ticket or track your existing requests.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Ticket list */}
                <div className="lg:col-span-3 space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Your Tickets</h2>
                    {tickets.data.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center">
                            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-700" />
                            <p className="text-sm text-gray-500">No tickets yet. Use the form to send us a message.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tickets.data.map(ticket => (
                                <Link
                                    key={ticket.id}
                                    href={route('tickets.show', ticket.id)}
                                    className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3.5 hover:bg-gray-100/60 dark:hover:bg-gray-100/60 dark:bg-gray-800/60 transition-colors group"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <StatusBadge status={ticket.status} />
                                            <span className="text-xs text-gray-600">#{ticket.id}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{ticket.subject}</p>
                                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(ticket.created_at)}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 shrink-0 ml-3 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    )}

                    {(tickets.prev_page_url || tickets.next_page_url) && (
                        <div className="flex items-center justify-center gap-4 pt-2">
                            {tickets.prev_page_url && (
                                <Link href={tickets.prev_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:border-gray-500">← Prev</Link>
                            )}
                            <span className="text-xs text-gray-600">Page {tickets.current_page} / {tickets.last_page}</span>
                            {tickets.next_page_url && (
                                <Link href={tickets.next_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:border-gray-500">Next →</Link>
                            )}
                        </div>
                    )}
                </div>

                {/* New ticket form */}
                <div className="lg:col-span-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Open a New Ticket</h2>
                    <form onSubmit={submit} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Subject</label>
                            <input
                                type="text"
                                value={data.subject}
                                onChange={e => setData('subject', e.target.value)}
                                maxLength={200}
                                placeholder="Briefly describe your issue"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                            {errors.subject && <p className="mt-1 text-xs text-red-400">{errors.subject}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Message</label>
                            <textarea
                                value={data.body}
                                onChange={e => setData('body', e.target.value)}
                                rows={5}
                                maxLength={5000}
                                placeholder="Describe your issue in detail..."
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                            />
                            {errors.body && <p className="mt-1 text-xs text-red-400">{errors.body}</p>}
                        </div>

                        {/* Image attachments */}
                        <div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                multiple
                                className="hidden"
                                onChange={e => handleFiles(e.target.files)}
                            />
                            {previews.length > 0 && (
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative">
                                            <img src={src} className="h-16 w-16 rounded-lg object-cover border border-gray-300 dark:border-gray-700" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-400"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {previews.length < 3 && (
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    Attach images ({previews.length}/3)
                                </button>
                            )}
                            {errors.images && <p className="mt-1 text-xs text-red-400">{errors.images}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            {processing ? 'Submitting…' : 'Submit Ticket'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
