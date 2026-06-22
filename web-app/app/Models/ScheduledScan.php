<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledScan extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'site_url',
        'interval',
        'is_active',
        'notify_email',
        'last_run_at',
        'next_run_at',
        'last_report_id',
    ];

    protected $casts = [
        'is_active'    => 'boolean',
        'notify_email' => 'boolean',
        'last_run_at'  => 'datetime',
        'next_run_at'  => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lastReport(): BelongsTo
    {
        return $this->belongsTo(FullAuditReport::class, 'last_report_id');
    }

    public static function computeNextRun(string $interval, ?Carbon $from = null): Carbon
    {
        $base = $from ?? now();

        return match ($interval) {
            'hourly'  => $base->copy()->addHour(),
            'daily'   => $base->copy()->addDay(),
            'weekly'  => $base->copy()->addWeek(),
            'monthly' => $base->copy()->addMonth(),
            default   => $base->copy()->addDay(),
        };
    }
}
