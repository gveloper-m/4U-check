<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cookie_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->string('version', 10)->default('1.0');
            $table->timestamp('accepted_at');
            $table->timestamps();

            $table->index(['ip_address', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cookie_consents');
    }
};
