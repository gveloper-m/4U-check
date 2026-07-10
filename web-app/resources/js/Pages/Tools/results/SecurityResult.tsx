import { Panel, StatCard, StatGrid, Row, SectionTitle, EmptyGood, IssueList } from '../Shared';

interface SslInfo {
    ssl_valid: boolean;
    ssl_days_left: number | null;
    ssl_expiry: string | null;
    ssl_issuer: string | null;
    ssl_subject: string | null;
    error: string | null;
    warning: string | null;
}

interface MixedContentItem {
    element: string;
    url: string;
}

interface MixedContentInfo {
    has_mixed_content: boolean;
    mixed_content_items: MixedContentItem[];
    error: string | null;
}

interface DnsSecurityInfo {
    root_domain: string;
    spf_record_exists: boolean;
    spf_record: string | null;
    dmarc_record_exists: boolean;
    dmarc_record: string | null;
    dkim_found: boolean;
    dkim_selector: string | null;
    errors: string[];
}

interface SecurityHeadersInfo {
    headers_present: Record<string, string>;
    headers_missing: string[];
    issues: string[];
    info_disclosure: Record<string, string>;
    score: number;
    status: string;
}

interface HttpsRedirectInfo {
    redirects_to_https: boolean | null;
    issues: string[];
    http_status_code?: number;
    redirect_location?: string | null;
}

interface Data {
    site_url: string;
    domain: string;
    ssl: SslInfo;
    mixed_content: MixedContentInfo;
    dns_security: DnsSecurityInfo;
    security_headers: SecurityHeadersInfo;
    https_redirect: HttpsRedirectInfo;
}

function scoreTone(score: number): 'good' | 'warn' | 'bad' {
    if (score >= 6) return 'good';
    if (score >= 4) return 'warn';
    return 'bad';
}

function sslTone(ssl: SslInfo): 'good' | 'warn' | 'bad' {
    if (!ssl.ssl_valid) return 'bad';
    if (ssl.ssl_days_left !== null && ssl.ssl_days_left < 14) return 'bad';
    if (ssl.ssl_days_left !== null && ssl.ssl_days_left < 30) return 'warn';
    return 'good';
}

function redirectTone(redirectsToHttps: boolean | null): 'good' | 'warn' | 'bad' {
    if (redirectsToHttps === true) return 'good';
    if (redirectsToHttps === false) return 'bad';
    return 'warn';
}

function redirectLabel(redirectsToHttps: boolean | null): string {
    if (redirectsToHttps === true) return 'Yes';
    if (redirectsToHttps === false) return 'No';
    return 'Unknown';
}

export default function SecurityResult({ data }: { data: Data }) {
    const { ssl, mixed_content, dns_security, security_headers, https_redirect } = data;

    const infoDisclosureEntries = Object.entries(security_headers.info_disclosure ?? {});

    return (
        <div>
            <StatGrid>
                <StatCard
                    label="Security headers score"
                    value={`${security_headers.score} / 6`}
                    tone={scoreTone(security_headers.score)}
                />
                <StatCard
                    label="SSL certificate"
                    value={ssl.ssl_valid ? `Valid (${ssl.ssl_days_left ?? '?'}d left)` : 'Invalid'}
                    tone={sslTone(ssl)}
                />
                <StatCard
                    label="HTTPS redirect"
                    value={redirectLabel(https_redirect.redirects_to_https)}
                    tone={redirectTone(https_redirect.redirects_to_https)}
                />
            </StatGrid>

            <SectionTitle>SSL certificate</SectionTitle>
            <Panel>
                <Row label="Valid" value={ssl.ssl_valid ? 'Yes' : 'No'} ok={ssl.ssl_valid} />
                <Row label="Days left" value={ssl.ssl_days_left ?? 'N/A'} />
                <Row label="Expires" value={ssl.ssl_expiry ?? 'N/A'} />
                <Row label="Issuer" value={ssl.ssl_issuer ?? 'N/A'} />
                <Row label="Subject" value={ssl.ssl_subject ?? 'N/A'} />
                {ssl.warning && <Row label="Warning" value={ssl.warning} ok={false} />}
                {ssl.error && <Row label="Error" value={ssl.error} ok={false} />}
            </Panel>

            <SectionTitle>HTTP to HTTPS redirect</SectionTitle>
            <Panel>
                <Row
                    label="Redirects to HTTPS"
                    value={redirectLabel(https_redirect.redirects_to_https)}
                    ok={https_redirect.redirects_to_https}
                />
                {'http_status_code' in https_redirect && (
                    <Row label="HTTP status code" value={https_redirect.http_status_code} />
                )}
                {'redirect_location' in https_redirect && https_redirect.redirect_location && (
                    <Row label="Redirect location" value={https_redirect.redirect_location} />
                )}
            </Panel>
            {https_redirect.issues.length > 0 && (
                <div className="mt-3">
                    <IssueList issues={https_redirect.issues} />
                </div>
            )}

            <SectionTitle>Security headers</SectionTitle>
            {security_headers.issues.length > 0 && (
                <div className="mb-3">
                    <IssueList issues={security_headers.issues} />
                </div>
            )}
            <Panel>
                {Object.entries(security_headers.headers_present).map(([header, value]) => (
                    <Row key={header} label={header} value={value} ok={true} />
                ))}
                {security_headers.headers_missing.map((header) => (
                    <Row key={header} label={header} value="Missing" ok={false} />
                ))}
            </Panel>

            <SectionTitle>Information disclosure</SectionTitle>
            {infoDisclosureEntries.length === 0 ? (
                <EmptyGood text="No information-disclosing headers found." />
            ) : (
                <Panel>
                    {infoDisclosureEntries.map(([header, value]) => (
                        <Row key={header} label={header} value={value} ok={false} />
                    ))}
                </Panel>
            )}

            <SectionTitle>Mixed content</SectionTitle>
            {mixed_content.error && (
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{mixed_content.error}</p>
            )}
            {mixed_content.mixed_content_items.length === 0 ? (
                <EmptyGood text="No mixed content found." />
            ) : (
                <Panel>
                    {mixed_content.mixed_content_items.map((item, i) => (
                        <Row key={i} label={item.element} value={item.url} ok={false} />
                    ))}
                </Panel>
            )}

            <SectionTitle>DNS security ({dns_security.root_domain})</SectionTitle>
            <Panel>
                <Row
                    label="SPF record"
                    value={dns_security.spf_record_exists ? dns_security.spf_record ?? 'Present' : 'Missing'}
                    ok={dns_security.spf_record_exists}
                />
                <Row
                    label="DMARC record"
                    value={dns_security.dmarc_record_exists ? dns_security.dmarc_record ?? 'Present' : 'Missing'}
                    ok={dns_security.dmarc_record_exists}
                />
                <Row
                    label="DKIM"
                    value={dns_security.dkim_found ? dns_security.dkim_selector ?? 'Present' : 'Not found'}
                    ok={dns_security.dkim_found}
                />
            </Panel>
            {dns_security.errors.length > 0 && (
                <div className="mt-3">
                    <IssueList issues={dns_security.errors} />
                </div>
            )}
        </div>
    );
}
