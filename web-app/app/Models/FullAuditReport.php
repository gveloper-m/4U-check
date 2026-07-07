<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FullAuditReport extends Model
{
    protected $fillable = [
        'user_id',
        'guest_ip',
        'guest_token',
        'name',
        'site_url',
        'status',
        'share_uuid',
        'share_enabled',
        'health_score',
        'score_deductions',
        'seo_schema_result',
        'security_result',
        'catalog_result',
        'tracking_result',
        'broken_resources_result',
        'performance_result',
        'accessibility_result',
        'fuzz_requested',
        'fuzz_testing_result',
    ];

    protected $casts = [
        'share_enabled'           => 'boolean',
        'score_deductions'        => 'array',
        'seo_schema_result'       => 'array',
        'security_result'         => 'array',
        'catalog_result'          => 'array',
        'tracking_result'         => 'array',
        'broken_resources_result' => 'array',
        'performance_result'      => 'array',
        'accessibility_result'    => 'array',
        'fuzz_requested'          => 'boolean',
        'fuzz_testing_result'     => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
