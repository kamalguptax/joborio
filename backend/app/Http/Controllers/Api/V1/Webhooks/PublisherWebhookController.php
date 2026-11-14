<?php

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Models\PublisherApiCredential;
use App\Models\PublisherWebhookEvent;
use App\Services\Publishers\MemberActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Inbound partner webhook for publishers.
 * Persists events idempotently. When member + activity type are present,
 * records activity counts without storing financial fields.
 */
class PublisherWebhookController extends Controller
{
    use ApiResponse;

    public function __construct(private MemberActivityService $activity) {}

    public function receive(Request $request, string $publisherCode): JsonResponse
    {
        $publisher = Publisher::query()->where('code', $publisherCode)->first();
        if (! $publisher) {
            return $this->error('NOT_FOUND', 'Publisher not found.', 404);
        }

        $secretHeader = (string) ($request->header('X-Joborio-Webhook-Secret')
            ?? $request->header('X-Webhook-Secret')
            ?? '');

        $credential = PublisherApiCredential::query()
            ->where('publisher_id', $publisher->id)
            ->where('is_active', true)
            ->whereNull('revoked_at')
            ->latest('id')
            ->get()
            ->first(fn (PublisherApiCredential $c) => $secretHeader !== '' && $c->matchesWebhookSecret($secretHeader));

        if (! $credential) {
            return $this->error('UNAUTHORIZED', 'Invalid webhook secret.', 401);
        }

        $payload = $request->all();
        $eventType = (string) ($payload['event_type'] ?? $payload['type'] ?? 'unknown');
        $externalId = isset($payload['event_id'])
            ? (string) $payload['event_id']
            : (isset($payload['id']) ? (string) $payload['id'] : null);

        if ($externalId) {
            $existing = PublisherWebhookEvent::query()
                ->where('publisher_id', $publisher->id)
                ->where('external_event_id', $externalId)
                ->first();

            if ($existing) {
                return $this->success([
                    'duplicate' => true,
                    'event' => [
                        'id' => $existing->id,
                        'status' => $existing->status,
                        'external_event_id' => $existing->external_event_id,
                    ],
                ]);
            }
        }

        $event = DB::transaction(function () use ($publisher, $eventType, $externalId, $payload, $credential) {
            $credential->forceFill(['last_used_at' => now()])->save();

            // Strip financial keys from stored webhook payload copy used for activity meta later.
            return PublisherWebhookEvent::create([
                'publisher_id' => $publisher->id,
                'direction' => 'inbound',
                'event_type' => substr($eventType, 0, 64),
                'external_event_id' => $externalId,
                'status' => 'received',
                'http_status' => 200,
                'payload' => $payload,
                'processed_at' => null,
            ]);
        });

        $activity = $this->activity->ingestWebhook($publisher, $event);

        return $this->success([
            'duplicate' => false,
            'event' => [
                'id' => $event->id,
                'status' => $event->fresh()->status,
                'external_event_id' => $event->external_event_id,
            ],
            'activity_recorded' => $activity !== null,
            'tracking_id' => $activity?->tracking_id,
        ], 201);
    }
}
