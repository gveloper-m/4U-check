import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, useState } from 'react';
import { PageProps } from '@/types';
import {
    LayoutDashboard,
    Search,
    History,
    Clock,
    CreditCard,
    User,
    LogOut,
    Menu,
    X,
    Zap,
    ChevronDown,
} from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    routeName: string;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, routeName: 'dashboard' },
    { label: 'New Scan', href: '/audits', icon: Search, routeName: 'audits.index' },
    { label: 'Scan History', href: '/audits', icon: History, routeName: 'audits.index' },
    { label: 'Scheduled Scans', href: '/scheduled-scans', icon: Clock, routeName: 'scheduled-scans.index' },
    { label: 'Billing', href: '/billing', icon: CreditCard, routeName: 'billing' },
];

export default function AppLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const currentRoute = () => {
        try {
            return route().current() ?? '';
        } catch {
            return '';
        }
    };

    const isActive = (routeName: string) => {
        const cr = currentRoute();
        return cr === routeName || cr.startsWith(routeName.replace('.index', ''));
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-gray-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">
                        4u<span className="text-violet-400">test</span>
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.routeName);
                        return (
                            <Link
                                key={item.routeName + item.label}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                                }`}
                            >
                                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-violet-400' : ''}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="shrink-0 border-t border-gray-800 p-4">
                    <div className="relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 border border-violet-500/30">
                                <span className="text-xs font-semibold text-violet-300">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="truncate text-sm font-medium text-gray-200">{auth.user.name}</p>
                                <p className="truncate text-xs text-gray-500">{auth.user.email}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0" />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute bottom-full mb-1 left-0 right-0 rounded-lg bg-gray-800 border border-gray-700 shadow-xl">
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </Link>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log Out
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-800 bg-gray-950/80 px-4 backdrop-blur-sm lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex-1" />
                    <Link
                        href="/audits"
                        className="hidden sm:flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
                    >
                        <Search className="h-4 w-4" />
                        New Scan
                    </Link>
                </div>

                {/* Page content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
