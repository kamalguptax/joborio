<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Services\Creators\CreatorOnboardingService;
use App\Services\Earnings\EarningLedgerService;
use App\Support\ApiResponse;
use App\Support\ClickContext;
use App\Support\ClickDedup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JobActivityController extends Controller
{
    use ApiResponse;

    public function __construct(
        private EarningLedgerService $earnings,
        private CreatorOnboardingService $creators,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $creator = $this->creators->ensureForUser($request->user());

        $data = $request->validate([
            'reference_id' => ['required', 'string', 'max:120'],
            'action' => ['required', Rule::in(['view', 'apply'])],
            'title' => ['nullable', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
        ]);

        $eventType = $data['action'] === 'apply' ? 'job_apply' : 'click';
        $windowStart = now()->subMinutes((int) config('joborio.click_dedup_minutes', 10));

        if ($data['action'] === 'view') {
            $legacy = AttributionEvent::query()
                ->where('creator_id', $creator->id)
                ->where('event_type', 'job_view')
                ->where('meta->reference_id', $data['reference_id'])
                ->where('is_counted', false)
                ->latest('id')
                ->first();

            if ($legacy) {
                $legacy->update([
                    'event_type' => 'click',
                    'is_counted' => true,
                    'fraud_status' => 'clean',
                ]);
                $earning = $legacy->earning;
                if (! $earning) {
                    $earning = $this->earnings->createSyndicatedApplyEarning($creator, $legacy);
                }

                return $this->success([
                    'tracked' => true,
                    'event_id' => $legacy->id,
                    'earning_id' => $earning->id,
                ]);
            }
        }

        $ip = ClickContext::ip($request);
        $jobKey = ClickDedup::jobKey($data['reference_id']);
        $existing = ClickDedup::original($creator->id, $ip, $jobKey, $windowStart);

        if ($existing) {
            $duplicate = AttributionEvent::create([
                'creator_id' => $creator->id,
                'event_type' => 'click',
                'ip_address' => $ip,
                'referrer' => $request->headers->get('referer'),
                'is_counted' => false,
                'fraud_status' => 'dedup',
                'meta' => [
                    'reference_id' => $data['reference_id'],
                    'job_key' => $jobKey,
                    'title' => $data['title'] ?? null,
                    'company' => $data['company'] ?? null,
                    'duplicate_of_event_id' => $existing->id,
                    'clicked_at' => ClickContext::clickedAt(),
                    'user_agent' => $request->userAgent(),
                ],
            ]);

            return $this->success([
                'tracked' => false,
                'duplicate' => true,
                'event_id' => $duplicate->id,
                'earning_id' => null,
            ]);
        }

        $event = AttributionEvent::create([
            'creator_id' => $creator->id,
            'event_type' => $eventType,
            'ip_address' => ClickContext::ip($request),
            'referrer' => $request->headers->get('referer'),
            'is_counted' => true,
            'fraud_status' => 'clean',
            'meta' => [
                'reference_id' => $data['reference_id'],
                'job_key' => $jobKey,
                'title' => $data['title'] ?? null,
                'company' => $data['company'] ?? null,
                'clicked_at' => ClickContext::clickedAt(),
                'user_agent' => $request->userAgent(),
            ],
        ]);

        $clickAlreadyPaid = $data['action'] === 'apply' && AttributionEvent::query()
            ->where('creator_id', $creator->id)
            ->where('event_type', 'click')
            ->where('is_counted', true)
            ->where('meta->reference_id', $data['reference_id'])
            ->whereHas('earning')
            ->exists();

        $earning = $clickAlreadyPaid
            ? null
            : $this->earnings->createSyndicatedApplyEarning($creator, $event);

        return $this->success([
            'tracked' => true,
            'event_id' => $event->id,
            'earning_id' => $earning?->id,
        ]);
    }
}
