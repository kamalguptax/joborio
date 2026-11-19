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

    public const LEAD_TYPES = ['application', 'signup', 'form_fill', 'call'];

    public const LEAD_TYPE_LABELS = [
        'application' => 'Application',
        'signup' => 'Signup',
        'form_fill' => 'Form Fill',
        'call' => 'Call',
    ];

    public const REQUIRED_FIELD_OPTIONS = [
        'name',
        'email',
        'phone',
        'resume',
        'city',
        'experience',
        'linkedin',
    ];

    public static function label(string $type): string
    {
        return self::LABELS[$type] ?? ucfirst($type);
    }

    public static function isValid(?string $type): bool
    {
        return in_array((string) $type, self::IDS, true);
    }

    public static function isValidLeadType(?string $type): bool
    {
        return in_array((string) $type, self::LEAD_TYPES, true);
    }
}
