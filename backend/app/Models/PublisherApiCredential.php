<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublisherApiCredential extends Model
{
    protected $fillable = [
        'publisher_id',
        'name',
        'key_prefix',
        'key_hash',
        'webhook_secret_prefix',
        'webhook_secret_hash',
        'outbound_webhook_url',
        'is_active',
        'last_used_at',
        'revoked_at',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    /**
     * @return array{api_key: string, key_prefix: string, key_hash: string}
     */
    public static function generateApiKey(): array
    {
        $raw = 'jo_pub_'.Str::lower(Str::random(40));
        $prefix = substr($raw, 0, 12);

        return [
            'api_key' => $raw,
            'key_prefix' => $prefix,
            'key_hash' => Hash::make($raw),
        ];
    }

    /**
     * @return array{webhook_secret: string, webhook_secret_prefix: string, webhook_secret_hash: string}
     */
    public static function generateWebhookSecret(): array
    {
        $raw = 'whsec_'.Str::lower(Str::random(32));
        $prefix = substr($raw, 0, 10);

        return [
            'webhook_secret' => $raw,
            'webhook_secret_prefix' => $prefix,
            'webhook_secret_hash' => Hash::make($raw),
        ];
    }

    public function matchesApiKey(string $plain): bool
    {
        return Hash::check($plain, $this->key_hash);
    }

    public function matchesWebhookSecret(string $plain): bool
    {
        if (! $this->webhook_secret_hash) {
            return false;
        }

        return Hash::check($plain, $this->webhook_secret_hash);
    }

    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'key_prefix' => $this->key_prefix,
            'webhook_secret_prefix' => $this->webhook_secret_prefix,
            'outbound_webhook_url' => $this->outbound_webhook_url,
            'is_active' => $this->is_active,
            'last_used_at' => optional($this->last_used_at)?->toIso8601String(),
            'revoked_at' => optional($this->revoked_at)?->toIso8601String(),
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }
}
