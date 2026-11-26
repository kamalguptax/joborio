<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employers', function (Blueprint $table) {
            if (! Schema::hasColumn('employers', 'notification_preferences')) {
                $table->json('notification_preferences')->nullable()->after('job_preferences');
            }
            if (! Schema::hasColumn('employers', 'portal_settings')) {
                $table->json('portal_settings')->nullable()->after('notification_preferences');
            }
            if (! Schema::hasColumn('employers', 'phone')) {
                $table->string('phone', 40)->nullable()->after('business_email');
            }
            if (! Schema::hasColumn('employers', 'primary_contact')) {
                $table->string('primary_contact', 120)->nullable()->after('phone');
            }
        });

        Schema::create('employer_content_complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code', 32)->unique();
            $table->string('campaign_ref', 64)->nullable();
            $table->string('platform', 64);
            $table->string('post_url', 2000);
            $table->string('category', 120);
            $table->text('description');
            $table->date('seen_on')->nullable();
            $table->string('status', 40)->default('open');
            $table->string('outcome', 255)->nullable();
            $table->json('timeline')->nullable();
            $table->timestamps();
            $table->index(['employer_id', 'status']);
        });

        Schema::create('employer_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120)->nullable();
            $table->string('email');
            $table->string('role', 64)->default('Campaign Manager');
            $table->string('status', 32)->default('invited');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('invited_at')->nullable();
            $table->timestamps();
            $table->unique(['employer_id', 'email']);
        });

        Schema::create('employer_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('file_name');
            $table->string('asset_type', 64)->default('other');
            $table->string('version', 16)->default('v1');
            $table->string('status', 32)->default('in_review');
            $table->string('storage_path', 500)->nullable();
            $table->timestamps();
            $table->index(['employer_id', 'status']);
        });

        Schema::create('employer_support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            $table->string('code', 32)->unique();
            $table->string('subject');
            $table->string('category', 64);
            $table->string('priority', 32)->default('normal');
            $table->string('status', 40)->default('open');
            $table->text('description');
            $table->timestamps();
            $table->index(['employer_id', 'status']);
        });

        Schema::create('employer_support_ticket_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_support_ticket_id')->constrained()->cascadeOnDelete();
            $table->string('message');
            $table->string('actor', 64)->default('brand');
            $table->timestamps();
        });

        Schema::create('employer_api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120)->default('Default');
            $table->string('key_prefix', 32);
            $table->string('key_hash', 128);
            $table->string('status', 32)->default('active');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->index(['employer_id', 'status']);
        });

        Schema::create('employer_ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code', 32)->unique();
            $table->string('entry_type', 64);
            $table->decimal('debit_usd', 12, 4)->default(0);
            $table->decimal('credit_usd', 12, 4)->default(0);
            $table->string('reference', 120)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->index(['employer_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employer_ledger_entries');
        Schema::dropIfExists('employer_api_keys');
        Schema::dropIfExists('employer_support_ticket_events');
        Schema::dropIfExists('employer_support_tickets');
        Schema::dropIfExists('employer_assets');
        Schema::dropIfExists('employer_team_members');
        Schema::dropIfExists('employer_content_complaints');

        Schema::table('employers', function (Blueprint $table) {
            foreach (['notification_preferences', 'portal_settings', 'phone', 'primary_contact'] as $col) {
                if (Schema::hasColumn('employers', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
