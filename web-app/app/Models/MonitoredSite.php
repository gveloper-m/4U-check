<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitoredSite extends Model
{
    protected $fillable = ['user_id', 'url', 'is_primary', 'label'];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->label ?: $this->url;
    }

    public function getHostAttribute(): string
    {
        return parse_url($this->url, PHP_URL_HOST) ?? $this->url;
    }
}
