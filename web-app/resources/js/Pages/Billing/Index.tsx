import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import axios from 'axios';
import {
  CreditCard, CheckCircle2, XCircle, Infinity, ArrowRight, Loader2,
  ShieldCheck, Globe, Lock, Plus, Trash2, AlertTriangle, X,
} from 'lucide-react';

interface SiteData {
  id: number;
  url: string;
  label: string | null;
  is_primary: boolean;
}

interface SubscriptionData {
  status?: string;
  canceled_at?: string | null;
  paused_at?: string | null;
  next_billed_at?: string | null;
  trial_ends_at?: string | null;
  [key: string]: unknown;
}

interface PaymentMethodData {
  card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number };
  [key: string]: unknown;
}

interface PaddleConfig {
  token: string;
  environment: 'production' | 'sandbox';
  monthly_price_id: string;
  yearly_price_id: string;
}

interface BillingProps extends PageProps {
  subscribed: boolean;
  subscription: SubscriptionData | null;
  is_unlimited: boolean;
  payment_method: PaymentMethodData | null;
  company_name: string | null;
  vat_number: string | null;
  sites: SiteData[];
  site_count: number;
  current_plan: 'monthly' | 'yearly';
  monthly_total: number;
  extra_sites_enabled: boolean;
  paddle: PaddleConfig;
}

function SiteRow({ site, canRemove, onRemove, removing }: {
  site: SiteData;
  canRemove: boolean;
  onRemove: (id: number) => void;
  removing: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
      <Globe className="h-4 w-4 shrink-0 text-violet-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{site.label || site.url}</p>
        {site.label && <p className="truncate text-xs text-gray-500">{site.url}</p>}
      </div>
      {site.is_primary ? (
        <span className="flex items-center gap-1 rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400 shrink-0">
          <Lock className="h-3 w-3" /> {t('billing.primarySite')}
        </span>
      ) : canRemove ? (
        <button
          type="button"
          onClick={() => onRemove(site.id)}
          disabled={removing}
          className="rounded p-1 text-gray-400 hover:text-red-400 disabled:opacity-40 transition-colors shrink-0"
          title={t('billing.removeSite')}
        >
          {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  );
}

export default function BillingIndex({
  subscribed, subscription, is_unlimited, payment_method,
  company_name, vat_number, flash,
  sites, site_count, current_plan, monthly_total, extra_sites_enabled,
  paddle: paddleConfig,
}: BillingProps) {
  const { t } = useTranslation();
  const { auth } = usePage<PageProps>().props;
  const planFeatures = t('billing.features', { returnObjects: true }) as string[];

  const paddleRef = useRef<Paddle | null>(null);

  useEffect(() => {
    if (!paddleConfig?.token) return;
    initializePaddle({
      environment: paddleConfig.environment,
      token: paddleConfig.token,
      eventCallback(data) {
        if (data.name === 'checkout.completed') {
          router.visit('/billing?success=1', { replace: true });
        }
      },
    }).then((instance) => {
      if (instance) paddleRef.current = instance;
    });
  }, [paddleConfig?.token]);

  const subscribeForm = useForm<{ plan: 'monthly' | 'yearly'; company_name: string; vat_number: string }>({
    plan: 'monthly',
    company_name: company_name ?? '',
    vat_number: vat_number ?? '',
  });

  const [subscribing, setSubscribing] = useState(false);

  const cancelForm  = useForm({});
  const addSiteForm = useForm({ url: '', label: '' });

  const [showAddSite, setShowAddSite]       = useState(false);
  const [removingId, setRemovingId]         = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove]   = useState<SiteData | null>(null);

  const handleSubscribe: FormEventHandler = async (e) => {
    e.preventDefault();
    setSubscribing(true);
    try {
      const response = await axios.post('/billing/subscribe', {
        plan: subscribeForm.data.plan,
        company_name: subscribeForm.data.company_name || null,
        vat_number: subscribeForm.data.vat_number || null,
      });
      const priceId: string = response.data.price_id;
      paddleRef.current?.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: auth.user.email },
      });
    } catch {
      subscribeForm.setError('plan', 'Something went wrong. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handlePortal: FormEventHandler = (e) => {
    e.preventDefault();
    cancelForm.post('/billing/portal');
  };

  const handleAddSite: FormEventHandler = (e) => {
    e.preventDefault();
    addSiteForm.post(route('billing.sites.add'), {
      onSuccess: () => { setShowAddSite(false); addSiteForm.reset(); },
    });
  };

  const handleRemoveSite = (id: number) => {
    setRemovingId(id);
    router.delete(route('billing.sites.remove', { site: id }), {
      onFinish: () => { setRemovingId(null); setConfirmRemove(null); },
    });
  };

  const card      = payment_method?.card;
  const brandName = card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : null;

  const basePrice  = current_plan === 'yearly' ? 199.99 : 19.99;
  const extraPrice = current_plan === 'yearly' ? 99.99  : 9.99;
  const planLabel  = subscribeForm.data.plan === 'yearly' ? t('billing.yearly') : t('billing.monthly');

  const previewBase  = subscribeForm.data.plan === 'yearly' ? 199.99 : 19.99;
  const previewExtra = subscribeForm.data.plan === 'yearly' ? 99.99  : 9.99;

  return (
    <AppLayout>
      <Head title={t('billing.title')} />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title')}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('billing.sub')}</p>
        </div>

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
          {/* ── Subscription card ── */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">{t('billing.activeTitle')}</h2>

            {is_unlimited ? (
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
              </div>
            ) : subscribed && subscription ? (
              <div className="space-y-4">
                {/* Active status */}
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-400">{t('billing.activeTitle')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {t('billing.activeStatus')}:{' '}
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {subscription.status ?? t('billing.active')}
                      </span>
                    </p>
                    {subscription.canceled_at && (
                      <p className="text-xs text-amber-400 mt-0.5">
                        Cancels on: {new Date(subscription.canceled_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('billing.basePlan')} (1 site)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      €{basePrice.toFixed(2)}{current_plan === 'yearly' ? t('billing.perYear') : t('billing.perMonth')}
                    </span>
                  </div>
                  {site_count > 1 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {site_count - 1} × {t('billing.extraSite')}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        €{((site_count - 1) * extraPrice).toFixed(2)}{current_plan === 'yearly' ? t('billing.perYear') : t('billing.perMonth')}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('billing.total')}</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">€{monthly_total.toFixed(2)}</span>
                      <span className="text-sm text-gray-500">{current_plan === 'yearly' ? t('billing.perYear') : t('billing.perMonth')} + {t('billing.exclVat')}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePortal}>
                  <button
                    type="submit"
                    disabled={cancelForm.processing}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancelForm.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {t('billing.manageBtn')}
                  </button>
                </form>
              </div>
            ) : (
              /* ── No subscription ── */
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-400">{t('billing.upgradeTitle')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t('billing.upgradeSub')}</p>
                  </div>
                </div>

                {/* Plan selector */}
                <div className="grid grid-cols-2 gap-3">
                  {([
                    {
                      key: 'monthly' as const,
                      label: t('billing.monthly'),
                      price: '€19.99',
                      period: t('billing.perMonth'),
                      note: `+ ${t('billing.exclVat')} · ${t('billing.billedMonthly')}`,
                    },
                    {
                      key: 'yearly' as const,
                      label: t('billing.yearly'),
                      price: '€199.99',
                      period: t('billing.perYear'),
                      note: `+ ${t('billing.exclVat')} · ${t('billing.twoMonthsFree')}`,
                    },
                  ]).map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => subscribeForm.setData('plan', p.key)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        subscribeForm.data.plan === p.key
                          ? 'border-violet-500/60 bg-violet-600/15'
                          : 'border-gray-300 dark:border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-500 mb-1">{p.label}</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {p.price}<span className="text-sm font-normal text-gray-500">{p.period}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">{p.note}</div>
                      {p.key === 'yearly' && (
                        <div className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          {t('billing.bestValue')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Per-site pricing callout */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-violet-300">{t('billing.perSiteTitle')}</p>
                  <p className="text-xs text-gray-500">{t('billing.perSiteBody', {
                    base: subscribeForm.data.plan === 'yearly' ? '€199.99' : '€19.99',
                    period: subscribeForm.data.plan === 'yearly' ? t('billing.perYear') : t('billing.perMonth'),
                    extra: subscribeForm.data.plan === 'yearly' ? '€99.99' : '€9.99',
                  })}</p>
                  <p className="text-xs text-gray-500">{t('billing.perSiteQuota', { scans: 30 })}</p>
                </div>

                <ul className="space-y-2">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="rounded-xl border border-gray-300 dark:border-gray-700/60 bg-gray-100/40 dark:bg-gray-800/40 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('billing.billingDetails')}</p>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">{t('billing.companyName')}</label>
                      <input
                        type="text"
                        value={subscribeForm.data.company_name}
                        onChange={e => subscribeForm.setData('company_name', e.target.value)}
                        placeholder="Acme Ltd."
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">{t('billing.vatNumber')}</label>
                      <input
                        type="text"
                        value={subscribeForm.data.vat_number}
                        onChange={e => subscribeForm.setData('vat_number', e.target.value.toUpperCase())}
                        placeholder={t('billing.vatNumberPlaceholder')}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none font-mono"
                      />
                      <p className="mt-1 text-xs text-gray-600">{t('billing.vatHint')}</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={subscribing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-500/25"
                  >
                    {subscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {t('billing.subscribeBtn')} — €{previewBase.toFixed(2)} + {t('billing.exclVat')}
                  </button>
                  <p className="text-center text-xs text-gray-600">{t('billing.vatNote')}</p>
                  <p className="text-center text-xs text-gray-500">{t('billing.nofees')}</p>
                </form>
              </div>
            )}
          </div>

          {/* ── Right column: payment method + sites ── */}
          <div className="space-y-6">
            {/* Payment method */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">{t('billing.paymentMethod')}</h2>

              {card ? (
                <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                      <CreditCard className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {brandName ?? 'Card'} •••• {card.last4}
                      </p>
                      {card.exp_month && card.exp_year && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Expires {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50 py-8 text-center">
                  <CreditCard className="mb-2 h-8 w-8 text-gray-600" />
                  <p className="text-sm text-gray-500">No payment method on file</p>
                  {subscribed && (
                    <form onSubmit={handlePortal} className="mt-3">
                      <button type="submit" disabled={cancelForm.processing} className="text-xs text-violet-400 hover:text-violet-300">
                        Add payment method
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-gray-300 dark:border-gray-700/50 bg-gray-100/50 dark:bg-gray-800/50 px-3 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <p className="text-xs text-gray-500">
                  Payments are securely processed by Paddle. Your card details are never stored on our servers.
                </p>
              </div>
            </div>

            {/* Monitored sites */}
            {(subscribed || is_unlimited) && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('billing.yourSites')}</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t('billing.scansPerSite', { scans: 30 })}
                    </p>
                  </div>
                  {extra_sites_enabled && (
                    <button
                      type="button"
                      onClick={() => setShowAddSite(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t('billing.addSite')}
                    </button>
                  )}
                </div>

                {sites.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('billing.noSites')}</p>
                ) : (
                  <div className="space-y-2">
                    {sites.map(site => (
                      <SiteRow
                        key={site.id}
                        site={site}
                        canRemove={subscribed || is_unlimited}
                        onRemove={(id) => setConfirmRemove(sites.find(s => s.id === id) ?? null)}
                        removing={removingId === site.id}
                      />
                    ))}
                  </div>
                )}

                {!extra_sites_enabled && (
                  <p className="mt-3 text-xs text-gray-500 italic">{t('billing.extraSitesNotEnabled')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Site Modal ── */}
      {showAddSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddSite(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <button onClick={() => setShowAddSite(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-200">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">{t('billing.addSiteTitle')}</h3>
            <p className="mb-4 text-sm text-gray-500">
              {current_plan === 'yearly'
                ? t('billing.addSiteNote', { price: '€99.99', period: t('billing.perYear') })
                : t('billing.addSiteNote', { price: '€9.99', period: t('billing.perMonth') })}
            </p>

            <form onSubmit={handleAddSite} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('billing.siteUrl')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={addSiteForm.data.url}
                  onChange={e => addSiteForm.setData('url', e.target.value)}
                  required
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
                {addSiteForm.errors.url && <p className="mt-1 text-xs text-red-400">{addSiteForm.errors.url}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('billing.siteLabel')} <span className="text-xs text-gray-500">({t('common.optional')})</span>
                </label>
                <input
                  type="text"
                  value={addSiteForm.data.label}
                  onChange={e => addSiteForm.setData('label', e.target.value)}
                  placeholder="e.g. Client Website"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={addSiteForm.processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
              >
                {addSiteForm.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t('billing.addSiteConfirm')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Remove Site Confirm ── */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmRemove(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">{t('billing.removeSiteTitle')}</h3>
            <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">{t('billing.removeSiteBody')}</p>
            <p className="mb-5 text-sm font-semibold text-gray-900 dark:text-white break-all">{confirmRemove.url}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm text-gray-300 hover:border-gray-500 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleRemoveSite(confirmRemove.id)}
                disabled={removingId !== null}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition-colors"
              >
                {removingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('billing.removeSiteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
