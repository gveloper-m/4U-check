import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login({
  status,
  canResetPassword,
}: {
  status?: string;
  canResetPassword: boolean;
}) {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false as boolean,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <GuestLayout>
      <Head title={t('auth.login.submit')} />

      <h2 className="mb-6 text-xl font-bold text-white">{t('auth.login.title')}</h2>

      {status && (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {status}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
            {t('auth.login.email')}
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={data.email}
            autoComplete="username"
            autoFocus
            onChange={(e) => setData('email', e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              {t('auth.login.password')}
            </label>
            {canResetPassword && (
              <Link
                href={route('password.request')}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {t('auth.login.forgot')}
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            name="password"
            value={data.password}
            autoComplete="current-password"
            onChange={(e) => setData('password', e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="••••••••"
          />
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            name="remember"
            checked={data.remember}
            onChange={(e) => setData('remember', (e.target.checked || false) as false)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500 focus:ring-offset-gray-900"
          />
          <label htmlFor="remember" className="text-sm text-gray-400">
            {t('auth.login.remember')}
          </label>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {processing && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('auth.login.submit')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {t('auth.login.noAccount')}{' '}
        <Link href={route('register')} className="text-violet-400 hover:text-violet-300 transition-colors">
          {t('auth.login.register')}
        </Link>
      </p>
    </GuestLayout>
  );
}
