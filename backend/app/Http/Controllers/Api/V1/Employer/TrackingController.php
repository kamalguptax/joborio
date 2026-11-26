<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\EmployerApiKey;
use App\Models\Listing;
use App\Models\Program;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TrackingController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public function overview(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $programIds = Program::query()->where('employer_id', $employer->id)->pluck('id');
        $listingIds = Listing::query()->whereIn('program_id', $programIds)->pluck('id');

        $events = AttributionEvent::query()
            ->whereIn('listing_id', $listingIds)
            ->latest()
            ->limit(1)
            ->first();

        $total = AttributionEvent::query()->whereIn('listing_id', $listingIds)->count();
        $last24 = AttributionEvent::query()
            ->whereIn('listing_id', $listingIds)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        $keys = EmployerApiKey::query()
            ->where('employer_id', $employer->id)
            ->latest()
            ->get()
            ->map(fn (EmployerApiKey $k) => [
                'id' => $k->id,
                'mask' => $k->key_prefix.'********'.substr($k->key_hash, -4),
                'created' => optional($k->created_at)->format('d M Y'),
                'status' => $k->status === 'active' ? 'Active' : 'Revoked',
                'can_revoke' => $k->status === 'active',
            ]);

        return $this->success([
            'diagnostics' => [
                ['k' => 'Events (all time)', 'v' => (string) $total],
                ['k' => 'Events (24h)', 'v' => (string) $last24],
                ['k' => 'Last event', 'v' => $events ? optional($events->created_at)->diffForHumans() : 'None yet'],
                ['k' => 'Active campaigns', 'v' => (string) Program::query()->where('employer_id', $employer->id)->where('status', 'active')->count()],
                ['k' => 'API keys', 'v' => (string) $keys->where('status', 'Active')->count()],
                ['k' => 'HMAC window', 'v' => '5 minutes'],
            ],
            'keys' => $keys,
            'programs' => Program::query()
                ->where('employer_id', $employer->id)
                ->latest()
                ->get(['id', 'title', 'status'])
                ->map(fn (Program $p) => [
                    'id' => $p->id,
                    'code' => 'JO-C-'.$p->id,
                    'title' => $p->title,
                    'status' => $p->status,
                ]),
        ]);
    }

    public function generateLink(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'program_id' => ['required', 'integer', 'exists:programs,id'],
            'destination_url' => ['nullable', 'url', 'max:2000'],
            'sub1' => ['nullable', 'string', 'max:120'],
            'sub2' => ['nullable', 'string', 'max:120'],
        ]);

        $program = Program::query()
            ->where('id', $data['program_id'])
            ->where('employer_id', $employer->id)
            ->with('listing')
            ->first();
        if (! $program) {
            return $this->error('NOT_FOUND', 'Campaign not found.', 404);
        }

        $base = $data['destination_url']
            ?: ($program->listing?->destination_url ?? config('app.frontend_url', 'https://joborio.sevenapps.in'));

        $params = array_filter([
            'jo_cid' => $program->id,
            'jo_ref' => 'brand',
            'sub1' => $data['sub1'] ?? null,
            'sub2' => $data['sub2'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');

        $sep = str_contains($base, '?') ? '&' : '?';
        $link = $base.$sep.http_build_query($params);

        return $this->success(['link' => $link, 'program_id' => $program->id]);
    }

    public function testConversion(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
        ]);

        if (! empty($data['program_id'])) {
            $owns = Program::query()
                ->where('id', $data['program_id'])
                ->where('employer_id', $employer->id)
                ->exists();
            if (! $owns) {
                return $this->error('NOT_FOUND', 'Campaign not found.', 404);
            }
        }

        return $this->success([
            'ok' => true,
            'message' => 'Test conversion accepted',
            'event_id' => 'evt_test_'.Str::lower(Str::random(8)),
            'received_at' => now()->toIso8601String(),
        ]);
    }

    public function createKey(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
        ]);

        $secret = 'jo_live_'.Str::random(32);
        $prefix = substr($secret, 0, 12);
        $key = EmployerApiKey::create([
            'employer_id' => $employer->id,
            'name' => $data['name'] ?? 'Default',
            'key_prefix' => $prefix,
            'key_hash' => hash('sha256', $secret),
            'status' => 'active',
        ]);

        return $this->success([
            'key' => [
                'id' => $key->id,
                'mask' => $prefix.'********'.substr(hash('sha256', $secret), -4),
                'created' => optional($key->created_at)->format('d M Y'),
                'status' => 'Active',
                'can_revoke' => true,
            ],
            'secret' => $secret,
            'message' => 'Copy this secret now. It is shown once.',
        ], 201);
    }

    public function revokeKey(Request $request, EmployerApiKey $key): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        if ((int) $key->employer_id !== (int) $employer->id) {
            return $this->error('NOT_FOUND', 'Key not found.', 404);
        }

        $key->update([
            'status' => 'revoked',
            'revoked_at' => now(),
        ]);

        return $this->success(['revoked' => true]);
    }
}
