import { StatGrid, StatCard, SectionTitle, EmptyGood, FindingCard } from '../Shared';

interface BrokenItem {
    url: string;
    found_on?: string | null;
    status_code?: number;
    error?: string;
    screenshot?: string;
}

interface Data {
    site_url: string;
    pages_crawled: number;
    summary: {
        total_links_checked: number;
        broken_links_count: number;
        broken_links_percentage: number;
        total_images_checked: number;
        broken_images_count: number;
        broken_images_percentage: number;
    };
    broken_links: BrokenItem[];
    broken_images: BrokenItem[];
}

function itemMeta(item: BrokenItem): string {
    const reason = item.status_code ? `HTTP ${item.status_code}` : (item.error ?? 'Unreachable');
    return item.found_on ? `${reason} — found on ${item.found_on}` : reason;
}

export default function BrokenLinksResult({ data }: { data: Data }) {
    const s = data.summary;

    return (
        <div>
            <StatGrid>
                <StatCard label="Pages crawled" value={data.pages_crawled} />
                <StatCard label="Broken links" value={s.broken_links_count} tone={s.broken_links_count > 0 ? 'bad' : 'good'} />
                <StatCard label="Broken images" value={s.broken_images_count} tone={s.broken_images_count > 0 ? 'bad' : 'good'} />
            </StatGrid>

            <SectionTitle>Broken links ({s.total_links_checked} checked)</SectionTitle>
            {data.broken_links.length === 0 ? (
                <EmptyGood text="No broken links found." />
            ) : (
                <div className="space-y-2">
                    {data.broken_links.map((item, i) => (
                        <FindingCard key={i} title={item.url} meta={itemMeta(item)} screenshot={item.screenshot} />
                    ))}
                </div>
            )}

            <SectionTitle>Broken images ({s.total_images_checked} checked)</SectionTitle>
            {data.broken_images.length === 0 ? (
                <EmptyGood text="No broken images found." />
            ) : (
                <div className="space-y-2">
                    {data.broken_images.map((item, i) => (
                        <FindingCard key={i} title={item.url} meta={itemMeta(item)} screenshot={item.screenshot} />
                    ))}
                </div>
            )}
        </div>
    );
}
