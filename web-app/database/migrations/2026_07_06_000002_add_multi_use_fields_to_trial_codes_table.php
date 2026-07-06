<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trial_codes', function (Blueprint $table) {
            // null = single-use (default behaviour); a number = redeemable up to that many times
            $table->unsignedSmallInteger('max_uses')->nullable()->after('note');
            // incremented each time a user redeems the code
            $table->unsignedSmallInteger('use_count')->default(0)->after('max_uses');
            // the code itself stops accepting new redemptions after this datetime
            $table->timestamp('active_until')->nullable()->after('expires_at');
            // how many days of premium the user receives from the moment they redeem
            $table->unsignedSmallInteger('premium_days')->default(7)->after('active_until');
        });
    }

    public function down(): void
    {
        Schema::table('trial_codes', function (Blueprint $table) {
            $table->dropColumn(['max_uses', 'use_count', 'active_until', 'premium_days']);
        });
    }
};
