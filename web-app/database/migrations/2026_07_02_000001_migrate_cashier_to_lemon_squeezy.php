<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Replaces Laravel Cashier (Stripe) tables with Lemon Squeezy tables.
 * Drops subscription_items, subscriptions, and Stripe-specific user columns.
 * Creates lemon_squeezy_customers and lemon_squeezy_subscriptions.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Drop Cashier tables ──────────────────────────────────────────────
        Schema::dropIfExists('subscription_items');
        Schema::dropIfExists('subscriptions');

        // ── Drop Stripe-specific user columns ────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $columns = ['stripe_id', 'pm_type', 'pm_last_four'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
            // trial_ends_at is kept — Lemon Squeezy also uses it for generic trials
        });

        // ── Lemon Squeezy customers ──────────────────────────────────────────
        Schema::create('lemon_squeezy_customers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('billable_id');
            $table->string('billable_type');
            $table->string('lemon_squeezy_id')->nullable()->unique();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamps();

            $table->unique(['billable_id', 'billable_type']);
        });

        // ── Lemon Squeezy subscriptions ──────────────────────────────────────
        Schema::create('lemon_squeezy_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->morphs('billable');
            $table->string('type');
            $table->string('lemon_squeezy_id')->unique();
            $table->string('status');
            $table->string('product_id');
            $table->string('variant_id');
            $table->string('card_brand')->nullable();
            $table->string('card_last_four')->nullable();
            $table->string('pause_mode')->nullable();
            $table->timestamp('pause_resumes_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('renews_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lemon_squeezy_subscriptions');
        Schema::dropIfExists('lemon_squeezy_customers');

        Schema::table('users', function (Blueprint $table) {
            $table->string('stripe_id')->nullable()->index()->after('remember_token');
            $table->string('pm_type')->nullable()->after('stripe_id');
            $table->string('pm_last_four', 4)->nullable()->after('pm_type');
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('type');
            $table->string('stripe_id')->unique();
            $table->string('stripe_status');
            $table->string('stripe_price')->nullable();
            $table->integer('quantity')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'stripe_status']);
        });
    }
};
