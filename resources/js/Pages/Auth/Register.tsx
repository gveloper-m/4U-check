import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    company_site: '',
    password: '',
    password_confirmation: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  const inputCls = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500';
  const labelCls = 'mb-1.5 block text-sm font-medium text-gray-300';

  return (
    <GuestLayout>
      <Head title={t('auth.register.title')} />

      <h2 className="mb-6 text-xl font-bold text-white">{t('auth.register.title')}</h2>

      <form onSubmit={submit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className={labelCls}>
            {t('auth.register.name')}
          </label>
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
          <label htmlFor="email" className={labelCls}>
            {t('auth.register.email')}
          </label>
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
          <label htmlFor="phone" className={labelCls}>
            {t('auth.register.phone')}
          </label>
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

        {/* Company row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div>
            <label htmlFor="company_site" className={labelCls}>
              {t('auth.register.companySite')}{' '}
              <span className="text-xs text-gray-500">({t('auth.register.optionalLabel')})</span>
            </label>
            <input
              id="company_site"
              type="url"
              value={data.company_site}
              autoComplete="url"
              onChange={(e) => setData('company_site', e.target.value)}
              className={inputCls}
              placeholder="https://acme.gr"
            />
            {errors.company_site && <p className="mt-1 text-xs text-red-400">{errors.company_site}</p>}
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className={labelCls}>
            {t('auth.register.password')}
          </label>
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
          <label htmlFor="password_confirmation" className={labelCls}>
            {t('auth.register.confirmPassword')}
          </label>
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

        <button
          type="submit"
          disabled={processing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {processing && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('auth.register.submit')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {t('auth.register.haveAccount')}{' '}
        <Link href={route('login')} className="text-violet-400 hover:text-violet-300 transition-colors">
          {t('auth.register.login')}
        </Link>
      </p>
    </GuestLayout>
  );
}
