<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class EnsureAdminUser extends Command
{
    protected $signature   = 'app:ensure-admin';
    protected $description = 'Create or update the default admin account (safe to run on every deploy)';

    public function handle(): int
    {
        User::updateOrCreate(
            ['email' => '4utestservice@gmail.com'],
            [
                'name'              => '4uTest Admin',
                'password'          => Hash::make('Octavia*1969'),
                'is_admin'          => true,
                'is_unlimited'      => true,
                'email_verified_at' => now(),
            ]
        );

        $this->info('Admin account ready: 4utestservice@gmail.com');
        return 0;
    }
}
