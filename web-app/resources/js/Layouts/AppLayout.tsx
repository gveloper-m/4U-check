import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageProps } from '@/types';
import {
    LayoutDashboard,
    Search,
    History,
    Clock,
    CreditCard,
    User,
    Users,
    LogOut,
    Menu,
    Zap,
    ChevronDown,
    FileText,
    CheckCircle2,
    XCircle,
    X,
    Ticket,
    Tag,
    HelpCircle,
    Activity,
    Bot,
} from 'lucide-react';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ThemeToggle from '@/Components/ThemeToggle';
import CookieBanner from '@/Components/CookieBanner';

export default function AppLayout({ children }: PropsWithChildren) {
    const { auth, flash } = usePage<PageProps>().props;
    const openTicketsCount = auth.openTicketsCount ?? null;
    const { t, i18n } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const lang = auth.user?.language ?? 'en';
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
    }, [auth.user?.language]);

    useEffect(() => {
        if (flash?.success) setToast({ message: flash.success, type: 'success' });
        else if (flash?.error) setToast({ message: flash.error, type: 'error' });
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    const navItems = [
        { label: t('nav.dashboard'),  href: '/dashboard',       icon: LayoutDashboard, routeName: 'dashboard' },
        { label: t('nav.newScan'),    href: '/audits',           icon: Search,          routeName: 'audits.new' },
        { label: t('nav.history'),    href: '/audits',           icon: History,         routeName: 'audits.index' },
        { label: t('nav.scheduled'),  href: '/scheduled-scans',  icon: Clock,           routeName: 'scheduled-scans.index' },
        { label: t('nav.billing'),    href: '/billing',          icon: CreditCard,      routeName: 'billing' },
        { label: t('nav.agent'),      href: '/agent',            icon: Bot,             routeName: 'agent.index' },
        { label: 'Support',           href: '/tickets',          icon: Ticket,          routeName: 'tickets.index' },
        ...(auth.user.is_admin ? [
            { label: 'Blog',         href: '/admin/blog',         icon: FileText, routeName: 'admin.blog.index' },
            { label: 'Tickets',      href: '/admin/tickets',      icon: Ticket,   routeName: 'admin.tickets.index' },
            { label: 'Users',        href: '/admin/users',        icon: Users,    routeName: 'admin.users.index' },
            { label: 'Monitoring',   href: '/admin/monitoring',   icon: Activity, routeName: 'admin.monitoring.index' },
            { label: 'Trial Codes',  href: '/admin/trial-codes',  icon: Tag,      routeName: 'admin.trial-codes.index' },
        ] : []),
    ];

    const currentRoute = () => {
        try { return route().current() ?? ''; } catch { return ''; }
    };

    const isActive = (routeName: string) => {
        const cr = currentRoute();
        return cr === routeName || cr.startsWith(routeName.replace('.index', '').replace('.new', ''));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            {sidebarOpen && (
                <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-800">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                            <Zap className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                            4u<span className="text-violet-400">test</span>
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.routeName);
                        const isTicketsAdmin = item.routeName === 'admin.tickets.index';
                        return (
                            <Link
                                key={item.routeName}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'}`}
                            >
                                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-violet-400' : ''}`} />
                                <span className="flex-1">{item.label}</span>
                                {isTicketsAdmin && openTicketsCount != null && openTicketsCount > 0 && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-xs font-semibold text-white">
                                        {openTicketsCount > 99 ? '99+' : openTicketsCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 border border-violet-500/30">
                                <span className="text-xs font-semibold text-violet-300">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{auth.user.name}</p>
                                <p className="truncate text-xs text-gray-500">{auth.user.email}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0" />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute bottom-full mb-1 left-0 right-0 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-xl">
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-lg"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <User className="h-4 w-4" />
                                    {t('nav.profile')}
                                </Link>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-b-lg"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('nav.logout')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {auth.user && !auth.user.email_verified_at && (
                    <div className="bg-amber-500 px-4 py-2.5 text-center text-sm font-medium text-white">
                        Please confirm your email address. Check your inbox for a verification link.{' '}
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="underline hover:no-underline"
                        >
                            Resend email
                        </Link>
                    </div>
                )}
                <div className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 px-4 backdrop-blur-sm lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-md p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex-1" />
                    <ThemeToggle />
                    <LanguageSwitcher />
                    <Link
                        href="/audits"
                        className="hidden sm:flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                    >
                        <Search className="h-4 w-4" />
                        {t('nav.newScan')}
                    </Link>
                </div>

                <main className="p-4 lg:p-6">{children}</main>
                <div className="px-4 py-2 lg:px-6 flex items-center justify-between">
                    <nav className="flex items-center gap-4 text-[11px] text-gray-400">
                        <Link href="/terms"   className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</Link>
                        <Link href="/refund"  className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Refunds</Link>
                    </nav>
                    <Link href="/tickets" className="flex items-center gap-1 text-xs text-gray-800 hover:text-gray-600 transition-colors">
                        <HelpCircle className="h-3 w-3" />
                        Need help?
                    </Link>
                </div>
            </div>
            <CookieBanner />
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl text-sm font-medium ${
                    toast.type === 'success'
                        ? 'border-emerald-500/30 bg-white dark:bg-gray-900 text-emerald-300'
                        : 'border-red-500/30 bg-white dark:bg-gray-900 text-red-300'
                }`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        : <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                    }
                    <span>{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
