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
        Schema::create('broken_resources_audits', function (Blueprint $table) {
            $table->id();
            $table->string('site_url');
            $table->integer('total_links_checked')->default(0);
            $table->integer('total_images_checked')->default(0);
            $table->json('broken_links')->nullable();
            $table->json('broken_images')->nullable();
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
        Schema::dropIfExists('broken_resources_audits');
    }
};
