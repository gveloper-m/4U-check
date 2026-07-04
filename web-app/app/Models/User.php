<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Paddle\Billable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, Billable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'company_name',
        'company_site',
        'vat_number',
        'billing_country',
        'elorus_contact_id',
        'language',
        'is_agency',
        'agency_logo',
        'agency_primary_color',
        'agency_secondary_color',
        'agency_footer_text',
        'notify_payment',
        'notify_monthly_report',
        'notify_renewal_reminder',
        'free_scan_used',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'trial_ends_at'     => 'datetime',
            'is_unlimited'             => 'boolean',
            'is_admin'                 => 'boolean',
            'is_agency'                => 'boolean',
            'notify_payment'           => 'boolean',
            'notify_monthly_report'    => 'boolean',
            'notify_renewal_reminder'  => 'boolean',
            'free_scan_used'           => 'boolean',
        ];
    }

    public const SCANS_PER_SITE    = 30;
    public const LEGACY_SCAN_LIMIT = 120;

    public function siteCount(): int
    {
        return $this->monitoredSites()->count();
    }

    public function monthlyLimit(): int
    {
        $count = $this->siteCount();
        $base  = $count > 0
            ? self::SCANS_PER_SITE * $count
            : self::LEGACY_SCAN_LIMIT;

        return $base + (int) ($this->crawl_quota_bonus ?? 0);
    }

    public function scansThisMonth(): int
    {
        return $this->auditReports()
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();
    }

    public function hasReachedScanLimit(): bool
    {
        if ($this->is_unlimited) {
            return false;
        }
        return $this->scansThisMonth() >= $this->monthlyLimit();
    }

    public function remainingScans(): int
    {
        if ($this->is_unlimited) {
            return PHP_INT_MAX;
        }
        return max(0, $this->monthlyLimit() - $this->scansThisMonth());
    }

    public function hasActiveSubscription(): bool
    {
        if ($this->is_unlimited) {
            return true;
        }

        if (! $this->free_scan_used) {
            return true;
        }

        return $this->subscribed();
    }

    public function primarySite(): ?MonitoredSite
    {
        return $this->monitoredSites()->where('is_primary', true)->first();
    }

    public function monitoredSites(): HasMany
    {
        return $this->hasMany(MonitoredSite::class);
    }

    public function auditReports(): HasMany
    {
        return $this->hasMany(FullAuditReport::class);
    }

    public function scheduledScans(): HasMany
    {
        return $this->hasMany(ScheduledScan::class);
    }
}
