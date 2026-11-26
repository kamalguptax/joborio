<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public const DEFAULTS = [
        'twofa' => true,
        'session_timeout' => true,
        'allow_data_export' => false,
        'recent_logins' => [],
    ];

    public function show(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $settings = array_merge(self::DEFAULTS, is_array($employer->portal_settings) ? $employer->portal_settings : []);

        if (($settings['recent_logins'] ?? []) === []) {
            $settings['recent_logins'] = [
                [
                    'text' => sprintf(
                        '%s, %s',
                        $request->userAgent() ? 'Current browser' : 'Unknown client',
                        now()->format('d M, H:i')
                    ),
                ],
            ];
        }

        return $this->success(['settings' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'twofa' => ['sometimes', 'boolean'],
            'session_timeout' => ['sometimes', 'boolean'],
            'allow_data_export' => ['sometimes', 'boolean'],
        ]);

        $current = array_merge(self::DEFAULTS, is_array($employer->portal_settings) ? $employer->portal_settings : []);
        $employer->portal_settings = array_merge($current, $data);
        $employer->save();

        return $this->success(['settings' => $employer->portal_settings]);
    }
}
