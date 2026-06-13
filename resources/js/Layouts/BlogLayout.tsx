import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Zap } from 'lucide-react';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import CookieBanner from '@/Components/CookieBanner';

export default function BlogLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-white">
                            4u<span className="text-violet-400">test</span>
                        </span>
                    </Link>

                    <nav className="flex items-center gap-5 text-sm">
                        <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                            Blog
                        </Link>
                        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                            Home
                        </Link>
                        <LanguageSwitcher />
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 py-10">
                {children}
            </main>

            <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
                &copy; {new Date().getFullYear()} 4utest. All rights reserved.
            </footer>

            <CookieBanner />
        </div>
    );
}
