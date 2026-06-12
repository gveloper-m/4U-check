<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_infrastructure_audits', function (Blueprint $table) {
            $table->id();
            $table->string('site_url');
            $table->boolean('ssl_valid')->default(false);
            $table->integer('ssl_days_left')->nullable();
            $table->boolean('has_mixed_content')->default(false);
            $table->boolean('spf_record_exists')->default(false);
            $table->boolean('dmarc_record_exists')->default(false);
            $table->timestamp('executed_at');
            $table->timestamps();

            $table->index('site_url');
            $table->index('executed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_infrastructure_audits');
    }
};
