<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Niche extends Model
{
    protected $fillable = ['code', 'name', 'group_name', 'sort_order'];

    public function creators(): BelongsToMany
    {
        return $this->belongsToMany(Creator::class, 'creator_niche');
    }
}
