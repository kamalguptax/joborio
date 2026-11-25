<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            if (! Schema::hasColumn('creators', 'referral_share_count')) {
                $table->unsignedInteger('referral_share_count')->default(0)->after('referral_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            if (Schema::hasColumn('creators', 'referral_share_count')) {
                $table->dropColumn('referral_share_count');
            }
        });
    }
};
