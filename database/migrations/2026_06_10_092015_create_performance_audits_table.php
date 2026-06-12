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
        Schema::create('performance_audits', function (Blueprint $table) {
            $table->id();
            $table->string('site_url');
            $table->integer('ttfb_ms')->nullable();
            
            // Desktop metrics
            $table->integer('desktop_fcp_ms')->nullable();
            $table->integer('desktop_lcp_ms')->nullable();
            $table->float('desktop_cls_score')->nullable();
            
            // Mobile metrics
            $table->integer('mobile_fcp_ms')->nullable();
            $table->integer('mobile_lcp_ms')->nullable();
            $table->float('mobile_cls_score')->nullable();
            
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
        Schema::dropIfExists('performance_audits');
    }
};
