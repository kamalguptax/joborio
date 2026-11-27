<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'linkedin_id',
        'is_active',
        'public_code',
        'avatar_path',
        'cover_path',
    ];

    protected $appends = [
        'public_code',
        'avatar_url',
        'cover_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'avatar_path',
        'cover_path',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (User $user) {
            if (! Schema::hasColumn('users', 'public_code')) {
                return;
            }
            if ($user->getRawOriginal('public_code')) {
                return;
            }
            $user->forceFill([
                'public_code' => self::codeForId((int) $user->id),
            ])->saveQuietly();
        });
    }

    public static function codeForId(int $id): string
    {
        return 'VIG'.str_pad((string) $id, 3, '0', STR_PAD_LEFT);
    }

    public static function findByPublicCode(string $code): ?self
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return null;
        }

        if (Schema::hasColumn('users', 'public_code')) {
            $stored = self::query()->where('public_code', $code)->first();
            if ($stored) {
                return $stored;
            }
        }

        if (preg_match('/^VIG(\d+)$/', $code, $match) === 1) {
            return self::query()->find((int) $match[1]);
        }

        return null;
    }

    public function getPublicCodeAttribute(?string $value): string
    {
        $stored = trim((string) $value);
        if ($stored !== '') {
            return $stored;
        }

        return self::codeForId((int) $this->id);
    }

    /** Public URL of the profile photo (null when none was uploaded). */
    public function getAvatarUrlAttribute(): ?string
    {
        return self::storageUrl($this->attributes['avatar_path'] ?? null);
    }

    /** Public URL of the cover banner (null when none was uploaded). */
    public function getCoverUrlAttribute(): ?string
    {
        return self::storageUrl($this->attributes['cover_path'] ?? null);
    }

    private static function storageUrl(?string $path): ?string
    {
        $path = trim((string) $path);

        return $path === '' ? null : Storage::disk('public')->url($path);
    }

    public function creator(): HasOne
    {
        return $this->hasOne(Creator::class);
    }

    public function employer(): HasOne
    {
        return $this->hasOne(Employer::class);
    }

    public function publisherUsers(): HasMany
    {
        return $this->hasMany(PublisherUser::class);
    }

    public function publishers()
    {
        return $this->belongsToMany(Publisher::class, 'publisher_users')
            ->withPivot(['role', 'is_active'])
            ->withTimestamps();
    }
}
