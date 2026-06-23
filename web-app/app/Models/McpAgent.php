<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class McpAgent extends Model
{
    protected $fillable = [
        'user_id',
        'monitored_site_id',
        'name',
        'token',
        'last_ping_at',
        'metrics',
        'latest_report_json',
    ];

    protected function casts(): array
    {
        return [
            'last_ping_at' => 'datetime',
            'metrics'      => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function monitoredSite(): BelongsTo
    {
        return $this->belongsTo(MonitoredSite::class, 'monitored_site_id');
    }

    public function isOnline(): bool
    {
        return $this->last_ping_at !== null
            && $this->last_ping_at->gte(now()->subMinutes(5));
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }
}
