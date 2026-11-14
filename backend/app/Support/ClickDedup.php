<?php

namespace App\Support;

use App\Models\AttributionEvent;
use Illuminate\Support\Carbon;

class ClickDedup
{
    public static function jobKey(?string $referenceId, ?string $url = null): string
    {
        $reference = self::normalize((string) $referenceId);
        if ($reference !== '') {
            return $reference;
        }

        return self::normalize((string) $url);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public static function fromMeta(array $meta): string
    {
        return self::jobKey(
            isset($meta['reference_id']) ? (string) $meta['reference_id'] : (isset($meta['job_key']) ? (string) $meta['job_key'] : null),
            isset($meta['destination']) ? (string) $meta['destination'] : null,
        );
    }

    public static function original(int $creatorId, string $ip, string $jobKey, Carbon $since): ?AttributionEvent
    {
        if ($jobKey === '' || $ip === '') {
            return null;
        }

        $events = AttributionEvent::query()
            ->where('creator_id', $creatorId)
            ->where('ip_address', $ip)
            ->whereIn('event_type', ['click', 'job_view', 'job_apply'])
            ->where('created_at', '>=', $since)
            ->orderBy('id')
            ->get(['id', 'meta', 'fraud_status']);

        foreach ($events as $event) {
            if ($event->fraud_status === 'dedup') {
                continue;
            }
            if (self::fromMeta($event->meta ?? []) === $jobKey) {
                return $event;
            }
        }

        return null;
    }

    /**
     * @return array{verified: int, duplicates: int}
     */
    public static function tally(int $creatorId, ?Carbon $since = null): array
    {
        $query = AttributionEvent::query()
            ->where('creator_id', $creatorId)
            ->whereIn('event_type', ['click', 'job_view', 'job_apply'])
            ->orderBy('id');

        if ($since) {
            $query->where('created_at', '>=', $since);
        }

        $seen = [];
        $verified = 0;
        $duplicates = 0;

        foreach ($query->get(['id', 'event_type', 'ip_address', 'is_counted', 'fraud_status', 'meta']) as $event) {
            $jobKey = self::fromMeta($event->meta ?? []);
            $bucket = $jobKey.'|'.(string) $event->ip_address;
            $repeat = $event->fraud_status === 'dedup'
                || ($jobKey !== '' && isset($seen[$bucket]));

            if ($repeat) {
                $duplicates++;
                continue;
            }

            if ($jobKey !== '') {
                $seen[$bucket] = true;
            }

            if ($event->is_counted || $event->event_type === 'job_view') {
                $verified++;
            }
        }

        return [
            'verified' => $verified,
            'duplicates' => $duplicates,
        ];
    }

    private static function normalize(string $value): string
    {
        $value = strtolower(trim($value));
        if ($value === '') {
            return '';
        }

        if (preg_match('/(\d{2,}_\d{2,})/', $value, $match) === 1) {
            return $match[1];
        }

        $parts = parse_url($value);
        if (is_array($parts) && ! empty($parts['host'])) {
            return strtolower($parts['host'].($parts['path'] ?? ''));
        }

        $colon = strrpos($value, ':');
        if ($colon !== false) {
            return substr($value, $colon + 1);
        }

        return $value;
    }
}
