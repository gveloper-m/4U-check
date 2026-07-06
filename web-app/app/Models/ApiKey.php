<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiKey extends Model
{
    protected $fillable = ['user_id', 'name', 'key_hash', 'key_prefix', 'last_used_at', 'expires_at'];

    protected $casts = [
        'last_used_at' => 'datetime',
        'expires_at'   => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function generate(): array
    {
        $raw    = '4ut_' . bin2hex(random_bytes(20));
        $hash   = hash('sha256', $raw);
        $prefix = substr($raw, 0, 12);

        return ['raw' => $raw, 'hash' => $hash, 'prefix' => $prefix];
    }
}
