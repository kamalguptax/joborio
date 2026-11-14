<?php

namespace App\Services\Programs;

use App\Models\Creator;
use App\Models\PostPromoteSubmission;
use App\Models\Program;
use App\Services\Earnings\EarningLedgerService;
use App\Support\CampaignTypes;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PostPromoteService
{
    public function __construct(private EarningLedgerService $earnings) {}

    public function submit(Creator $creator, Program $program, array $data): PostPromoteSubmission
    {
        if (! $program->isPostPromote() || $program->status !== 'active') {
            throw ValidationException::withMessages([
                'program' => ['This is not an active post-promote campaign.'],
            ]);
        }

        $joined = $creator->programs()
            ->where('programs.id', $program->id)
            ->wherePivot('status', 'active')
            ->exists();
        if (! $joined) {
            throw ValidationException::withMessages([
                'program' => ['Opt in to this campaign before submitting engagement.'],
            ]);
        }

        $actions = array_values(array_intersect(
            CampaignTypes::ENGAGEMENT_ACTIONS,
            array_map('strtolower', $data['actions_done'] ?? []),
        ));
        $required = array_values(array_intersect(
            CampaignTypes::ENGAGEMENT_ACTIONS,
            array_map('strtolower', $program->engagement_actions ?? CampaignTypes::ENGAGEMENT_ACTIONS),
        ));
        if ($required !== [] && array_diff($required, $actions) !== []) {
            throw ValidationException::withMessages([
                'actions_done' => ['Complete all required actions: '.implode(', ', $required).'.'],
            ]);
        }

        return PostPromoteSubmission::query()->updateOrCreate(
            ['program_id' => $program->id, 'creator_id' => $creator->id],
            [
                'actions_done' => $actions,
                'proof_url' => $data['proof_url'] ?? null,
                'proof_note' => $data['proof_note'] ?? null,
                'status' => 'pending',
                'review_note' => null,
                'reviewed_at' => null,
            ],
        );
    }

    public function approve(Program $program, PostPromoteSubmission $submission, ?string $note = null): PostPromoteSubmission
    {
        if ((int) $submission->program_id !== (int) $program->id) {
            abort(404);
        }
        if ($submission->status === 'approved') {
            return $submission;
        }

        return DB::transaction(function () use ($program, $submission, $note) {
            $rate = (float) $program->rate_usd;
            $creator = Creator::query()->findOrFail($submission->creator_id);
            if ($rate > 0 && $program->budgetRemaining() >= $rate) {
                $this->earnings->createPpeEarning($creator, $rate);
                $program->increment('budget_spent_usd', $rate);
            }

            $submission->update([
                'status' => 'approved',
                'review_note' => $note,
                'reviewed_at' => now(),
            ]);

            return $submission->fresh();
        });
    }

    public function reject(Program $program, PostPromoteSubmission $submission, ?string $note = null): PostPromoteSubmission
    {
        if ((int) $submission->program_id !== (int) $program->id) {
            abort(404);
        }

        $submission->update([
            'status' => 'rejected',
            'review_note' => $note,
            'reviewed_at' => now(),
        ]);

        return $submission->fresh();
    }
}
