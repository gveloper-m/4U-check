import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useState } from 'react';
import {
    Database, Server, Cpu, HardDrive, Clock, Zap, AlertTriangle,
    CheckCircle2, XCircle, RefreshCw, AlertCircle, Info,
    MemoryStick, Activity,
} from 'lucide-react';

interface Ram { total: number; used: number; free: number; percent: number; }
interface Disk { total: number; used: number; free: number; percent: number; }
interface PhpMemory { usage: number; peak: number; limit: number; }
interface System {
    ram: Ram;
    uptime: number;
    uptime_human: string;
    load: [number, number, number];
    disk: Disk;
    php_memory: PhpMemory;
}
interface Health {
    db_ok: boolean;
    db_ms: number | null;
    redis_ok: boolean;
    pending_jobs: number;
    failed_jobs: number;
    log_size: number;
}
interface LogEntry { time: string; level: string; message: string; }
interface AppInfo {
    laravel_version: string;
    php_version: string;
    env: string;
    debug: boolean;
    timezone: string;
}
interface Props extends PageProps {
    system: System;
    health: Health;
    errors: LogEntry[];
    appInfo: AppInfo;
}

function fmt(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

function Bar({ percent, color = 'bg-violet-500' }: { percent: number; color?: string }) {
    const bg = percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : color;
    return (
        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
            <div className={`h-1.5 rounded-full transition-all ${bg}`} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
    );
}

function StatusDot({ ok }: { ok: boolean }) {
    return (
        <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-rose-500'} shadow-[0_0_6px_2px] ${ok ? 'shadow-emerald-500/40' : 'shadow-rose-500/40'}`} />
    );
}

const levelConfig: Record<string, { cls: string; icon: React.ElementType }> = {
    ERROR:     { cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20',    icon: XCircle },
    CRITICAL:  { cls: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: AlertCircle },
    EMERGENCY: { cls: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: AlertCircle },
    ALERT:     { cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: AlertTriangle },
    WARNING:   { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle },
    NOTICE:    { cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    icon: Info },
    INFO:      { cls: 'text-sky-400 bg-sky-500/10 border-sky-500/20',       icon: Info },
};

export default function AdminMonitoring({ system, health, errors, appInfo }: Props) {
    const [levelFilter, setLevelFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const refresh = () => {
        setRefreshing(true);
        router.reload({ onFinish: () => { setRefreshing(false); setLastRefresh(new Date()); } });
    };

    useEffect(() => {
        const timer = setInterval(refresh, 30_000);
        return () => clearInterval(timer);
    }, []);

    const levels = ['ALL', 'ERROR', 'CRITICAL', 'WARNING', 'ALERT', 'NOTICE', 'INFO'];
    const filteredErrors = errors.filter(e => {
        const matchLevel = levelFilter === 'ALL' || e.level === levelFilter;
        const matchSearch = !search || e.message.toLowerCase().includes(search.toLowerCase()) || e.time.includes(search);
        return matchLevel && matchSearch;
    });

    const errorCount   = errors.filter(e => ['ERROR', 'CRITICAL', 'EMERGENCY', 'ALERT'].includes(e.level)).length;
    const warningCount = errors.filter(e => e.level === 'WARNING').length;

    return (
        <AppLayout>
            <Head title="Monitoring" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitoring</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            System health &amp; application errors — refreshes every 30s
                        </p>
                    </div>
                    <button
                        onClick={refresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Status bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { label: 'Database', ok: health.db_ok, sub: health.db_ms ? `${health.db_ms}ms` : null },
                        { label: 'Redis cache', ok: health.redis_ok, sub: null },
                        { label: 'Queue', ok: health.failed_jobs === 0, sub: `${health.pending_jobs} pending · ${health.failed_jobs} failed` },
                        { label: 'Debug mode', ok: !appInfo.debug, sub: appInfo.debug ? '⚠ Turn off in production' : 'Off — good' },
                    ].map(s => (
                        <div key={s.label} className={`flex items-start gap-3 rounded-xl border p-4 ${s.ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                            <StatusDot ok={s.ok} />
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{s.label}</div>
                                {s.sub && <div className={`mt-0.5 text-xs ${s.ok ? 'text-gray-500' : 'text-amber-400'}`}>{s.sub}</div>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* System metrics */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {/* RAM */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <MemoryStick className="h-4 w-4 text-violet-400" /> RAM
                            </div>
                            <span className="text-xs text-gray-500">{system.ram.percent}%</span>
                        </div>
                        <div className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{fmt(system.ram.used)}</div>
                        <div className="text-xs text-gray-500">of {fmt(system.ram.total)}</div>
                        <Bar percent={system.ram.percent} />
                        <div className="mt-2 text-xs text-gray-600">{fmt(system.ram.free)} free</div>
                    </div>

                    {/* CPU */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Cpu className="h-4 w-4 text-sky-400" /> CPU load
                        </div>
                        <div className="mt-3 flex items-end gap-3">
                            <div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">{system.load[0].toFixed(2)}</div>
                                <div className="text-xs text-gray-500">1 min</div>
                            </div>
                            <div className="mb-0.5">
                                <div className="text-base font-semibold text-gray-700 dark:text-gray-300">{system.load[1].toFixed(2)}</div>
                                <div className="text-xs text-gray-600">5 min</div>
                            </div>
                            <div className="mb-0.5">
                                <div className="text-base font-semibold text-gray-600 dark:text-gray-400">{system.load[2].toFixed(2)}</div>
                                <div className="text-xs text-gray-600">15 min</div>
                            </div>
                        </div>
                        <Bar percent={Math.min(system.load[0] * 100, 100)} color="bg-sky-500" />
                    </div>

                    {/* Disk */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <HardDrive className="h-4 w-4 text-emerald-400" /> Disk
                            </div>
                            <span className="text-xs text-gray-500">{system.disk.percent}%</span>
                        </div>
                        <div className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{fmt(system.disk.used)}</div>
                        <div className="text-xs text-gray-500">of {fmt(system.disk.total)}</div>
                        <Bar percent={system.disk.percent} color="bg-emerald-500" />
                        <div className="mt-2 text-xs text-gray-600">{fmt(system.disk.free)} free</div>
                    </div>

                    {/* Uptime & PHP */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Clock className="h-4 w-4 text-amber-400" /> Uptime
                        </div>
                        <div className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{system.uptime_human}</div>
                        <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                            <div className="flex justify-between">
                                <span>PHP memory</span>
                                <span className="text-gray-600 dark:text-gray-400">{fmt(system.php_memory.usage)} / {fmt(system.php_memory.limit)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>PHP peak</span>
                                <span className="text-gray-600 dark:text-gray-400">{fmt(system.php_memory.peak)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* App info */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[
                        { label: 'Laravel', value: appInfo.laravel_version },
                        { label: 'PHP',     value: appInfo.php_version },
                        { label: 'Env',     value: appInfo.env },
                        { label: 'Timezone',value: appInfo.timezone },
                        { label: 'Log size',value: fmt(health.log_size) },
                    ].map(i => (
                        <div key={i.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                            <div className="text-xs text-gray-500">{i.label}</div>
                            <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{i.value}</div>
                        </div>
                    ))}
                </div>

                {/* Error log */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 px-5 py-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Application log</h2>
                            {errorCount > 0 && (
                                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-400">{errorCount} errors</span>
                            )}
                            {warningCount > 0 && (
                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">{warningCount} warnings</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search…"
                                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-600 focus:border-violet-500 focus:outline-none w-44"
                            />
                            <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                                {levels.map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setLevelFilter(l)}
                                        className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                            levelFilter === l
                                                ? 'bg-violet-600 text-white'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-800/50">
                        {filteredErrors.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-14 text-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
                                <p className="text-sm text-gray-600">No log entries match your filters.</p>
                            </div>
                        )}
                        {filteredErrors.map((entry, i) => {
                            const cfg = levelConfig[entry.level] ?? levelConfig['INFO'];
                            const Icon = cfg.icon;
                            return (
                                <div key={i} className="flex gap-3 px-5 py-3 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition-colors">
                                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.cls.split(' ')[0]}`} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cfg.cls}`}>
                                                {entry.level}
                                            </span>
                                            <span className="text-xs text-gray-600">{entry.time}</span>
                                        </div>
                                        <p className="mt-1 break-all font-mono text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {entry.message}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-2.5 text-xs text-gray-600">
                        Showing {filteredErrors.length} of {errors.length} entries · Last refresh: {lastRefresh.toLocaleTimeString()}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
