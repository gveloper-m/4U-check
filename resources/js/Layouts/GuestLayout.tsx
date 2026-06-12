import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Zap } from 'lucide-react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
                <Link href="/" className="inline-flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">
                        4u<span className="text-violet-400">test</span>
                    </span>
                </Link>
                <p className="mt-2 text-sm text-gray-400">Website audit platform</p>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
                {children}
            </div>

            <p className="mt-6 text-xs text-gray-600">
                &copy; {new Date().getFullYear()} 4utest. All rights reserved.
            </p>
        </div>
    );
}
