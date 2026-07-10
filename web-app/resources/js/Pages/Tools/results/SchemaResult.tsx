import { Panel, StatGrid, StatCard, Row, SectionTitle, EmptyGood, IssueList } from '../Shared';

interface MetaTitle {
    status: string;
    value: string | null;
    length: number;
    issues: string[];
}

interface Lede {
    text: string | null;
    length: number;
    issues: string[];
}

interface MetaDescription {
    status: string;
    value: string | null;
    length: number;
    issues: string[];
    note: string;
    lede: Lede;
}

interface H1Tags {
    count: number;
    status: string;
    texts: string[];
    in_articles: number;
    article_count: number;
    context: string;
    issues: string[];
}

interface Canonical {
    url: string | null;
    matches_audited_url: boolean | null;
    multiple_found: boolean;
    status: string;
    issues: string[];
}

interface SchemaValidation {
    has_valid_schema: boolean;
    schemas_found: any[];
    errors: string[];
    rdfa: { detected: boolean };
    microdata: { detected: boolean };
    implementations: string[];
}

interface OpenGraph {
    found: Record<string, string>;
    missing: string[];
    issues: string[];
    twitter_card: string | null;
    twitter_title: string | null;
    status: string;
}

interface ImageAltUrl {
    src: string;
    role: string | null;
    in_link: boolean;
}

interface ImageAltText {
    total_images: number;
    missing_alt: number;
    decorative: number;
    has_alt: number;
    missing_alt_urls: ImageAltUrl[];
    note: string;
    status: string;
    issues: string[];
}

interface TechnicalSeo {
    robots_txt: { exists: boolean; status_code: number | null };
    sitemap_xml: { exists: boolean; status_code: number | null };
    issues: string[];
}

interface RobotsDirectives {
    is_noindex: boolean;
    is_nofollow: boolean;
    directives: string[];
    status: string;
    issues: string[];
}

interface UrlQuality {
    path: string;
    path_length: number;
    segments: number;
    has_uppercase: boolean;
    uses_hyphens: boolean;
    uses_underscores: boolean;
    has_query_params: boolean;
    has_dynamic_id: boolean;
    issues: string[];
    status: string;
}

interface PageContent {
    word_count: number;
    content_depth: string;
    issues: string[];
}

interface Heading {
    level: number;
    text: string;
}

interface HeadingStructure {
    total_headings: number;
    headings: Heading[];
    issues: string[];
    status: string;
}

interface InternalLinking {
    internal_links: number;
    external_links: number;
    nofollow_links: number;
    total_links: number;
    issues: string[];
}

interface Data {
    site_url: string;
    meta_title: MetaTitle;
    meta_description: MetaDescription;
    h1_tags: H1Tags;
    canonical: Canonical;
    schema_validation: SchemaValidation;
    open_graph: OpenGraph;
    image_alt_text: ImageAltText;
    technical_seo: TechnicalSeo;
    robots_directives: RobotsDirectives;
    url_quality: UrlQuality;
    page_content: PageContent;
    heading_structure: HeadingStructure;
    internal_linking: InternalLinking;
}

type Tone = 'good' | 'bad' | 'warn' | 'neutral';

const BAD_STATUSES = new Set(['MISSING', 'BAD', 'MULTIPLE', 'MISMATCH', 'TOO_LONG', 'TOO_SHORT', 'EMPTY', 'NOINDEX']);
const WARN_STATUSES = new Set(['WARN', 'PARTIAL']);

function statusTone(status: string | undefined | null): Tone {
    if (!status) return 'neutral';
    if (BAD_STATUSES.has(status)) return 'bad';
    if (WARN_STATUSES.has(status)) return 'warn';
    return 'good';
}

function statusOk(status: string | undefined | null): boolean | null {
    const tone = statusTone(status);
    if (tone === 'good') return true;
    if (tone === 'bad') return false;
    return null;
}

export default function SchemaResult({ data }: { data: Data }) {
    const {
        meta_title,
        meta_description,
        h1_tags,
        canonical,
        schema_validation,
        open_graph,
        image_alt_text,
        technical_seo,
        robots_directives,
        url_quality,
        page_content,
        heading_structure,
        internal_linking,
    } = data;

    const totalIssues =
        meta_title.issues.length +
        meta_description.issues.length +
        meta_description.lede.issues.length +
        h1_tags.issues.length +
        canonical.issues.length +
        schema_validation.errors.length +
        open_graph.issues.length +
        image_alt_text.issues.length +
        technical_seo.issues.length +
        robots_directives.issues.length +
        url_quality.issues.length +
        page_content.issues.length +
        heading_structure.issues.length +
        internal_linking.issues.length;

    return (
        <div>
            <StatGrid>
                <StatCard label="Total issues" value={totalIssues} tone={totalIssues > 0 ? (totalIssues > 5 ? 'bad' : 'warn') : 'good'} />
                <StatCard label="H1 tags" value={h1_tags.count} tone={statusTone(h1_tags.status)} />
                <StatCard label="Word count" value={page_content.word_count} />
                <StatCard label="Valid schema" value={schema_validation.has_valid_schema ? 'Yes' : 'No'} tone={schema_validation.has_valid_schema ? 'good' : 'bad'} />
                <StatCard label="Missing alt text" value={image_alt_text.missing_alt} tone={statusTone(image_alt_text.status)} />
                <StatCard label="Internal links" value={internal_linking.internal_links} />
            </StatGrid>

            <SectionTitle>Meta title</SectionTitle>
            <Panel>
                <Row label="Status" value={meta_title.status} ok={statusOk(meta_title.status)} />
                <Row label="Value" value={meta_title.value} />
                <Row label="Length" value={meta_title.length} />
                <div className="mt-4">
                    <IssueList issues={meta_title.issues} />
                </div>
            </Panel>

            <SectionTitle>Meta description</SectionTitle>
            <Panel>
                <Row label="Status" value={meta_description.status} ok={statusOk(meta_description.status)} />
                <Row label="Value" value={meta_description.value} />
                <Row label="Length" value={meta_description.length} />
                <Row label="Note" value={meta_description.note} />
                <Row label="Lede text" value={meta_description.lede.text} />
                <Row label="Lede length" value={meta_description.lede.length} />
                <div className="mt-4">
                    <IssueList issues={[...meta_description.issues, ...meta_description.lede.issues]} />
                </div>
            </Panel>

            <SectionTitle>H1 tags</SectionTitle>
            <Panel>
                <Row label="Status" value={h1_tags.status} ok={statusOk(h1_tags.status)} />
                <Row label="Count" value={h1_tags.count} />
                <Row label="Context" value={h1_tags.context} />
                <Row label="In articles" value={`${h1_tags.in_articles} / ${h1_tags.article_count}`} />
                {h1_tags.texts.length > 0 && (
                    <div className="mt-3 space-y-1">
                        {h1_tags.texts.map((text, i) => (
                            <div key={i} className="text-sm text-gray-700 dark:text-gray-300 break-words">
                                {text}
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-4">
                    <IssueList issues={h1_tags.issues} />
                </div>
            </Panel>

            <SectionTitle>Canonical URL</SectionTitle>
            <Panel>
                <Row label="Status" value={canonical.status} ok={statusOk(canonical.status)} />
                <Row label="URL" value={canonical.url} />
                <Row label="Matches audited URL" value={canonical.matches_audited_url === null ? 'N/A' : canonical.matches_audited_url ? 'Yes' : 'No'} ok={canonical.matches_audited_url} />
                <Row label="Multiple found" value={canonical.multiple_found ? 'Yes' : 'No'} ok={!canonical.multiple_found} />
                <div className="mt-4">
                    <IssueList issues={canonical.issues} />
                </div>
            </Panel>

            <SectionTitle>Schema validation</SectionTitle>
            <Panel>
                <Row label="Has valid schema" value={schema_validation.has_valid_schema ? 'Yes' : 'No'} ok={schema_validation.has_valid_schema} />
                <Row label="Schemas found" value={schema_validation.schemas_found.length} />
                <Row label="Implementations" value={schema_validation.implementations.length > 0 ? schema_validation.implementations.join(', ') : 'None'} />
                <Row label="RDFa detected" value={schema_validation.rdfa.detected ? 'Yes' : 'No'} />
                <Row label="Microdata detected" value={schema_validation.microdata.detected ? 'Yes' : 'No'} />
                <div className="mt-4">
                    <IssueList issues={schema_validation.errors} />
                </div>
            </Panel>

            <SectionTitle>Open Graph &amp; Twitter cards</SectionTitle>
            <Panel>
                <Row label="Status" value={open_graph.status} ok={statusOk(open_graph.status)} />
                <Row label="Twitter card" value={open_graph.twitter_card} />
                <Row label="Twitter title" value={open_graph.twitter_title} />
                {Object.keys(open_graph.found).length > 0 && (
                    <div className="mt-3 space-y-1">
                        {Object.entries(open_graph.found).map(([key, value]) => (
                            <Row key={key} label={key} value={value} />
                        ))}
                    </div>
                )}
                {open_graph.missing.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Missing tags: {open_graph.missing.join(', ')}
                    </div>
                )}
                <div className="mt-4">
                    <IssueList issues={open_graph.issues} />
                </div>
            </Panel>

            <SectionTitle>Image alt text</SectionTitle>
            <Panel>
                <Row label="Status" value={image_alt_text.status} ok={statusOk(image_alt_text.status)} />
                <Row label="Total images" value={image_alt_text.total_images} />
                <Row label="Has alt" value={image_alt_text.has_alt} />
                <Row label="Missing alt" value={image_alt_text.missing_alt} ok={image_alt_text.missing_alt === 0} />
                <Row label="Decorative" value={image_alt_text.decorative} />
                <Row label="Note" value={image_alt_text.note} />
                {image_alt_text.missing_alt_urls.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {image_alt_text.missing_alt_urls.map((img, i) => (
                            <div key={i} className="text-sm text-gray-700 dark:text-gray-300 break-all">
                                {img.src}
                                {img.role && <span className="text-gray-500 dark:text-gray-400"> — role: {img.role}</span>}
                                {img.in_link && <span className="text-gray-500 dark:text-gray-400"> — inside a link</span>}
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-4">
                    <IssueList issues={image_alt_text.issues} />
                </div>
            </Panel>

            <SectionTitle>Technical SEO</SectionTitle>
            <Panel>
                <Row label="robots.txt exists" value={technical_seo.robots_txt.exists ? 'Yes' : 'No'} ok={technical_seo.robots_txt.exists} />
                <Row label="robots.txt status code" value={technical_seo.robots_txt.status_code} />
                <Row label="sitemap.xml exists" value={technical_seo.sitemap_xml.exists ? 'Yes' : 'No'} ok={technical_seo.sitemap_xml.exists} />
                <Row label="sitemap.xml status code" value={technical_seo.sitemap_xml.status_code} />
                <div className="mt-4">
                    <IssueList issues={technical_seo.issues} />
                </div>
            </Panel>

            <SectionTitle>Robots directives</SectionTitle>
            <Panel>
                <Row label="Status" value={robots_directives.status} ok={statusOk(robots_directives.status)} />
                <Row label="Noindex" value={robots_directives.is_noindex ? 'Yes' : 'No'} ok={!robots_directives.is_noindex} />
                <Row label="Nofollow" value={robots_directives.is_nofollow ? 'Yes' : 'No'} ok={!robots_directives.is_nofollow} />
                <Row label="Directives" value={robots_directives.directives.length > 0 ? robots_directives.directives.join(', ') : 'None'} />
                <div className="mt-4">
                    <IssueList issues={robots_directives.issues} />
                </div>
            </Panel>

            <SectionTitle>URL quality</SectionTitle>
            <Panel>
                <Row label="Status" value={url_quality.status} ok={statusOk(url_quality.status)} />
                <Row label="Path" value={url_quality.path} />
                <Row label="Path length" value={url_quality.path_length} />
                <Row label="Segments" value={url_quality.segments} />
                <Row label="Has uppercase" value={url_quality.has_uppercase ? 'Yes' : 'No'} ok={!url_quality.has_uppercase} />
                <Row label="Uses hyphens" value={url_quality.uses_hyphens ? 'Yes' : 'No'} />
                <Row label="Uses underscores" value={url_quality.uses_underscores ? 'Yes' : 'No'} ok={!url_quality.uses_underscores} />
                <Row label="Has query params" value={url_quality.has_query_params ? 'Yes' : 'No'} />
                <Row label="Has dynamic ID" value={url_quality.has_dynamic_id ? 'Yes' : 'No'} />
                <div className="mt-4">
                    <IssueList issues={url_quality.issues} />
                </div>
            </Panel>

            <SectionTitle>Page content</SectionTitle>
            <Panel>
                <Row label="Word count" value={page_content.word_count} />
                <Row label="Content depth" value={page_content.content_depth} />
                <div className="mt-4">
                    <IssueList issues={page_content.issues} />
                </div>
            </Panel>

            <SectionTitle>Heading structure</SectionTitle>
            <Panel>
                <Row label="Status" value={heading_structure.status} ok={statusOk(heading_structure.status)} />
                <Row label="Total headings" value={heading_structure.total_headings} />
                {heading_structure.headings.length > 0 && (
                    <div className="mt-3 space-y-1">
                        {heading_structure.headings.map((h, i) => (
                            <div key={i} className="text-sm text-gray-700 dark:text-gray-300 break-words">
                                <span className="text-gray-500 dark:text-gray-400">H{h.level}</span> {h.text}
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-4">
                    <IssueList issues={heading_structure.issues} />
                </div>
            </Panel>

            <SectionTitle>Internal linking</SectionTitle>
            <Panel>
                <Row label="Internal links" value={internal_linking.internal_links} />
                <Row label="External links" value={internal_linking.external_links} />
                <Row label="Nofollow links" value={internal_linking.nofollow_links} />
                <Row label="Total links" value={internal_linking.total_links} />
                <div className="mt-4">
                    <IssueList issues={internal_linking.issues} />
                </div>
            </Panel>

            {totalIssues === 0 && (
                <div className="mt-6">
                    <EmptyGood text="No SEO or schema issues found across all checks." />
                </div>
            )}
        </div>
    );
}
