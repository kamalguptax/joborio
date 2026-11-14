<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            if (! Schema::hasColumn('creators', 'approval_status')) {
                $table->string('approval_status', 16)->default('pending')->after('onboarding_completed_at');
            }
            if (! Schema::hasColumn('creators', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approval_status');
            }
            if (! Schema::hasColumn('creators', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('creators', 'approval_status')) {
            DB::table('creators')
                ->whereNotNull('onboarding_completed_at')
                ->where(function ($q) {
                    $q->whereNull('approval_status')->orWhere('approval_status', 'pending');
                })
                ->update([
                    'approval_status' => 'approved',
                    'approved_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            if (Schema::hasColumn('creators', 'approved_by')) {
                $table->dropConstrainedForeignId('approved_by');
            }
            if (Schema::hasColumn('creators', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
            if (Schema::hasColumn('creators', 'approval_status')) {
                $table->dropColumn('approval_status');
            }
        });
    }
};
