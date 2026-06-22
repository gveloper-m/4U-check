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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_agency')->default(false)->after('language');
            $table->string('agency_logo')->nullable()->after('is_agency');
            $table->string('agency_primary_color', 7)->nullable()->after('agency_logo');
            $table->string('agency_secondary_color', 7)->nullable()->after('agency_primary_color');
            $table->string('agency_footer_text')->nullable()->after('agency_secondary_color');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_agency',
                'agency_logo',
                'agency_primary_color',
                'agency_secondary_color',
                'agency_footer_text',
            ]);
        });
    }
};
