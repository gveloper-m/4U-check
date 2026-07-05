import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Zap, CheckCircle2, XCircle, X } from 'lucide-react';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ThemeToggle from '@/Components/ThemeToggle';
import CookieBanner from '@/Components/CookieBanner';

export default function Guest({ children }: PropsWithChildren) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (flash?.success) setToast({ message: flash.success, type: 'success' });
        else if (flash?.error) setToast({ message: flash.error, type: 'error' });
    }, [flash]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
            {/* Language switcher + theme toggle top-right */}
            <div className="fixed top-4 right-4 flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
            </div>

            <div className="mb-8 text-center">
                <Link href="/" className="inline-flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        4u<span className="text-violet-400">test</span>
                    </span>
                </Link>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Website audit platform</p>
            </div>

            <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
                {children}
            </div>

            <p className="mt-6 text-xs text-gray-600">
                &copy; {new Date().getFullYear()} 4utest. All rights reserved.
            </p>
            <CookieBanner />

            {toast && (
                <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow text-sm font-medium text-gray-900 dark:text-white">
                    {toast.type === 'success'
                        ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                        : <XCircle className="h-5 w-5 shrink-0 text-red-500" />}
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
