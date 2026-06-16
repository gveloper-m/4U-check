import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Ticket, TicketMessage } from '@/types';
import { ArrowLeft, Paperclip, X, Send, User } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

function StatusBadge({ status }: { status: Ticket['status'] }) {
    const map = {
        open:        { label: 'Open',        cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        in_progress: { label: 'In Progress',  cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        resolved:    { label: 'Resolved',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        closed:      { label: 'Closed',       cls: 'bg-gray-700/50 text-gray-400 border-gray-700' },
    };
    const { label, cls } = map[status] ?? map.closed;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${cls}`}>
            {label}
        </span>
    );
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function MessageBubble({ msg }: { msg: TicketMessage }) {
    const isAdmin = msg.is_admin;
    return (
        <div className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isAdmin ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300' : 'bg-gray-700 text-gray-300'
            }`}>
                {isAdmin ? 'S' : (msg.user?.name?.charAt(0).toUpperCase() ?? '?')}
            </div>
            <div className={`max-w-[75%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`flex items-center gap-2 text-xs text-gray-500 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                    <span className="font-medium text-gray-400">{isAdmin ? 'Support Team' : (msg.user?.name ?? 'User')}</span>
                    <span>{formatDateTime(msg.created_at)}</span>
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    isAdmin
                        ? 'bg-violet-600/15 border border-violet-500/20 text-gray-200 rounded-tr-sm'
                        : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm'
                }`}>
                    {msg.body}
                </div>
                {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {msg.attachments.map(att => (
                            <a key={att.id} href={att.url} target="_blank" rel="noreferrer">
                                <img src={att.url} alt={att.filename} className="h-20 w-20 rounded-lg object-cover border border-gray-700 hover:border-gray-500 transition-colors" />
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminTicketShow({ ticket }: { ticket: Ticket }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);

    const replyForm = useForm<{ body: string; images: File[] }>({ body: '', images: [] });
    const [statusUpdating, setStatusUpdating] = useState(false);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const arr = Array.from(files).slice(0, 3);
        replyForm.setData('images', arr);
        setPreviews(arr.map(f => URL.createObjectURL(f)));
    };

    const removeImage = (i: number) => {
        replyForm.setData('images', replyForm.data.images.filter((_, idx) => idx !== i));
        setPreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    const submitReply = (e: React.FormEvent) => {
        e.preventDefault();
        replyForm.post(route('admin.tickets.reply', ticket.id), {
            forceFormData: true,
            onSuccess: () => { replyForm.reset(); setPreviews([]); },
        });
    };

    const submitStatus = (status: Ticket['status']) => {
        setStatusUpdating(true);
        router.patch(route('admin.tickets.status', ticket.id), { status }, {
            preserveScroll: true,
            onFinish: () => setStatusUpdating(false),
        });
    };

    return (
        <AppLayout>
            <Head title={`Ticket #${ticket.id}`} />

            <div className="mb-6 flex items-center gap-4">
                <Link href={route('admin.tickets.index')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    All Tickets
                </Link>
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-gray-600">#{ticket.id}</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Thread column */}
                <div className="lg:col-span-3 space-y-6">
                    <div>
                        <h1 className="text-xl font-bold text-white mb-1">{ticket.subject}</h1>
                        <p className="text-xs text-gray-600">Opened {formatDateTime(ticket.created_at)}</p>
                    </div>

                    <div className="space-y-5">
                        {(ticket.messages ?? []).map(msg => (
                            <MessageBubble key={msg.id} msg={msg} />
                        ))}
                    </div>

                    {/* Admin reply form */}
                    <form onSubmit={submitReply} className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
                        <h3 className="text-sm font-medium text-gray-300">Reply as Support Team</h3>
                        <textarea
                            value={replyForm.data.body}
                            onChange={e => replyForm.setData('body', e.target.value)}
                            rows={5}
                            maxLength={5000}
                            placeholder="Write your reply to the user… (they'll receive an email notification)"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                        />
                        {replyForm.errors.body && <p className="text-xs text-red-400">{replyForm.errors.body}</p>}

                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                        {previews.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {previews.map((src, i) => (
                                    <div key={i} className="relative">
                                        <img src={src} className="h-16 w-16 rounded-lg object-cover border border-gray-700" />
                                        <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            {previews.length < 3 && (
                                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                                    <Paperclip className="h-3.5 w-3.5" />
                                    Attach images ({previews.length}/3)
                                </button>
                            )}
                            <div className="ml-auto">
                                <button
                                    type="submit"
                                    disabled={replyForm.processing}
                                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                    {replyForm.processing ? 'Sending…' : 'Send Reply'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Info sidebar */}
                <div className="space-y-4">
                    {/* User info */}
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">User</h3>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                                <User className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-200">{ticket.user?.name ?? '—'}</p>
                                <p className="text-xs text-gray-500">{ticket.user?.email ?? ''}</p>
                            </div>
                        </div>
                        {ticket.user?.company_name && (
                            <p className="text-xs text-gray-600">{ticket.user.company_name}</p>
                        )}
                    </div>

                    {/* Status control */}
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Change Status</h3>
                        <div className="space-y-1.5">
                            {(['open', 'in_progress', 'resolved', 'closed'] as Ticket['status'][]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => submitStatus(s)}
                                    disabled={ticket.status === s || statusUpdating}
                                    className={`w-full rounded-lg px-3 py-2 text-xs font-medium text-left transition-colors ${
                                        ticket.status === s
                                            ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'
                                    }`}
                                >
                                    {s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : s === 'resolved' ? 'Resolved' : 'Closed'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
