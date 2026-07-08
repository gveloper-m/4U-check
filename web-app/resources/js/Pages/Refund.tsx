import { Head, Link, useForm } from '@inertiajs/react';
import LegalLayout from '@/Layouts/LegalLayout';
import { RefreshCw, AlertTriangle, Mail, CheckCircle2, Loader2 } from 'lucide-react';

const EFFECTIVE_DATE = '9 July 2026';
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

interface RefundFormData {
    name: string;
    email: string;
    transaction_id: string;
    plan: 'monthly' | 'yearly';
    purchase_date: string;
    scans_used: string;
    reason: string;
}

function RefundRequestForm() {
    const { data, setData, post, processing, errors, wasSuccessful, reset } = useForm<RefundFormData>({
        name: '',
        email: '',
        transaction_id: '',
        plan: 'monthly',
        purchase_date: '',
        scans_used: '',
        reason: '',
    });

    const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none';
    const labelCls = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400';

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/refund/request', { onSuccess: () => reset() });
    };

    if (wasSuccessful) {
        return (
            <div className="my-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-6 py-5 flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Your refund request has been submitted. We will reply within 3 business days.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="my-5 space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Full name</label>
                    <input className={inputCls} value={data.name} onChange={e => setData('name', e.target.value)} required />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>
                <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" className={inputCls} value={data.email} onChange={e => setData('email', e.target.value)} required />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>
            </div>
            <div>
                <label className={labelCls}>Paddle transaction ID</label>
                <input className={inputCls} value={data.transaction_id} onChange={e => setData('transaction_id', e.target.value)} placeholder="From your payment receipt email" required />
                {errors.transaction_id && <p className="mt-1 text-xs text-red-400">{errors.transaction_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>Plan</label>
                    <select className={inputCls} value={data.plan} onChange={e => setData('plan', e.target.value as 'monthly' | 'yearly')}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Purchase date</label>
                    <input type="date" className={inputCls} value={data.purchase_date} onChange={e => setData('purchase_date', e.target.value)} required />
                    {errors.purchase_date && <p className="mt-1 text-xs text-red-400">{errors.purchase_date}</p>}
                </div>
            </div>
            <div>
                <label className={labelCls}>Scans used this billing period (optional)</label>
                <input type="number" min={0} className={inputCls} value={data.scans_used} onChange={e => setData('scans_used', e.target.value)} />
                <p className="mt-1 text-xs text-gray-500">Helps us calculate a proportionate refund faster if you're withdrawing within the 14-day period.</p>
            </div>
            <div>
                <label className={labelCls}>Reason</label>
                <textarea rows={4} className={inputCls} value={data.reason} onChange={e => setData('reason', e.target.value)} required minLength={10} />
                {errors.reason && <p className="mt-1 text-xs text-red-400">{errors.reason}</p>}
            </div>
            <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
            >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Submit refund request
            </button>
        </form>
    );
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
                4utest is an ongoing digital <strong>service</strong> — ongoing dashboard access, scheduled scans, and
                ongoing account management — rather than a one-off digital content purchase (like a single downloaded
                report). That distinction matters: it means your withdrawal right is governed by <strong>Article 16(a)
                and Article 14(3)</strong> of the Directive, not the stricter "digital content" exception in Article 16(m).
            </P>

            <div className="my-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">What this means in practice</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            When you subscribe, you're asked to confirm that you want the service to start immediately
                            (see the exact wording below). If you then withdraw within the 14-day period, you are{' '}
                            <strong>not</strong> entitled to a full refund, but you are also <strong>not</strong> entitled
                            to a zero refund — you receive the amount paid minus a proportionate deduction for the days
                            of service you already had access to.
                        </p>
                    </div>
                </div>
            </div>

            <P>
                We calculate the proportionate deduction as: <em>(days between your subscription start and your
                withdrawal request ÷ days in your billing cycle) × amount paid</em>. For example, withdrawing on day 5
                of a 30-day monthly cycle means we refund roughly 25/30 of what you paid.
            </P>

            <P>
                When you subscribe, the checkout page displays this checkbox, which you must tick before the payment
                option is enabled:
            </P>
            <div className="my-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-xs text-gray-600 dark:text-gray-400 italic">
                "I want 4uTest to start providing the service immediately. I understand that if I withdraw within the
                14-day period, I will only be refunded a proportionate amount for the unused part of my subscription."
            </div>

            <P>
                If you subscribed and have <strong>not</strong> checked that box (which is required before checkout can
                proceed) or have not been charged yet, none of the above applies — you can request a full refund within
                14 days with no deduction, as normal for any distance contract.
            </P>

            <H2>2. How to Cancel</H2>
            <P>
                Cancel your subscription at any time — no questions asked. Cancellation stops future charges immediately.
                You retain full access to the service until the end of the current billing period; we do not cut off
                access early.
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
                Submit the form below with your Paddle transaction ID (found in your payment receipt email), or email
                us directly. We review all requests within 3 business days. Once approved, Paddle refunds to your
                original payment method within 5–10 business days.
            </P>

            <RefundRequestForm />

            <P>
                Prefer email? Write to us directly with the same details (transaction ID, plan, purchase date, reason):
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
            </div>

            <H2>4. Refund Amounts — What to Expect</H2>
            <UL>
                <li>Within 14 days of your first charge, having requested immediate access: refunded minus a proportionate deduction for days already used (see Section 1).</li>
                <li>Within 14 days, having <strong>not</strong> requested immediate access or not yet used the service: full refund, no deduction.</li>
                <li>After the 14-day period: refunds are entirely at our discretion as a voluntary goodwill policy — for example, for billing errors or accidental duplicate charges — and are not a statutory entitlement.</li>
                <li>Refund requests submitted more than 90 days after the charge date will generally not be considered, except where required by law.</li>
                <li>Subscriptions terminated by us for violations of the <Link href="/terms" className="text-violet-400 hover:underline">Terms of Service</Link> are not eligible for a refund of amounts already charged.</li>
            </UL>

            <H2>5. Your Statutory Rights</H2>
            <P>
                This policy does not limit your statutory rights under the consumer protection law of your country of
                residence (which, for EU/EEA consumers, applies regardless of this policy's wording — Regulation (EC)
                No 593/2008 "Rome I", Art. 6) or under EU consumer protection directives generally. If you believe a
                refund was unfairly denied, you may contact your national consumer protection authority (in Greece, the
                Hellenic General Secretariat for Consumer Affairs) or file a complaint via the EU Online Dispute
                Resolution platform at{' '}
                <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                    ec.europa.eu/odr
                </a>.
                ODR contact email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
            </P>
            <p className="mb-3 text-xs text-gray-500">
                This page describes our understanding of Directive 2011/83/EU as it applies to an ongoing subscription
                service and is not a substitute for professional legal advice.
            </p>

            <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-wrap gap-6 text-xs text-gray-400">
                <Link href="/terms"   className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy Policy</Link>
                <Link href="/billing" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Billing</Link>
            </div>
        </LegalLayout>
    );
}
