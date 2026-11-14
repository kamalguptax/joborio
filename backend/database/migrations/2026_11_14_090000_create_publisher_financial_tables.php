<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publisher_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->decimal('commission_percent', 5, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('status', 20)->default('active'); // active | superseded
            $table->unsignedInteger('version')->default(1);
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['publisher_id', 'status']);
            $table->unique(['publisher_id', 'version']);
        });

        Schema::create('publisher_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->foreignId('community_id')->nullable()->constrained('publisher_communities')->nullOnDelete();
            $table->foreignId('campaign_assignment_id')->nullable()
                ->constrained('publisher_campaign_assignments')->nullOnDelete();
            $table->string('entry_type', 32); // credit | debit | reversal | adjustment
            $table->string('source', 40)->default('partner_confirmed'); // partner_confirmed | settlement | manual
            $table->string('state', 20)->default('pending'); // pending | approved | payable | paid | reversed
            $table->decimal('gross_usd', 12, 4)->default(0);
            $table->decimal('platform_fee_usd', 12, 4)->default(0);
            $table->decimal('net_usd', 12, 4)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('reference', 120)->nullable();
            $table->string('idempotency_key', 120)->nullable();
            $table->foreignId('reverses_ledger_id')->nullable()
                ->constrained('publisher_ledger')->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['publisher_id', 'state']);
            $table->index(['publisher_id', 'entry_type']);
            $table->unique(['publisher_id', 'idempotency_key']);
        });

        Schema::create('member_settlement_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->foreignId('network_member_id')->constrained('network_members')->cascadeOnDelete();
            $table->foreignId('community_id')->nullable()->constrained('publisher_communities')->nullOnDelete();
            $table->string('status', 20)->default('pending'); // pending | settled | cancelled
            $table->decimal('amount_usd', 12, 4)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('period_label', 64)->nullable();
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();
            $table->timestamp('settled_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['publisher_id', 'status']);
            $table->index(['network_member_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_settlement_records');
        Schema::dropIfExists('publisher_ledger');
        Schema::dropIfExists('publisher_commissions');
    }
};
