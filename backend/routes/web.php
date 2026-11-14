<?php

use App\Http\Controllers\TrackingRedirectController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['service' => 'JobOrio API', 'docs' => '/api/v1/health']);
});

Route::get('/r/{token}', TrackingRedirectController::class)->name('tracking.redirect');
