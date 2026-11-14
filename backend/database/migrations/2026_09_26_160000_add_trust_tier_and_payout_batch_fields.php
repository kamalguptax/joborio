<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            $table->timestamp('trust_tier_updated_at')->nullable()->after('trust_tier');
        });

        Schema::table('payout_batches', function (Blueprint $table) {
            $table->string('source', 16)->default('manual')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('payout_batches', function (Blueprint $table) {
            $table->dropColumn('source');
        });

        Schema::table('creators', function (Blueprint $table) {
            $table->dropColumn('trust_tier_updated_at');
        });
    }
};
