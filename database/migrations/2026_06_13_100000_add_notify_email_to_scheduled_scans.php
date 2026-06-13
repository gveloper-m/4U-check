<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scheduled_scans', function (Blueprint $table) {
            $table->boolean('notify_email')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('scheduled_scans', function (Blueprint $table) {
            $table->dropColumn('notify_email');
        });
    }
};
