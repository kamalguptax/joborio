<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\EmployerAsset;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssetController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public function index(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $assets = EmployerAsset::query()
            ->where('employer_id', $employer->id)
            ->latest()
            ->get()
            ->map(fn (EmployerAsset $a) => $this->serialize($a));

        return $this->success(['assets' => $assets]);
    }

    public function store(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'file_name' => ['required', 'string', 'max:255'],
            'asset_type' => ['required', Rule::in(['logo', 'banner', 'promotional_image', 'brand_guideline', 'other'])],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
        ]);

        $asset = EmployerAsset::create([
            'employer_id' => $employer->id,
            'program_id' => $data['program_id'] ?? null,
            'file_name' => $data['file_name'],
            'asset_type' => $data['asset_type'],
            'version' => 'v1',
            'status' => 'in_review',
        ]);

        return $this->success(['asset' => $this->serialize($asset)], 201);
    }

    private function serialize(EmployerAsset $a): array
    {
        $status = match ($a->status) {
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            default => 'In review',
        };

        return [
            'id' => $a->id,
            'x' => $a->file_name,
            'ver' => $a->version,
            'st' => $status,
            'asset_type' => $a->asset_type,
        ];
    }
}
