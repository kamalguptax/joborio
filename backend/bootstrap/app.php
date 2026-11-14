<?php

use App\Http\Middleware\EnsureApiCors;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

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
        $exceptions->respond(function ($response, $exception, Request $request) {
            return app(EnsureApiCors::class)->withCors($request, $response);
        });
    })->create();
