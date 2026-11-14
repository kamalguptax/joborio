<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publisher_campaign_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->foreignId('community_id')->nullable()->constrained('publisher_communities')->nullOnDelete();
            $table->foreignId('program_id')->constrained('programs')->cascadeOnDelete();
            $table->string('status', 20)->default('active'); // active | paused | ended
            $table->string('pricing_model', 16)->nullable();
            $table->decimal('accepted_rate_usd', 10, 4)->nullable();
            $table->unsignedInteger('rate_version')->default(1);
            $table->timestamp('accepted_at')->nullable();
            $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['publisher_id', 'community_id', 'program_id'], 'pub_comm_program_unique');
            $table->index(['publisher_id', 'status']);
            $table->index(['program_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publisher_campaign_assignments');
    }
};
