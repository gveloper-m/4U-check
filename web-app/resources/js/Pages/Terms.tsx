import { Head } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8">
            <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            <div className="space-y-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{children}</div>
        </section>
    );
}

export default function Terms() {
    const { t } = useTranslation();
    const year = new Date().getFullYear();

    return (
        <GuestLayout>
            <Head title={t('terms.title')} />

            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 border border-violet-500/30">
                    <ShieldCheck className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('terms.title')}</h1>
                    <p className="text-xs text-gray-500">{t('terms.lastUpdated', { year })}</p>
                </div>
            </div>

            <Section title={t('terms.s1Title')}>
                <p>{t('terms.s1Body')}</p>
            </Section>

            <Section title={t('terms.s2Title')}>
                <p>{t('terms.s2Body')}</p>
            </Section>

            <Section title={t('terms.s3Title')}>
                <p>{t('terms.s3Body')}</p>
            </Section>

            <Section title={t('terms.s4Title')}>
                <p>{t('terms.s4Body')}</p>
            </Section>

            <Section title={t('terms.s5Title')}>
                <p>{t('terms.s5Body')}</p>
            </Section>

            <Section title={t('terms.s6Title')}>
                <p>{t('terms.s6Body')}</p>
            </Section>

            <Section title={t('terms.s7Title')}>
                <p>{t('terms.s7Body')}</p>
            </Section>

            <Section title={t('terms.s8Title')}>
                <p>{t('terms.s8Body')}</p>
            </Section>

            <p className="mt-8 text-xs text-gray-600">
                &copy; {year} 4utest. {t('terms.allRights')}
            </p>
        </GuestLayout>
    );
}
