import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, Tag, Copy, Check, Pencil, X, RefreshCw, Users } from 'lucide-react';
import { PageProps } from '@/types';

interface CodeRow {
    id: number;
    code: string;
    note: string | null;
    created_by: string | null;
    used_by: { id: number; name: string; email: string } | null;
    used_at: string | null;
    expires_at: string | null;
    active_until: string | null;
    premium_days: number;
    max_uses: number | null;
    use_count: number;
    site_url: string | null;
    created_at: string;
    is_used: boolean;
    is_fully_used: boolean;
    is_redeemable: boolean;
    is_expired: boolean;
}

interface Props extends PageProps {
    codes: CodeRow[];
}

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatCard({ label, value, color = 'violet' }: { label: string; value: number; color?: string }) {
    const bar: Record<string, string> = {
        violet:  'bg-violet-500/10',
        emerald: 'bg-emerald-500/10',
        blue:    'bg-blue-500/10',
        amber:   'bg-amber-500/10',
    };
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{label}</div>
            <div className={`mt-2 h-1 w-10 rounded-full ${bar[color]}`} />
        </div>
    );
}

function StatusBadge({ row }: { row: CodeRow }) {
    if (row.is_expired) {
        return (
            <span className="inline-flex items-center rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400">
                Date Expired
            </span>
        );
    }
    if (row.is_fully_used) {
        return (
            <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-medium text-rose-400">
                Fully Used
            </span>
        );
    }
    if (row.is_used) {
        return (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                Active
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            Unused
        </span>
    );
}

function UsagePill({ row }: { row: CodeRow }) {
    const max = row.max_uses;
    const count = row.use_count;

    if (max === null) {
        return (
            <span className="text-xs text-gray-500">
                {count === 0 ? 'Single use' : '1 / 1'}
            </span>
        );
    }

    const pct = Math.min(100, Math.round((count / max) * 100));
    const full = count >= max;
    return (
        <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${full ? 'bg-rose-500' : 'bg-violet-500'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`text-xs font-mono ${full ? 'text-rose-400' : 'text-gray-500'}`}>
                {count}/{max}
            </span>
        </div>
    );
}

function CopyCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(code).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                });
            }}
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
            { preserveScroll: true, onFinish: () => { setSaving(false); setEditing(false); } }
        );
    };

    if (editing) {
        return (
            <textarea
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={save}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
                    if (e.key === 'Escape') { setValue(note ?? ''); setEditing(false); }
                }}
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
            {value
                ? <span className="text-gray-700 dark:text-gray-300">{value}</span>
                : <span className="text-gray-400 italic">Add note…</span>
            }
            <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
        </button>
    );
}

// ── Create Code Modal ──────────────────────────────────────────────────────────

interface CreateModalProps { onClose: () => void }

function CreateModal({ onClose }: CreateModalProps) {
    const [code, setCode]               = useState('');
    const [note, setNote]               = useState('');
    const [maxUses, setMaxUses]         = useState('');
    const [activeUntil, setActiveUntil] = useState('');
    const [premiumDays, setPremiumDays] = useState('7');
    const [isMulti, setIsMulti]         = useState(false);
    const [submitting, setSubmitting]   = useState(false);
    const [errors, setErrors]           = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        router.post(
            route('admin.trial-codes.store'),
            {
                code:          code.trim() || undefined,
                note:          note.trim() || undefined,
                max_uses:      isMulti && maxUses ? parseInt(maxUses) : undefined,
                active_until:  activeUntil || undefined,
                premium_days:  parseInt(premiumDays) || 7,
            },
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) => { setErrors(errs); setSubmitting(false); },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Trial Code</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Code */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Code <span className="text-gray-400 font-normal">(leave blank to auto-generate)</span>
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. SUMMER24 or ABCD-EFGH"
                            maxLength={64}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        {errors.code && <p className="mt-1 text-xs text-rose-400">{errors.code}</p>}
                    </div>

                    {/* Note / label */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Label / Note
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g. Summer campaign 2024"
                            maxLength={500}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>

                    {/* Premium days */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Premium days from activation
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={3650}
                            value={premiumDays}
                            onChange={e => setPremiumDays(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        {errors.premium_days && <p className="mt-1 text-xs text-rose-400">{errors.premium_days}</p>}
                    </div>

                    {/* Single vs multi-use toggle */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Multi-use code</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMulti(!isMulti)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${isMulti ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isMulti ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {isMulti && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Max users
                                </label>
                                <input
                                    type="number"
                                    min={2}
                                    max={9999}
                                    value={maxUses}
                                    onChange={e => setMaxUses(e.target.value)}
                                    placeholder="e.g. 50"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                {errors.max_uses && <p className="mt-1 text-xs text-rose-400">{errors.max_uses}</p>}
                            </div>
                        )}
                    </div>

                    {/* Active until */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Active until <span className="text-gray-400 font-normal">(optional — leave blank for no expiry)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={activeUntil}
                            onChange={e => setActiveUntil(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        {errors.active_until && <p className="mt-1 text-xs text-rose-400">{errors.active_until}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
                        >
                            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Create Code
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminTrialCodesIndex({ codes }: Props) {
    const { props } = usePage<PageProps>();
    const flash = props.flash;
    const [showModal, setShowModal] = useState(false);

    const totalCodes    = codes.length;
    const usedCodes     = codes.filter(c => c.is_used).length;
    const activeTrials  = codes.filter(c => c.is_redeemable && c.is_used).length;
    const expiredCodes  = codes.filter(c => c.is_expired || c.is_fully_used).length;

    const handleDelete = (id: number) => {
        if (!confirm('Delete this unused code?')) return;
        router.delete(route('admin.trial-codes.destroy', { trialCode: id }), { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Trial Codes" />

            {showModal && <CreateModal onClose={() => setShowModal(false)} />}

            <div className="space-y-6">
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
                            Single-use or multi-use codes that grant premium access for a set number of days
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Create Code
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Total Codes"    value={totalCodes}   color="violet" />
                    <StatCard label="Used at least once" value={usedCodes} color="blue" />
                    <StatCard label="Still redeemable" value={activeTrials} color="emerald" />
                    <StatCard label="Expired / Full"  value={expiredCodes} color="amber" />
                </div>

                {/* Table */}
                {codes.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
                        <Tag className="mx-auto mb-3 h-10 w-10 text-gray-500" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No trial codes yet.</p>
                        <p className="mt-1 text-xs text-gray-500">Create your first code above.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="px-4 py-3 text-left">Code</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Usage</th>
                                        <th className="px-4 py-3 text-left">Days</th>
                                        <th className="px-4 py-3 text-left hidden md:table-cell">Note</th>
                                        <th className="px-4 py-3 text-left hidden lg:table-cell">Active Until</th>
                                        <th className="px-4 py-3 text-left hidden lg:table-cell">Used By</th>
                                        <th className="px-4 py-3 text-left hidden xl:table-cell">Created</th>
                                        <th className="px-4 py-3 text-right w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {codes.map(code => (
                                        <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <CopyCode code={code.code} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge row={code} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <UsagePill row={code} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
                                                    {code.premium_days}d
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell min-w-[180px]">
                                                <InlineNote id={code.id} note={code.note} />
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                                                {code.active_until ? (
                                                    <span className={code.is_expired ? 'text-rose-400' : ''}>
                                                        {formatDate(code.active_until)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">No limit</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                {code.used_by ? (
                                                    <div>
                                                        <p className="text-gray-700 dark:text-gray-300 text-xs font-medium">{code.used_by.name}</p>
                                                        <p className="text-gray-500 text-xs">{code.used_by.email}</p>
                                                    </div>
                                                ) : code.use_count > 0 ? (
                                                    <span className="text-xs text-gray-500">{code.use_count} user{code.use_count > 1 ? 's' : ''}</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
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
