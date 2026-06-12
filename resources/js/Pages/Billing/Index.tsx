import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Infinity,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface SubscriptionData {
  stripe_status?: string;
  ends_at?: string | null;
  trial_ends_at?: string | null;
  [key: string]: unknown;
}

interface PaymentMethodData {
  card?: {
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
  };
  [key: string]: unknown;
}

interface BillingProps extends PageProps {
  subscribed: boolean;
  subscription: SubscriptionData | null;
  is_unlimited: boolean;
  payment_method: PaymentMethodData | null;
}

const planFeatures = [
  'Unlimited website scans',
  'All 6 audit modules',
  'Scheduled automatic scans',
  'Full scan history & comparisons',
  'PDF & CSV exports',
  'Priority queue processing',
];

export default function BillingIndex({
  subscribed,
  subscription,
  is_unlimited,
  payment_method,
  flash,
}: BillingProps) {
  const subscribeForm = useForm({});
  const cancelForm = useForm({});

  const handleSubscribe: FormEventHandler = (e) => {
    e.preventDefault();
    subscribeForm.post('/billing/subscribe');
  };

  const handlePortal: FormEventHandler = (e) => {
    e.preventDefault();
    cancelForm.post('/billing/portal');
  };

  const card = payment_method?.card;
  const brandName = card?.brand
    ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1)
    : null;

  return (
    <AppLayout>
      <Head title="Billing" />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="mt-1 text-sm text-gray-400">Manage your subscription and payment details</p>
        </div>

        {/* Flash messages */}
        {flash?.success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {flash.error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Subscription card */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-base font-semibold text-white">Subscription</h2>

            {is_unlimited ? (
              /* Unlimited account */
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <Infinity className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-400">Unlimited Account</p>
                    <p className="text-xs text-emerald-300/70">Full access — no limits applied</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  Your account has unlimited access to all features. No billing required.
                </p>
              </div>
            ) : subscribed && subscription ? (
              /* Active subscription */
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-400">Active Subscription</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Status:{' '}
                      <span className="text-gray-300 capitalize">
                        {subscription.stripe_status ?? 'active'}
                      </span>
                    </p>
                    {subscription.ends_at && (
                      <p className="text-xs text-amber-400 mt-0.5">
                        Cancels on: {new Date(subscription.ends_at).toLocaleDateString()}
                      </p>
                    )}
                    {subscription.trial_ends_at && (
                      <p className="text-xs text-violet-400 mt-0.5">
                        Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-white">€19.99</span>
                  <span className="mb-1 text-sm text-gray-400">/month</span>
                </div>

                <form onSubmit={handlePortal}>
                  <button
                    type="submit"
                    disabled={cancelForm.processing}
                    className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:border-gray-600 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancelForm.processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    Manage Subscription
                  </button>
                </form>
              </div>
            ) : (
              /* No subscription */
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-400">No Active Subscription</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Subscribe to unlock all features
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-3xl font-bold text-white">€19.99</span>
                    <span className="mb-1 text-sm text-gray-400">/month</span>
                  </div>
                  <ul className="mb-5 space-y-2">
                    {planFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={handleSubscribe}>
                    <button
                      type="submit"
                      disabled={subscribeForm.processing}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/25"
                    >
                      {subscribeForm.processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Subscribe — €19.99/month
                    </button>
                  </form>
                  <p className="mt-2 text-center text-xs text-gray-500">
                    No setup fees. Cancel anytime.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment method card */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-base font-semibold text-white">Payment Method</h2>

            {card ? (
              <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700">
                    <CreditCard className="h-5 w-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {brandName ?? 'Card'} •••• {card.last4}
                    </p>
                    {card.exp_month && card.exp_year && (
                      <p className="text-xs text-gray-400">
                        Expires {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-800/50 py-10 text-center">
                <CreditCard className="mb-2 h-8 w-8 text-gray-600" />
                <p className="text-sm text-gray-500">No payment method on file</p>
                {subscribed && (
                  <form onSubmit={handlePortal} className="mt-3">
                    <button
                      type="submit"
                      disabled={cancelForm.processing}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Add payment method
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Security note */}
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
              <p className="text-xs text-gray-500">
                Payments are securely processed by Stripe. Your card details are never stored on our
                servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
