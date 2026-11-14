<?php

namespace App\Support;

use Illuminate\Http\Request;

class ClickContext
{
    public static function ip(Request $request): string
    {
        $candidates = [
            $request->headers->get('CF-Connecting-IP'),
            $request->headers->get('X-Real-IP'),
        ];

        $forwarded = $request->headers->get('X-Forwarded-For');
        if (is_string($forwarded) && $forwarded !== '') {
            $candidates[] = trim(explode(',', $forwarded)[0]);
        }

        $candidates[] = $request->ip();

        foreach ($candidates as $ip) {
            $ip = trim((string) $ip);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }

        return '0.0.0.0';
    }

    public static function clickedAt(): string
    {
        return now()->toIso8601String();
    }
}
