import { Head, Link } from '@inertiajs/react';
import LegalLayout from '@/Layouts/LegalLayout';
import { RefreshCw, AlertTriangle, Mail } from 'lucide-react';

const EFFECTIVE_DATE = '6 July 2026';
const CONTACT_EMAIL  = 'billing@4utest.com';

function H2({ children }: { children: React.ReactNode }) {
    return <h2 className="mt-10 mb-3 text-base font-semibold text-gray-900 dark:text-white">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
    return <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
    return <ul className="mb-3 list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">{children}</ul>;
}

export default function Refund() {
    return (
        <LegalLayout>
            <Head title="Refund & Cancellation Policy — 4utest" />

            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30">
                    <RefreshCw className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Refund & Cancellation Policy</h1>
                    <p className="text-xs text-gray-500">Effective: {EFFECTIVE_DATE} · EU Consumer Rights Directive 2011/83/EU</p>
                </div>
            </div>

            <P>
                This policy explains your cancellation and refund rights when subscribing to 4utest.
                Payments are processed by <strong>Paddle</strong>, our Merchant of Record.
            </P>

            <H2>1. Your 14-Day Statutory Right of Withdrawal</H2>
            <P>
                Under EU Directive 2011/83/EU, consumers have a 14-day right of withdrawal from distance contracts.
                You may exercise this right within 14 days of your purchase without giving any reason.
            </P>

            <div className="my-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Immediate performance exception</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            When you subscribe and actively use the service — run audits, view detailed scan results, or download
                            PDF reports — you expressly request <em>immediate performance</em> of the digital service.
                            Once the digital content has been delivered and accessed, you lose your statutory right of withdrawal
                            for that billing period, as permitted by Art. 16(m) of the Directive.
                        </p>
                    </div>
                </div>
            </div>

            <P>
                In plain terms: if you subscribed and have <strong>not</strong> run any audit or downloaded any report,
                you can request a full refund within 14 days. If you have actively used the service, the withdrawal right
                is waived.
            </P>

            <P>
                When you subscribe, the checkout page displays the following notice:
            </P>
            <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-xs text-gray-600 dark:text-gray-400 italic">
                "By clicking Subscribe, you agree to the immediate performance of the service and acknowledge that you lose
                your right of withdrawal once the digital content has been fully delivered or accessed."
            </div>

            <H2>2. How to Cancel</H2>
            <P>
                Cancel your subscription at any time — no questions asked. Cancellation stops future charges immediately.
                You retain full access to the service until the end of the current billing period.
            </P>

            <div className="my-5">
                <Link
                    href="/billing"
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" /> Cancel my subscription
                </Link>
            </div>

            <H2>3. How to Request a Refund</H2>
            <P>
                To request a refund, email us with your Paddle transaction ID (found in your payment receipt email),
                the plan you purchased, and a brief explanation. We review all requests within 3 business days.
                Once approved, Paddle refunds to your original payment method within 5–10 business days.
            </P>

            <div className="my-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5">
                <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-violet-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Contact support</p>
                </div>
                <a
                    href={`mailto:${CONTACT_EMAIL}?subject=Refund request`}
                    className="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
                >
                    {CONTACT_EMAIL}
                </a>
                <p className="mt-2 text-xs text-gray-500">
                    Include: transaction ID, plan type (monthly / yearly), purchase date, and reason.
                    Your transaction ID appears in your Paddle payment receipt email.
                </p>
            </div>

            <H2>4. What Is Not Refundable</H2>
            <UL>
                <li>Charges for billing periods where the service was actively used (audits run or reports downloaded).</li>
                <li>Refund requests submitted more than 90 days after the charge date.</li>
                <li>Subscriptions terminated by us for violations of the <Link href="/terms" className="text-violet-400 hover:underline">Terms of Service</Link>.</li>
                <li>Billing periods that have already fully elapsed.</li>
            </UL>

            <H2>5. Your Statutory Rights</H2>
            <P>
                This policy does not limit your statutory rights under Greek Consumer Protection Law (L. 2251/1994 as amended)
                or EU consumer protection directives. If you believe a refund was unfairly denied, you may contact the Hellenic
                General Secretariat for Consumer Affairs or file a complaint via the EU Online Dispute Resolution platform at{' '}
                <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                    ec.europa.eu/odr
                </a>.
                ODR contact email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
            </P>

            <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-wrap gap-6 text-xs text-gray-400">
                <Link href="/terms"   className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy Policy</Link>
                <Link href="/billing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Billing</Link>
            </div>
        </LegalLayout>
    );
}
