<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublisherCommunity;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', 'max:40'],
            'publisher_id' => ['nullable', 'integer'],
            'search' => ['nullable', 'string', 'max:120'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $query = PublisherCommunity::query()
            ->with([
                'publisher:id,code,username,display_name,status',
                'manager:id,name,email',
            ])
            ->withCount([
                'members as members_active_count' => fn ($q) => $q->where('status', 'active'),
                'members as members_total_count',
            ])
            ->latest('id')
            ->limit((int) ($data['limit'] ?? 100));

        if (! empty($data['status']) && $data['status'] !== 'all') {
            $query->where('status', $data['status']);
        }
        if (! empty($data['publisher_id'])) {
            $query->where('publisher_id', (int) $data['publisher_id']);
        }
        if (! empty($data['search'])) {
            $term = '%'.$data['search'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('category', 'like', $term)
                    ->orWhereHas('publisher', function ($pq) use ($term) {
                        $pq->where('display_name', 'like', $term)
                            ->orWhere('username', 'like', $term)
                            ->orWhere('code', 'like', $term);
                    });
            });
        }

        $rows = $query->get()->map(fn (PublisherCommunity $c) => [
            'id' => $c->id,
            'code' => $c->code,
            'name' => $c->name,
            'category' => $c->category,
            'status' => $c->status,
            'country_code' => $c->country_code,
            'commission_percent' => $c->commission_percent !== null
                ? round((float) $c->commission_percent, 2)
                : null,
            'members_active' => (int) ($c->members_active_count ?? 0),
            'members_total' => (int) ($c->members_total_count ?? 0),
            'xml_jobs_count' => is_array($c->xml_job_refs) ? count($c->xml_job_refs) : 0,
            'manager' => $c->manager ? [
                'id' => $c->manager->id,
                'name' => $c->manager->name,
                'email' => $c->manager->email,
            ] : null,
            'publisher' => $c->publisher ? [
                'id' => $c->publisher->id,
                'code' => $c->publisher->code,
                'username' => $c->publisher->username,
                'display_name' => $c->publisher->display_name,
                'status' => $c->publisher->status,
            ] : null,
            'created_at' => optional($c->created_at)?->toIso8601String(),
        ]);

        return $this->success([
            'communities' => $rows,
            'total' => $rows->count(),
        ]);
    }
}
