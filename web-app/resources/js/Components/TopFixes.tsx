import { AlertTriangle } from 'lucide-react';
import type { TFunction } from 'i18next';
import { Deduction, isStructured, dedText, SEVERITY_ORDER, SEVERITY_DOT } from '@/lib/deductions';

/**
 * "Score deductions" panel, upgraded to prioritize by severity and show a
 * remediation hint per finding. Accepts both the new structured deduction
 * objects and the legacy plain-string shape (old reports) transparently.
 */
export default function TopFixes({ deductions, t }: { deductions: Deduction[]; t: TFunction }) {
    if (!deductions || deductions.length === 0) return null;

    // Structured deductions sort by severity then points; strings keep order.
    const sorted = [...deductions].sort((a, b) => {
        if (isStructured(a) && isStructured(b)) {
            const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
            return s !== 0 ? s : b.points - a.points;
        }
        return 0;
    });

    return (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('show.deductionsTitle')}</h3>
            </div>
            <ul className="space-y-2.5">
                {sorted.map((d, i) => {
                    if (!isStructured(d)) {
                        return (
                            <li key={i} className="text-sm text-amber-700 dark:text-amber-400">• {d}</li>
                        );
                    }
                    const fix = t(d.fixKey, { defaultValue: '' });
                    return (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[d.severity]}`} aria-hidden="true" />
                            <div className="min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{d.label}</span>
                                    <span className="shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-500">−{d.points}</span>
                                </div>
                                {fix && <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80">{fix}</p>}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
