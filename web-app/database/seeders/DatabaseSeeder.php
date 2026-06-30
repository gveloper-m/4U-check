<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name'         => '4uTest Admin',
            'email'        => '4utestservice@gmail.com',
            'password'     => bcrypt('Octavia*1969'),
            'is_admin'     => true,
            'is_unlimited' => true,
        ]);
    }
}
