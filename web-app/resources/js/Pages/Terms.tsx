import { Head, Link } from '@inertiajs/react';
import LegalLayout from '@/Layouts/LegalLayout';
import { FileText } from 'lucide-react';

function H2({ children }: { children: React.ReactNode }) {
    return <h2 className="mt-10 mb-3 text-base font-semibold text-gray-900 dark:text-white">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
    return <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
    return <ul className="mb-3 list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">{children}</ul>;
}

const EFFECTIVE_DATE = '3 July 2026';
const CONTACT_EMAIL  = 'legal@4utest.com';
const SERVICE_URL    = 'https://4utest.com';

export default function Terms() {
    return (
        <LegalLayout>
            <Head title="Terms of Service — 4utest" />

            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 border border-violet-500/30">
                    <FileText className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
                    <p className="text-xs text-gray-500">Effective date: {EFFECTIVE_DATE} · Governing law: Greece / European Union</p>
                </div>
            </div>

            <P>
                Please read these Terms of Service ("Terms") carefully before using 4utest ({SERVICE_URL}),
                operated by Georgios Markou ("we", "us", "our"), a service provider established in Greece.
                By accessing or using the service, you agree to be bound by these Terms. If you do not agree,
                do not use the service.
            </P>

            <H2>1. Definitions</H2>
            <UL>
                <li><strong>"Service"</strong> — the 4utest web application and all features accessible at 4utest.com.</li>
                <li><strong>"User" / "you"</strong> — any natural or legal person who creates an account or accesses the Service.</li>
                <li><strong>"Subscription"</strong> — a paid plan (monthly or yearly) that unlocks full Service features.</li>
                <li><strong>"Site"</strong> — a domain or subdomain registered in your account for auditing.</li>
                <li><strong>"Scan"</strong> — one complete automated audit run across all seven audit modules for one Site.</li>
            </UL>

            <H2>2. Eligibility</H2>
            <P>
                You must be at least 18 years old (or the legal age of majority in your jurisdiction) and
                legally capable of entering a binding contract. If you register on behalf of a company or
                other legal entity, you represent that you have authority to bind that entity.
            </P>

            <H2>3. Service Description</H2>
            <P>
                4utest provides automated website auditing across seven parallel modules: SEO, Security,
                Performance, Broken Links, E-commerce, Marketing Tracking, and Accessibility (WCAG 2.1 AA).
                Each scan produces a health score (0–100) and detailed actionable findings. Audits are performed
                by our cloud infrastructure; you are not granted access to our servers or underlying code.
            </P>
            <P>
                The Service is provided on a subscription basis. Free-tier access (where available) is limited
                and may be modified or discontinued at our discretion with reasonable notice.
            </P>

            <H2>4. Acceptable Use</H2>
            <P>You may only audit websites you own or have explicit written authorisation from the owner to audit.</P>
            <P>You must not use the Service to:</P>
            <UL>
                <li>Conduct unauthorised security testing or penetration testing against third-party systems.</li>
                <li>Overload, disrupt, or damage servers belonging to third parties.</li>
                <li>Scrape, resell, or redistribute audit data in bulk or for commercial purposes without written permission.</li>
                <li>Violate any applicable law or regulation, including the GDPR, Greek Consumer Protection Law (L. 2251/1994), or the Electronic Commerce Directive (2000/31/EC).</li>
                <li>Attempt to reverse-engineer, decompile, or extract source code from the Service.</li>
                <li>Create multiple free accounts to circumvent usage limits.</li>
            </UL>
            <P>Breach of this section may result in immediate termination without refund.</P>

            <H2>5. Subscriptions and Billing</H2>
            <P>
                Paid plans are processed by <strong>Paddle.com Market Limited</strong> ("Paddle"), our Merchant of Record.
                Paddle acts as the reseller of our Service and is responsible for collecting and remitting VAT/GST
                where applicable. Your legal contract for payment is with Paddle; see paddle.com/legal for Paddle's own terms.
            </P>
            <UL>
                <li>Subscriptions renew automatically at the end of each billing period unless cancelled.</li>
                <li>You may cancel at any time from the Billing page; access continues until the end of the paid period.</li>
                <li>Prices are displayed inclusive or exclusive of VAT depending on your location; Paddle handles tax compliance.</li>
                <li>We reserve the right to change pricing with 30 days' written notice. Price changes do not affect subscriptions
                    already paid for the current period.</li>
            </UL>

            <H2>6. Right of Withdrawal and Refunds</H2>
            <P>
                Under EU Directive 2011/83/EU, consumers have a 14-day right of withdrawal for distance contracts.
                However, by completing registration and initiating your first scan, you expressly request
                immediate performance of the digital service and acknowledge that the right of withdrawal
                is waived once the service has begun. This waiver is without prejudice to our voluntary
                refund policy set out at <Link href="/refund" className="text-violet-400 hover:underline">4utest.com/refund</Link>.
            </P>
            <P>
                Our voluntary refund policy is more generous than the statutory minimum and is described in full
                on the Refund Policy page. Refund requests must be submitted via the form at
                {' '}<Link href="/refund" className="text-violet-400 hover:underline">4utest.com/refund</Link>.
            </P>

            <H2>7. Data Protection and Privacy</H2>
            <P>
                We process personal data in accordance with the General Data Protection Regulation (EU) 2016/679
                (GDPR) and the applicable Greek data protection law implementing Regulation (EU) 2018/1725.
                Our Privacy Policy at <Link href="/privacy" className="text-violet-400 hover:underline">4utest.com/privacy</Link> forms
                part of these Terms and explains what data we collect, how we use it, and your rights.
            </P>

            <H2>8. Cookies</H2>
            <P>
                We use strictly necessary cookies to maintain your session. With your consent (given via the cookie
                banner on first visit), we may also set analytics cookies. You may withdraw consent at any time
                by clearing cookies or adjusting browser settings. For details see our Privacy Policy.
            </P>

            <H2>9. Intellectual Property</H2>
            <P>
                All software, trademarks, design elements, and content of the Service are the exclusive property
                of 4utest and its licensors. Nothing in these Terms transfers ownership of any intellectual
                property to you. You are granted a limited, non-exclusive, non-transferable licence to access
                the Service for your own internal business purposes.
            </P>
            <P>
                Audit reports generated by the Service on your behalf belong to you. We may use anonymised,
                aggregated audit data for internal analytics and service improvement.
            </P>

            <H2>10. MCP Agent and Server Access</H2>
            <P>
                The optional MCP Agent is a Docker container you deploy on your own server. When using the
                Auto Deploy feature, you voluntarily provide SSH credentials solely for the purpose of executing
                the setup script. Credentials are transmitted over HTTPS, used for a single SSH session, and
                immediately discarded — they are never stored in our database or logs.
            </P>
            <P>
                The setup script creates the directory <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">/opt/4utest-agent/backups</code>,
                pulls the Docker image, and starts the container. No other server resources are accessed.
                File contents are never transmitted off your server. If you prefer, use Manual setup and run
                the provided command yourself.
            </P>

            <H2>11. Limitation of Liability</H2>
            <P>
                To the maximum extent permitted by applicable law (including mandatory Greek and EU consumer protection
                rules which cannot be excluded), we provide the Service "as is" without warranties of any kind, express
                or implied, including but not limited to accuracy, completeness, or fitness for a particular purpose.
            </P>
            <P>
                Our total liability to you for any claim arising under or in connection with these Terms shall not
                exceed the greater of: (a) the total Subscription fees paid by you in the 12 months preceding the
                claim, or (b) €100. We are not liable for indirect, incidental, special, or consequential damages.
            </P>
            <P>
                Nothing in these Terms limits our liability for: (i) death or personal injury caused by negligence;
                (ii) fraud or fraudulent misrepresentation; or (iii) any other liability that cannot be limited under
                mandatory EU or Greek law.
            </P>

            <H2>12. Service Availability and Changes</H2>
            <P>
                We aim for high availability but do not guarantee uninterrupted access. We may modify, suspend, or
                discontinue the Service (or any part thereof) at any time, with reasonable advance notice for material
                changes. If we discontinue the Service entirely, subscribers will receive a pro-rata refund for the
                unused portion of their paid period.
            </P>

            <H2>13. Termination</H2>
            <P>
                We may suspend or terminate your account immediately and without refund if you breach these Terms,
                engage in fraudulent activity, or if required by law. You may terminate your account at any time
                from the Profile settings page. Upon termination, your data is retained for 30 days before deletion,
                except where we are required by law to retain it longer.
            </P>

            <H2>14. Changes to These Terms</H2>
            <P>
                We may update these Terms. We will notify you of material changes at least 30 days in advance
                by email and via an in-app notice. If you do not agree to the updated Terms, you may cancel
                your subscription before the changes take effect. Continued use after the effective date
                constitutes acceptance.
            </P>

            <H2>15. Governing Law and Dispute Resolution</H2>
            <P>
                These Terms are governed by the laws of Greece and the applicable regulations of the European Union.
                Any dispute that cannot be resolved amicably shall be subject to the exclusive jurisdiction of the
                competent courts of Athens, Greece, without prejudice to any mandatory local jurisdiction rights
                you may have as a consumer.
            </P>
            <P>
                For consumers in the EU, disputes may also be submitted through the European Commission's Online
                Dispute Resolution platform at{' '}
                <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                    ec.europa.eu/odr
                </a>.
                Our contact for ODR purposes: <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
            </P>

            <H2>16. Contact</H2>
            <P>
                Questions about these Terms should be sent to{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
            </P>

            <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-wrap gap-6 text-xs text-gray-400">
                <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy Policy</Link>
                <Link href="/refund"  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Refund Policy</Link>
                <Link href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Pricing</Link>
            </div>
        </LegalLayout>
    );
}
