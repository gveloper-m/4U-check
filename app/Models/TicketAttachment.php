<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TicketAttachment extends Model
{
    public $timestamps = false;

    protected $fillable = ['ticket_message_id', 'filename', 'path'];

    protected $appends = ['url'];

    public function message(): BelongsTo
    {
        return $this->belongsTo(TicketMessage::class, 'ticket_message_id');
    }

    public function getUrlAttribute(): string
    {
        return Storage::url($this->path);
    }
}
