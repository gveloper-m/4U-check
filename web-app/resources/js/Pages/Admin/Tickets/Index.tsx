import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Ticket, PaginatedData } from '@/types';
import { MessageCircle, ChevronRight } from 'lucide-react';

interface Props {
    tickets: PaginatedData<Ticket>;
    currentStatus: string;
    counts: Record<string, number>;
}

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

const FILTERS = [
    { key: 'all',         label: 'All' },
    { key: 'open',        label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved',    label: 'Resolved' },
    { key: 'closed',      label: 'Closed' },
];

export default function AdminTicketsIndex({ tickets, currentStatus, counts }: Props) {
    const setFilter = (status: string) => {
        router.get('/admin/tickets', status !== 'all' ? { status } : {}, { preserveState: false });
    };

    return (
        <AppLayout>
            <Head title="Support Tickets" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{counts.all} total &mdash; {counts.open + counts.in_progress} active</p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                            currentStatus === f.key
                                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                    >
                        {f.label}
                        <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                            currentStatus === f.key ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                            {counts[f.key] ?? 0}
                        </span>
                    </button>
                ))}
            </div>

            {tickets.data.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
                    <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-700" />
                    <p className="text-gray-600 dark:text-gray-400">No tickets in this category.</p>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3 text-left w-12">#</th>
                                <th className="px-4 py-3 text-left">Subject</th>
                                <th className="px-4 py-3 text-left hidden md:table-cell">User</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left hidden lg:table-cell">Opened</th>
                                <th className="px-4 py-3 text-right w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {tickets.data.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-100/40 dark:hover:bg-gray-100/40 dark:bg-gray-800/40 transition-colors">
                                    <td className="px-4 py-3 text-gray-600 text-xs">{ticket.id}</td>
                                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-xs truncate">{ticket.subject}</td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div>
                                            <p className="text-gray-700 dark:text-gray-300 text-xs">{ticket.user?.name ?? '—'}</p>
                                            <p className="text-gray-600 text-xs">{ticket.user?.email ?? ''}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(ticket.created_at)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route('admin.tickets.show', ticket.id)}
                                            className="inline-flex items-center rounded p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                            title="View"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(tickets.prev_page_url || tickets.next_page_url) && (
                <div className="mt-6 flex items-center justify-center gap-4">
                    {tickets.prev_page_url && (
                        <Link href={tickets.prev_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 transition-colors">← Previous</Link>
                    )}
                    <span className="text-sm text-gray-500">Page {tickets.current_page} of {tickets.last_page}</span>
                    {tickets.next_page_url && (
                        <Link href={tickets.next_page_url} className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-500 transition-colors">Next →</Link>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
