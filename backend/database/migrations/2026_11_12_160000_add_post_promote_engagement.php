<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            if (! Schema::hasColumn('programs', 'post_url')) {
                $table->string('post_url', 2000)->nullable()->after('description');
            }
            if (! Schema::hasColumn('programs', 'engagement_actions')) {
                $table->json('engagement_actions')->nullable()->after('post_url');
            }
            if (! Schema::hasColumn('programs', 'engage_brief')) {
                $table->text('engage_brief')->nullable()->after('engagement_actions');
            }
        });

        Schema::create('post_promote_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained()->cascadeOnDelete();
            $table->json('actions_done')->nullable(); // like, comment, repost
            $table->string('proof_url', 2000)->nullable();
            $table->text('proof_note')->nullable();
            $table->string('status', 24)->default('pending'); // pending|approved|rejected
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['program_id', 'creator_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_promote_submissions');
        Schema::table('programs', function (Blueprint $table) {
            foreach (['post_url', 'engagement_actions', 'engage_brief'] as $col) {
                if (Schema::hasColumn('programs', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
