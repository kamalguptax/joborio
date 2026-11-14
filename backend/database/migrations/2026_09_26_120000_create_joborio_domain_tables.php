<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->boolean('is_active')->default(true)->after('password');
        });

        Schema::create('niches', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('creators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('handle')->unique();
            $table->text('bio')->nullable();
            $table->string('profile_photo_path')->nullable();
            $table->string('accent_color', 7)->default('#2563eb');
            $table->json('social_links')->nullable();
            $table->json('audience_countries')->nullable();
            $table->unsignedInteger('audience_size_estimate')->nullable();
            $table->string('trust_tier', 16)->default('nano');
            $table->string('referral_code', 32)->unique();
            $table->foreignId('referred_by_creator_id')->nullable()->constrained('creators')->nullOnDelete();
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->string('payout_method', 32)->nullable();
            $table->timestamps();
        });

        Schema::create('creator_niche', function (Blueprint $table) {
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('niche_id')->constrained()->cascadeOnDelete();
            $table->primary(['creator_id', 'niche_id']);
        });

        Schema::create('listings', function (Blueprint $table) {
            $table->id();
            $table->string('type', 16)->default('job');
            $table->string('external_id')->nullable()->index();
            $table->string('title');
            $table->string('company_name')->nullable();
            $table->string('location_label')->nullable();
            $table->string('country_code', 2)->nullable()->index();
            $table->boolean('is_remote')->default(false);
            $table->string('category')->nullable();
            $table->string('experience_level')->nullable();
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->text('description')->nullable();
            $table->string('destination_url');
            $table->string('source', 32)->default('manual');
            $table->string('status', 24)->default('active');
            $table->decimal('ppc_rate_usd', 10, 4)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('creator_listing', function (Blueprint $table) {
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_hidden')->default(false);
            $table->primary(['creator_id', 'listing_id']);
        });

        Schema::create('tracking_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('listing_id')->constrained()->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->timestamps();
        });

        Schema::create('attribution_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tracking_token_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('listing_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_type', 32);
            $table->string('ip_address', 45)->nullable();
            $table->string('device_fingerprint', 64)->nullable();
            $table->string('geo_country', 2)->nullable();
            $table->string('referrer')->nullable();
            $table->boolean('is_counted')->default(false);
            $table->string('fraud_status', 24)->default('clean');
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->index(['creator_id', 'event_type', 'created_at']);
            $table->index(['device_fingerprint', 'created_at']);
        });

        Schema::create('earning_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attribution_event_id')->nullable()->constrained()->nullOnDelete();
            $table->string('earning_type', 16)->default('ppc');
            $table->decimal('gross_usd', 12, 4);
            $table->decimal('platform_fee_usd', 12, 4);
            $table->decimal('net_usd', 12, 4);
            $table->string('state', 24)->default('pending');
            $table->timestamp('hold_until')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['creator_id', 'state']);
        });

        Schema::create('fraud_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribution_event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->string('reason');
            $table->string('status', 24)->default('open');
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payout_batches', function (Blueprint $table) {
            $table->id();
            $table->string('status', 24)->default('draft');
            $table->decimal('total_usd', 12, 2)->default(0);
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payout_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payout_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount_usd', 12, 2);
            $table->string('method', 32)->nullable();
            $table->string('status', 24)->default('pending');
            $table->string('external_reference')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_lines');
        Schema::dropIfExists('payout_batches');
        Schema::dropIfExists('fraud_reviews');
        Schema::dropIfExists('earning_ledgers');
        Schema::dropIfExists('attribution_events');
        Schema::dropIfExists('tracking_tokens');
        Schema::dropIfExists('creator_listing');
        Schema::dropIfExists('listings');
        Schema::dropIfExists('creator_niche');
        Schema::dropIfExists('creators');
        Schema::dropIfExists('niches');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'is_active']);
        });
    }
};
