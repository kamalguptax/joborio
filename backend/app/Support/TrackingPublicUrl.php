<?php

namespace App\Support;

/**
 * Public share URLs for /r/{token} clicks.
 * Use the marketing domain (joborio.com), never the API host (api.joborio.com).
 */
final class TrackingPublicUrl
{
    public static function base(): string
    {
        $configured = (string) config(
            'joborio.tracking_public_url',
            config('joborio.frontend_url', 'https://joborio.com'),
        );

        return rtrim($configured !== '' ? $configured : 'https://joborio.com', '/');
    }

    public static function forToken(string $token): string
    {
        // /r/static/?t= works on Nginx/static hosts without a path rewrite.
        // Pretty /r/{token} also works when the host rewrites to /r/static/.
        return self::base().'/r/static/?t='.rawurlencode($token);
    }
}
