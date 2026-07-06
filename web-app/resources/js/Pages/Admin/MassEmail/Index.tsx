import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import {
    Mail, Plus, Upload, Play, Trash2, RefreshCw, X, Globe,
    CheckCircle2, Clock, AlertCircle, Send, Loader2, ChevronDown,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface Contact {
    id: number;
    email: string;
    website: string;
    language: string;
    status: 'pending' | 'scanning' | 'sending' | 'sent' | 'failed' | 'scan_failed';
    audit_score: number | null;
    error_message: string | null;
    sent_at: string | null;
    created_at: string;
}

interface PaginatedContacts {
    data: Contact[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Stats {
    total: number;
    pending: number;
    scanning: number;
    sent: number;
    failed: number;
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

function StatusBadge({ status }: { status: Contact['status'] }) {
    const map: Record<Contact['status'], { label: string; cls: string; icon: React.ReactNode }> = {
        pending:     { label: 'Pending',      cls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',                          icon: <Clock className="h-3 w-3" /> },
        scanning:    { label: 'Scanning…',    cls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',                        icon: <Loader2 className="h-3 w-3 animate-spin" /> },
        sending:     { label: 'Sending…',     cls: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800',           icon: <Loader2 className="h-3 w-3 animate-spin" /> },
        sent:        { label: 'Sent',         cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',     icon: <CheckCircle2 className="h-3 w-3" /> },
        failed:      { label: 'Failed',       cls: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',                             icon: <AlertCircle className="h-3 w-3" /> },
        scan_failed: { label: 'Scan Failed',  cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',                icon: <AlertCircle className="h-3 w-3" /> },
    };
    const { label, cls, icon } = map[status] ?? map.pending;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
            {icon}{label}
        </span>
    );
}

function ScoreBadge({ score }: { score: number | null }) {
    if (score === null) return <span className="text-gray-400">—</span>;
    const color = score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
    return <span className={`text-sm font-semibold ${color}`}>{score}/100</span>;
}

function AddContactModal({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '', website: '', language: 'en',
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Contact</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <form onSubmit={e => { e.preventDefault(); post(route('admin.mass-email.store'), { onSuccess: onClose }); }} className="p-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                        <input type="url" value={data.website} onChange={e => setData('website', e.target.value)} placeholder="https://example.com" required
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                        {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email Language</label>
                        <select value={data.language} onChange={e => setData('language', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
                            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors">Cancel</button>
                        <button type="submit" disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 transition-colors">
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Contact
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ImportCsvModal({ onClose }: { onClose: () => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors } = useForm<{ csv: File | null }>({ csv: null });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Import CSV</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-4 w-4" /></button>
                </div>
                <div className="px-6 pt-4 pb-2">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p className="font-medium text-gray-700 dark:text-gray-300">Required columns:</p>
                        <p><code className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1">email</code> — recipient email address</p>
                        <p><code className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1">website</code> — full URL (https://example.com)</p>
                        <p><code className="text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1">language</code> — optional: en, el, de, fr, es, nl, cs (defaults to en)</p>
                    </div>
                </div>
                <form onSubmit={e => {
                    e.preventDefault();
                    post(route('admin.mass-email.import'), { forceFormData: true, onSuccess: onClose });
                }} className="p-6 space-y-4">
                    <div>
                        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                            onChange={e => setData('csv', e.target.files?.[0] ?? null)} />
                        <button type="button" onClick={() => fileRef.current?.click()}
                            className="w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 py-6 text-sm text-gray-500 hover:border-violet-400 hover:text-violet-500 transition-colors">
                            {data.csv ? `✓ ${data.csv.name}` : 'Click to select CSV file'}
                        </button>
                        {errors.csv && <p className="mt-1 text-xs text-red-500">{errors.csv}</p>}
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors">Cancel</button>
                        <button type="submit" disabled={processing || !data.csv}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 transition-colors">
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function MassEmailIndex({ contacts, stats }: { contacts: PaginatedContacts; stats: Stats }) {
    const { props } = usePage<PageProps>();
    const flash = (props as any).flash as { success?: string; error?: string } | undefined;
    const [showAdd, setShowAdd]         = useState(false);
    const [showImport, setShowImport]   = useState(false);
    const [starting, setStarting]       = useState(false);

    const handleStart = () => {
        if (! confirm(`Queue ${stats.pending} pending contact(s) for scanning and emailing?`)) return;
        setStarting(true);
        router.post(route('admin.mass-email.start'), {}, { onFinish: () => setStarting(false) });
    };

    const handleRetry = (id: number) => router.post(route('admin.mass-email.retry', id));
    const handleDelete = (id: number) => { if (confirm('Delete this contact?')) router.delete(route('admin.mass-email.destroy', id)); };
    const handleLangChange = (id: number, lang: string) => router.patch(route('admin.mass-email.update-language', id), { language: lang });
    const handleDeleteAll = (status?: string) => {
        const label = status ? `all ${status} contacts` : 'ALL contacts';
        if (! confirm(`Delete ${label}? This cannot be undone.`)) return;
        router.delete(route('admin.mass-email.destroy-all'), { data: status ? { status } : {} });
    };

    const statCards = [
        { label: 'Total',    value: stats.total,    color: 'text-gray-700 dark:text-gray-300' },
        { label: 'Pending',  value: stats.pending,  color: 'text-amber-600 dark:text-amber-400' },
        { label: 'In Progress', value: stats.scanning, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Sent',     value: stats.sent,     color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Failed',   value: stats.failed,   color: 'text-red-600 dark:text-red-400' },
    ];

    return (
        <AppLayout>
            <Head title="Mass Email" />

            {flash?.success && (
                <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {flash.error}
                </div>
            )}

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mass Email</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Scan each website and send a personalised audit email to each contact.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors">
                        <Upload className="h-4 w-4" /> Import CSV
                    </button>
                    <button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 transition-colors">
                        <Plus className="h-4 w-4" /> Add Contact
                    </button>
                    <button onClick={handleStart} disabled={starting || stats.pending === 0}
                        className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Start Sending {stats.pending > 0 && `(${stats.pending})`}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {statCards.map(s => (
                    <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Bulk delete actions */}
            {stats.total > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">Delete:</span>
                    {stats.failed > 0 && (
                        <button onClick={() => handleDeleteAll('failed')} className="rounded border border-red-200 dark:border-red-800 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                            Failed ({stats.failed})
                        </button>
                    )}
                    {stats.sent > 0 && (
                        <button onClick={() => handleDeleteAll('sent')} className="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            Sent ({stats.sent})
                        </button>
                    )}
                    <button onClick={() => handleDeleteAll()} className="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        All ({stats.total})
                    </button>
                </div>
            )}

            {/* Table */}
            {contacts.data.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
                    <Mail className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500">No contacts yet. Import a CSV or add one manually.</p>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left">Website</th>
                                    <th className="px-4 py-3 text-left">Language</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Score</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {contacts.data.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{c.email}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                                            <a href={c.website} target="_blank" rel="noreferrer" className="hover:underline text-violet-600 dark:text-violet-400">{c.website}</a>
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.status === 'pending' ? (
                                                <div className="relative">
                                                    <select
                                                        value={c.language}
                                                        onChange={e => handleLangChange(c.id, e.target.value)}
                                                        className="appearance-none rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-2.5 pr-7 py-1 text-xs text-gray-700 dark:text-gray-300 focus:border-violet-500 focus:outline-none cursor-pointer"
                                                    >
                                                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                                    </select>
                                                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                </div>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Globe className="h-3 w-3" />
                                                    {LANGUAGES.find(l => l.value === c.language)?.label ?? c.language}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <StatusBadge status={c.status} />
                                                {c.error_message && (
                                                    <p className="mt-1 text-xs text-red-500 max-w-[200px] truncate" title={c.error_message}>
                                                        {c.error_message}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><ScoreBadge score={c.audit_score} /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {(c.status === 'failed' || c.status === 'scan_failed') && (
                                                    <button onClick={() => handleRetry(c.id)} title="Retry"
                                                        className="rounded p-1.5 text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                        <RefreshCw className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(c.id)} title="Delete"
                                                    className="rounded p-1.5 text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {(contacts.prev_page_url || contacts.next_page_url) && (
                <div className="mt-6 flex items-center justify-center gap-4">
                    {contacts.prev_page_url && (
                        <a href={contacts.prev_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 transition-colors">← Previous</a>
                    )}
                    <span className="text-sm text-gray-500">Page {contacts.current_page} of {contacts.last_page}</span>
                    {contacts.next_page_url && (
                        <a href={contacts.next_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 transition-colors">Next →</a>
                    )}
                </div>
            )}

            {showAdd    && <AddContactModal    onClose={() => setShowAdd(false)} />}
            {showImport && <ImportCsvModal     onClose={() => setShowImport(false)} />}
        </AppLayout>
    );
}
