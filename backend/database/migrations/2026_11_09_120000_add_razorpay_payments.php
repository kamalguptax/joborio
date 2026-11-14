<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employers') && ! Schema::hasColumn('employers', 'prepaid_balance_usd')) {
            Schema::table('employers', function (Blueprint $table) {
                $table->decimal('prepaid_balance_usd', 12, 4)->default(0)->after('billing_completed_at');
            });
        }

        if (! Schema::hasTable('employer_payment_orders')) {
            Schema::create('employer_payment_orders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employer_id')->constrained('employers')->cascadeOnDelete();
                $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
                $table->string('provider', 32)->default('razorpay');
                $table->string('purpose', 32)->default('wallet'); // wallet | program_budget
                $table->string('currency', 8)->default('INR');
                $table->unsignedBigInteger('amount_paise');
                $table->decimal('amount_usd', 12, 4);
                $table->decimal('fx_rate', 12, 6)->default(83);
                $table->string('razorpay_order_id')->nullable()->unique();
                $table->string('razorpay_payment_id')->nullable()->unique();
                $table->string('razorpay_signature')->nullable();
                $table->string('status', 24)->default('created'); // created|paid|failed
                $table->timestamp('credited_at')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index(['employer_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('employer_payment_orders');
        if (Schema::hasTable('employers') && Schema::hasColumn('employers', 'prepaid_balance_usd')) {
            Schema::table('employers', function (Blueprint $table) {
                $table->dropColumn('prepaid_balance_usd');
            });
        }
    }
};
