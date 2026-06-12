<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->after('site_url');
            $table->integer('health_score')->nullable()->after('performance_result');
            $table->json('score_deductions')->nullable()->after('health_score');
        });
    }

    public function down(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->dropColumn(['status', 'health_score', 'score_deductions']);
        });
    }
};
