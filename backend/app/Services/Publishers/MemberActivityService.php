<?php

namespace App\Services\Publishers;

use App\Models\MemberActivityEvent;
use App\Models\NetworkMember;
use App\Models\Publisher;
use App\Models\PublisherWebhookEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MemberActivityService
{
    /**
     * Activity-only summary. Never includes rates, fees, payouts, or balances.
     *
     * @return array{
     *   clicks_total: int,
     *   clicks_valid: int,
     *   signups: int,
     *   applications: int,
     *   leads: int,
     *   conversions: int,
     *   actions_approved: int,
     *   actions_pending: int
     * }
     */
    public function summaryForMember(NetworkMember $member): array
    {
        $rows = MemberActivityEvent::query()
            ->where('network_member_id', $member->id)
            ->where('status', 'counted')
            ->select('activity_type', DB::raw('count(*) as total'))
            ->groupBy('activity_type')
            ->pluck('total', 'activity_type');

        $clicks = (int) ($rows['click'] ?? 0);
        $valid = (int) ($rows['click_valid'] ?? 0);

        return [
            'clicks_total' => $clicks + $valid,
            'clicks_valid' => $valid > 0 ? $valid : $clicks,
            'signups' => (int) ($rows['signup'] ?? 0),
            'applications' => (int) ($rows['application'] ?? 0),
            'leads' => (int) ($rows['lead'] ?? 0),
            'conversions' => (int) ($rows['conversion'] ?? 0),
            'actions_approved' => (int) ($rows['action_approved'] ?? 0),
            'actions_pending' => (int) ($rows['action_pending'] ?? 0),
        ];
    }

    /**
     * @param  array{
     *   activity_type: string,
     *   tracking_id?: string|null,
     *   external_event_id?: string|null,
     *   community_id?: int|null,
     *   campaign_assignment_id?: int|null,
     *   webhook_event_id?: int|null,
     *   meta?: array<string, mixed>|null,
     *   occurred_at?: mixed,
     *   status?: string
     * }  $payload
     */
    public function record(NetworkMember $member, array $payload): MemberActivityEvent
    {
        $type = (string) ($payload['activity_type'] ?? '');
        if (! in_array($type, MemberActivityEvent::TYPES, true)) {
            throw ValidationException::withMessages([
                'activity_type' => ['Unsupported activity type.'],
            ]);
        }

        $externalId = $payload['external_event_id'] ?? null;
        if ($externalId) {
            $existing = MemberActivityEvent::query()
                ->where('publisher_id', $member->publisher_id)
                ->where('external_event_id', $externalId)
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        $meta = $this->sanitizeMeta($payload['meta'] ?? null);

        return MemberActivityEvent::create([
            'publisher_id' => $member->publisher_id,
            'network_member_id' => $member->id,
            'community_id' => $payload['community_id'] ?? null,
            'campaign_assignment_id' => $payload['campaign_assignment_id'] ?? null,
            'activity_type' => $type,
            'status' => $payload['status'] ?? 'counted',
            'tracking_id' => $payload['tracking_id'] ?? null,
            'external_event_id' => $externalId,
            'webhook_event_id' => $payload['webhook_event_id'] ?? null,
            'meta' => $meta,
            'occurred_at' => $payload['occurred_at'] ?? now(),
        ]);
    }

    /**
     * Best-effort mapping from inbound partner webhook payloads.
     * Does not invent a partner contract — only records when member + activity type are present.
     * Financial keys in the payload are stripped and never stored on activity rows.
     */
    public function ingestWebhook(Publisher $publisher, PublisherWebhookEvent $webhook): ?MemberActivityEvent
    {
        $payload = is_array($webhook->payload) ? $webhook->payload : [];
        $type = $this->mapActivityType(
            (string) ($payload['activity_type'] ?? $payload['action'] ?? $webhook->event_type),
        );

        if (! $type) {
            $webhook->update([
                'status' => 'ignored',
                'processed_at' => now(),
                'error_message' => 'No mappable activity_type.',
            ]);

            return null;
        }

        $member = $this->resolveMember($publisher, $payload);
        if (! $member) {
            $webhook->update([
                'status' => 'ignored',
                'processed_at' => now(),
                'error_message' => 'Could not resolve network member.',
            ]);

            return null;
        }

        $trackingId = isset($payload['tracking_id'])
            ? (string) $payload['tracking_id']
            : (isset($payload['click_id']) ? (string) $payload['click_id'] : null);

        $event = $this->record($member, [
            'activity_type' => $type,
            'tracking_id' => $trackingId,
            'external_event_id' => $webhook->external_event_id,
            'webhook_event_id' => $webhook->id,
            'community_id' => $payload['community_id'] ?? null,
            'meta' => [
                'source' => 'webhook',
                'event_type' => $webhook->event_type,
            ],
            'status' => $type === 'action_rejected' ? 'rejected' : 'counted',
            'occurred_at' => $payload['occurred_at'] ?? now(),
        ]);

        $webhook->update([
            'status' => 'processed',
            'processed_at' => now(),
            'error_message' => null,
        ]);

        return $event;
    }

    private function resolveMember(Publisher $publisher, array $payload): ?NetworkMember
    {
        if (! empty($payload['network_member_id'])) {
            return NetworkMember::query()
                ->where('publisher_id', $publisher->id)
                ->where('id', (int) $payload['network_member_id'])
                ->first();
        }

        if (! empty($payload['member_email'])) {
            $email = strtolower(trim((string) $payload['member_email']));

            return NetworkMember::query()
                ->where('publisher_id', $publisher->id)
                ->whereHas('user', fn ($q) => $q->where('email', $email))
                ->first();
        }

        return null;
    }

    private function mapActivityType(string $raw): ?string
    {
        $key = strtolower(trim($raw));
        $key = str_replace(['.', '-', ' '], '_', $key);

        return match (true) {
            in_array($key, ['click', 'clicks', 'click_total'], true) => 'click',
            in_array($key, ['click_valid', 'valid_click', 'verified_click'], true) => 'click_valid',
            in_array($key, ['signup', 'sign_up', 'registration', 'ppr'], true) => 'signup',
            in_array($key, ['application', 'apply', 'job_apply', 'ppa'], true) => 'application',
            in_array($key, ['lead', 'leads'], true) => 'lead',
            in_array($key, ['conversion', 'convert', 'sale'], true) => 'conversion',
            in_array($key, ['action_approved', 'approved', 'action.confirmed', 'action_confirmed'], true) => 'action_approved',
            in_array($key, ['action_pending', 'pending'], true) => 'action_pending',
            in_array($key, ['action_rejected', 'rejected', 'reversed'], true) => 'action_rejected',
            default => in_array($key, MemberActivityEvent::TYPES, true) ? $key : null,
        };
    }

    /**
     * @param  array<string, mixed>|null  $meta
     * @return array<string, mixed>|null
     */
    private function sanitizeMeta(?array $meta): ?array
    {
        if ($meta === null) {
            return null;
        }

        $blocked = [
            'cpc', 'cpc_price', 'rate', 'rate_usd', 'accepted_rate_usd',
            'payout', 'partner_payout', 'commission', 'publisher_commission',
            'platform_fee', 'platform_fee_usd', 'fee', 'balance', 'withdrawal',
            'gross_usd', 'net_usd', 'amount', 'amount_usd', 'revenue',
        ];

        $clean = [];
        foreach ($meta as $k => $v) {
            $key = strtolower((string) $k);
            if (in_array($key, $blocked, true)) {
                continue;
            }
            if (is_array($v)) {
                $nested = $this->sanitizeMeta($v);
                if ($nested !== null && $nested !== []) {
                    $clean[$k] = $nested;
                }
                continue;
            }
            $clean[$k] = $v;
        }

        return $clean === [] ? null : $clean;
    }
}
