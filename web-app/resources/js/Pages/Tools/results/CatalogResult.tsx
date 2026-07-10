import { StatGrid, StatCard, SectionTitle, EmptyGood, FindingCard, Row } from '../Shared';

interface CatalogProductResult {
    url: string;
    is_broken: boolean;
    has_price_error: boolean;
    price_errors: string[];
    detected_price: string | null;
    schema_stock: string | null;
    schema_price: string | null;
    frontend_stock: string;
    stock_mismatch: boolean;
    stock_details: string[];
    cart_disabled: boolean;
}

interface Data {
    site_url: string;
    pages_crawled: number;
    product_pages_found: number;
    products_audited: number;
    broken_products_count: number;
    broken_percentage: number;
    results: CatalogProductResult[];
    executed_at: string;
}

function brokenSummary(item: CatalogProductResult): string {
    const parts: string[] = [];
    if (item.price_errors.length > 0) parts.push(...item.price_errors);
    if (item.stock_details.length > 0) parts.push(...item.stock_details);
    if (item.cart_disabled) parts.push('Add-to-cart disabled');
    return parts.length > 0 ? parts.join(', ') : 'Issue detected';
}

function contextMeta(item: CatalogProductResult): string {
    const parts = [
        `Detected price: ${item.detected_price ?? 'N/A'}`,
        `Schema price: ${item.schema_price ?? 'N/A'}`,
        `Schema stock: ${item.schema_stock ?? 'N/A'}`,
        `Frontend stock: ${item.frontend_stock}`,
    ];
    return parts.join(' · ');
}

export default function CatalogResult({ data }: { data: Data }) {
    const brokenResults = data.results.filter((item) => item.is_broken);
    const cleanCount = data.results.length - brokenResults.length;

    return (
        <div>
            <StatGrid>
                <StatCard label="Product pages found" value={data.product_pages_found} />
                <StatCard label="Products audited" value={data.products_audited} />
                <StatCard
                    label="Broken products"
                    value={data.broken_products_count}
                    tone={data.broken_products_count > 0 ? 'bad' : 'good'}
                />
                <StatCard
                    label="Broken percentage"
                    value={`${data.broken_percentage.toFixed(1)}%`}
                    tone={data.broken_products_count > 0 ? 'bad' : 'good'}
                />
            </StatGrid>

            <SectionTitle>Broken products ({data.products_audited} audited)</SectionTitle>
            {brokenResults.length === 0 ? (
                <EmptyGood text="No broken products found." />
            ) : (
                <div className="space-y-2">
                    {brokenResults.map((item, i) => (
                        <div key={i}>
                            <FindingCard title={item.url} meta={brokenSummary(item)} />
                            <div className="mt-1 mb-2 pl-3">
                                <Row label="Context" value={contextMeta(item)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {data.results.length > 0 && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {cleanCount} of {data.results.length} product pages passed with no issues.
                </p>
            )}
        </div>
    );
}
