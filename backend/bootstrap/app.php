<?php

use App\Http\Middleware\EnsureApiCors;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'tracking.cors' => \App\Http\Middleware\TrackingCors::class,
        ]);
        $middleware->trustProxies(at: '*');
        $middleware->prepend(EnsureApiCors::class);
        $middleware->appendToGroup('api', \App\Http\Middleware\ResolveGeoCountry::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (Request $request) {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            $errors = $e->errors();
            $first = collect($errors)->flatten()->first();
            $message = is_string($first) && $first !== ''
                ? $first
                : ($e->getMessage() ?: 'Validation failed.');

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => $message,
                    'details' => $errors,
                ],
                'meta' => ['request_id' => (string) Str::uuid()],
            ], $e->status);
        });

        $exceptions->respond(function ($response, $exception, Request $request) {
            return app(EnsureApiCors::class)->withCors($request, $response);
        });
    })->create();
