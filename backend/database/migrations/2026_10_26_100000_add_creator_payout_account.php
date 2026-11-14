<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            $table->string('payout_holder_name', 120)->nullable()->after('payout_method');
            $table->string('payout_upi_id', 120)->nullable()->after('payout_holder_name');
            $table->string('payout_paypal_email', 190)->nullable()->after('payout_upi_id');
            $table->string('payout_bank_name', 120)->nullable()->after('payout_paypal_email');
            $table->string('payout_account_number', 34)->nullable()->after('payout_bank_name');
            $table->string('payout_ifsc', 20)->nullable()->after('payout_account_number');
        });
    }

    public function down(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            $table->dropColumn([
                'payout_holder_name',
                'payout_upi_id',
                'payout_paypal_email',
                'payout_bank_name',
                'payout_account_number',
                'payout_ifsc',
            ]);
        });
    }
};
