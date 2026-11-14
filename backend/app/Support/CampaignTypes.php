<?php

namespace App\Support;

class CampaignTypes
{
    public const IDS = ['job', 'course', 'tool', 'branding', 'post_promote', 'other'];

    public const LABELS = [
        'job' => 'Jobs',
        'course' => 'Courses',
        'tool' => 'Tools',
        'branding' => 'Branding promotion',
        'post_promote' => 'Post promote (like / comment / repost)',
        'other' => 'Other',
    ];

    /** Engagement actions creators can perform on a source post. */
    public const ENGAGEMENT_ACTIONS = ['like', 'comment', 'repost'];

    public static function label(string $type): string
    {
        return self::LABELS[$type] ?? ucfirst($type);
    }

    public static function isValid(?string $type): bool
    {
        return in_array((string) $type, self::IDS, true);
    }
}
