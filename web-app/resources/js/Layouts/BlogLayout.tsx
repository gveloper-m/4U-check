import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Zap, Instagram, Mail } from 'lucide-react';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ThemeToggle from '@/Components/ThemeToggle';
import CookieBanner from '@/Components/CookieBanner';

export default function BlogLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <header className="sticky top-0 z-20 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                            4u<span className="text-violet-400">test</span>
                        </span>
                    </Link>

                    <nav className="flex items-center gap-5 text-sm">
                        <Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Blog
                        </Link>
                        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Home
                        </Link>
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-10">
                {children}
            </main>

            <footer className="border-t border-gray-200 dark:border-gray-800 py-6 px-4">
                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>&copy; {new Date().getFullYear()} 4utest. All rights reserved.</span>
                    <a
                        href="mailto:4utestservice@gmail.com"
                        className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <Mail className="h-3.5 w-3.5" /> 4utestservice@gmail.com
                    </a>
                    <a
                        href="https://www.instagram.com/4utest_/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="4uTest on Instagram"
                        className="hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <Instagram className="h-4 w-4" />
                    </a>
                </div>
            </footer>

            <CookieBanner />
        </div>
    );
}
