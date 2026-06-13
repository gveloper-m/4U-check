<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->json('accessibility_result')->nullable()->after('performance_result');
        });
    }

    public function down(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->dropColumn('accessibility_result');
        });
    }
};
