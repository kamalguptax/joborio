<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\EarningLedger;
use App\Services\Creators\CreatorOnboardingService;
use App\Services\Earnings\EarningLedgerService;
use App\Support\ApiResponse;
use App\Support\ClickContext;
use App\Support\ClickDedup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

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
            'category' => ['nullable', 'string', 'max:80'],
            'source' => ['nullable', 'string', 'max:80'],
        ]);

        $eventType = $data['action'] === 'apply' ? 'job_apply' : 'click';
        $windowStart = now()->subMinutes((int) config('joborio.click_dedup_minutes', 10));
        $source = $data['source'] ?? ($data['action'] === 'apply' ? 'creator_apply' : 'creator_view');
        $metaBase = [
            'reference_id' => $data['reference_id'],
            'title' => $data['title'] ?? null,
            'company' => $data['company'] ?? null,
            'category' => $data['category'] ?? null,
            'source' => $source,
            'clicked_at' => ClickContext::clickedAt(),
            'user_agent' => $request->userAgent(),
        ];

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
                    'meta' => array_merge(is_array($legacy->meta) ? $legacy->meta : [], $metaBase),
                ]);
                $earning = $legacy->earning ?: $this->safeEarning($creator, $legacy);

                return $this->success([
                    'tracked' => true,
                    'event_id' => $legacy->id,
                    'earning_id' => $earning?->id,
                ]);
            }
        }

        $ip = ClickContext::ip($request);
        $jobKey = ClickDedup::jobKey($data['reference_id']);
        $existing = ClickDedup::original($creator->id, $ip, $jobKey, $windowStart);

        if ($existing) {
            // Same job + IP inside the dedup window: keep the first click only.
            return $this->success([
                'tracked' => false,
                'duplicate' => true,
                'event_id' => $existing->id,
                'earning_id' => null,
            ]);
        }

        $event = AttributionEvent::create([
            'creator_id' => $creator->id,
            'event_type' => $eventType,
            'ip_address' => $ip,
            'referrer' => $request->headers->get('referer'),
            'is_counted' => true,
            'fraud_status' => 'clean',
            'meta' => array_merge($metaBase, [
                'job_key' => $jobKey,
            ]),
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
            : $this->safeEarning($creator, $event);

        return $this->success([
            'tracked' => true,
            'event_id' => $event->id,
            'earning_id' => $earning?->id,
        ]);
    }

    private function safeEarning(Creator $creator, AttributionEvent $event): ?EarningLedger
    {
        try {
            return $this->earnings->createSyndicatedApplyEarning($creator, $event);
        } catch (Throwable $e) {
            Log::warning('job_activity_earning_failed', [
                'creator_id' => $creator->id,
                'event_id' => $event->id,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
