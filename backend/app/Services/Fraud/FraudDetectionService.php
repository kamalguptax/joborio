<?php

namespace App\Services\Fraud;

use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\FraudReview;
use App\Services\Notifications\UserNotificationService;
use Illuminate\Support\Facades\Cache;

class FraudDetectionService
{
    public function __construct(private UserNotificationService $notifications) {}

    /**
     * @return array{block: bool, reason: string, queue_review: bool}
     */
    public function evaluateClick(Creator $creator, AttributionEvent $event): array
    {
        if ($this->isDatacenterIp($event->ip_address)) {
            return ['block' => true, 'reason' => 'datacenter_ip', 'queue_review' => true];
        }

        if ($this->exceedsVelocity($creator)) {
            return ['block' => true, 'reason' => 'velocity_spike', 'queue_review' => true];
        }

        return ['block' => false, 'reason' => 'clean', 'queue_review' => false];
    }

    /**
     * @return array{block: bool, reason: string, queue_review: bool}
     */
    public function evaluateRegistration(Creator $creator, AttributionEvent $event): array
    {
        if ($this->exceedsRegistrationVelocity($creator)) {
            return ['block' => true, 'reason' => 'ppr_velocity', 'queue_review' => true];
        }

        return ['block' => false, 'reason' => 'clean', 'queue_review' => false];
    }

    public function queueReview(AttributionEvent $event, string $reason): FraudReview
    {
        $review = FraudReview::create([
            'attribution_event_id' => $event->id,
            'creator_id' => $event->creator_id,
            'reason' => $reason,
            'status' => 'open',
        ]);

        $creator = $event->creator;
        if ($creator?->user) {
            $this->notifications->notify(
                $creator->user,
                'fraud_review',
                'Traffic under review',
                'Some activity was flagged for review ('.$reason.'). Earnings may be held until cleared.',
                ['fraud_review_id' => $review->id],
            );
        }

        return $review;
    }

    private function exceedsVelocity(Creator $creator): bool
    {
        $hourKey = "joborio:clicks:hour:{$creator->id}:".now()->format('YmdH');
        $count = (int) Cache::get($hourKey, 0);
        Cache::put($hourKey, $count + 1, now()->addHour());

        $avgKey = "joborio:clicks:avg7d:{$creator->id}";
        $avgHourly = (float) Cache::get($avgKey, 10);
        $multiplier = config('joborio.velocity_multiplier', 5);

        return $count > max(50, $avgHourly * $multiplier);
    }

    private function exceedsRegistrationVelocity(Creator $creator): bool
    {
        $hourKey = "joborio:ppr:hour:{$creator->id}:".now()->format('YmdH');
        $count = (int) Cache::get($hourKey, 0);
        Cache::put($hourKey, $count + 1, now()->addHour());

        $max = config('joborio.ppr_max_per_creator_hour', 20);

        return $count >= $max;
    }

    private function isDatacenterIp(?string $ip): bool
    {
        if (! $ip) {
            return false;
        }

        // Placeholder: extend with IP2Location LITE blocklist (Module E).
        return str_starts_with($ip, '10.') || str_starts_with($ip, '192.0.2.');
    }
}
