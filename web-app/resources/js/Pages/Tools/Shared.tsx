import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 ${className}`}>
            {children}
        </div>
    );
}

export function StatCard({ label, value, tone = 'neutral' }: { label: string; value: ReactNode; tone?: 'good' | 'bad' | 'warn' | 'neutral' }) {
    const toneClass = {
        good: 'text-emerald-500 dark:text-emerald-400',
        bad: 'text-red-500 dark:text-red-400',
        warn: 'text-amber-500 dark:text-amber-400',
        neutral: 'text-gray-900 dark:text-white',
    }[tone];
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
            <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
        </div>
    );
}

export function StatGrid({ children }: { children: ReactNode }) {
    return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">{children}</div>;
}

export function Row({ label, value, ok }: { label: string; value: ReactNode; ok?: boolean | null }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-200 dark:border-gray-800 last:border-0">
            <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">{label}</span>
            <div className="flex items-center gap-1.5 text-right">
                {ok === true && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                {ok === false && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
                <span className="text-sm text-gray-800 dark:text-gray-200 break-all">{value ?? 'N/A'}</span>
            </div>
        </div>
    );
}

export function SectionTitle({ children }: { children: ReactNode }) {
    return <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-3">{children}</h2>;
}

export function EmptyGood({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {text}
        </div>
    );
}

export function FindingCard({ title, meta, screenshot }: { title: ReactNode; meta?: ReactNode; screenshot?: string | null }) {
    return (
        <div className="flex items-start gap-4 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            {screenshot && (
                <img
                    src={screenshot.startsWith('http') ? screenshot : `/storage/${screenshot}`}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded object-cover border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                />
            )}
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white break-all">{title}</div>
                {meta && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">{meta}</div>}
            </div>
        </div>
    );
}

export function IssueList({ issues }: { issues: string[] }) {
    if (issues.length === 0) return <EmptyGood text="No issues found here." />;
    return (
        <ul className="space-y-2">
            {issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                    {issue}
                </li>
            ))}
        </ul>
    );
}
