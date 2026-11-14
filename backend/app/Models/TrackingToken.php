<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrackingToken extends Model
{
    protected $fillable = ['creator_id', 'listing_id', 'token'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Creator::class);
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(AttributionEvent::class);
    }
}
