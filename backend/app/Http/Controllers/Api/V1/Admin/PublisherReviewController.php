<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Models\PublisherUser;
use App\Services\Publishers\PublisherLedgerService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublisherReviewController extends Controller
{
    use ApiResponse;

    public function __construct(private PublisherLedgerService $ledger) {}

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('search', ''));
        $query = Publisher::query()
            ->withCount([
                'communities as communities_count',
                'networkMembers as members_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->latest();

        if (is_string($status) && $status !== '' && $status !== 'all') {
            if ($status === 'under_review') {
                $query->whereIn('status', [
                    Publisher::STATUS_SUBMITTED,
                    Publisher::STATUS_EMAIL_VERIFIED,
                    Publisher::STATUS_SOCIAL_REVIEWED,
                    Publisher::STATUS_COMMERCIAL_APPROVED,
                ]);
            } else {
                $query->where('status', $status);
            }
        }

        if ($search !== '') {
            $term = '%'.$search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('display_name', 'like', $term)
                    ->orWhere('username', 'like', $term)
                    ->orWhere('code', 'like', $term);
            });
        }

        $rows = $query->limit(150)->get()->map(function (Publisher $p) {
            $owner = PublisherUser::query()
                ->where('publisher_id', $p->id)
                ->where('role', 'owner')
                ->where('is_active', true)
                ->with('user:id,name,email')
                ->first();

            $balances = $this->ledger->balances($p);

            return [
                'id' => $p->id,
                'code' => $p->code,
                'username' => $p->username,
                'display_name' => $p->display_name,
                'country_code' => $p->country_code,
                'network_type' => $p->network_type,
                'status' => $p->status,
                'status_label' => $p->statusLabel(),
                'social_url' => $p->social_url,
                'website_url' => $p->website_url,
                'communities_count' => (int) ($p->communities_count ?? 0),
                'members_count' => (int) ($p->members_count ?? 0),
                'payable_usd' => round((float) ($balances['payable_usd'] ?? 0), 4),
                'paid_usd' => round((float) ($balances['paid_usd'] ?? 0), 4),
                'lifetime_net_usd' => round((float) ($balances['lifetime_net_usd'] ?? 0), 4),
                'owner' => $owner?->user ? [
                    'id' => $owner->user->id,
                    'name' => $owner->user->name,
                    'email' => $owner->user->email,
                ] : null,
                'created_at' => optional($p->created_at)?->toIso8601String(),
                'activated_at' => optional($p->activated_at)?->toIso8601String(),
            ];
        });

        return $this->success([
            'publishers' => $rows,
            'total' => $rows->count(),
        ]);
    }

    public function activate(Publisher $publisher): JsonResponse
    {
        $publisher->update([
            'status' => Publisher::STATUS_ACTIVATED,
            'activated_at' => now(),
            'commercial_approved_at' => $publisher->commercial_approved_at ?? now(),
            'social_reviewed_at' => $publisher->social_reviewed_at ?? now(),
        ]);

        return $this->success([
            'publisher' => [
                'id' => $publisher->id,
                'status' => $publisher->status,
                'status_label' => $publisher->statusLabel(),
                'activated_at' => optional($publisher->activated_at)?->toIso8601String(),
            ],
        ]);
    }
}
