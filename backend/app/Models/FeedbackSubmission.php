<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackSubmission extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'rating',
        'message',
        'name',
        'email',
        'page_url',
        'ip_address',
        'user_agent',
        'status',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
