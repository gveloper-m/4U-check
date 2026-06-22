<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('full_audit_reports', function (Blueprint $table) {
            $table->id();
            $table->string('site_url');
            $table->json('seo_schema_result')->nullable();
            $table->json('security_result')->nullable();
            $table->json('catalog_result')->nullable();
            $table->json('tracking_result')->nullable();
            $table->json('broken_resources_result')->nullable();
            $table->json('performance_result')->nullable();
            $table->timestamp('executed_at');
            $table->timestamps();

            $table->index('site_url');
            $table->index('executed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('full_audit_reports');
    }
};
