import { Head, Link } from '@inertiajs/react';
import LegalLayout from '@/Layouts/LegalLayout';
import { ShieldCheck } from 'lucide-react';

function H2({ children }: { children: React.ReactNode }) {
    return <h2 className="mt-10 mb-3 text-base font-semibold text-gray-900 dark:text-white">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
    return <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
    return <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
    return <ul className="mb-3 list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">{children}</ul>;
}
function Table({ rows }: { rows: [string, string, string, string][] }) {
    return (
        <div className="overflow-x-auto mb-6">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                        <th className="py-2 pr-4 text-left font-semibold text-gray-700 dark:text-gray-300 w-1/4">Category</th>
                        <th className="py-2 pr-4 text-left font-semibold text-gray-700 dark:text-gray-300 w-1/4">Data</th>
                        <th className="py-2 pr-4 text-left font-semibold text-gray-700 dark:text-gray-300 w-1/4">Legal basis</th>
                        <th className="py-2 text-left font-semibold text-gray-700 dark:text-gray-300 w-1/4">Retention</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {rows.map(([cat, data, basis, ret]) => (
                        <tr key={cat}>
                            <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 font-medium align-top">{cat}</td>
                            <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 align-top">{data}</td>
                            <td className="py-2 pr-4 text-gray-600 dark:text-gray-400 align-top">{basis}</td>
                            <td className="py-2 text-gray-600 dark:text-gray-400 align-top">{ret}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const EFFECTIVE_DATE  = '3 July 2026';
const CONTROLLER      = 'Georgios Markou';
const CONTROLLER_EMAIL = 'privacy@4utest.com';
const DPA_URL         = 'https://www.dpa.gr';

const DATA_TABLE: [string, string, string, string][] = [
    ['Account data',      'Name, email, phone, company name, VAT number',              'Art. 6(1)(b) GDPR — performance of contract',          'Until account deletion + 30 days'],
    ['Billing data',      'Invoice records, transaction IDs (held by Paddle)',          'Art. 6(1)(c) — legal obligation (tax records)',         '10 years (Greek tax law)'],
    ['Audit data',        'URLs submitted, audit results, health scores',               'Art. 6(1)(b) — performance of contract',                'Until account deletion + 30 days'],
    ['Usage logs',        'IP address, browser user-agent, timestamps',                 'Art. 6(1)(f) — legitimate interest (security, fraud)',  '12 months'],
    ['Consent records',   'Cookie consent choice, IP, timestamp',                       'Art. 6(1)(c) — legal obligation',                      '3 years'],
    ['Support messages',  'Ticket content, email correspondence',                       'Art. 6(1)(b) — performance of contract',                '3 years after closure'],
    ['Marketing emails',  'Email address (where you opt in to newsletter)',             'Art. 6(1)(a) — consent',                               'Until unsubscribe'],
];

export default function Privacy() {
    return (
        <LegalLayout>
            <Head title="Privacy Policy — 4utest" />

            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30">
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
                    <p className="text-xs text-gray-500">Effective date: {EFFECTIVE_DATE} · GDPR-compliant · Hellenic DPA registered</p>
                </div>
            </div>

            <P>
                This Privacy Policy explains how 4utest ("we", "us", "our"), operated by{' '}
                <strong>{CONTROLLER}</strong>, processes personal data when you use 4utest.com. It is issued in
                accordance with the General Data Protection Regulation (EU) 2016/679 ("GDPR") and the
                applicable Greek implementing legislation.
            </P>

            <H2>1. Data Controller</H2>
            <P>
                The data controller is <strong>{CONTROLLER}</strong>, Greece.<br />
                Contact: <a href={`mailto:${CONTROLLER_EMAIL}`} className="text-violet-400 hover:underline">{CONTROLLER_EMAIL}</a>
            </P>
            <P>
                We are not required to appoint a Data Protection Officer (DPO) under Article 37 GDPR
                (we are not a public authority, our core activities do not involve large-scale systematic
                monitoring, or special-category data processing). Privacy enquiries are handled by the
                controller directly at the address above.
            </P>

            <H2>2. Data We Collect and Why</H2>
            <P>We collect only the minimum data necessary for the purposes described below.</P>
            <Table rows={DATA_TABLE} />

            <H3>2a. Data you provide directly</H3>
            <UL>
                <li>Registration: name, email address, password (hashed, never stored in plain text), optional phone and company details.</li>
                <li>Billing: company name and VAT number (for invoice purposes, stored by us and passed to Paddle for tax compliance). Card details are never received or stored by us — they go directly to Paddle's PCI-DSS-certified infrastructure.</li>
                <li>Audit usage: the URLs you submit for auditing.</li>
                <li>Support: the content of any tickets or emails you send us.</li>
            </UL>

            <H3>2b. Data collected automatically</H3>
            <UL>
                <li>Server logs: IP address, browser user-agent, requested URL, timestamp. Used for security, abuse prevention, and debugging. Logs are stored for 12 months.</li>
                <li>Cookies: see Section 6.</li>
            </UL>

            <H3>2c. Data from third parties</H3>
            <UL>
                <li>Paddle: We receive transaction IDs, invoice numbers, subscription status, and (where applicable) billing country. We do not receive your full card number.</li>
            </UL>

            <H2>3. How We Use Your Data</H2>
            <UL>
                <li><strong>Providing the Service</strong> — running scans, displaying results, generating reports.</li>
                <li><strong>Billing</strong> — managing your subscription, issuing invoices, handling refund requests.</li>
                <li><strong>Communication</strong> — sending transactional emails (account verification, renewal reminders, payment receipts). Marketing emails only with your consent.</li>
                <li><strong>Security</strong> — detecting and preventing fraud, abuse, and unauthorised access.</li>
                <li><strong>Legal compliance</strong> — meeting tax, accounting, and other legal obligations under Greek and EU law.</li>
                <li><strong>Service improvement</strong> — analysing anonymised, aggregated usage patterns to improve the platform.</li>
            </UL>

            <H2>4. Legal Bases for Processing (GDPR Art. 6)</H2>
            <UL>
                <li><strong>Art. 6(1)(a) — Consent</strong>: analytics cookies; marketing emails. You may withdraw consent at any time.</li>
                <li><strong>Art. 6(1)(b) — Contractual necessity</strong>: account management, running audits, sending transactional emails.</li>
                <li><strong>Art. 6(1)(c) — Legal obligation</strong>: tax record retention (10 years, Greek L. 4308/2014), consent records.</li>
                <li><strong>Art. 6(1)(f) — Legitimate interests</strong>: security logging, fraud prevention, service improvement. We have conducted a balancing test and determined these interests are not overridden by your rights.</li>
            </UL>

            <H2>5. Data Processors and Third-Party Recipients</H2>
            <P>We share data only as described below. We do not sell personal data.</P>
            <UL>
                <li>
                    <strong>Paddle.com Market Limited</strong> (UK/Ireland) — payment processing and Merchant of Record.
                    Paddle's privacy policy: paddle.com/legal/privacy. Standard Contractual Clauses in place for UK→EU transfers.
                </li>
                <li>
                    <strong>Brevo (Sendinblue SAS)</strong> (France) — transactional and marketing email delivery.
                    GDPR-compliant, EU-based. Brevo's DPA: brevo.com/en/legal/privacypolicy/.
                </li>
                <li>
                    <strong>Cloud hosting provider</strong> (servers located in the EU) — infrastructure hosting.
                    A Data Processing Agreement (DPA) is in place.
                </li>
                <li>
                    <strong>Public authorities</strong> — when required by Greek or EU law (e.g., tax authorities, courts).
                </li>
            </UL>
            <P>
                Where we transfer data outside the EEA, we rely on adequacy decisions, Standard Contractual Clauses
                (SCCs, Commission Decision 2021/914), or other lawful transfer mechanisms.
            </P>

            <H2>6. Cookies</H2>
            <UL>
                <li>
                    <strong>Strictly necessary</strong> (no consent required): session cookie (keeps you logged in),
                    CSRF token (security), cookie consent record. Legal basis: Art. 6(1)(b)/(c).
                </li>
                <li>
                    <strong>Analytics</strong> (consent required): aggregate usage statistics. Legal basis: Art. 6(1)(a).
                    You may decline these via the cookie banner or clear them from your browser at any time.
                </li>
            </UL>
            <P>
                We do not use advertising, tracking, or third-party social-media cookies.
                Cookie consent is logged with a timestamp and your IP hash for compliance purposes.
            </P>

            <H2>7. Your Rights Under the GDPR</H2>
            <P>As a data subject, you have the following rights, exercisable free of charge:</P>
            <UL>
                <li><strong>Right of access (Art. 15)</strong> — obtain a copy of your personal data.</li>
                <li><strong>Right to rectification (Art. 16)</strong> — correct inaccurate data.</li>
                <li><strong>Right to erasure (Art. 17)</strong> — request deletion of your data where there is no lawful basis for retention.</li>
                <li><strong>Right to restriction of processing (Art. 18)</strong> — limit how we use your data in certain circumstances.</li>
                <li><strong>Right to data portability (Art. 20)</strong> — receive your data in a machine-readable format (applies to data processed on the basis of consent or contract).</li>
                <li><strong>Right to object (Art. 21)</strong> — object to processing based on legitimate interests or direct marketing.</li>
                <li><strong>Right to withdraw consent (Art. 7(3))</strong> — withdraw any consent at any time without affecting the lawfulness of prior processing.</li>
            </UL>
            <P>
                To exercise any right, email{' '}
                <a href={`mailto:${CONTROLLER_EMAIL}`} className="text-violet-400 hover:underline">{CONTROLLER_EMAIL}</a>.
                We will respond within 30 days. We may ask for proof of identity before fulfilling a request.
            </P>
            <P>
                You also have the right to lodge a complaint with the Hellenic Data Protection Authority (ΑΠΔΠΧ / DPA):
                <br />
                Website: <a href={DPA_URL} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">{DPA_URL}</a>
                {' '}· Address: Kifisias 1–3, 115 23 Athens, Greece · Tel: +30 210 6475 600
            </P>

            <H2>8. Data Security</H2>
            <P>
                We implement appropriate technical and organisational measures to protect your data, including:
                TLS encryption in transit, hashed passwords (bcrypt), database-level access controls,
                regular security audits, and limited staff access on a need-to-know basis.
                No method of transmission or storage is 100% secure; in the event of a personal data breach
                affecting your rights, we will notify you and the Hellenic DPA within 72 hours as required
                by GDPR Art. 33–34.
            </P>

            <H2>9. Data Retention</H2>
            <P>
                We retain personal data only as long as necessary for the purpose for which it was collected,
                or as required by law. Retention periods are set out in Section 2. When an account is deleted,
                personal data is removed within 30 days, except where retention is mandated by law
                (e.g., billing records for 10 years under Greek tax law L. 4308/2014).
            </P>

            <H2>10. Children's Data</H2>
            <P>
                The Service is not directed at persons under 18. We do not knowingly collect data from children.
                If you believe a child has provided us with personal data, contact us and we will delete it.
            </P>

            <H2>11. Changes to This Policy</H2>
            <P>
                We may update this Privacy Policy. Material changes will be communicated by email or in-app notice
                at least 30 days before they take effect. The current version is always available at 4utest.com/privacy.
            </P>

            <H2>12. Contact</H2>
            <P>
                All privacy-related requests and questions:{' '}
                <a href={`mailto:${CONTROLLER_EMAIL}`} className="text-violet-400 hover:underline">{CONTROLLER_EMAIL}</a>
            </P>

            <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-wrap gap-6 text-xs text-gray-400">
                <Link href="/terms"  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms of Service</Link>
                <Link href="/refund" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Refund Policy</Link>
            </div>
        </LegalLayout>
    );
}
