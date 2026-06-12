<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('marketing_tracking_audits', function (Blueprint $table) {
            $table->id();
            $table->string('site_url');
            $table->boolean('ga4_detected')->default(false);
            $table->json('ga4_ids')->nullable();
            $table->boolean('facebook_pixel_detected')->default(false);
            $table->json('facebook_pixel_ids')->nullable();
            $table->boolean('tiktok_pixel_detected')->default(false);
            $table->json('tiktok_pixel_ids')->nullable();
            $table->timestamp('executed_at');
            $table->timestamps();
            
            $table->index('site_url');
            $table->index('executed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketing_tracking_audits');
    }
};
