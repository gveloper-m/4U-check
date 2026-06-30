<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notify_payment')->default(true)->after('agency_footer_text');
            $table->boolean('notify_monthly_report')->default(true)->after('notify_payment');
            $table->boolean('notify_renewal_reminder')->default(true)->after('notify_monthly_report');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['notify_payment', 'notify_monthly_report', 'notify_renewal_reminder']);
        });
    }
};
