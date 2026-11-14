<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$service = app(App\Services\Syndication\JobrapidoFeedService::class);
$service->clearCache();
$data = $service->loadFeed();
echo json_encode([
    'count' => count($data['jobs']),
    'source' => $data['source'],
], JSON_PRETTY_PRINT);
