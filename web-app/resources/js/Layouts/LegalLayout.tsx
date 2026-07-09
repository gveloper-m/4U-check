import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Zap, Instagram, Mail } from 'lucide-react';
import CookieBanner from '@/Components/CookieBanner';

export default function LegalLayout({ children }: PropsWithChildren) {
    const year = new Date().getFullYear();
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            4u<span className="text-violet-400">test</span>
                        </span>
                    </Link>
                    <nav className="flex items-center gap-4 text-xs text-gray-500">
                        <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
                        <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sign in</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-12">
                {children}
            </main>

            <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-5">
                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">© {year} 4utest. All rights reserved.</p>
                    <nav className="flex flex-wrap items-center gap-5 text-xs text-gray-400">
                        <Link href="/terms"   className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</Link>
                        <Link href="/refund"  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Refunds</Link>
                        <a
                            href="mailto:4utestservice@gmail.com"
                            className="flex items-center gap-1.5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <Mail className="h-3.5 w-3.5" /> 4utestservice@gmail.com
                        </a>
                        <a
                            href="https://www.instagram.com/4utest_/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="4uTest on Instagram"
                            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <Instagram className="h-4 w-4" />
                        </a>
                    </nav>
                </div>
            </footer>

            <CookieBanner />
        </div>
    );
}
