<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publishers', function (Blueprint $table) {
            if (! Schema::hasColumn('publishers', 'payout_method')) {
                $table->string('payout_method', 32)->nullable()->after('notification_preferences');
            }
            if (! Schema::hasColumn('publishers', 'payout_holder_name')) {
                $table->string('payout_holder_name', 120)->nullable()->after('payout_method');
            }
            if (! Schema::hasColumn('publishers', 'payout_upi_id')) {
                $table->string('payout_upi_id', 120)->nullable()->after('payout_holder_name');
            }
            if (! Schema::hasColumn('publishers', 'payout_paypal_email')) {
                $table->string('payout_paypal_email', 190)->nullable()->after('payout_upi_id');
            }
            if (! Schema::hasColumn('publishers', 'payout_bank_name')) {
                $table->string('payout_bank_name', 120)->nullable()->after('payout_paypal_email');
            }
            if (! Schema::hasColumn('publishers', 'payout_account_number')) {
                $table->string('payout_account_number', 34)->nullable()->after('payout_bank_name');
            }
            if (! Schema::hasColumn('publishers', 'payout_ifsc')) {
                $table->string('payout_ifsc', 20)->nullable()->after('payout_account_number');
            }
        });

        Schema::table('network_members', function (Blueprint $table) {
            if (! Schema::hasColumn('network_members', 'payout_method')) {
                $table->string('payout_method', 32)->nullable()->after('released_at');
            }
            if (! Schema::hasColumn('network_members', 'payout_holder_name')) {
                $table->string('payout_holder_name', 120)->nullable()->after('payout_method');
            }
            if (! Schema::hasColumn('network_members', 'payout_upi_id')) {
                $table->string('payout_upi_id', 120)->nullable()->after('payout_holder_name');
            }
            if (! Schema::hasColumn('network_members', 'payout_paypal_email')) {
                $table->string('payout_paypal_email', 190)->nullable()->after('payout_upi_id');
            }
            if (! Schema::hasColumn('network_members', 'payout_bank_name')) {
                $table->string('payout_bank_name', 120)->nullable()->after('payout_paypal_email');
            }
            if (! Schema::hasColumn('network_members', 'payout_account_number')) {
                $table->string('payout_account_number', 34)->nullable()->after('payout_bank_name');
            }
            if (! Schema::hasColumn('network_members', 'payout_ifsc')) {
                $table->string('payout_ifsc', 20)->nullable()->after('payout_account_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('publishers', function (Blueprint $table) {
            foreach ([
                'payout_method',
                'payout_holder_name',
                'payout_upi_id',
                'payout_paypal_email',
                'payout_bank_name',
                'payout_account_number',
                'payout_ifsc',
            ] as $col) {
                if (Schema::hasColumn('publishers', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('network_members', function (Blueprint $table) {
            foreach ([
                'payout_method',
                'payout_holder_name',
                'payout_upi_id',
                'payout_paypal_email',
                'payout_bank_name',
                'payout_account_number',
                'payout_ifsc',
            ] as $col) {
                if (Schema::hasColumn('network_members', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
