<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mcp_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('monitored_site_id')->nullable()->constrained('monitored_sites')->nullOnDelete();
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->timestamp('last_ping_at')->nullable();
            $table->json('metrics')->nullable();         // last heartbeat CPU/RAM/disk
            $table->longText('latest_report_json')->nullable(); // queued for next heartbeat
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mcp_agents');
    }
};
