<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Creator;
use App\Models\User;
use App\Services\Auth\PasswordChangeOtpService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Account settings shared by creators, brands and publishers:
 * name / username, profile photo, cover banner and password (with email OTP).
 */
class AccountController extends Controller
{
    use ApiResponse;

    private const DISK = 'public';

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'username' => ['sometimes', 'nullable', 'string', 'min:3', 'max:30', 'regex:/^[a-z0-9_]+$/'],
        ], [
            'username.regex' => 'Username can only use a–z, 0–9 and _.',
        ]);

        $user->name = trim($data['name']);
        $user->save();

        // Only creators have a public @username (their handle).
        $username = isset($data['username']) ? Str::lower(trim($data['username'])) : '';
        $creator = $user->creator;
        if ($username !== '' && $creator && $username !== $creator->handle) {
            $taken = Creator::query()
                ->where('handle', $username)
                ->where('id', '!=', $creator->id)
                ->exists();
            if ($taken) {
                throw ValidationException::withMessages([
                    'username' => ['That username is already taken.'],
                ]);
            }
            $creator->handle = $username;
            $creator->save();
        }

        return $this->success([
            'user' => $this->presentUser($user),
            'message' => 'Profile updated.',
        ]);
    }

    public function requestPasswordOtp(Request $request, PasswordChangeOtpService $otp): JsonResponse
    {
        $result = $otp->issue($request->user());

        if (! $result['sent']) {
            return $this->error('OTP_NOT_SENT', 'We could not email the code. Please try again shortly.', 503);
        }

        $payload = [
            'message' => 'We sent a 6-digit code to your email.',
            'otp_sent' => true,
        ];
        if ($result['debug_otp'] !== null) {
            $payload['debug_otp'] = $result['debug_otp'];
        }

        return $this->success($payload);
    }

    public function updatePassword(Request $request, PasswordChangeOtpService $otp): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'otp' => ['required', 'string', 'size:6'],
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            return $this->error('INVALID_PASSWORD', 'Current password is incorrect.', 422);
        }

        if (Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['New password must be different from the current one.'],
            ]);
        }

        $otp->assertValid($user, $data['otp']);

        $user->password = Hash::make($data['password']);
        $user->save();

        // Sign out every other device after a password change.
        $currentId = $user->currentAccessToken()?->id;
        $user->tokens()->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))->delete();

        return $this->success(['message' => 'Password updated. Other sessions were signed out.']);
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'photo.max' => 'Photo must be 2 MB or smaller.',
            'photo.image' => 'Choose an image file (JPG, PNG or WebP).',
            'photo.mimes' => 'Choose an image file (JPG, PNG or WebP).',
        ]);

        $user = $request->user();
        $this->replaceImage($user, 'avatar_path', 'avatars', $request->file('photo'));
        $user = $user->fresh();

        return $this->success([
            'avatar_url' => $user->avatar_url,
            'user' => $this->presentUser($user),
        ]);
    }

    public function removePhoto(Request $request): JsonResponse
    {
        $this->clearImage($request->user(), 'avatar_path');

        return $this->success(['message' => 'Profile photo removed.']);
    }

    public function uploadCover(Request $request): JsonResponse
    {
        $request->validate([
            'cover' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
        ], [
            'cover.max' => 'Cover banner must be 3 MB or smaller.',
            'cover.image' => 'Choose an image file (JPG, PNG or WebP).',
            'cover.mimes' => 'Choose an image file (JPG, PNG or WebP).',
        ]);

        $user = $request->user();
        $this->replaceImage($user, 'cover_path', 'covers', $request->file('cover'));
        $user = $user->fresh();

        return $this->success([
            'cover_url' => $user->cover_url,
            'user' => $this->presentUser($user),
        ]);
    }

    public function removeCover(Request $request): JsonResponse
    {
        $this->clearImage($request->user(), 'cover_path');

        return $this->success(['message' => 'Cover banner removed.']);
    }

    /** Stores the new file first, then swaps the column and deletes the old file. */
    private function replaceImage(User $user, string $column, string $folder, UploadedFile $file): void
    {
        $path = Storage::disk(self::DISK)->putFile($folder.'/'.$user->id, $file);
        if (! is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'file' => ['Could not save the image. Please try again.'],
            ]);
        }

        $old = (string) $user->getRawOriginal($column);
        $user->forceFill([$column => $path])->save();

        if ($old !== '' && $old !== $path) {
            Storage::disk(self::DISK)->delete($old);
        }
    }

    private function clearImage(User $user, string $column): void
    {
        $old = (string) $user->getRawOriginal($column);
        $user->forceFill([$column => null])->save();

        if ($old !== '') {
            Storage::disk(self::DISK)->delete($old);
        }
    }

    private function presentUser(User $user): User
    {
        return $user->fresh()->load('creator.niches', 'employer', 'roles', 'publisherUsers.publisher');
    }
}
