<?php

namespace App\Services\Disputes;

use App\Models\AttributionDispute;
use App\Models\PpaApplication;
use App\Models\Program;
use App\Models\User;
use App\Services\Notifications\UserNotificationService;
use Illuminate\Support\Facades\DB;

class AttributionDisputeService
{
    public function __construct(private UserNotificationService $notifications) {}

    public function openForPpaApplication(
        PpaApplication $application,
        Program $program,
        User $employerUser,
        string $reason,
    ): AttributionDispute {
        if ((int) $application->program_id !== (int) $program->id) {
            abort(404);
        }

        if ($application->status !== 'confirmed') {
            abort(422, 'Only confirmed applications can be disputed.');
        }

        $existing = AttributionDispute::query()
            ->where('ppa_application_id', $application->id)
            ->where('status', 'open')
            ->exists();

        if ($existing) {
            abort(422, 'A dispute is already open for this application.');
        }

        return DB::transaction(function () use ($application, $program, $employerUser, $reason) {
            $dispute = AttributionDispute::create([
                'creator_id' => $application->creator_id,
                'opened_by_user_id' => $employerUser->id,
                'attribution_event_id' => $application->attribution_event_id,
                'ppa_application_id' => $application->id,
                'reason' => $reason,
                'status' => 'open',
            ]);

            $application->update(['status' => 'disputed']);

            $creator = $application->creator;
            if ($creator) {
                $this->notifications->notifyCreatorUser(
                    $creator,
                    'dispute_opened',
                    'Attribution disputed',
                    'An employer disputed application #'.$application->id.'. Admin will review.',
                    ['dispute_id' => $dispute->id, 'application_id' => $application->id],
                );
            }

            $this->evaluateEmployerDisputeRate($program);
            $this->evaluateCreatorDisputeRate($application->creator_id);

            return $dispute->fresh(['creator', 'opener']);
        });
    }

    private function evaluateEmployerDisputeRate(Program $program): void
    {
        $threshold = (float) config('joborio.disputes.employer_pause_rate', 0.20);
        $windowDays = (int) config('joborio.disputes.rate_window_days', 90);

        $total = PpaApplication::query()
            ->where('program_id', $program->id)
            ->where('created_at', '>=', now()->subDays($windowDays))
            ->whereIn('status', ['confirmed', 'disputed', 'rejected'])
            ->count();

        if ($total < 5) {
            return;
        }

        $disputed = PpaApplication::query()
            ->where('program_id', $program->id)
            ->where('created_at', '>=', now()->subDays($windowDays))
            ->where('status', 'disputed')
            ->count();

        if ($disputed / $total > $threshold && $program->status === 'active') {
            $program->update(['status' => 'paused']);
        }
    }

    private function evaluateCreatorDisputeRate(int $creatorId): void
    {
        $threshold = (float) config('joborio.disputes.creator_review_rate', 0.15);
        $windowDays = (int) config('joborio.disputes.rate_window_days', 90);

        $total = PpaApplication::query()
            ->where('creator_id', $creatorId)
            ->where('created_at', '>=', now()->subDays($windowDays))
            ->whereIn('status', ['confirmed', 'disputed'])
            ->count();

        if ($total < 10) {
            return;
        }

        $disputed = PpaApplication::query()
            ->where('creator_id', $creatorId)
            ->where('created_at', '>=', now()->subDays($windowDays))
            ->where('status', 'disputed')
            ->count();

        if ($disputed / $total <= $threshold) {
            return;
        }

        $creator = \App\Models\Creator::find($creatorId);
        if (! $creator?->user) {
            return;
        }

        $this->notifications->notify(
            $creator->user,
            'trust_review',
            'Trust tier under review',
            'Your disputed application rate triggered a trust review. Payouts may be held until cleared.',
            ['creator_id' => $creatorId],
        );
    }
}
