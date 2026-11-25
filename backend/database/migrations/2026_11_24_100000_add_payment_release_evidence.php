<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payout_batches', function (Blueprint $table) {
            $table->string('evidence_path', 500)->nullable()->after('processed_at');
            $table->string('evidence_original_name', 255)->nullable()->after('evidence_path');
            $table->string('evidence_mime', 120)->nullable()->after('evidence_original_name');
            $table->unsignedBigInteger('evidence_size')->nullable()->after('evidence_mime');
            $table->text('evidence_note')->nullable()->after('evidence_size');
            $table->timestamp('evidence_uploaded_at')->nullable()->after('evidence_note');
            $table->foreignId('released_by_user_id')->nullable()->after('evidence_uploaded_at')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('member_settlement_records', function (Blueprint $table) {
            $table->string('evidence_path', 500)->nullable()->after('notes');
            $table->string('evidence_original_name', 255)->nullable()->after('evidence_path');
            $table->string('evidence_mime', 120)->nullable()->after('evidence_original_name');
            $table->unsignedBigInteger('evidence_size')->nullable()->after('evidence_mime');
            $table->text('evidence_note')->nullable()->after('evidence_size');
            $table->timestamp('evidence_uploaded_at')->nullable()->after('evidence_note');
            $table->foreignId('settled_by_user_id')->nullable()->after('evidence_uploaded_at')
                ->constrained('users')->nullOnDelete();
        });

        Schema::table('publisher_ledger', function (Blueprint $table) {
            $table->string('evidence_path', 500)->nullable()->after('paid_at');
            $table->string('evidence_original_name', 255)->nullable()->after('evidence_path');
            $table->string('evidence_mime', 120)->nullable()->after('evidence_original_name');
            $table->unsignedBigInteger('evidence_size')->nullable()->after('evidence_mime');
            $table->text('evidence_note')->nullable()->after('evidence_size');
            $table->timestamp('evidence_uploaded_at')->nullable()->after('evidence_note');
            $table->foreignId('released_by_user_id')->nullable()->after('evidence_uploaded_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payout_batches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('released_by_user_id');
            $table->dropColumn([
                'evidence_path',
                'evidence_original_name',
                'evidence_mime',
                'evidence_size',
                'evidence_note',
                'evidence_uploaded_at',
            ]);
        });

        Schema::table('member_settlement_records', function (Blueprint $table) {
            $table->dropConstrainedForeignId('settled_by_user_id');
            $table->dropColumn([
                'evidence_path',
                'evidence_original_name',
                'evidence_mime',
                'evidence_size',
                'evidence_note',
                'evidence_uploaded_at',
            ]);
        });

        Schema::table('publisher_ledger', function (Blueprint $table) {
            $table->dropConstrainedForeignId('released_by_user_id');
            $table->dropColumn([
                'evidence_path',
                'evidence_original_name',
                'evidence_mime',
                'evidence_size',
                'evidence_note',
                'evidence_uploaded_at',
            ]);
        });
    }
};
