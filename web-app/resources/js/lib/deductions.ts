// A score deduction. Old reports stored plain strings (amount baked in);
// new reports store structured objects. Every render surface accepts both.
export interface StructuredDeduction {
    module: string;
    key: string;
    label: string;
    points: number;
    severity: 'critical' | 'major' | 'moderate' | 'minor';
    fixKey: string;
}

export type Deduction = string | StructuredDeduction;

export function isStructured(d: Deduction): d is StructuredDeduction {
    return typeof d === 'object' && d !== null && 'points' in d;
}

/** Display text for a single deduction, handling both shapes. */
export function dedText(d: Deduction): string {
    if (typeof d === 'string') return d;
    return `${d.label} (-${d.points})`;
}

export const SEVERITY_ORDER: Record<StructuredDeduction['severity'], number> = {
    critical: 0,
    major: 1,
    moderate: 2,
    minor: 3,
};

// Tailwind dot colors per severity — used by the "top fixes" panel.
export const SEVERITY_DOT: Record<StructuredDeduction['severity'], string> = {
    critical: 'bg-red-500',
    major: 'bg-orange-500',
    moderate: 'bg-amber-500',
    minor: 'bg-gray-400',
};
