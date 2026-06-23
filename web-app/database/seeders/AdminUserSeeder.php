<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@4utest.gr'],
            [
                'name'         => 'Admin',
                'password'     => Hash::make('admin4utest2024'),
                'is_unlimited' => true,
                'is_admin'     => true,
            ]
        );

        $this->command->info('Admin user created: admin@4utest.gr / admin4utest2024');
    }
}
