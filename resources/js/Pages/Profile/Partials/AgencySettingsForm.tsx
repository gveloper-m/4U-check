import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Upload, X } from 'lucide-react';
import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';

export default function AgencySettingsForm({ className = '' }: { className?: string }) {
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

    const inputCls = 'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500';

    return (
        <section className={className}>
            <header>
                <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900">
                    <Building2 className="h-5 w-5 text-violet-600" />
                    {t('profile.agencyTitle')}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{t('profile.agencySub')}</p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Agency toggle */}
                <label className="flex cursor-pointer items-center gap-3">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={data.is_agency}
                            onChange={(e) => setData('is_agency', e.target.checked)}
                        />
                        <div className={`h-6 w-11 rounded-full transition-colors ${data.is_agency ? 'bg-violet-600' : 'bg-gray-300'}`} />
                        <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.is_agency ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{t('profile.agencyToggle')}</span>
                </label>

                {data.is_agency && (
                    <div className="space-y-5 rounded-xl border border-violet-100 bg-violet-50/40 p-5">
                        {/* Logo upload */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                {t('profile.agencyLogo')}
                            </label>
                            {preview ? (
                                <div className="mb-3 flex items-center gap-3">
                                    <img src={preview} alt="Agency logo" className="h-12 max-w-[160px] rounded border border-gray-200 object-contain p-1" />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                                    >
                                        <X className="h-3 w-3" />
                                        {t('profile.agencyLogoRemove')}
                                    </button>
                                </div>
                            ) : null}
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors">
                                <Upload className="h-4 w-4" />
                                <span>{t('profile.agencyLogoHint')}</span>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
                                    className="hidden"
                                    onChange={handleFile}
                                />
                            </label>
                            <InputError className="mt-1" message={errors.agency_logo} />
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    {t('profile.agencyPrimaryColor')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={data.agency_primary_color}
                                        onChange={(e) => setData('agency_primary_color', e.target.value)}
                                        className="h-9 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={data.agency_primary_color}
                                        onChange={(e) => setData('agency_primary_color', e.target.value)}
                                        className={inputCls}
                                        placeholder="#1a1a2e"
                                        maxLength={7}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('profile.agencyPrimaryColorHint')}</p>
                                <InputError className="mt-1" message={errors.agency_primary_color} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    {t('profile.agencySecondaryColor')}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={data.agency_secondary_color}
                                        onChange={(e) => setData('agency_secondary_color', e.target.value)}
                                        className="h-9 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={data.agency_secondary_color}
                                        onChange={(e) => setData('agency_secondary_color', e.target.value)}
                                        className={inputCls}
                                        placeholder="#2d3748"
                                        maxLength={7}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('profile.agencySecondaryColorHint')}</p>
                                <InputError className="mt-1" message={errors.agency_secondary_color} />
                            </div>
                        </div>

                        {/* Footer text */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                {t('profile.agencyFooterText')}
                            </label>
                            <input
                                type="text"
                                value={data.agency_footer_text}
                                onChange={(e) => setData('agency_footer_text', e.target.value)}
                                className={inputCls}
                                placeholder={t('profile.agencyFooterTextPlaceholder')}
                                maxLength={255}
                            />
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('profile.agencyFooterTextHint')}</p>
                            <InputError className="mt-1" message={errors.agency_footer_text} />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
                    >
                        {t('profile.agencySave')}
                    </button>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">{t('profile.saved')}</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
