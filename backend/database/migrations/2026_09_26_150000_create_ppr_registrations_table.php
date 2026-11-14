<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->decimal('ppr_rate_usd', 10, 4)->nullable()->after('ppc_rate_usd');
        });

        Schema::create('ppr_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tracking_token_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('status', 32)->default('pending_verification');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('verification_token', 64)->nullable();
            $table->foreignId('attribution_event_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('earning_ledger_id')->nullable()->constrained('earning_ledgers')->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['listing_id', 'email']);
            $table->index(['creator_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppr_registrations');
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn('ppr_rate_usd');
        });
    }
};
