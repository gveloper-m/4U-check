import { Head, Link, useForm } from '@inertiajs/react';
import LegalLayout from '@/Layouts/LegalLayout';
import { RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { FormEventHandler } from 'react';

function H2({ children }: { children: React.ReactNode }) {
    return <h2 className="mt-10 mb-3 text-base font-semibold text-gray-900 dark:text-white">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
    return <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
    return <ul className="mb-3 list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">{children}</ul>;
}
function Highlight({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
            {children}
        </div>
    );
}
function Example({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-xs text-gray-600 dark:text-gray-400 italic">
            {children}
        </div>
    );
}

const EFFECTIVE_DATE  = '3 July 2026';
const CONTACT_EMAIL   = 'billing@4utest.com';
const MONTHLY_PRICE   = 19.99;
const YEARLY_PRICE    = 199.99;

type FormData = {
    name: string;
    email: string;
    transaction_id: string;
    plan: 'monthly' | 'yearly' | '';
    purchase_date: string;
    scans_used: string;
    reason: string;
};

export default function Refund() {
    const { data, setData, post, processing, errors, wasSuccessful, reset } = useForm<FormData>({
        name: '',
        email: '',
        transaction_id: '',
        plan: '',
        purchase_date: '',
        scans_used: '',
        reason: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/refund/request', { onSuccess: () => reset() });
    };

    return (
        <LegalLayout>
            <Head title="Refund Policy — 4utest" />

            <div className="mb-8 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30">
                    <RefreshCw className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Refund Policy</h1>
                    <p className="text-xs text-gray-500">Effective date: {EFFECTIVE_DATE} · EU & Greek consumer law compliant</p>
                </div>
            </div>

            <P>
                We want you to feel confident subscribing to 4utest. This policy sets out exactly when and how
                refunds are issued. All refunds are processed by <strong>Paddle</strong>, our Merchant of Record,
                and returned to your original payment method within 5–10 business days.
            </P>

            <H2>1. Statutory Right of Withdrawal</H2>
            <P>
                Under EU Directive 2011/83/EU, consumers have a 14-day statutory right of withdrawal for
                distance contracts. However, by completing your purchase and beginning to use the Service, you
                expressly request immediate performance of the digital service. The statutory withdrawal right
                is waived once the service has commenced, as permitted by Art. 16(m) of the Directive.
            </P>
            <P>
                Notwithstanding the above, our <strong>voluntary refund policy (below)</strong> provides
                protection that exceeds the statutory minimum.
            </P>

            <H2>2. Monthly Plan Refunds</H2>

            <Highlight>
                <strong>Full refund</strong> — if you cancel within <strong>14 calendar days</strong> of purchase{' '}
                <em>and</em> you have used <strong>fewer than 14 scans</strong>, you are entitled to a full refund
                of the current month's subscription fee.
            </Highlight>

            <Highlight>
                <strong>Pro-rata refund</strong> — if you cancel after 14 days <em>or</em> after using 14 or more scans,
                you receive a refund for the <strong>unused portion</strong> of your billing period, calculated by day.
            </Highlight>

            <Example>
                Example: You pay €{MONTHLY_PRICE.toFixed(2)} on the 1st and cancel on the 20th (after using 20 scans).
                Your billing period is 31 days. Days used = 20; days remaining = 11.
                Refund = (11 ÷ 31) × €{MONTHLY_PRICE.toFixed(2)} = €{((11/31)*MONTHLY_PRICE).toFixed(2)}.
            </Example>

            <P>
                The monthly plan for any additional Sites follows the same pro-rata logic — each extra site
                billed at €9.99/month is refunded proportionally for its unused days.
            </P>

            <H2>3. Yearly Plan Refunds</H2>

            <Highlight>
                <strong>50% of the remaining unused portion</strong> — if you cancel a yearly plan mid-term,
                you receive a refund equal to 50% of the pro-rata value of the full months remaining.
            </Highlight>

            <P>
                "Remaining full months" means whole calendar months left from the cancellation date to the
                end of the annual billing period (partial months are not counted). The 50% factor reflects
                the discount you received by paying annually versus monthly.
            </P>

            <Example>
                Example: You pay €{YEARLY_PRICE.toFixed(2)}/year and cancel after 4 months, with 8 full months remaining.
                Remaining pro-rata value = (8 ÷ 12) × €{YEARLY_PRICE.toFixed(2)} = €{((8/12)*YEARLY_PRICE).toFixed(2)}.
                Refund = 50% × €{((8/12)*YEARLY_PRICE).toFixed(2)} = €{(0.5*(8/12)*YEARLY_PRICE).toFixed(2)}.
            </Example>

            <Example>
                Example: Cancel after 9 months, 3 full months remaining.
                Remaining = (3 ÷ 12) × €{YEARLY_PRICE.toFixed(2)} = €{((3/12)*YEARLY_PRICE).toFixed(2)}.
                Refund = 50% × €{((3/12)*YEARLY_PRICE).toFixed(2)} = €{(0.5*(3/12)*YEARLY_PRICE).toFixed(2)}.
            </Example>

            <P>
                The same calculation applies to any additional Sites billed at €99.99/year each.
            </P>

            <H2>4. Non-Refundable Situations</H2>
            <UL>
                <li>Refund requests submitted more than <strong>90 days</strong> after the charge date.</li>
                <li>Subscriptions terminated by us for violation of the <Link href="/terms" className="text-violet-400 hover:underline">Terms of Service</Link>.</li>
                <li>Charges for billing periods that have already fully elapsed.</li>
                <li>Partial months for the purpose of the yearly 50% calculation (only full remaining months count).</li>
                <li>Any promotional, discounted, or trial-code pricing — refunds are calculated on the price actually paid.</li>
            </UL>

            <H2>5. How to Request a Refund</H2>
            <P>
                Submit the form below. We review all requests within <strong>3 business days</strong>. Once approved,
                Paddle processes the refund to your original payment method within <strong>5–10 business days</strong>
                depending on your bank or card issuer.
            </P>
            <P>
                You can find your Transaction ID in the payment receipt email sent by Paddle after your purchase.
            </P>

            <H2>6. EU Consumer Rights</H2>
            <P>
                This policy does not affect your statutory rights under Greek Consumer Protection Law (L. 2251/1994
                as amended) or EU consumer protection directives. If you believe a refund has been unfairly denied,
                you may contact the Hellenic General Secretariat for Consumer Affairs or submit a complaint via the
                EU ODR platform at{' '}
                <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                    ec.europa.eu/odr
                </a>.
                Our ODR contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
            </P>

            {/* ── Refund Request Form ── */}
            <div className="mt-14 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
                <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Submit a Refund Request</h2>
                <p className="mb-6 text-sm text-gray-500">Fill in the form below. Our team will review your request and reply within 3 business days.</p>

                {wasSuccessful ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Request received</p>
                        <p className="text-sm text-gray-500">We will review your request and get back to you within 3 business days.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Full name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                                    placeholder="Jane Smith"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Email address <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                                    placeholder="you@example.com"
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Paddle Transaction ID <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.transaction_id}
                                    onChange={e => setData('transaction_id', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none font-mono"
                                    placeholder="txn_..."
                                />
                                <p className="mt-1 text-xs text-gray-500">Found in your Paddle payment receipt email.</p>
                                {errors.transaction_id && <p className="mt-1 text-xs text-red-400">{errors.transaction_id}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Plan type <span className="text-red-400">*</span>
                                </label>
                                <select
                                    required
                                    value={data.plan}
                                    onChange={e => setData('plan', e.target.value as 'monthly' | 'yearly')}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none"
                                >
                                    <option value="">Select plan…</option>
                                    <option value="monthly">Monthly — €19.99/mo</option>
                                    <option value="yearly">Yearly — €199.99/yr</option>
                                </select>
                                {errors.plan && <p className="mt-1 text-xs text-red-400">{errors.plan}</p>}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Purchase date <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={data.purchase_date}
                                    onChange={e => setData('purchase_date', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none"
                                />
                                {errors.purchase_date && <p className="mt-1 text-xs text-red-400">{errors.purchase_date}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Scans used (approx.) <span className="text-xs font-normal text-gray-500">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.scans_used}
                                    onChange={e => setData('scans_used', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none"
                                    placeholder="e.g. 3"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Reason for refund request <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={data.reason}
                                onChange={e => setData('reason', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none resize-none"
                                placeholder="Please describe why you are requesting a refund…"
                            />
                            {errors.reason && <p className="mt-1 text-xs text-red-400">{errors.reason}</p>}
                        </div>

                        <p className="text-xs text-gray-500">
                            By submitting this form you consent to us processing the personal data provided above for the
                            purpose of handling your refund request, in accordance with our{' '}
                            <Link href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>.
                        </p>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Submit refund request
                        </button>
                    </form>
                )}
            </div>

            <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-wrap gap-6 text-xs text-gray-400">
                <Link href="/terms"   className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy Policy</Link>
            </div>
        </LegalLayout>
    );
}
