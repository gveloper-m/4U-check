<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Inertia::share([
            'flash' => fn () => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ]);

        $this->configureRateLimiters();
    }

    private function configureRateLimiters(): void
    {
        // Shared report page — 60 views/min per IP
        RateLimiter::for('shared-report', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        // Shared PDF generation — expensive server-side render, cap at 10/min per IP
        RateLimiter::for('shared-pdf', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Audit store — belt-and-suspenders on top of quota enforcement
        RateLimiter::for('audit-store', function (Request $request) {
            return [
                Limit::perMinute(20)->by($request->user()?->id ?? $request->ip()),
                Limit::perHour(60)->by($request->user()?->id ?? $request->ip()),
            ];
        });
    }
}
