<?php

namespace App\Http\Controllers\Api\V1\Network;

use App\Http\Controllers\Controller;
use App\Models\NetworkMember;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherCommunity;
use App\Services\Publishers\CommunityXmlFeedSyncService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Assigned PPC/campaigns + community XML jobs for network members to share.
 * Never returns CPC rates, fees, or balances.
 */
class OpportunitiesController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = NetworkMember::query()
            ->with([
                'communityMemberships' => fn ($q) => $q->where('status', 'active'),
            ])
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'Active network membership not found.', 404);
        }

        $communityIds = $member->communityMemberships
            ->pluck('community_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $assignments = PublisherCampaignAssignment::query()
            ->where('publisher_id', $member->publisher_id)
            ->where('status', 'active')
            ->where(function ($q) use ($communityIds) {
                $q->whereNull('community_id');
                if ($communityIds !== []) {
                    $q->orWhereIn('community_id', $communityIds);
                }
            })
            ->with([
                'program:id,title,status,promotion_type,pricing_model,post_url,listing_id',
                'program.listing:id,title,destination_url,company_name,location_label,status',
            ])
            ->latest()
            ->get();

        $campaigns = $assignments
            ->map(function (PublisherCampaignAssignment $a) use ($user) {
                $program = $a->program;
                if (! $program || ($program->status ?? '') !== 'active') {
                    return null;
                }

                $destination = trim((string) ($program->post_url ?: $program->listing?->destination_url ?: ''));
                $ref = 'assignment:'.$a->id;
                $shareCode = trim((string) $user->public_code) !== ''
                    ? (string) $user->public_code
                    : \App\Models\User::codeForId((int) $user->id);

                return [
                    'assignment_id' => $a->id,
                    'program_id' => $program->id,
                    'title' => $program->title,
                    'status' => $program->status,
                    'pricing_model' => $program->pricing_model,
                    'promotion_type' => $program->promotion_type,
                    'company' => $program->listing?->company_name,
                    'location' => $program->listing?->location_label,
                    'destination_url' => $destination !== '' ? $destination : null,
                    'reference_id' => $ref,
                    'share_code' => $shareCode,
                    'can_share' => $destination !== '' && $shareCode !== '',
                ];
            })
            ->filter()
            ->values();

        $xmlJobRefs = [];
        if ($communityIds !== []) {
            $communities = PublisherCommunity::query()
                ->whereIn('id', $communityIds)
                ->where('status', 'active')
                ->get(['id', 'xml_job_refs', 'category']);

            $xmlSync = app(CommunityXmlFeedSyncService::class);
            foreach ($communities as $community) {
                $refs = is_array($community->xml_job_refs) ? $community->xml_job_refs : [];
                // Prefer live category matches so member feeds stay current when XML updates.
                $live = $xmlSync->refsForCategories(
                    $xmlSync->categoriesFromCommunity($community),
                );
                foreach ([...$live, ...$refs] as $ref) {
                    $key = trim((string) $ref);
                    if ($key !== '') {
                        $xmlJobRefs[$key] = true;
                    }
                }
            }
        }

        $shareCode = trim((string) $user->public_code) !== ''
            ? (string) $user->public_code
            : \App\Models\User::codeForId((int) $user->id);

        return $this->success([
            'member' => [
                'name' => $member->display_name ?: $user->name,
                'public_code' => $shareCode,
            ],
            'campaigns' => $campaigns,
            'xml_job_refs' => array_keys($xmlJobRefs),
            'note' => 'Every share link includes your reference (code/subid) so clicks count on your account. Rates stay hidden.',
        ]);
    }
}
