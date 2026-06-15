<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, Billable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_unlimited',
        'is_admin',
        'phone',
        'company_name',
        'company_site',
        'language',
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
            'is_unlimited'      => 'boolean',
            'is_admin'          => 'boolean',
        ];
    }

    public function hasActiveSubscription(): bool
    {
        if ($this->is_unlimited) {
            return true;
        }

        return $this->subscribed('default');
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
