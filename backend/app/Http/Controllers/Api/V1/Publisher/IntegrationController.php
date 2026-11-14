<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Models\PublisherApiCredential;
use App\Models\PublisherCommunity;
use App\Models\PublisherInvitation;
use App\Models\PublisherWebhookEvent;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IntegrationController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $credentials = PublisherApiCredential::query()
            ->where('publisher_id', $publisher->id)
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (PublisherApiCredential $c) => $c->toPublicArray());

        $events = PublisherWebhookEvent::query()
            ->where('publisher_id', $publisher->id)
            ->latest('id')
            ->limit(25)
            ->get()
            ->map(fn (PublisherWebhookEvent $e) => [
                'id' => $e->id,
                'direction' => $e->direction,
                'event_type' => $e->event_type,
                'external_event_id' => $e->external_event_id,
                'status' => $e->status,
                'http_status' => $e->http_status,
                'error_message' => $e->error_message,
                'processed_at' => optional($e->processed_at)?->toIso8601String(),
                'created_at' => optional($e->created_at)?->toIso8601String(),
            ]);

        $appUrl = rtrim((string) config('app.url'), '/');

        return $this->success([
            'integration_preference' => $publisher->integration_preference,
            'modes' => Publisher::INTEGRATIONS,
            'inbound_webhook_url' => $appUrl.'/api/v1/webhooks/publisher/'.$publisher->code,
            'xml_feed_hint' => $appUrl.'/api/v1/publisher/xml/'.$publisher->code,
            'credentials' => $credentials,
            'webhook_events' => $events,
            'note' => 'API keys and webhook secrets are shown only once at creation/rotation. Hashes are stored; secrets are never returned in ordinary responses.',
        ]);
    }

    public function updatePreference(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $data = $request->validate([
            'integration_preference' => ['required', 'string', Rule::in(Publisher::INTEGRATIONS)],
        ]);

        $publisher->integration_preference = $data['integration_preference'];
        $publisher->save();

        return $this->success([
            'integration_preference' => $publisher->integration_preference,
        ]);
    }

    public function createCredential(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'outbound_webhook_url' => ['nullable', 'url', 'max:500'],
        ]);

        $key = PublisherApiCredential::generateApiKey();
        $secret = PublisherApiCredential::generateWebhookSecret();

        $cred = PublisherApiCredential::create([
            'publisher_id' => $publisher->id,
            'name' => $data['name'] ?? 'Default',
            'key_prefix' => $key['key_prefix'],
            'key_hash' => $key['key_hash'],
            'webhook_secret_prefix' => $secret['webhook_secret_prefix'],
            'webhook_secret_hash' => $secret['webhook_secret_hash'],
            'outbound_webhook_url' => $data['outbound_webhook_url'] ?? null,
            'is_active' => true,
            'created_by_user_id' => $request->user()->id,
        ]);

        return $this->success([
            'credential' => $cred->toPublicArray(),
            'secrets' => [
                'api_key' => $key['api_key'],
                'webhook_secret' => $secret['webhook_secret'],
            ],
            'warning' => 'Copy these secrets now. They will not be shown again.',
        ], 201);
    }

    public function rotateCredential(Request $request, int $credential): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $cred = PublisherApiCredential::query()
            ->where('publisher_id', $publisher->id)
            ->where('id', $credential)
            ->where('is_active', true)
            ->first();

        if (! $cred) {
            return $this->error('NOT_FOUND', 'Credential not found.', 404);
        }

        $key = PublisherApiCredential::generateApiKey();
        $secret = PublisherApiCredential::generateWebhookSecret();

        $cred->fill([
            'key_prefix' => $key['key_prefix'],
            'key_hash' => $key['key_hash'],
            'webhook_secret_prefix' => $secret['webhook_secret_prefix'],
            'webhook_secret_hash' => $secret['webhook_secret_hash'],
        ])->save();

        return $this->success([
            'credential' => $cred->fresh()->toPublicArray(),
            'secrets' => [
                'api_key' => $key['api_key'],
                'webhook_secret' => $secret['webhook_secret'],
            ],
            'warning' => 'Copy these secrets now. They will not be shown again.',
        ]);
    }

    public function updateCredential(Request $request, int $credential): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $cred = PublisherApiCredential::query()
            ->where('publisher_id', $publisher->id)
            ->where('id', $credential)
            ->first();

        if (! $cred) {
            return $this->error('NOT_FOUND', 'Credential not found.', 404);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'outbound_webhook_url' => ['nullable', 'url', 'max:500'],
        ]);

        $cred->fill($data)->save();

        return $this->success(['credential' => $cred->toPublicArray()]);
    }

    public function revokeCredential(Request $request, int $credential): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $cred = PublisherApiCredential::query()
            ->where('publisher_id', $publisher->id)
            ->where('id', $credential)
            ->first();

        if (! $cred) {
            return $this->error('NOT_FOUND', 'Credential not found.', 404);
        }

        $cred->is_active = false;
        $cred->revoked_at = now();
        $cred->save();

        return $this->success(['credential' => $cred->toPublicArray()]);
    }

    /**
     * API member creation — creates a pending invite (channel=api) for the email.
     */
    public function createMemberInvite(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'community_id' => ['nullable', 'integer'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ]);

        $communityId = null;
        if (! empty($data['community_id'])) {
            PublisherAccess::assertCanAccessCommunity($request->user(), (int) $data['community_id']);
            $communityId = (int) $data['community_id'];
        }

        $email = strtolower(trim($data['email']));
        $duplicate = PublisherInvitation::query()
            ->where('publisher_id', $publisher->id)
            ->where('email', $email)
            ->where('status', 'pending')
            ->where(function ($q) use ($communityId) {
                if ($communityId) {
                    $q->where('community_id', $communityId);
                } else {
                    $q->whereNull('community_id');
                }
            })
            ->exists();

        if ($duplicate) {
            return $this->error('DUPLICATE_INVITE', 'A pending invite already exists for this email.', 422);
        }

        $days = (int) ($data['expires_in_days'] ?? 14);
        $invite = PublisherInvitation::create([
            'publisher_id' => $publisher->id,
            'community_id' => $communityId,
            'token' => PublisherInvitation::makeToken(),
            'email' => $email,
            'channel' => 'api',
            'status' => 'pending',
            'created_by_user_id' => $request->user()->id,
            'expires_at' => now()->addDays($days),
        ]);
        $invite->load('community:id,code,name', 'publisher:id,code');

        $frontend = rtrim((string) config('joborio.frontend_url', 'https://joborio.com'), '/');

        return $this->success([
            'invitation' => [
                'id' => $invite->id,
                'email' => $invite->email,
                'channel' => $invite->channel,
                'status' => $invite->status,
                'expires_at' => optional($invite->expires_at)?->toIso8601String(),
                'path' => $invite->invitePath(),
            ],
            'invite_url' => $frontend.$invite->invitePath(),
        ], 201);
    }
}
