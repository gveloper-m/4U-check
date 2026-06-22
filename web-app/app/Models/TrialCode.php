<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrialCode extends Model
{
    protected $fillable = ['code', 'note', 'created_by', 'used_by', 'used_at', 'expires_at', 'site_url'];

    protected function casts(): array
    {
        return [
            'used_at'    => 'datetime',
            'expires_at' => 'datetime',
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

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    public function isActive(): bool
    {
        return $this->isUsed() && $this->expires_at && $this->expires_at->isFuture();
    }
}
