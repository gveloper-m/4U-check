import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, Tag, Copy, Check, Pencil } from 'lucide-react';
import { PageProps } from '@/types';

interface CodeRow {
    id: number;
    code: string;
    note: string | null;
    created_by: string | null;
    used_by: { id: number; name: string; email: string } | null;
    used_at: string | null;
    expires_at: string | null;
    site_url: string | null;
    created_at: string;
    is_used: boolean;
    is_active: boolean;
}

interface Props extends PageProps {
    codes: CodeRow[];
}

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatCard({ label, value, color = 'violet' }: { label: string; value: number; color?: string }) {
    const colors: Record<string, string> = {
        violet:  'bg-violet-500/10 border-violet-500/20 text-violet-400',
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        blue:    'bg-blue-500/10   border-blue-500/20   text-blue-400',
    };
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{label}</div>
            <div className={`mt-2 h-1 w-10 rounded-full ${colors[color].split(' ')[0]}`} />
        </div>
    );
}

function StatusBadge({ row }: { row: CodeRow }) {
    if (!row.is_used) {
        return (
            <span className="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                Unused
            </span>
        );
    }
    if (row.is_active) {
        return (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                Active Trial
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-medium text-rose-400">
            Expired
        </span>
    );
}

function CopyCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            title="Copy code"
            className="group inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
            {code}
            {copied
                ? <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                : <Copy className="h-3.5 w-3.5 text-gray-500 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
            }
        </button>
    );
}

function InlineNote({ id, note }: { id: number; note: string | null }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(note ?? '');
    const [saving, setSaving] = useState(false);

    const save = () => {
        setSaving(true);
        router.patch(
            route('admin.trial-codes.update-note', { trialCode: id }),
            { note: value },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSaving(false);
                    setEditing(false);
                },
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            save();
        }
        if (e.key === 'Escape') {
            setValue(note ?? '');
            setEditing(false);
        }
    };

    if (editing) {
        return (
            <textarea
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={save}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={saving}
                className="w-full rounded border border-violet-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none resize-none min-w-[160px]"
            />
        );
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className="group inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
            {value ? (
                <span className="text-gray-700 dark:text-gray-300">{value}</span>
            ) : (
                <span className="text-gray-400 italic">Add note...</span>
            )}
            <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
        </button>
    );
}

export default function AdminTrialCodesIndex({ codes }: Props) {
    const { props } = usePage<PageProps>();
    const flash = props.flash;

    const totalCodes = codes.length;
    const usedCodes = codes.filter(c => c.is_used).length;
    const activeTrials = codes.filter(c => c.is_active).length;

    const handleGenerate = () => {
        router.post(route('admin.trial-codes.store'), {}, { preserveScroll: true });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Delete this unused code?')) return;
        router.delete(route('admin.trial-codes.destroy', { trialCode: id }), { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Trial Codes" />

            <div className="space-y-6">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trial Codes</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Generate one-use trial codes for new users
                        </p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Generate Code
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Total Codes"   value={totalCodes}   color="violet" />
                    <StatCard label="Used Codes"    value={usedCodes}    color="blue" />
                    <StatCard label="Active Trials" value={activeTrials} color="emerald" />
                </div>

                {/* Table / Empty state */}
                {codes.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
                        <Tag className="mx-auto mb-3 h-10 w-10 text-gray-500" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No trial codes yet.</p>
                        <p className="mt-1 text-xs text-gray-500">Generate your first code above.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="px-4 py-3 text-left">Code</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Note</th>
                                        <th className="px-4 py-3 text-left hidden md:table-cell">Used By</th>
                                        <th className="px-4 py-3 text-left hidden lg:table-cell">Used At</th>
                                        <th className="px-4 py-3 text-left hidden lg:table-cell">Expires</th>
                                        <th className="px-4 py-3 text-left hidden xl:table-cell">Site</th>
                                        <th className="px-4 py-3 text-left hidden xl:table-cell">Created</th>
                                        <th className="px-4 py-3 text-right w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {codes.map(code => (
                                        <tr
                                            key={code.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <CopyCode code={code.code} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge row={code} />
                                            </td>
                                            <td className="px-4 py-3 min-w-[180px]">
                                                <InlineNote id={code.id} note={code.note} />
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                {code.used_by ? (
                                                    <div>
                                                        <p className="text-gray-700 dark:text-gray-300 text-xs font-medium">{code.used_by.name}</p>
                                                        <p className="text-gray-500 text-xs">{code.used_by.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                                                {formatDate(code.used_at)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                                                {formatDate(code.expires_at)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell max-w-[160px]">
                                                {code.site_url ? (
                                                    <span className="truncate block" title={code.site_url}>
                                                        {code.site_url}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">
                                                {formatDate(code.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {!code.is_used && (
                                                    <button
                                                        onClick={() => handleDelete(code.id)}
                                                        title="Delete"
                                                        className="inline-flex items-center rounded p-1.5 text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
