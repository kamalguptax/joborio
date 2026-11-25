<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\CaptchaService;
use App\Services\Publishers\InvitationAcceptService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class JoinInvitationController extends Controller
{
    use ApiResponse;

    public function show(Request $request, InvitationAcceptService $accepts): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:64'],
        ]);

        $invite = $accepts->findUsable($data['token']);

        return $this->success([
            'invitation' => [
                'token' => $invite->token,
                'channel' => $invite->channel,
                'email' => $invite->email,
                'expires_at' => optional($invite->expires_at)?->toIso8601String(),
                'publisher' => [
                    'code' => $invite->publisher?->code,
                    'name' => $invite->publisher?->display_name,
                    'username' => $invite->publisher?->username,
                ],
                'community' => $invite->community ? [
                    'code' => $invite->community->code,
                    'name' => $invite->community->name,
                ] : null,
            ],
        ]);
    }

    /**
     * Guest or authenticated accept. Creates a private network-member user when needed
     * (never a public Creator profile).
     */
    public function accept(
        Request $request,
        InvitationAcceptService $accepts,
        CaptchaService $captcha,
    ): JsonResponse {
        $user = Auth::guard('sanctum')->user();

        if (! $user) {
            $data = $request->validate([
                'token' => ['required', 'string', 'max:64'],
                'name' => ['required', 'string', 'max:120'],
                'email' => ['required', 'email', 'max:255'],
                'password' => ['required', 'confirmed', Password::defaults()],
                'captcha_id' => ['required', 'string'],
                'captcha_answer' => ['required', 'string'],
            ]);
            $captcha->assertValid($data['captcha_id'], $data['captcha_answer']);

            $invite = $accepts->findUsable($data['token']);
            $email = strtolower(trim($data['email']));
            if ($invite->email && strcasecmp((string) $invite->email, $email) !== 0) {
                throw ValidationException::withMessages([
                    'email' => ['Use the invited email address for this link.'],
                ]);
            }

            $existing = User::query()->where('email', $email)->first();
            if ($existing) {
                throw ValidationException::withMessages([
                    'email' => ['An account already exists for this email. Log in, then open the invite link again.'],
                ]);
            }

            $user = User::create([
                'name' => trim($data['name']),
                'email' => $email,
                'password' => Hash::make($data['password']),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        } else {
            $data = $request->validate([
                'token' => ['required', 'string', 'max:64'],
            ]);
        }

        $result = $accepts->accept($user, $data['token']);
        $member = $result['member'];
        $invite = $result['invitation'];
        $token = $user->createToken('network')->plainTextToken;

        $communityName = $invite->community?->name;
        if ($result['already_in_community'] && $communityName) {
            $message = "You are already a member of {$communityName}.";
        } elseif ($result['added_community'] && $result['is_returning_member'] && $communityName) {
            $message = "You joined {$communityName}. You can belong to multiple communities under this publisher.";
        } elseif ($communityName) {
            $message = "You joined {$communityName} in this publisher network.";
        } else {
            $message = 'You joined the publisher network.';
        }

        return $this->success([
            'message' => $message,
            'token' => $token,
            'user' => $user->load('roles'),
            'member' => [
                'id' => $member->id,
                'status' => $member->status,
                'publisher' => [
                    'code' => $member->publisher?->code,
                    'name' => $member->publisher?->display_name,
                ],
                'communities' => $member->communityMemberships
                    ->filter(fn ($cm) => $cm->community)
                    ->map(fn ($cm) => [
                        'id' => $cm->community->id,
                        'code' => $cm->community->code,
                        'name' => $cm->community->name,
                        'status' => $cm->status,
                        'joined_at' => optional($cm->joined_at)?->toIso8601String(),
                    ])
                    ->values()
                    ->all(),
            ],
            'join' => [
                'added_community' => $result['added_community'],
                'already_in_community' => $result['already_in_community'],
                'is_returning_member' => $result['is_returning_member'],
                'communities_count' => $result['communities_count'],
                'community' => $invite->community ? [
                    'code' => $invite->community->code,
                    'name' => $invite->community->name,
                ] : null,
            ],
            // Returning members skip onboarding and land on the dashboard.
            'redirect' => $result['is_returning_member']
                ? '/network/dashboard'
                : '/network/onboarding',
        ]);
    }
}
