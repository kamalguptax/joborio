<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('creators', 'payout_currency')) {
            Schema::table('creators', function (Blueprint $table) {
                $table->string('payout_currency', 3)->nullable()->after('payout_method');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('creators', 'payout_currency')) {
            Schema::table('creators', function (Blueprint $table) {
                $table->dropColumn('payout_currency');
            });
        }
    }
};
