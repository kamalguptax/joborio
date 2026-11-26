<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public const DEFAULTS = [
        ['l' => 'Campaign approved / rejected', 'sev' => 'High', 'in_app' => true, 'email' => true, 'critical' => true],
        ['l' => 'Budget low (<15%)', 'sev' => 'High', 'in_app' => true, 'email' => true, 'critical' => true],
        ['l' => 'Tracking failures', 'sev' => 'High', 'in_app' => true, 'email' => true, 'critical' => false],
        ['l' => 'Lead pending approval', 'sev' => 'Medium', 'in_app' => true, 'email' => false, 'critical' => false],
        ['l' => 'Content complaint update', 'sev' => 'Medium', 'in_app' => true, 'email' => true, 'critical' => false],
        ['l' => 'Wallet top-up confirmed', 'sev' => 'Low', 'in_app' => true, 'email' => true, 'critical' => false],
        ['l' => 'Weekly performance digest', 'sev' => 'Low', 'in_app' => false, 'email' => true, 'critical' => false],
        ['l' => 'Team invite accepted', 'sev' => 'Low', 'in_app' => true, 'email' => false, 'critical' => false],
    ];

    public function show(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $prefs = $employer->notification_preferences;
        if (! is_array($prefs) || $prefs === []) {
            $prefs = self::DEFAULTS;
        }

        return $this->success(['preferences' => $prefs]);
    }

    public function update(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'preferences' => ['required', 'array', 'min:1'],
            'preferences.*.l' => ['required', 'string', 'max:120'],
            'preferences.*.sev' => ['required', 'string', 'max:32'],
            'preferences.*.in_app' => ['required', 'boolean'],
            'preferences.*.email' => ['required', 'boolean'],
            'preferences.*.critical' => ['sometimes', 'boolean'],
        ]);

        $employer->notification_preferences = $data['preferences'];
        $employer->save();

        return $this->success(['preferences' => $employer->notification_preferences]);
    }
}
