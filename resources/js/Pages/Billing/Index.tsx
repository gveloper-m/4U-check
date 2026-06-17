import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
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
  company_name: string | null;
  vat_number: string | null;
}

export default function BillingIndex({
  subscribed,
  subscription,
  is_unlimited,
  payment_method,
  company_name,
  vat_number,
  flash,
}: BillingProps) {
  const { t } = useTranslation();
  const planFeatures = t('billing.features', { returnObjects: true }) as string[];
  const subscribeForm = useForm<{ plan: 'monthly' | 'yearly'; company_name: string; vat_number: string }>({
    plan: 'monthly',
    company_name: company_name ?? '',
    vat_number: vat_number ?? '',
  });
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
      <Head title={t('billing.title')} />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">{t('billing.title')}</h1>
          <p className="mt-1 text-sm text-gray-400">{t('billing.sub')}</p>
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
            <h2 className="mb-4 text-base font-semibold text-white">{t('billing.activeTitle')}</h2>

            {is_unlimited ? (
              /* Unlimited account */
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <Infinity className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-400">{t('billing.unlimited')}</p>
                    <p className="text-xs text-emerald-300/70">{t('billing.unlimitedSub')}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  {t('billing.unlimitedSub')}
                </p>
              </div>
            ) : subscribed && subscription ? (
              /* Active subscription */
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-400">{t('billing.activeTitle')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('billing.activeStatus')}:{' '}
                      <span className="text-gray-300 capitalize">
                        {subscription.stripe_status ?? t('billing.active')}
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

                <div className="flex items-end gap-1 flex-wrap">
                  <span className="text-3xl font-bold text-white">€22</span>
                  <span className="mb-1 text-sm text-gray-400">/{t('billing.perMonth')} + {t('billing.exclVat')}</span>
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
                    {t('billing.manageBtn')}
                  </button>
                </form>
              </div>
            ) : (
              /* No subscription */
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-400">{t('billing.upgradeTitle')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('billing.upgradeSub')}
                    </p>
                  </div>
                </div>

                <div>
                  {/* Plan selector */}
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    {([
                      { key: 'monthly', price: '€22', period: '/mo', note: `+ ${t('billing.exclVat')} · billed monthly` },
                      { key: 'yearly',  price: '€220', period: '/yr', note: `+ ${t('billing.exclVat')} · save 2 months` },
                    ] as const).map(p => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => subscribeForm.setData('plan', p.key)}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          subscribeForm.data.plan === p.key
                            ? 'border-violet-500/60 bg-violet-600/15'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-xl font-bold text-white">{p.price}<span className="text-sm font-normal text-gray-400">{p.period}</span></div>
                        <div className="mt-1 text-xs text-gray-500">{p.note}</div>
                        {p.key === 'yearly' && (
                          <div className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">Best value — €18.3/mo</div>
                        )}
                      </button>
                    ))}
                  </div>

                  <ul className="mb-5 space-y-2">
                    {planFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Billing details */}
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('billing.billingDetails')}</p>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">{t('billing.companyName')}</label>
                        <input
                          type="text"
                          value={subscribeForm.data.company_name}
                          onChange={e => subscribeForm.setData('company_name', e.target.value)}
                          placeholder="Acme Ltd."
                          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">{t('billing.vatNumber')}</label>
                        <input
                          type="text"
                          value={subscribeForm.data.vat_number}
                          onChange={e => subscribeForm.setData('vat_number', e.target.value.toUpperCase())}
                          placeholder={t('billing.vatNumberPlaceholder')}
                          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none font-mono"
                        />
                        <p className="mt-1 text-xs text-gray-600">{t('billing.vatHint')}</p>
                      </div>
                    </div>

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
                      {t('billing.subscribeBtn')} —{' '}
                      {subscribeForm.data.plan === 'yearly' ? '€220' : '€22'} + {t('billing.exclVat')}
                    </button>
                    <p className="text-center text-xs text-gray-600">{t('billing.vatNote')}</p>
                    <p className="text-center text-xs text-gray-500">{t('billing.nofees')}</p>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Payment method card */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="mb-4 text-base font-semibold text-white">{t('billing.paymentMethod')}</h2>

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
