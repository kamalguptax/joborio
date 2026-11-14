<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publisher_communities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->string('code', 32);
            $table->string('name');
            $table->string('category', 120)->nullable();
            $table->text('description')->nullable();
            $table->string('country_code', 2)->nullable();
            $table->string('campaign_access', 32)->default('all_eligible'); // all_eligible | selected
            $table->foreignId('manager_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('active'); // active | paused
            $table->timestamps();

            $table->unique(['publisher_id', 'code']);
            $table->index(['publisher_id', 'status']);
        });

        Schema::create('network_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->string('status', 32)->default('active'); // invited | active | removed | released
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'publisher_id']);
            $table->index(['publisher_id', 'status']);
        });

        Schema::create('community_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained('publisher_communities')->cascadeOnDelete();
            $table->foreignId('network_member_id')->constrained('network_members')->cascadeOnDelete();
            $table->string('status', 20)->default('active');
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['community_id', 'network_member_id']);
        });

        Schema::create('publisher_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->foreignId('community_id')->nullable()->constrained('publisher_communities')->nullOnDelete();
            $table->string('token', 64)->unique();
            $table->string('email')->nullable();
            $table->string('channel', 20)->default('link'); // link | email | csv | api
            $table->string('status', 20)->default('pending'); // pending | accepted | expired | revoked
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('accepted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['publisher_id', 'status']);
            $table->index(['email', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publisher_invitations');
        Schema::dropIfExists('community_members');
        Schema::dropIfExists('network_members');
        Schema::dropIfExists('publisher_communities');
    }
};
