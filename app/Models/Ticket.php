<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = ['user_id', 'subject', 'status'];

    protected $casts = [
        'status' => 'string',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->orderBy('created_at');
    }

    public function latestMessage(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->latest()->limit(1);
    }

    public function statusColor(): string
    {
        return match ($this->status) {
            'open'        => 'blue',
            'in_progress' => 'amber',
            'resolved'    => 'emerald',
            'closed'      => 'gray',
            default       => 'gray',
        };
    }
}
