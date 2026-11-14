<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveGeoCountry
{
    public function handle(Request $request, Closure $next): Response
    {
        $country = $request->header('CF-IPCountry')
            ?? $request->header('X-Geo-Country');

        if (! $country && app()->environment('local', 'testing')) {
            $fallback = config('joborio.dev_geo_country');
            if ($fallback) {
                $request->headers->set('X-Geo-Country', strtoupper(substr((string) $fallback, 0, 2)));
            }
        }

        return $next($request);
    }
}
