<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FullAuditReport extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'site_url',
        'status',
        'health_score',
        'score_deductions',
        'seo_schema_result',
        'security_result',
        'catalog_result',
        'tracking_result',
        'broken_resources_result',
        'performance_result',
        'accessibility_result',
    ];

    protected $casts = [
        'score_deductions'        => 'array',
        'seo_schema_result'       => 'array',
        'security_result'         => 'array',
        'catalog_result'          => 'array',
        'tracking_result'         => 'array',
        'broken_resources_result' => 'array',
        'performance_result'      => 'array',
        'accessibility_result'    => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
