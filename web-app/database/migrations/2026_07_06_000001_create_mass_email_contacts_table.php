<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mass_email_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('website');
            $table->string('language', 5)->default('en');
            $table->string('status', 20)->default('pending'); // pending|scanning|scan_failed|sending|sent|failed
            $table->unsignedBigInteger('audit_id')->nullable();
            $table->uuid('share_uuid')->nullable();
            $table->unsignedSmallInteger('audit_score')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mass_email_contacts');
    }
};
