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
        Schema::create('ecommerce_catalog_audits', function (Blueprint $table) {
            $table->id();
            $table->string('page_url');
            $table->boolean('has_price_error')->default(false);
            $table->string('detected_price')->nullable();
            $table->string('schema_stock_status')->nullable();
            $table->boolean('cart_button_disabled')->default(false);
            $table->boolean('is_broken_catalog')->default(false);
            $table->timestamp('executed_at');
            $table->timestamps();
            
            $table->index('page_url');
            $table->index('executed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ecommerce_catalog_audits');
    }
};
