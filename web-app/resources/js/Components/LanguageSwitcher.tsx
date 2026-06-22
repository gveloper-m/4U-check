import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Globe } from 'lucide-react';

const ALL_LANGS = ['en', 'el', 'de', 'fr', 'es', 'nl', 'cs'] as const;
type Lang = typeof ALL_LANGS[number];

const flags: Record<Lang, string> = {
  en: '🇬🇧', el: '🇬🇷', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', nl: '🇳🇱', cs: '🇨🇿',
};
const labels: Record<Lang, string> = {
  en: 'EN', el: 'EL', de: 'DE', fr: 'FR', es: 'ES', nl: 'NL', cs: 'CS',
};

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current: Lang = (ALL_LANGS.find(l => i18n.language.startsWith(l)) ?? 'en') as Lang;

  const changeLang = (lang: Lang) => {
    i18n.changeLanguage(lang);
    router.post('/language', { lang }, {
      preserveState: true,
      preserveScroll: true,
      onError: () => {},
    });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
        <span className="hidden sm:inline">{flags[current]}</span>
        <span className="font-medium">{labels[current]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-xl overflow-hidden">
          {ALL_LANGS.map((lang) => (
            <button
              key={lang}
              onClick={() => changeLang(lang)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                current === lang
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{flags[lang]}</span>
              <span>{t(`lang.${lang}`)}</span>
              {current === lang && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
