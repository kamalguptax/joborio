<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class TrackedWebsite extends Model
{
    protected $fillable = [
        'name',
        'domain',
        'public_key',
        'is_active',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (TrackedWebsite $site) {
            if (! $site->public_key) {
                $site->public_key = Str::lower(Str::random(32));
            }
            $site->domain = self::normalizeDomain($site->domain);
        });

        static::updating(function (TrackedWebsite $site) {
            if ($site->isDirty('domain')) {
                $site->domain = self::normalizeDomain($site->domain);
            }
        });
    }

    public static function normalizeDomain(string $domain): string
    {
        $domain = strtolower(trim($domain));
        $domain = preg_replace('#^https?://#', '', $domain) ?? $domain;
        $domain = explode('/', $domain)[0];

        return rtrim($domain, '/');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(WebsiteTrackingEvent::class);
    }
}
