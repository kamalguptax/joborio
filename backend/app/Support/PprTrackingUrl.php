<?php

namespace App\Support;

/**
 * Append Upclift PPR attribution params to the employer destination URL.
 * Employer reads `joborio_token` (or legacy `token`) after registration and
 * posts it to POST /api/v1/webhooks/ppr.
 */
final class PprTrackingUrl
{
    public const QUERY_TOKEN = 'joborio_token';

    public static function append(string $url, string $token, ?string $subid = null): string
    {
        $token = trim($token);
        if ($url === '' || $token === '') {
            return $url;
        }

        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            $join = str_contains($url, '?') ? '&' : '?';
            $extra = self::QUERY_TOKEN.'='.rawurlencode($token);
            if ($subid !== null && trim($subid) !== '') {
                $extra .= '&subid='.rawurlencode(trim($subid));
            }

            return $url.$join.$extra;
        }

        $query = [];
        if (isset($parts['query'])) {
            parse_str($parts['query'], $query);
        }
        $query[self::QUERY_TOKEN] = $token;
        // Keep a short alias some employer scripts already use.
        $query['token'] = $token;
        if ($subid !== null && trim($subid) !== '') {
            $query['subid'] = trim($subid);
        }

        $rebuilt = $parts['scheme'].'://'.$parts['host']
            .(isset($parts['port']) ? ':'.$parts['port'] : '')
            .($parts['path'] ?? '/')
            .'?'.http_build_query($query);

        if (isset($parts['fragment']) && $parts['fragment'] !== '') {
            $rebuilt .= '#'.$parts['fragment'];
        }

        return $rebuilt;
    }
}
