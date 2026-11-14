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
        $token = $user->createToken('network')->plainTextToken;

        return $this->success([
            'message' => 'You joined the publisher network.',
            'token' => $token,
            'user' => $user->load('roles'),
            'member' => [
                'id' => $member->id,
                'status' => $member->status,
                'publisher' => [
                    'code' => $member->publisher?->code,
                    'name' => $member->publisher?->display_name,
                ],
            ],
            'redirect' => '/network/dashboard',
        ]);
    }
}
