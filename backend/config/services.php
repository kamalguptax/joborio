<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', env('APP_URL').'/api/v1/auth/google/callback'),
    ],

    'linkedin-openid' => [
        'client_id' => env('LINKEDIN_CLIENT_ID'),
        'client_secret' => env('LINKEDIN_CLIENT_SECRET'),
        'redirect' => env('LINKEDIN_REDIRECT_URI', env('APP_URL').'/api/v1/auth/linkedin/callback'),
    ],

    'razorpay' => [
        'key_id' => env('RAZORPAY_KEY_ID'),
        'key_secret' => env('RAZORPAY_KEY_SECRET'),
        'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET'),
        // Used to convert USD campaign budgets into INR paise for Checkout
        'usd_inr_rate' => (float) env('RAZORPAY_USD_INR_RATE', env('JOBORIO_USD_INR_RATE', 83)),
    ],

    // Meta Marketing API (system token + ad account) — campaigns created PAUSED
    'meta_ads' => [
        'access_token' => env('META_ADS_ACCESS_TOKEN'),
        'ad_account_id' => env('META_AD_ACCOUNT_ID'),
        'api_version' => env('META_ADS_API_VERSION', 'v21.0'),
    ],

    // LinkedIn Marketing API — campaigns created PAUSED
    'linkedin_ads' => [
        'access_token' => env('LINKEDIN_ADS_ACCESS_TOKEN'),
        'ad_account_id' => env('LINKEDIN_AD_ACCOUNT_ID'),
        'api_version' => env('LINKEDIN_ADS_API_VERSION', '202411'),
    ],

    // Site-wide AI assistant. Any OpenAI-compatible /chat/completions endpoint works.
    // Default is Google Gemini's free tier (key from https://aistudio.google.com/apikey).
    // Without a key the bot still answers from its built-in knowledge base (no cost).
    'chatbot' => [
        'enabled' => (bool) env('CHATBOT_ENABLED', true),
        'base_url' => env('CHATBOT_API_URL', 'https://generativelanguage.googleapis.com/v1beta/openai'),
        'api_key' => env('CHATBOT_API_KEY'),
        'model' => env('CHATBOT_MODEL', 'gemini-2.5-flash-lite'),
        'max_tokens' => (int) env('CHATBOT_MAX_TOKENS', 400),
        // Keeps usage inside the free quota; extra questions fall back to the built-in answers.
        'daily_limit_per_ip' => (int) env('CHATBOT_DAILY_LIMIT_PER_IP', 40),
        'daily_limit_global' => (int) env('CHATBOT_DAILY_LIMIT_GLOBAL', 400),
    ],

    // Cloudflare Turnstile (https://dash.cloudflare.com → Turnstile)
    // After changing these in .env on the server: php artisan config:clear && php artisan config:cache
    'turnstile' => [
        'site_key' => trim((string) env('TURNSTILE_SITE_KEY', env('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')), " \t\"'"),
        'secret_key' => trim((string) env('TURNSTILE_SECRET_KEY', ''), " \t\"'"),
    ],

];
