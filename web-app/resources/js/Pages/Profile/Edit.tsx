import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Lock,
  Trash2,
  BookOpen,
  Building2,
  Bell,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Upload,
  X,
} from 'lucide-react';

interface NotificationPrefs {
  notify_payment: boolean;
  notify_monthly_report: boolean;
  notify_renewal_reminder: boolean;
}

interface EditProps extends PageProps {
  mustVerifyEmail: boolean;
  status?: string;
  notificationPrefs: NotificationPrefs;
  notifications_saved?: boolean;
}

/* ─────────────── Shared input style ─────────────── */
const inputCls =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50';
const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';

/* ─────────────── Card wrapper ─────────────── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  color,
  bg,
  border,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} border ${border}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

/* ─────────────── Profile information form ─────────────── */
function ProfileInfoForm({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
  const { t } = useTranslation();
  const user = usePage().props.auth.user;
  const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
    name:         user.name ?? '',
    email:        user.email ?? '',
    phone:        user.phone ?? '',
    company_name: user.company_name ?? '',
    company_site: user.company_site ?? '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    patch(route('profile.update'));
  };

  return (
    <Card>
      <CardHeader
        icon={User}
        color="text-violet-400"
        bg="bg-violet-500/10"
        border="border-violet-500/20"
        title={t('profile.infoTitle')}
        sub={t('profile.infoSub')}
      />

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelCls}>{t('profile.name')}</label>
            <input
              id="name"
              type="text"
              value={data.name}
              autoComplete="name"
              onChange={(e) => setData('name', e.target.value)}
              required
              className={inputCls}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>{t('profile.email')}</label>
            <input
              id="email"
              type="email"
              value={data.email}
              autoComplete="username"
              onChange={(e) => setData('email', e.target.value)}
              required
              className={inputCls}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className={labelCls}>{t('profile.phone')}</label>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="company_name" className={labelCls}>
              {t('profile.companyName')}{' '}
              <span className="text-xs text-gray-500">({t('profile.optionalLabel')})</span>
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
              {t('profile.companySite')}{' '}
              <span className="text-xs text-gray-500">({t('profile.optionalLabel')})</span>
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

        {mustVerifyEmail && !user.email_verified_at && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            {t('profile.unverified')}{' '}
            <Link
              href={route('verification.send')}
              method="post"
              as="button"
              className="underline hover:text-amber-200"
            >
              {t('profile.resend')}
            </Link>
            {status === 'verification-link-sent' && (
              <p className="mt-1 font-medium text-emerald-400">{t('profile.resentSent')}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
          >
            {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('profile.save')}
          </button>
          {recentlySuccessful && (
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('profile.saved')}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

/* ─────────────── Agency branding form ─────────────── */
function AgencyCard() {
  const { t } = useTranslation();
  const user = usePage().props.auth.user;
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    user.agency_logo ? `/storage/${user.agency_logo}` : null
  );

  const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
    is_agency:              user.is_agency ?? false,
    agency_primary_color:   user.agency_primary_color   ?? '#1a1a2e',
    agency_secondary_color: user.agency_secondary_color ?? '#2d3748',
    agency_footer_text:     user.agency_footer_text     ?? '',
    agency_logo:            null as File | null,
    remove_logo:            false,
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData('agency_logo', file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setData((prev) => ({ ...prev, agency_logo: null, remove_logo: true }));
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('agency.update'), { forceFormData: true });
  };

  return (
    <Card>
      <CardHeader
        icon={Building2}
        color="text-amber-400"
        bg="bg-amber-500/10"
        border="border-amber-500/20"
        title={t('profile.agencyTitle')}
        sub={t('profile.agencySub')}
      />

      <form onSubmit={submit} className="space-y-5">
        {/* Toggle */}
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative flex-shrink-0">
            <input type="checkbox" className="sr-only" checked={data.is_agency}
              onChange={(e) => setData('is_agency', e.target.checked)} />
            <div className={`h-6 w-11 rounded-full transition-colors ${data.is_agency ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.is_agency ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('profile.agencyToggle')}</span>
        </label>

        {data.is_agency && (
          <div className="space-y-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            {/* Logo */}
            <div>
              <label className={labelCls}>{t('profile.agencyLogo')}</label>
              {preview && (
                <div className="mb-3 flex items-center gap-3">
                  <img src={preview} alt="logo" className="h-12 max-w-[160px] rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 object-contain p-1" />
                  <button type="button" onClick={removeLogo}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                    <X className="h-3 w-3" />{t('profile.agencyLogoRemove')}
                  </button>
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:border-violet-500 hover:text-violet-400 transition-colors">
                <Upload className="h-4 w-4" />
                <span>{t('profile.agencyLogoHint')}</span>
                <input ref={fileRef} type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
                  className="hidden" onChange={handleFile} />
              </label>
              {errors.agency_logo && <p className="mt-1 text-xs text-red-400">{errors.agency_logo}</p>}
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'agency_primary_color' as const,   labelKey: 'agencyPrimaryColor',   hintKey: 'agencyPrimaryColorHint',   default: '#1a1a2e' },
                { key: 'agency_secondary_color' as const, labelKey: 'agencySecondaryColor', hintKey: 'agencySecondaryColorHint', default: '#2d3748' },
              ].map(({ key, labelKey, hintKey, default: def }) => (
                <div key={key}>
                  <label className={labelCls}>{t(`profile.${labelKey}`)}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={data[key]} onChange={(e) => setData(key, e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 p-0.5" />
                    <input type="text" value={data[key]} onChange={(e) => setData(key, e.target.value)}
                      className={inputCls} placeholder={def} maxLength={7} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{t(`profile.${hintKey}`)}</p>
                </div>
              ))}
            </div>

            {/* Footer text */}
            <div>
              <label className={labelCls}>{t('profile.agencyFooterText')}</label>
              <input type="text" value={data.agency_footer_text}
                onChange={(e) => setData('agency_footer_text', e.target.value)}
                className={inputCls}
                placeholder={t('profile.agencyFooterTextPlaceholder')}
                maxLength={255} />
              <p className="mt-1 text-xs text-gray-500">{t('profile.agencyFooterTextHint')}</p>
              {errors.agency_footer_text && <p className="mt-1 text-xs text-red-400">{errors.agency_footer_text}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-1">
          <button type="submit" disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-60 transition-colors">
            {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('profile.agencySave')}
          </button>
          {recentlySuccessful && (
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />{t('profile.saved')}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

/* ─────────────── Password form ─────────────── */
function PasswordForm() {
  const { t } = useTranslation();
  const passwordRef = useRef<HTMLInputElement>(null);
  const currentRef  = useRef<HTMLInputElement>(null);
  const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
    current_password:      '',
    password:              '',
    password_confirmation: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    put(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => reset(),
      onError: (errs) => {
        if (errs.password) { reset('password', 'password_confirmation'); passwordRef.current?.focus(); }
        if (errs.current_password) { reset('current_password'); currentRef.current?.focus(); }
      },
    });
  };

  return (
    <Card>
      <CardHeader
        icon={Lock}
        color="text-blue-400"
        bg="bg-blue-500/10"
        border="border-blue-500/20"
        title={t('profile.passwordTitle')}
        sub={t('profile.passwordSub')}
      />

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="current_password" className={labelCls}>{t('profile.currentPassword')}</label>
          <input
            id="current_password"
            ref={currentRef}
            type="password"
            value={data.current_password}
            autoComplete="current-password"
            onChange={(e) => setData('current_password', e.target.value)}
            className={inputCls}
          />
          {errors.current_password && <p className="mt-1 text-xs text-red-400">{errors.current_password}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new_password" className={labelCls}>{t('profile.newPassword')}</label>
            <input
              id="new_password"
              ref={passwordRef}
              type="password"
              value={data.password}
              autoComplete="new-password"
              onChange={(e) => setData('password', e.target.value)}
              className={inputCls}
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="password_confirmation" className={labelCls}>{t('profile.confirmPassword')}</label>
            <input
              id="password_confirmation"
              type="password"
              value={data.password_confirmation}
              autoComplete="new-password"
              onChange={(e) => setData('password_confirmation', e.target.value)}
              className={inputCls}
            />
            {errors.password_confirmation && <p className="mt-1 text-xs text-red-400">{errors.password_confirmation}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 transition-colors"
          >
            {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('profile.save')}
          </button>
          {recentlySuccessful && (
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('profile.saved')}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

/* ─────────────── Delete account ─────────────── */
function DeleteAccountForm() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { data, setData, delete: destroy, processing, reset, errors } = useForm({ password: '' });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    destroy(route('profile.destroy'), {
      preserveScroll: true,
      onSuccess: () => setOpen(false),
      onError: () => passwordRef.current?.focus(),
      onFinish: () => reset(),
    });
  };

  return (
    <Card>
      <CardHeader
        icon={Trash2}
        color="text-red-400"
        bg="bg-red-500/10"
        border="border-red-500/20"
        title={t('profile.deleteTitle')}
        sub={t('profile.deleteSub')}
      />

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
        >
          {t('profile.deleteBtn')}
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-300">{t('profile.deleteConfirm')}</p>
          <div>
            <label htmlFor="delete_password" className={labelCls}>{t('profile.deletePasswordLabel')}</label>
            <input
              id="delete_password"
              ref={passwordRef}
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              autoFocus
              className={inputCls}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={processing}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60 transition-colors"
            >
              {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('profile.deleteBtn')}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); reset(); }}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('profile.cancel')}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

/* ─────────────── Instructions section ─────────────── */
function InstructionsSection() {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const items = t('profile.instructions', { returnObjects: true }) as Array<{ title: string; body: string }>;

  return (
    <Card>
      <CardHeader
        icon={BookOpen}
        color="text-emerald-400"
        bg="bg-emerald-500/10"
        border="border-emerald-500/20"
        title={t('profile.instructionsTitle')}
        sub={t('profile.instructionsSub')}
      />

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex w-full items-center justify-between bg-gray-100/60 dark:bg-gray-800/60 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                <span className="mr-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                  {i + 1}
                </span>
                {item.title}
              </span>
              {openIdx === i
                ? <ChevronUp className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400" />
                : <ChevronDown className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400" />}
            </button>
            {openIdx === i && (
              <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{item.body}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─────────────── Notification preferences ─────────────── */
function NotificationsCard({ prefs, saved }: { prefs: NotificationPrefs; saved?: boolean }) {
  const { data, setData, post, processing, recentlySuccessful } = useForm({
    notify_payment:          prefs.notify_payment,
    notify_monthly_report:   prefs.notify_monthly_report,
    notify_renewal_reminder: prefs.notify_renewal_reminder,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('notification-prefs.update'));
  };

  const toggles: { key: keyof typeof data; label: string; description: string }[] = [
    {
      key:         'notify_payment',
      label:       'Payment receipts',
      description: 'Email confirmation every time your card is charged.',
    },
    {
      key:         'notify_monthly_report',
      label:       'Monthly audit summary',
      description: 'Mid-month recap of your sites' health scores and top issues.',
    },
    {
      key:         'notify_renewal_reminder',
      label:       'Renewal reminders',
      description: 'Heads-up 7 days before your subscription renews.',
    },
  ];

  return (
    <Card>
      <CardHeader
        icon={Bell}
        color="text-sky-400"
        bg="bg-sky-500/10"
        border="border-sky-500/20"
        title="Email notifications"
        sub="Choose which emails you receive from 4uTest."
      />

      <form onSubmit={submit} className="space-y-4">
        {toggles.map(({ key, label, description }) => (
          <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={data[key]}
                onChange={(e) => setData(key, e.target.checked)}
              />
              <div className={`h-6 w-11 rounded-full transition-colors ${data[key] ? 'bg-sky-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data[key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          </label>
        ))}

        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60 transition-colors"
          >
            {processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save preferences
          </button>
          {(recentlySuccessful || saved) && (
            <span className="flex items-center gap-1 text-sm text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

/* ─────────────── Page ─────────────── */
export default function ProfileEdit({ mustVerifyEmail, status, notificationPrefs, notifications_saved }: EditProps) {
  const { t } = useTranslation();

  return (
    <AppLayout>
      <Head title={t('profile.title')} />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('profile.infoSub')}</p>
        </div>

        <ProfileInfoForm mustVerifyEmail={mustVerifyEmail} status={status} />
        <AgencyCard />
        <NotificationsCard prefs={notificationPrefs} saved={notifications_saved} />
        <PasswordForm />
        <InstructionsSection />
        <DeleteAccountForm />
      </div>
    </AppLayout>
  );
}
