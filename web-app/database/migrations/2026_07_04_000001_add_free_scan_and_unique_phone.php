<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('free_scan_used')->default(false)->after('trial_ends_at');

            // Make phone unique — drop index first if it already exists
            try {
                $table->unique('phone');
            } catch (\Throwable) {
                // already unique
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('free_scan_used');
            $table->dropUnique(['phone']);
        });
    }
};
