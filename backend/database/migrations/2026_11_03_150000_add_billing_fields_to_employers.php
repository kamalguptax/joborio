<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employers', function (Blueprint $table) {
            if (! Schema::hasColumn('employers', 'business_email')) {
                $table->string('business_email')->nullable()->after('website');
            }
            if (! Schema::hasColumn('employers', 'gst_number')) {
                $table->string('gst_number', 32)->nullable()->after('business_email');
            }
            if (! Schema::hasColumn('employers', 'billing_address')) {
                $table->text('billing_address')->nullable()->after('gst_number');
            }
            if (! Schema::hasColumn('employers', 'payment_method')) {
                $table->string('payment_method', 32)->nullable()->after('billing_address');
            }
            if (! Schema::hasColumn('employers', 'payment_upi_id')) {
                $table->string('payment_upi_id')->nullable()->after('payment_method');
            }
            if (! Schema::hasColumn('employers', 'payment_account_name')) {
                $table->string('payment_account_name')->nullable()->after('payment_upi_id');
            }
            if (! Schema::hasColumn('employers', 'payment_bank_name')) {
                $table->string('payment_bank_name')->nullable()->after('payment_account_name');
            }
            if (! Schema::hasColumn('employers', 'payment_account_number')) {
                $table->string('payment_account_number')->nullable()->after('payment_bank_name');
            }
            if (! Schema::hasColumn('employers', 'payment_ifsc')) {
                $table->string('payment_ifsc', 32)->nullable()->after('payment_account_number');
            }
            if (! Schema::hasColumn('employers', 'billing_completed_at')) {
                $table->timestamp('billing_completed_at')->nullable()->after('verified_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employers', function (Blueprint $table) {
            foreach ([
                'business_email',
                'gst_number',
                'billing_address',
                'payment_method',
                'payment_upi_id',
                'payment_account_name',
                'payment_bank_name',
                'payment_account_number',
                'payment_ifsc',
                'billing_completed_at',
            ] as $column) {
                if (Schema::hasColumn('employers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
