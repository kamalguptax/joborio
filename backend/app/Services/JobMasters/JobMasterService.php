<?php

namespace App\Services\JobMasters;

use App\Models\JobMaster;
use Illuminate\Support\Collection;

class JobMasterService
{
    /**
     * @return array<string, list<array<string, mixed>>>
     */
    public function publicFilters(): array
    {
        $rows = JobMaster::query()
            ->active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'type', 'parent_id', 'name', 'slug', 'code']);

        $grouped = [];
        foreach (JobMaster::TYPES as $type) {
            $grouped[$type] = [];
        }

        foreach ($rows as $row) {
            $grouped[$row->type][] = [
                'id' => $row->id,
                'parent_id' => $row->parent_id,
                'name' => $row->name,
                'slug' => $row->slug,
                'code' => $row->code,
            ];
        }

        return $grouped;
    }

    /**
     * @param  array<string, mixed>  $params  master_id keys from request
     * @return array<string, string>
     */
    public function resolveFilterNames(array $params): array
    {
        $map = [
            'country_id' => 'country',
            'state_id' => 'state',
            'city_id' => 'location',
            'category_id' => 'category',
            'jobtype_id' => 'jobtype',
            'experience_id' => 'experience',
            'education_id' => 'education',
            'company_id' => 'company',
        ];

        $resolved = [];
        foreach ($map as $param => $field) {
            $id = (int) ($params[$param] ?? 0);
            if ($id <= 0) {
                continue;
            }
            $master = JobMaster::query()->active()->find($id);
            if ($master) {
                if ($field === 'country') {
                    $resolved[$field] = $master->code
                        ? strtoupper($master->code)
                        : $master->name;
                } else {
                    $resolved[$field] = $master->name;
                }
            }
        }

        return $resolved;
    }

    public function findNameById(?int $id): ?string
    {
        if (! $id) {
            return null;
        }

        $master = JobMaster::query()->active()->find($id);

        return $master?->name;
    }
}
