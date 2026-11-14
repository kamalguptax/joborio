<?php

namespace App\Services\Programs;

use App\Models\Program;

class ProgramBudgetService
{
    public function canSpend(Program $program, float $amount): bool
    {
        if (! in_array($program->status, ['active'], true)) {
            return false;
        }

        return $program->budgetRemaining() >= $amount;
    }

    public function recordSpend(Program $program, float $grossAmount): void
    {
        $program->refresh();
        $newSpent = (float) $program->budget_spent_usd + $grossAmount;
        $program->update(['budget_spent_usd' => $newSpent]);

        if ($newSpent >= (float) $program->budget_total_usd) {
            $program->update(['status' => 'budget_exhausted']);
            $program->listing?->update(['status' => 'budget_exhausted']);
        }
    }

    /** Add prepaid funds to a campaign budget (Razorpay top-up). */
    public function creditBudget(Program $program, float $amountUsd): void
    {
        if ($amountUsd <= 0) {
            return;
        }

        $program->refresh();
        $newTotal = round((float) $program->budget_total_usd + $amountUsd, 4);
        $payload = ['budget_total_usd' => $newTotal];

        if (in_array($program->status, ['budget_exhausted', 'paused'], true)
            && $newTotal > (float) $program->budget_spent_usd) {
            $payload['status'] = 'active';
            $program->listing?->update(['status' => 'active']);
        }

        $program->update($payload);
    }
}
