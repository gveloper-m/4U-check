<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->string('locale', 10)->default('en')->after('user_id');
            $table->text('meta_description')->nullable()->after('excerpt');
            $table->timestamp('scheduled_at')->nullable()->after('published_at');
        });

        // Add 'scheduled' to the status enum
        DB::statement("ALTER TABLE blog_posts MODIFY COLUMN status ENUM('draft','published','scheduled') DEFAULT 'draft'");
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropColumn(['locale', 'meta_description', 'scheduled_at']);
        });
        DB::statement("ALTER TABLE blog_posts MODIFY COLUMN status ENUM('draft','published') DEFAULT 'draft'");
    }
};
