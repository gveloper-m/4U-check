<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->boolean('fuzz_requested')->default(false)->after('accessibility_result');
            $table->json('fuzz_testing_result')->nullable()->after('fuzz_requested');
        });
    }

    public function down(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->dropColumn(['fuzz_requested', 'fuzz_testing_result']);
        });
    }
};
