<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->string('guest_ip', 45)->nullable()->after('user_id');
            $table->string('guest_token', 36)->nullable()->after('guest_ip')->index();
        });
    }

    public function down(): void
    {
        Schema::table('full_audit_reports', function (Blueprint $table) {
            $table->dropIndex(['guest_token']);
            $table->dropColumn(['guest_ip', 'guest_token']);
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
