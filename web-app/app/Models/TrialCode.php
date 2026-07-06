<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrialCode extends Model
{
    protected $fillable = [
        'code', 'note', 'created_by', 'used_by', 'used_at', 'expires_at',
        'site_url', 'max_uses', 'use_count', 'active_until', 'premium_days',
    ];

    protected function casts(): array
    {
        return [
            'used_at'     => 'datetime',
            'expires_at'  => 'datetime',
            'active_until'=> 'datetime',
        ];
    }

    public function usedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Maximum redemptions allowed (null treated as 1 = single-use)
    public function maxUses(): int
    {
        return $this->max_uses ?? 1;
    }

    // Has the code been used at least once?
    public function isUsed(): bool
    {
        return ($this->use_count ?? 0) > 0;
    }

    // Has the code reached its redemption limit?
    public function isFullyUsed(): bool
    {
        return ($this->use_count ?? 0) >= $this->maxUses();
    }

    // Has the code's validity window expired (no more redemptions accepted)?
    public function isDateExpired(): bool
    {
        return $this->active_until !== null && $this->active_until->isPast();
    }

    // Can the code still be redeemed by a new user?
    public function isRedeemable(): bool
    {
        return !$this->isFullyUsed() && !$this->isDateExpired();
    }

    // Legacy helper — kept for backward compatibility with views that call isActive()
    public function isActive(): bool
    {
        return $this->isUsed() && !$this->isDateExpired() && !$this->isFullyUsed();
    }
}
