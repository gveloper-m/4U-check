<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('scans:run')->everyMinute();
Schedule::command('blog:publish-scheduled')->everyMinute();
Schedule::command('emails:monthly-report')->monthlyOn(15, '08:00');
Schedule::command('emails:renewal-reminders')->dailyAt('09:00');
Schedule::command('blog:auto-generate')->twiceDaily(8, 20)->withoutOverlapping();
