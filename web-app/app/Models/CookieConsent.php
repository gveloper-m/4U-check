<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CookieConsent extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'version',
        'accepted_at',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
