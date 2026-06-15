<?php

namespace App\Providers;

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
    }
}
