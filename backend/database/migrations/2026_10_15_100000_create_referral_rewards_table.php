<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            $table->timestamp('referral_first_bonus_paid_at')->nullable()->after('referred_by_creator_id');
            $table->timestamp('referral_override_ends_at')->nullable()->after('referral_first_bonus_paid_at');
        });

        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_creator_id')->constrained('creators')->cascadeOnDelete();
            $table->foreignId('referred_creator_id')->constrained('creators')->cascadeOnDelete();
            $table->string('kind', 16);
            $table->foreignId('source_earning_ledger_id')->nullable()->constrained('earning_ledgers')->nullOnDelete();
            $table->foreignId('earning_ledger_id')->nullable()->constrained('earning_ledgers')->nullOnDelete();
            $table->decimal('amount_usd', 12, 4);
            $table->timestamps();

            $table->unique(['source_earning_ledger_id', 'kind'], 'referral_override_per_source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_rewards');

        Schema::table('creators', function (Blueprint $table) {
            $table->dropColumn(['referral_first_bonus_paid_at', 'referral_override_ends_at']);
        });
    }
};
