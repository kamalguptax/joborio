<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JobMasters\JobMasterService;
use App\Services\Syndication\JobrapidoFeedService;
use App\Support\ApiResponse;
use App\Support\CreatorRelevance;
use App\Support\JobSubid;
use App\Support\PromoteJobTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobrapidoSyndicationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly JobrapidoFeedService $feed,
        private readonly JobMasterService $masters,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $payload = $this->feed->loadFeed();
        $allJobs = $payload['jobs'];

        $filters = [
            'search' => $request->string('search')->toString(),
            'feed' => $request->string('feed')->toString(),
            'category' => $request->string('category')->toString(),
            'location' => $request->string('location')->toString(),
            'state' => $request->string('state')->toString(),
            'country' => $request->string('country')->toString(),
            'company' => $request->string('company')->toString(),
            'jobtype' => $request->string('jobtype')->toString(),
            'experience' => $request->string('experience')->toString(),
            'education' => $request->string('education')->toString(),
        ];

        $fromMasters = $this->masters->resolveFilterNames([
            'country_id' => $request->input('country_id'),
            'state_id' => $request->input('state_id'),
            'city_id' => $request->input('city_id'),
            'category_id' => $request->input('category_id'),
            'jobtype_id' => $request->input('jobtype_id'),
            'experience_id' => $request->input('experience_id'),
            'education_id' => $request->input('education_id'),
            'company_id' => $request->input('company_id'),
        ]);

        foreach ($fromMasters as $key => $value) {
            if ($value !== '') {
                $filters[$key] = $value;
            }
        }

        foreach ($filters as $key => $value) {
            if ($value === '') {
                unset($filters[$key]);
            }
        }

        $masterFilters = $this->masters->publicFilters();

        $filtered = $this->feed->applyFilters($allJobs, $filters);
        $promoteTypes = PromoteJobTypes::clean(array_map(
            'trim',
            explode(',', $request->string('promote_types')->toString()),
        ));
        if ($promoteTypes !== []) {
            $filtered = array_values(array_filter(
                $filtered,
                function (array $job) use ($promoteTypes): bool {
                    $hay = implode(' ', [
                        $job['title'] ?? '',
                        $job['jobtype'] ?? '',
                        $job['location'] ?? '',
                        $job['location_label'] ?? '',
                        $job['description_text'] ?? '',
                    ]);

                    return PromoteJobTypes::matches($hay, $promoteTypes);
                },
            ));
        }

        if ($request->boolean('for_creator')) {
            $user = auth('sanctum')->user();
            $creator = $user instanceof User ? $user->creator : null;
            $filtered = $creator
                ? CreatorRelevance::filterJobs($filtered, $creator, $promoteTypes)
                : [];
        }
        $referenceId = trim($request->string('reference_id')->toString());
        if ($referenceId !== '') {
            $filtered = array_values(array_filter(
                $filtered,
                fn (array $job): bool => $this->referenceMatches($job, $referenceId),
            ));
        }

        if ($request->boolean('group_by_category')) {
            return $this->success([
                'jobs' => $filtered,
                'grouped_by_category' => $this->feed->groupByCategory($filtered),
                'filters' => $masterFilters,
                'source' => $payload['source'],
            ], 200, [
                'total' => count($filtered),
                'total_in_feed' => count($allJobs),
                'storage' => 'live_feed_cache_only',
            ]);
        }

        $perPage = min(max((int) $request->input('per_page', 24), 1), 100);
        $page = max((int) $request->input('page', 1), 1);
        $total = count($filtered);
        $lastPage = max((int) ceil($total / $perPage), 1);
        $page = min($page, $lastPage);
        $offset = ($page - 1) * $perPage;
        $pageItems = array_slice($filtered, $offset, $perPage);
        $pageItems = $this->stampSubid($pageItems);

        return $this->success([
            'jobs' => $pageItems,
            'grouped_by_category' => null,
            'filters' => $masterFilters,
            'source' => $payload['source'],
        ], 200, [
            'current_page' => $page,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'total_in_feed' => count($allJobs),
            'storage' => 'live_feed_cache_only',
        ]);
    }

    public function show(string $referenceId): JsonResponse
    {
        $payload = $this->feed->loadFeed();
        foreach ($payload['jobs'] as $job) {
            if ($this->referenceMatches($job, $referenceId)) {
                $job = $this->stampSubid([$job])[0];

                return $this->success($job, 200, [
                    'source' => $payload['source'],
                    'storage' => 'live_feed_cache_only',
                ]);
            }
        }

        return $this->error('NOT_FOUND', 'Job not found in syndication feed.', 404);
    }

    /**
     * @param  list<array<string, mixed>>  $jobs
     * @return list<array<string, mixed>>
     */
    private function referenceMatches(array $job, string $wanted): bool
    {
        $stored = (string) ($job['reference_id'] ?? '');
        if ($stored === '' || $wanted === '') {
            return false;
        }
        if (strcasecmp($stored, $wanted) === 0) {
            return true;
        }

        $wantedRaw = str_contains($wanted, ':')
            ? substr($wanted, (int) strrpos($wanted, ':') + 1)
            : $wanted;
        $storedRaw = str_contains($stored, ':')
            ? substr($stored, (int) strrpos($stored, ':') + 1)
            : $stored;

        return $wantedRaw !== '' && strcasecmp($wantedRaw, $storedRaw) === 0;
    }

    /**
     * @param  list<array<string, mixed>>  $jobs
     * @return list<array<string, mixed>>
     */
    private function stampSubid(array $jobs): array
    {
        $user = auth('sanctum')->user();
        if (! $user instanceof User) {
            return $jobs;
        }

        $code = $user->public_code ?: User::codeForId((int) $user->id);
        foreach ($jobs as &$job) {
            if (! isset($job['url']) || ! is_string($job['url'])) {
                continue;
            }
            $job['url'] = JobSubid::append($job['url'], $code);
            $job['subid'] = $code;
        }
        unset($job);

        return $jobs;
    }

    public function refresh(): JsonResponse
    {
        $this->feed->clearCache();
        $payload = $this->feed->loadFeed();

        return $this->success([
            'total_in_feed' => count($payload['jobs']),
            'source' => $payload['source'],
        ], 200, ['storage' => 'live_feed_cache_only']);
    }
}
