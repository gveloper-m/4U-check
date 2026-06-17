<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Monitoring', [
            'system'  => $this->systemMetrics(),
            'health'  => $this->appHealth(),
            'errors'  => $this->recentErrors(100),
            'appInfo' => [
                'laravel_version' => app()->version(),
                'php_version'     => PHP_VERSION,
                'env'             => app()->environment(),
                'debug'           => config('app.debug'),
                'timezone'        => config('app.timezone'),
            ],
        ]);
    }

    private function systemMetrics(): array
    {
        $ram = ['total' => 0, 'used' => 0, 'free' => 0, 'percent' => 0];
        if (file_exists('/proc/meminfo')) {
            $mem  = file_get_contents('/proc/meminfo');
            preg_match('/MemTotal:\s+(\d+)/', $mem, $t);
            preg_match('/MemAvailable:\s+(\d+)/', $mem, $a);
            $totalKb   = (int) ($t[1] ?? 0);
            $availKb   = (int) ($a[1] ?? 0);
            $usedKb    = $totalKb - $availKb;
            $ram = [
                'total'   => $totalKb * 1024,
                'used'    => $usedKb  * 1024,
                'free'    => $availKb  * 1024,
                'percent' => $totalKb > 0 ? round($usedKb / $totalKb * 100) : 0,
            ];
        }

        $uptime = 0;
        $uptimeHuman = 'unknown';
        if (file_exists('/proc/uptime')) {
            $uptime = (int) explode(' ', file_get_contents('/proc/uptime'))[0];
            $days    = (int) ($uptime / 86400);
            $hours   = (int) (($uptime % 86400) / 3600);
            $minutes = (int) (($uptime % 3600) / 60);
            $uptimeHuman = ($days > 0 ? "{$days}d " : '') . "{$hours}h {$minutes}m";
        }

        $diskTotal = (int) disk_total_space('/');
        $diskFree  = (int) disk_free_space('/');
        $diskUsed  = $diskTotal - $diskFree;

        return [
            'ram'        => $ram,
            'uptime'     => $uptime,
            'uptime_human' => $uptimeHuman,
            'load'       => sys_getloadavg(),
            'disk'       => [
                'total'   => $diskTotal,
                'used'    => $diskUsed,
                'free'    => $diskFree,
                'percent' => $diskTotal > 0 ? round($diskUsed / $diskTotal * 100) : 0,
            ],
            'php_memory' => [
                'usage'  => memory_get_usage(true),
                'peak'   => memory_get_peak_usage(true),
                'limit'  => $this->parseBytes(ini_get('memory_limit')),
            ],
        ];
    }

    private function appHealth(): array
    {
        $dbOk = false;
        $dbMs = null;
        try {
            $t0 = microtime(true);
            DB::select('SELECT 1');
            $dbMs = round((microtime(true) - $t0) * 1000, 1);
            $dbOk = true;
        } catch (\Throwable) {}

        $redisOk = false;
        try {
            Cache::store('redis')->put('__healthcheck__', 1, 5);
            $redisOk = Cache::store('redis')->get('__healthcheck__') === 1;
        } catch (\Throwable) {}

        $pendingJobs = 0;
        $failedJobs  = 0;
        try {
            $pendingJobs = DB::table('jobs')->count();
            $failedJobs  = DB::table('failed_jobs')->count();
        } catch (\Throwable) {}

        $logSize = 0;
        $logPath = storage_path('logs/laravel.log');
        if (file_exists($logPath)) {
            $logSize = filesize($logPath);
        }

        return [
            'db_ok'        => $dbOk,
            'db_ms'        => $dbMs,
            'redis_ok'     => $redisOk,
            'pending_jobs' => $pendingJobs,
            'failed_jobs'  => $failedJobs,
            'log_size'     => $logSize,
        ];
    }

    private function recentErrors(int $limit = 100): array
    {
        $logPath = storage_path('logs/laravel.log');
        if (! file_exists($logPath)) return [];

        $lines  = array_slice(
            file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES),
            -3000
        );
        $errors = [];

        foreach (array_reverse($lines) as $line) {
            if (preg_match(
                '/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \w+\.(ERROR|CRITICAL|WARNING|ALERT|EMERGENCY|NOTICE|INFO)(?:\.|:)\s*(.+)/',
                $line,
                $m
            )) {
                $errors[] = [
                    'time'    => $m[1],
                    'level'   => $m[2],
                    'message' => substr(trim($m[3]), 0, 400),
                ];
                if (count($errors) >= $limit) break;
            }
        }

        return $errors;
    }

    private function parseBytes(string $val): int
    {
        $val  = trim($val);
        $last = strtolower($val[strlen($val) - 1]);
        $num  = (int) $val;
        return match ($last) {
            'g' => $num * 1024 * 1024 * 1024,
            'm' => $num * 1024 * 1024,
            'k' => $num * 1024,
            default => $num,
        };
    }
}
