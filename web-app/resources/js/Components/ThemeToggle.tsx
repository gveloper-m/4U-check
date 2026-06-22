import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative flex h-7 w-14 items-center rounded-full bg-amber-100 px-0.5 transition-colors duration-300 dark:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
            <span
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 dark:bg-gray-900 ${isDark ? 'translate-x-7' : 'translate-x-0'}`}
            >
                {isDark
                    ? <Moon className="h-3.5 w-3.5 text-violet-400" />
                    : <Sun className="h-3.5 w-3.5 text-amber-500" />
                }
            </span>
        </button>
    );
}
