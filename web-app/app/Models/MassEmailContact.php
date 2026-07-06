<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MassEmailContact extends Model
{
    protected $fillable = [
        'email',
        'website',
        'language',
        'status',
        'audit_id',
        'share_uuid',
        'audit_score',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function markScanning(int $auditId, string $shareUuid): void
    {
        $this->update(['status' => 'scanning', 'audit_id' => $auditId, 'share_uuid' => $shareUuid]);
    }

    public function markSent(int $score): void
    {
        $this->update(['status' => 'sent', 'audit_score' => $score, 'sent_at' => now(), 'error_message' => null]);
    }

    public function markFailed(string $reason): void
    {
        $this->update(['status' => 'failed', 'error_message' => $reason]);
    }

    public function markScanFailed(string $reason): void
    {
        $this->update(['status' => 'scan_failed', 'error_message' => $reason]);
    }
}
