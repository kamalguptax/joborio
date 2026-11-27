<?php

namespace App\Services\Auth;

use App\Models\NetworkMember;
use App\Models\User;

/**
 * Role-specific login pages (/creator/login, /brand/login, /publisher/login)
 * only accept their own account type. The frontend sends `login_as`, and this
 * guard decides, before any token is issued, whether the account may sign in
 * there. The universal /login page sends no `login_as` and accepts everyone.
 */
class LoginRoleGuard
{
    public const CREATOR = 'creator';

    public const EMPLOYER = 'employer';

    public const PUBLISHER = 'publisher';

    public const ROLES = [self::CREATOR, self::EMPLOYER, self::PUBLISHER];

    /** Frontend login page + readable name of each account type. */
    private const INFO = [
        self::CREATOR => ['label' => 'Creator', 'login_path' => '/creator/login'],
        self::EMPLOYER => ['label' => 'Brand', 'login_path' => '/brand/login'],
        self::PUBLISHER => ['label' => 'Publisher', 'login_path' => '/publisher/login'],
    ];

    public static function normalize(?string $role): ?string
    {
        $role = strtolower(trim((string) $role));

        return in_array($role, self::ROLES, true) ? $role : null;
    }

    /**
     * Account types the user has: any of admin, publisher, network_member,
     * employer, creator.
     *
     * @return list<string>
     */
    public function accountTypes(User $user): array
    {
        $types = [];

        if ($user->hasRole('admin')) {
            $types[] = 'admin';
        }

        if ($user->hasRole('publisher')
            || $user->publisherUsers()->where('is_active', true)->exists()) {
            $types[] = self::PUBLISHER;
        }

        if ($user->hasRole('network_member')
            || NetworkMember::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists()) {
            $types[] = 'network_member';
        }

        if ($user->hasRole('employer')) {
            $types[] = self::EMPLOYER;
        }

        if ($user->creator()->exists()) {
            $types[] = self::CREATOR;
        }

        return $types;
    }

    public function allows(User $user, string $role): bool
    {
        $types = $this->accountTypes($user);

        // A brand-new account with no type yet becomes a creator on first login
        // (existing behaviour), so the creator login accepts it.
        if ($types === [] && $role === self::CREATOR) {
            return true;
        }

        return in_array($role, $types, true);
    }

    /** Message + the login page the user should have used. */
    public function mismatch(User $user, string $role): array
    {
        $types = $this->accountTypes($user);
        $names = array_map(fn (string $t) => match ($t) {
            'admin' => 'Admin',
            'network_member' => 'Network Member',
            default => self::INFO[$t]['label'],
        }, $types);

        $useLoginPath = match (true) {
            in_array('admin', $types, true) => '/login',
            in_array(self::PUBLISHER, $types, true) => self::INFO[self::PUBLISHER]['login_path'],
            in_array('network_member', $types, true) => '/login',
            in_array(self::EMPLOYER, $types, true) && ! in_array(self::CREATOR, $types, true) => self::INFO[self::EMPLOYER]['login_path'],
            in_array(self::CREATOR, $types, true) => self::INFO[self::CREATOR]['login_path'],
            in_array(self::EMPLOYER, $types, true) => self::INFO[self::EMPLOYER]['login_path'],
            default => '/login',
        };

        $have = $names === [] ? 'different' : implode(' / ', $names);

        return [
            'message' => sprintf(
                'This email is registered as a %s account, not a %s account.',
                $have,
                self::INFO[$role]['label'],
            ),
            'details' => [
                'login_as' => $role,
                'account_types' => $types,
                'use_login_path' => $useLoginPath,
            ],
        ];
    }
}
