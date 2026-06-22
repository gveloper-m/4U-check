import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const CONSENT_KEY = 'cookie_consent_v1';
const TERMS_VERSION = '1.0';

export default function CookieBanner() {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(CONSENT_KEY)) {
            // Small delay so the banner doesn't flash on first paint
            const id = setTimeout(() => setVisible(true), 400);
            return () => clearTimeout(id);
        }
    }, []);

    const accept = async () => {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        setVisible(false);
        try {
            await axios.post('/cookie-consent', { version: TERMS_VERSION });
        } catch {
            // Best-effort — UX must not block on network failure
        }
    };

    const decline = () => {
        localStorage.setItem(CONSENT_KEY, 'declined');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
            <div className="mx-auto max-w-4xl rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl shadow-black/60">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30">
                        <Cookie className="h-5 w-5 text-violet-400" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t('cookie.title')}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                            {t('cookie.body')}{' '}
                            <Link
                                href="/terms"
                                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
                            >
                                {t('cookie.termsLink')}
                            </Link>
                            .
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex shrink-0 items-center gap-3">
                        <button
                            onClick={decline}
                            className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                            {t('cookie.decline')}
                        </button>
                        <button
                            onClick={accept}
                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t('cookie.accept')}
                        </button>
                        <button
                            onClick={decline}
                            className="rounded-md p-1 text-gray-600 hover:text-gray-400 transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
