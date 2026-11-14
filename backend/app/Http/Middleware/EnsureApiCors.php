<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiCors
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->withCors($request, response('', 204));
        }

        return $this->withCors($request, $next($request));
    }

    public function withCors(Request $request, Response $response): Response
    {
        $origin = $request->headers->get('Origin');
        if (! is_string($origin) || ! $this->allowed($origin)) {
            return $response;
        }

        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Vary', 'Origin');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, X-Requested-With');
        $response->headers->set('Access-Control-Max-Age', '86400');

        return $response;
    }

    private function allowed(string $origin): bool
    {
        $host = parse_url($origin, PHP_URL_HOST);
        if (! is_string($host) || $host === '') {
            return false;
        }

        if (in_array($host, ['joborio.com', 'www.joborio.com', 'localhost', '127.0.0.1'], true)) {
            return true;
        }

        if (str_ends_with($host, '.joborio.com') || $host === 'joborio.sevenapps.in' || str_ends_with($host, '.joborio.sevenapps.in')) {
            return true;
        }

        $listed = config('cors.allowed_origins', []);
        if (is_array($listed) && in_array($origin, $listed, true)) {
            return true;
        }

        $patterns = config('cors.allowed_origins_patterns', []);
        if (is_array($patterns)) {
            foreach ($patterns as $pattern) {
                if (is_string($pattern) && $pattern !== '' && @preg_match($pattern, $origin)) {
                    return true;
                }
            }
        }

        return false;
    }
}
