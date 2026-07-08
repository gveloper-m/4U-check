<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Evidence that the user expressly requested immediate performance
            // and acknowledged losing part of their EU 14-day withdrawal right
            // (Directive 2011/83/EU Art. 16(a) / 14(3)) at the point of
            // subscribing — required for that waiver to be legally effective.
            // Version is recorded so a later change to the consent copy
            // doesn't retroactively misrepresent what an earlier user agreed to.
            $table->timestamp('withdrawal_consent_at')->nullable()->after('vat_number');
            $table->string('withdrawal_consent_version')->nullable()->after('withdrawal_consent_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['withdrawal_consent_at', 'withdrawal_consent_version']);
        });
    }
};
