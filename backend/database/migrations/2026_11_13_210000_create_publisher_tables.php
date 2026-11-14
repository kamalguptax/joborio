<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publishers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('username', 64)->unique();
            $table->string('display_name');
            $table->string('country_code', 2);
            $table->string('network_type', 32);
            $table->string('social_url', 500);
            $table->string('website_url', 500);
            $table->string('integration_preference', 32)->default('dashboard');
            $table->json('niche_ids')->nullable();
            $table->json('job_preferences')->nullable();
            $table->string('status', 40)->default('submitted')->index();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('social_reviewed_at')->nullable();
            $table->timestamp('commercial_approved_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('publisher_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 32)->default('owner'); // owner | manager
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['publisher_id', 'user_id']);
            $table->index(['user_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publisher_users');
        Schema::dropIfExists('publishers');
    }
};
