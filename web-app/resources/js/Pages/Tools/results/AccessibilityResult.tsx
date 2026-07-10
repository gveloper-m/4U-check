import { AlertTriangle } from 'lucide-react';
import { Panel, StatCard, StatGrid, Row, SectionTitle, EmptyGood, IssueList, FindingCard } from '../Shared';

interface FormLabelViolation {
    element: string;
    type: string;
    name: string;
    id: string;
    issue: string;
    html_snippet: string;
}

interface FormLabelsCheck {
    status: 'pass' | 'warn' | 'fail';
    pass: number;
    fail: number;
    total: number;
    violations: FormLabelViolation[];
}

interface ImageAltViolation {
    src: string;
    issue: string;
    parent_tag: string;
    parent_href: string;
    html_snippet: string;
}

interface ImageAltCheck {
    status: 'pass' | 'warn' | 'fail';
    total: number;
    with_alt: number;
    decorative: number;
    missing_count: number;
    violations: ImageAltViolation[];
}

interface AriaLabelViolation {
    element: string;
    issue: string;
    html_snippet: string;
    href?: string;
    src?: string;
}

interface AriaLabelsCheck {
    status: 'pass' | 'warn' | 'fail';
    pass: number;
    fail: number;
    violations: AriaLabelViolation[];
}

interface Heading {
    level: number;
    text: string;
}

interface HeadingHierarchyCheck {
    status: 'pass' | 'warn' | 'fail';
    headings: Heading[];
    h1_count: number;
    total_headings: number;
    issues: string[];
}

interface LinkTextViolation {
    href: string;
    issue: string;
    text?: string;
}

interface LinkTextCheck {
    status: 'pass' | 'warn' | 'fail';
    pass: number;
    fail: number;
    violations: LinkTextViolation[];
}

interface LandmarksCheck {
    status: 'pass' | 'warn' | 'fail';
    has_lang: boolean;
    lang: string;
    has_title: boolean;
    title: string;
    has_main: boolean;
    has_nav: boolean;
    has_header: boolean;
    has_footer: boolean;
    has_skip_nav: boolean;
    issues: string[];
}

interface ColorContrastViolation {
    element?: string;
    class?: string;
    id?: string;
    selector?: string;
    fg_color: string;
    bg_color: string;
    ratio: number;
    required: number;
    source: string;
    html_snippet?: string;
    screenshot?: string;
}

interface ColorContrastCheck {
    status: 'pass' | 'warn' | 'fail';
    pass: number;
    fail: number;
    note: string;
    violations: ColorContrastViolation[];
}

interface AccessibilityChecks {
    form_labels: FormLabelsCheck;
    image_alt: ImageAltCheck;
    aria_labels: AriaLabelsCheck;
    heading_hierarchy: HeadingHierarchyCheck;
    link_text: LinkTextCheck;
    landmarks: LandmarksCheck;
    color_contrast: ColorContrastCheck;
}

interface AccessibilitySuccess {
    status: 'ok';
    url: string;
    score: number;
    checks: AccessibilityChecks;
}

interface AccessibilityError {
    status: 'error';
    error: string;
}

type Data = AccessibilitySuccess | AccessibilityError;

function scoreTone(score: number): 'good' | 'warn' | 'bad' {
    if (score >= 90) return 'good';
    if (score >= 70) return 'warn';
    return 'bad';
}

function statusTone(status: 'pass' | 'warn' | 'fail'): 'good' | 'warn' | 'bad' {
    if (status === 'pass') return 'good';
    if (status === 'warn') return 'warn';
    return 'bad';
}

function CheckHeader({
    title,
    status,
    counts,
}: {
    title: string;
    status: 'pass' | 'warn' | 'fail';
    counts?: string;
}) {
    const toneClass = {
        good: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
        warn: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
        bad: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/20',
    }[statusTone(status)];

    return (
        <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            <div className="flex items-center gap-2">
                {counts && <span className="text-xs text-gray-500 dark:text-gray-400">{counts}</span>}
                <span className={`text-xs font-medium uppercase tracking-wide rounded-full border px-2 py-0.5 ${toneClass}`}>
                    {status}
                </span>
            </div>
        </div>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{message}</span>
        </div>
    );
}

export default function AccessibilityResult({ data }: { data: Data }) {
    if (data.status === 'error') {
        return <ErrorBanner message={data.error || 'The accessibility audit could not be completed.'} />;
    }

    const c = data.checks;

    return (
        <div>
            <StatGrid>
                <StatCard label="Accessibility score" value={`${data.score}/100`} tone={scoreTone(data.score)} />
                <StatCard label="Form label issues" value={c.form_labels.fail} tone={c.form_labels.fail > 0 ? 'bad' : 'good'} />
                <StatCard label="Missing image alt" value={c.image_alt.missing_count} tone={c.image_alt.missing_count > 0 ? 'bad' : 'good'} />
            </StatGrid>

            <SectionTitle>Form labels</SectionTitle>
            <Panel>
                <CheckHeader
                    title="Form labels"
                    status={c.form_labels.status}
                    counts={`${c.form_labels.pass} pass / ${c.form_labels.fail} fail / ${c.form_labels.total} total`}
                />
                {c.form_labels.violations.length === 0 ? (
                    <EmptyGood text="All form fields have accessible labels." />
                ) : (
                    <div className="space-y-2">
                        {c.form_labels.violations.map((v, i) => (
                            <FindingCard
                                key={i}
                                title={v.issue}
                                meta={`${v.name || v.id || v.element} — <${v.element}>`}
                            />
                        ))}
                    </div>
                )}
            </Panel>

            <SectionTitle>Image alt text</SectionTitle>
            <Panel>
                <CheckHeader
                    title="Image alt text"
                    status={c.image_alt.status}
                    counts={`${c.image_alt.with_alt}/${c.image_alt.total} with alt, ${c.image_alt.decorative} decorative`}
                />
                {c.image_alt.violations.length === 0 ? (
                    <EmptyGood text="All images have appropriate alt text." />
                ) : (
                    <div className="space-y-2">
                        {c.image_alt.violations.map((v, i) => (
                            <FindingCard
                                key={i}
                                title={v.issue}
                                meta={`${v.src}${v.parent_tag ? ` — inside <${v.parent_tag}>` : ''}`}
                            />
                        ))}
                    </div>
                )}
            </Panel>

            <SectionTitle>ARIA labels</SectionTitle>
            <Panel>
                <CheckHeader
                    title="ARIA labels"
                    status={c.aria_labels.status}
                    counts={`${c.aria_labels.pass} pass / ${c.aria_labels.fail} fail`}
                />
                {c.aria_labels.violations.length === 0 ? (
                    <EmptyGood text="No missing ARIA labels found." />
                ) : (
                    <div className="space-y-2">
                        {c.aria_labels.violations.map((v, i) => (
                            <FindingCard
                                key={i}
                                title={v.issue}
                                meta={`<${v.element}>${v.href ? ` — ${v.href}` : v.src ? ` — ${v.src}` : ''}`}
                            />
                        ))}
                    </div>
                )}
            </Panel>

            <SectionTitle>Heading hierarchy</SectionTitle>
            <Panel>
                <CheckHeader
                    title="Heading hierarchy"
                    status={c.heading_hierarchy.status}
                    counts={`${c.heading_hierarchy.h1_count} H1 / ${c.heading_hierarchy.total_headings} headings`}
                />
                <IssueList issues={c.heading_hierarchy.issues} />
            </Panel>

            <SectionTitle>Link text</SectionTitle>
            <Panel>
                <CheckHeader
                    title="Link text"
                    status={c.link_text.status}
                    counts={`${c.link_text.pass} pass / ${c.link_text.fail} fail`}
                />
                {c.link_text.violations.length === 0 ? (
                    <EmptyGood text="All links have descriptive text." />
                ) : (
                    <div className="space-y-2">
                        {c.link_text.violations.map((v, i) => (
                            <FindingCard key={i} title={v.issue} meta={`${v.text ? `"${v.text}" — ` : ''}${v.href}`} />
                        ))}
                    </div>
                )}
            </Panel>

            <SectionTitle>Landmarks</SectionTitle>
            <Panel>
                <CheckHeader title="Landmarks" status={c.landmarks.status} />
                <div className="mb-4">
                    <Row label="Language attribute" value={c.landmarks.lang || 'N/A'} ok={c.landmarks.has_lang} />
                    <Row label="Page title" value={c.landmarks.title || 'N/A'} ok={c.landmarks.has_title} />
                    <Row label="Main landmark" value={c.landmarks.has_main ? 'Present' : 'Missing'} ok={c.landmarks.has_main} />
                    <Row label="Nav landmark" value={c.landmarks.has_nav ? 'Present' : 'Missing'} ok={c.landmarks.has_nav} />
                    <Row label="Header landmark" value={c.landmarks.has_header ? 'Present' : 'Missing'} ok={c.landmarks.has_header} />
                    <Row label="Footer landmark" value={c.landmarks.has_footer ? 'Present' : 'Missing'} ok={c.landmarks.has_footer} />
                    <Row label="Skip navigation link" value={c.landmarks.has_skip_nav ? 'Present' : 'Missing'} ok={c.landmarks.has_skip_nav} />
                </div>
                <IssueList issues={c.landmarks.issues} />
            </Panel>

            <SectionTitle>Color contrast</SectionTitle>
            <Panel>
                <CheckHeader
                    title="Color contrast"
                    status={c.color_contrast.status}
                    counts={`${c.color_contrast.pass} pass / ${c.color_contrast.fail} fail`}
                />
                {c.color_contrast.note && (
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{c.color_contrast.note}</p>
                )}
                {c.color_contrast.violations.length === 0 ? (
                    <EmptyGood text="No low-contrast text found." />
                ) : (
                    <div className="space-y-2">
                        {c.color_contrast.violations.map((v, i) => {
                            const identifier = v.selector ?? v.element ?? v.class ?? v.id ?? 'Unknown element';
                            return (
                                <FindingCard
                                    key={i}
                                    title={`${identifier} — ratio ${v.ratio}:1 (needs ${v.required}:1)`}
                                    meta={`fg ${v.fg_color} on bg ${v.bg_color} — via ${v.source}`}
                                    screenshot={v.screenshot}
                                />
                            );
                        })}
                    </div>
                )}
            </Panel>
        </div>
    );
}
