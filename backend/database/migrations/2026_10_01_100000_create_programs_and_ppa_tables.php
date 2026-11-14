<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('company_name');
            $table->string('website')->nullable();
            $table->string('country_code', 2)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('listing_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('pricing_model', 8)->default('ppc');
            $table->decimal('rate_usd', 10, 4);
            $table->decimal('budget_total_usd', 12, 2);
            $table->decimal('budget_spent_usd', 12, 2)->default(0);
            $table->string('status', 24)->default('draft');
            $table->json('target_niche_ids')->nullable();
            $table->json('target_countries')->nullable();
            $table->string('min_trust_tier', 16)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'employer_id']);
        });

        Schema::create('program_creator', function (Blueprint $table) {
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->timestamp('opted_in_at');
            $table->string('status', 16)->default('active');
            $table->primary(['program_id', 'creator_id']);
        });

        Schema::table('listings', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->after('source')->constrained()->nullOnDelete();
            $table->decimal('ppa_rate_usd', 10, 4)->nullable()->after('ppr_rate_usd');
        });

        Schema::create('ppa_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tracking_token_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('external_application_id')->nullable();
            $table->string('email')->nullable();
            $table->string('status', 32)->default('pending_employer');
            $table->foreignId('attribution_event_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('earning_ledger_id')->nullable()->constrained('earning_ledgers')->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamp('employer_confirmed_at')->nullable();
            $table->timestamps();
            $table->unique(['listing_id', 'external_application_id']);
            $table->index(['creator_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppa_applications');
        Schema::table('listings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('program_id');
            $table->dropColumn('ppa_rate_usd');
        });
        Schema::dropIfExists('program_creator');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('employers');
    }
};
