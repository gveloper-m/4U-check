<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop Lemon Squeezy tables
        Schema::dropIfExists('lemon_squeezy_subscriptions');
        Schema::dropIfExists('lemon_squeezy_customers');

        // Paddle customers (polymorphic — one row per billable model)
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->morphs('billable');
            $table->string('paddle_id')->unique();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamps();
        });

        // Paddle subscriptions
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->morphs('billable');
            $table->string('type');
            $table->string('paddle_id')->unique();
            $table->string('status');
            $table->json('scheduled_change')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('next_billed_at')->nullable(); // populated by SubscriptionUpdated listener
            $table->timestamps();
            $table->index(['billable_type', 'billable_id', 'status']);
        });

        // Paddle subscription items (one per price, supports multi-price subscriptions)
        Schema::create('subscription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('product_id');
            $table->string('price_id');
            $table->string('status');
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();
            $table->unique(['subscription_id', 'price_id']);
        });

        // Paddle transactions (payment history)
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->morphs('billable');
            $table->string('paddle_id')->unique();
            $table->string('paddle_subscription_id')->nullable()->index();
            $table->string('invoice_id')->nullable();
            $table->string('invoice_number')->nullable();
            $table->string('status');
            $table->string('total');
            $table->string('tax');
            $table->string('currency', 3);
            $table->timestamp('billed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('subscription_items');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('customers');
    }
};
