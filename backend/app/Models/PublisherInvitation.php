<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PublisherInvitation extends Model
{
    protected $fillable = [
        'publisher_id',
        'community_id',
        'token',
        'email',
        'channel',
        'status',
        'created_by_user_id',
        'accepted_by_user_id',
        'expires_at',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(PublisherCommunity::class, 'community_id');
    }

    public static function makeToken(): string
    {
        return Str::random(48);
    }

    public function isUsable(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function invitePath(): string
    {
        $pub = rawurlencode((string) ($this->publisher?->code ?? 'PUB'));
        $com = rawurlencode((string) ($this->community?->code ?? 'ALL'));
        // Pretty /join/{pub}/{com}/ — Apache rewrites to /join/static/static/index.html
        // (see frontend/public/_hostinger.htaccess). Token alone is enough to load the invite.
        $q = http_build_query(['token' => $this->token]);

        return '/join/'.$pub.'/'.$com.'/?'.$q;
    }
}
