<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class JobMaster extends Model
{
    public const TYPE_COUNTRY = 'country';

    public const TYPE_STATE = 'state';

    public const TYPE_CITY = 'city';

    public const TYPE_CATEGORY = 'category';

    public const TYPE_JOB_TYPE = 'job_type';

    public const TYPE_EXPERIENCE = 'experience';

    public const TYPE_EDUCATION = 'education';

    public const TYPE_COMPANY = 'company';

    public const TYPES = [
        self::TYPE_COUNTRY,
        self::TYPE_STATE,
        self::TYPE_CITY,
        self::TYPE_CATEGORY,
        self::TYPE_JOB_TYPE,
        self::TYPE_EXPERIENCE,
        self::TYPE_EDUCATION,
        self::TYPE_COMPANY,
    ];

    protected $fillable = [
        'type',
        'parent_id',
        'name',
        'slug',
        'code',
        'sort_order',
        'is_active',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'meta' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (JobMaster $master) {
            if ($master->slug === '') {
                $master->slug = Str::slug($master->name);
            }
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
