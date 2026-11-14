<?php

$fromList = array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))));
$frontend = trim((string) env('FRONTEND_URL', ''));
$defaults = [
    'https://joborio.com',
    'https://www.joborio.com',
    'https://joborio.sevenapps.in',
    'https://www.joborio.sevenapps.in',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];
$origins = array_values(array_unique(array_filter(array_merge(
    $defaults,
    $fromList,
    $frontend !== '' ? [$frontend] : [],
))));

return [
    'paths' => ['*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => array_values(array_filter(array_merge(
        [
            '#^https?://localhost(:\d+)?$#',
            '#^https?://127\.0\.0\.1(:\d+)?$#',
            '#^https://([a-z0-9-]+\.)?joborio\.com$#',
            '#^https://([a-z0-9-]+\.)?joborio\.sevenapps\.in$#',
        ],
        env('CORS_ALLOWED_ORIGIN_PATTERN') ? [env('CORS_ALLOWED_ORIGIN_PATTERN')] : [],
    ))),
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
