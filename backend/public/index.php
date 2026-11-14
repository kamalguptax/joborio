<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$request = Request::capture();
$kernel = $app->make(Kernel::class);
$response = $kernel->handle($request);
joborio_apply_cors($request, $response);
$response->send();
$kernel->terminate($request, $response);

function joborio_apply_cors(Request $request, Symfony\Component\HttpFoundation\Response $response): void
{
    $origin = $request->headers->get('Origin');
    if (! is_string($origin) || ! joborio_origin_allowed($origin)) {
        return;
    }

    $response->headers->set('Access-Control-Allow-Origin', $origin);
    $response->headers->set('Vary', 'Origin');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    $response->headers->set(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, Accept, X-Requested-With, X-XSRF-TOKEN'
    );
    $response->headers->set('Access-Control-Max-Age', '86400');
}

function joborio_origin_allowed(string $origin): bool
{
    $host = parse_url($origin, PHP_URL_HOST);
    if (! is_string($host) || $host === '') {
        return false;
    }

    if (in_array($host, ['joborio.com', 'www.joborio.com', 'localhost', '127.0.0.1'], true)) {
        return true;
    }

    return str_ends_with($host, '.joborio.com')
        || $host === 'joborio.sevenapps.in'
        || str_ends_with($host, '.joborio.sevenapps.in');
}
