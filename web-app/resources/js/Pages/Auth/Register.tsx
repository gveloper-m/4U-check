import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Loader2, Building2, Globe, Lock, AlertTriangle, X, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    primary_site: '',
    trial_code: '',
    password: '',
    password_confirmation: '',
    is_agency: false,
    agency_primary_color: '#1a1a2e',
    agency_secondary_color: '#2d3748',
  });

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    if (!data.primary_site) return;
    setShowConfirm(true);
  };

  const confirmAndSubmit = () => {
    setShowConfirm(false);
    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500';
  const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

  return (
    <GuestLayout>
      <Head title={t('auth.register.title')} />

      <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">{t('auth.register.title')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className={labelCls}>{t('auth.register.name')}</label>
          <input
            id="name"
            type="text"
            value={data.name}
            autoComplete="name"
            autoFocus
            onChange={(e) => setData('name', e.target.value)}
            required
            className={inputCls}
            placeholder="Maria Papadopoulou"
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelCls}>{t('auth.register.email')}</label>
          <input
            id="email"
            type="email"
            value={data.email}
            autoComplete="username"
            onChange={(e) => setData('email', e.target.value)}
            required
            className={inputCls}
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className={labelCls}>{t('auth.register.phone')}</label>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            autoComplete="tel"
            onChange={(e) => setData('phone', e.target.value)}
            className={inputCls}
            placeholder="+30 210 0000000"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
        </div>

        {/* Company name */}
        <div>
          <label htmlFor="company_name" className={labelCls}>
            {t('auth.register.companyName')}{' '}
            <span className="text-xs text-gray-500">({t('auth.register.optionalLabel')})</span>
          </label>
          <input
            id="company_name"
            type="text"
            value={data.company_name}
            autoComplete="organization"
            onChange={(e) => setData('company_name', e.target.value)}
            className={inputCls}
            placeholder="Acme Ltd"
          />
          {errors.company_name && <p className="mt-1 text-xs text-red-400">{errors.company_name}</p>}
        </div>

        {/* Primary site — required, locked at subscription */}
        <div>
          <label htmlFor="primary_site" className={labelCls}>
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-violet-400" />
              {t('auth.register.primarySite')} <span className="text-red-400">*</span>
            </span>
          </label>
          <input
            id="primary_site"
            type="url"
            value={data.primary_site}
            autoComplete="url"
            onChange={(e) => setData('primary_site', e.target.value)}
            required
            className={inputCls}
            placeholder="https://yourwebsite.com"
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
            <Lock className="h-3 w-3 shrink-0" />
            {t('auth.register.primarySiteHint')}
          </p>
          {errors.primary_site && <p className="mt-1 text-xs text-red-400">{errors.primary_site}</p>}
        </div>

        {/* Trial code — optional */}
        <div>
          <label htmlFor="trial_code" className={labelCls}>
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              {t('auth.register.trialCode')}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({t('common.optional')})</span>
            </span>
          </label>
          <input
            id="trial_code"
            type="text"
            value={data.trial_code}
            onChange={(e) => setData('trial_code', e.target.value.toUpperCase())}
            className={inputCls}
            placeholder="XXXX-XXXX"
            maxLength={9}
            style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('auth.register.trialCodeHint')}</p>
          {errors.trial_code && <p className="mt-1 text-xs text-red-400">{errors.trial_code}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className={labelCls}>{t('auth.register.password')}</label>
          <input
            id="password"
            type="password"
            value={data.password}
            autoComplete="new-password"
            onChange={(e) => setData('password', e.target.value)}
            required
            className={inputCls}
            placeholder="••••••••"
          />
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="password_confirmation" className={labelCls}>{t('auth.register.confirmPassword')}</label>
          <input
            id="password_confirmation"
            type="password"
            value={data.password_confirmation}
            autoComplete="new-password"
            onChange={(e) => setData('password_confirmation', e.target.value)}
            required
            className={inputCls}
            placeholder="••••••••"
          />
          {errors.password_confirmation && (
            <p className="mt-1 text-xs text-red-400">{errors.password_confirmation}</p>
          )}
        </div>

        {/* Agency toggle */}
        <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={data.is_agency}
                onChange={(e) => setData('is_agency', e.target.checked)}
              />
              <div className={`h-6 w-11 rounded-full transition-colors ${data.is_agency ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
              <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.is_agency ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('profile.agencyToggle')}</span>
            </div>
          </label>

          {data.is_agency && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t('profile.agencyPrimaryColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={data.agency_primary_color}
                      onChange={(e) => setData('agency_primary_color', e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-0.5" />
                    <input type="text" value={data.agency_primary_color}
                      onChange={(e) => setData('agency_primary_color', e.target.value)}
                      className={inputCls} placeholder="#1a1a2e" maxLength={7} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t('profile.agencySecondaryColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={data.agency_secondary_color}
                      onChange={(e) => setData('agency_secondary_color', e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-0.5" />
                    <input type="text" value={data.agency_secondary_color}
                      onChange={(e) => setData('agency_secondary_color', e.target.value)}
                      className={inputCls} placeholder="#2d3748" maxLength={7} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">You can upload your logo and set a report footer after signing in.</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={processing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {processing && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('auth.register.submit')}
        </button>
        <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          Get 1 free scan included with every new account
        </p>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {t('auth.register.haveAccount')}{' '}
        <Link href={route('login')} className="text-violet-400 hover:text-violet-300 transition-colors">
          {t('auth.register.login')}
        </Link>
      </p>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('auth.register.confirmModal.title')}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('auth.register.confirmModal.body')}
            </p>

            <div className="mb-5 flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3">
              <Globe className="h-4 w-4 shrink-0 text-violet-400" />
              <span className="text-sm font-semibold text-violet-300 break-all">{data.primary_site}</span>
            </div>

            <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-300">
                {t('auth.register.confirmModal.lockWarning')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-500 transition-colors"
              >
                {t('auth.register.confirmModal.change')}
              </button>
              <button
                type="button"
                onClick={confirmAndSubmit}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
              >
                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('auth.register.confirmModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </GuestLayout>
  );
}
