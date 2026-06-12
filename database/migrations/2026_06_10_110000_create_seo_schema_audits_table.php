<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seo_schema_audits', function (Blueprint $table) {
            $table->id();
            $table->string('site_url');
            $table->string('meta_title_status')->nullable();
            $table->string('meta_description_status')->nullable();
            $table->integer('h1_count')->default(0);
            $table->string('canonical_url', 2048)->nullable();
            $table->boolean('has_valid_schema')->default(false);
            $table->json('schema_errors')->nullable();
            $table->timestamp('executed_at');
            $table->timestamps();

            $table->index('site_url');
            $table->index('executed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_schema_audits');
    }
};
