<?php

return [
    'platform_fee_percent' => (float) env('JOBORIO_PLATFORM_FEE_PERCENT', 25),
    'ppc_hold_days' => (int) env('JOBORIO_PPC_HOLD_DAYS', 5),
    'ppc_hold_days_micro' => (int) env('JOBORIO_PPC_HOLD_DAYS_MICRO', 3),
    'click_dedup_minutes' => (int) env('JOBORIO_CLICK_DEDUP_MINUTES', 10),
    'min_payout_usd' => (float) env('JOBORIO_MIN_PAYOUT_USD', 10),
    'default_ppc_rate_usd' => (float) env('JOBORIO_DEFAULT_PPC_RATE_USD', 0.03),
    'creator_link_base' => env('JOBORIO_CREATOR_LINK_BASE', 'https://brand.link'),
    'velocity_multiplier' => (float) env('JOBORIO_VELOCITY_MULTIPLIER', 5),

    'frontend_url' => env('FRONTEND_URL', 'https://joborio.com'),
    'oauth_callback_path' => env('JOBORIO_OAUTH_CALLBACK_PATH', '/auth/callback'),

    'listings_ingest_enabled' => (bool) env('JOBORIO_LISTINGS_INGEST_ENABLED', true),
    'listings_ingest_source' => env('JOBORIO_LISTINGS_INGEST_SOURCE', 'file'),
    'listings_ingest_file' => env('JOBORIO_LISTINGS_INGEST_FILE', database_path('data/listings-feed.json')),
    'listings_ingest_url' => env('JOBORIO_LISTINGS_INGEST_URL'),
    'listings_ingest_schedule_hours' => (int) env('JOBORIO_LISTINGS_INGEST_HOURS', 2),

    'jobrapido_feed_url' => env(
        'JOBORIO_JOBRAPIDO_FEED_URL',
        'https://storage.googleapis.com/jr-databox-syndication-public/syndication/aggregators/vigyapanam/jobrapido_Vigyapanam_IN.xml'
    ),
    'jobrapido_feed_cache_seconds' => (int) env('JOBORIO_JOBRAPIDO_FEED_CACHE_SECONDS', 900),
    'jobrapido_feed_cache_store' => env('JOBORIO_JOBRAPIDO_FEED_CACHE_STORE', 'file'),
    'jobrapido_feed_sample_path' => env(
        'JOBORIO_JOBRAPIDO_SAMPLE_PATH',
        storage_path('app/syndication/jobrapido_sample_IN.xml')
    ),
    'jobrapido_feed_use_sample_when_empty' => (bool) env('JOBORIO_JOBRAPIDO_USE_SAMPLE_WHEN_EMPTY', true),
    // Optional seed extras: "Name1,https://url1.xml|Name2,https://url2.xml"
    'syndication_feeds_extra' => env('JOBORIO_SYNDICATION_FEEDS_EXTRA', ''),

    'default_ppr_rate_usd' => (float) env('JOBORIO_DEFAULT_PPR_RATE_USD', 0.30),
    'ppr_webhook_secret' => env('JOBORIO_PPR_WEBHOOK_SECRET', 'dev-ppr-secret'),
    'ppr_verification_hours' => (int) env('JOBORIO_PPR_VERIFICATION_HOURS', 24),
    'ppr_hold_days' => (int) env('JOBORIO_PPR_HOLD_DAYS', 3),
    'ppr_allow_nano_tier' => (bool) env('JOBORIO_PPR_ALLOW_NANO', false),
    'ppr_max_per_creator_hour' => (int) env('JOBORIO_PPR_MAX_PER_HOUR', 20),
    'ppr_disposable_domains' => [
        'mailinator.com',
        'guerrillamail.com',
        'tempmail.com',
        '10minutemail.com',
    ],

    'default_ppa_rate_usd' => (float) env('JOBORIO_DEFAULT_PPA_RATE_USD', 5.00),
    'ppa_webhook_secret' => env('JOBORIO_PPA_WEBHOOK_SECRET', 'dev-ppa-secret'),
    'ppa_hold_days' => (int) env('JOBORIO_PPA_HOLD_DAYS', 7),
    'ppa_allow_below_mid' => (bool) env('JOBORIO_PPA_ALLOW_BELOW_MID', false),

    'auto_payout_enabled' => (bool) env('JOBORIO_AUTO_PAYOUT_ENABLED', true),
    'dev_geo_country' => env('JOBORIO_DEV_GEO_COUNTRY', 'IN'),

    'referral' => [
        'bonus_usd' => (float) env('JOBORIO_REFERRAL_BONUS_USD', 5),
        'bonus_threshold_approved_usd' => (float) env('JOBORIO_REFERRAL_BONUS_THRESHOLD_USD', 10),
        'override_percent' => (float) env('JOBORIO_REFERRAL_OVERRIDE_PERCENT', 3),
        'override_months' => (int) env('JOBORIO_REFERRAL_OVERRIDE_MONTHS', 2),
        'hold_days' => (int) env('JOBORIO_REFERRAL_HOLD_DAYS', 3),
    ],

    'ai_studio' => [
        'monthly_cap' => (int) env('JOBORIO_AI_STUDIO_MONTHLY_CAP', 5),
    ],

    'notifications' => [
        'email_enabled' => (bool) env('JOBORIO_NOTIFICATION_EMAIL_ENABLED', true),
        'email_skip_types' => [],
    ],

    'website_tracking' => [
        'pageview_dedup_minutes' => (int) env('JOBORIO_WEBTRACK_DEDUP_MINUTES', 2),
    ],

    'google_maps' => [
        'enabled' => (bool) env('JOBORIO_GOOGLE_MAPS_ENABLED', true),
        'api_key' => env('GOOGLE_MAPS_API_KEY', ''),
        'geolocation_tracking' => (bool) env('JOBORIO_GEOLOCATION_TRACKING', true),
    ],

    'employer_programs' => [
        // When true, new employer programs go live immediately (no admin approval gate).
        'auto_activate' => (bool) env('JOBORIO_EMPLOYER_PROGRAMS_AUTO_ACTIVATE', true),
    ],

    'disputes' => [
        'employer_pause_rate' => (float) env('JOBORIO_DISPUTE_EMPLOYER_PAUSE_RATE', 0.20),
        'creator_review_rate' => (float) env('JOBORIO_DISPUTE_CREATOR_REVIEW_RATE', 0.15),
        'rate_window_days' => (int) env('JOBORIO_DISPUTE_RATE_WINDOW_DAYS', 90),
    ],

    'trust_tier' => [
        'micro_clicks' => (int) env('JOBORIO_TRUST_MICRO_CLICKS', 1000),
        'micro_active_days' => (int) env('JOBORIO_TRUST_MICRO_ACTIVE_DAYS', 30),
        'mid_clicks' => (int) env('JOBORIO_TRUST_MID_CLICKS', 5000),
        'mid_active_days' => (int) env('JOBORIO_TRUST_MID_ACTIVE_DAYS', 60),
        'mid_max_invalid_rate' => (float) env('JOBORIO_TRUST_MID_MAX_INVALID_RATE', 0.05),
    ],
];
