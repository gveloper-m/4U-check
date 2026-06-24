<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scheduled_scans', function (Blueprint $table) {
            $table->index('next_run_at');
        });

        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('monitored_sites', function (Blueprint $table) {
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('scheduled_scans', function (Blueprint $table) {
            $table->dropIndex(['next_run_at']);
        });

        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('monitored_sites', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });
    }
};
