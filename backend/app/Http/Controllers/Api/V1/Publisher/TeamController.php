<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\PublisherUser;
use App\Models\User;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class TeamController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;

        // Managers may see the owner + themselves for assignment labels;
        // only owners see the full roster for inviting.
        $query = PublisherUser::query()
            ->where('publisher_id', $publisher->id)
            ->where('is_active', true)
            ->with('user:id,name,email');

        if (! $membership->isOwner()) {
            $query->where(function ($q) use ($request) {
                $q->where('role', 'owner')->orWhere('user_id', $request->user()->id);
            });
        }

        $team = $query->orderByRaw("CASE role WHEN 'owner' THEN 0 ELSE 1 END")
            ->get()
            ->map(fn (PublisherUser $pu) => [
                'id' => $pu->id,
                'user_id' => $pu->user_id,
                'role' => $pu->role,
                'name' => $pu->user?->name,
                'email' => $pu->user?->email,
            ]);

        return $this->success([
            'team' => $team,
            'membership_role' => $membership->role,
            'can_invite_managers' => $membership->isOwner(),
        ]);
    }

    public function inviteManager(Request $request): JsonResponse
    {
        PublisherAccess::assertOwner($request->user(), 'Only the publisher owner can invite managers.');
        $publisher = PublisherAccess::publisher($request->user());

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['required', 'string', 'max:120'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $email = strtolower(trim($data['email']));
        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            $password = $data['password'] ?? Str::password(12);
            $user = User::create([
                'name' => $data['name'],
                'email' => $email,
                'password' => Hash::make($password),
                'is_active' => true,
            ]);
        }

        if (Role::query()->where('name', 'publisher')->where('guard_name', 'web')->exists()
            && ! $user->hasRole('publisher')) {
            $user->assignRole('publisher');
        }

        $existing = PublisherUser::query()
            ->where('publisher_id', $publisher->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing && $existing->role === 'owner') {
            return $this->error('INVALID_ROLE', 'This user is already the publisher owner.', 422);
        }

        $row = PublisherUser::query()->updateOrCreate(
            [
                'publisher_id' => $publisher->id,
                'user_id' => $user->id,
            ],
            [
                'role' => 'manager',
                'is_active' => true,
            ],
        );

        return $this->success([
            'member' => [
                'id' => $row->id,
                'user_id' => $user->id,
                'role' => $row->role,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'message' => 'Manager added. Assign them to communities from the Communities page.',
            'temporary_password_set' => ! array_key_exists('password', $data) || empty($data['password']),
        ], 201);
    }
}
