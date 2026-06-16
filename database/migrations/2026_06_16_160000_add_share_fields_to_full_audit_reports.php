<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->uuid('share_uuid')->nullable()->unique()->after('status');
            $table->boolean('share_enabled')->default(false)->after('share_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->dropColumn(['share_uuid', 'share_enabled']);
        });
    }
};
