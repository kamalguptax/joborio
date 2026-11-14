<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\JobMaster;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminJobMasterController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $type = $request->string('type')->toString();
        if ($type === '' || ! in_array($type, JobMaster::TYPES, true)) {
            return $this->error('INVALID_TYPE', 'Valid type query param required.', 422);
        }

        $items = JobMaster::query()
            ->ofType($type)
            ->with('parent:id,name,type')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(min((int) $request->input('per_page', 100), 200));

        return $this->success($items->items(), 200, [
            'type' => $type,
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $item = JobMaster::create($data);

        return $this->success($item->fresh('parent'), 201);
    }

    public function update(Request $request, JobMaster $jobMaster): JsonResponse
    {
        $data = $this->validated($request, partial: true);
        if (isset($data['name']) && ! isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $jobMaster->update($data);

        return $this->success($jobMaster->fresh('parent'));
    }

    public function destroy(JobMaster $jobMaster): JsonResponse
    {
        $jobMaster->update(['is_active' => false]);

        return $this->success(['message' => 'Master deactivated.']);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $rules = [
            'type' => ['required', Rule::in(JobMaster::TYPES)],
            'parent_id' => ['nullable', 'integer', 'exists:job_masters,id'],
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:160'],
            'code' => ['nullable', 'string', 'max:16'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
        ];

        if ($partial) {
            foreach ($rules as $key => $rule) {
                $rules[$key] = array_merge(['sometimes'], $rule);
            }
            unset($rules['type']);
        }

        return $request->validate($rules);
    }
}
