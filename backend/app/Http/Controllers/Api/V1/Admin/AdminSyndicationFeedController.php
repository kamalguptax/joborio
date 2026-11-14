<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SyndicationFeed;
use App\Services\Syndication\JobrapidoFeedService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminSyndicationFeedController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly JobrapidoFeedService $syndication) {}

    public function index(): JsonResponse
    {
        $feeds = SyndicationFeed::query()->orderBy('sort_order')->orderBy('name')->get();

        return $this->success($feeds);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        if (empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name']);
        }

        $feed = SyndicationFeed::create($data);

        return $this->success($feed, 201);
    }

    public function update(Request $request, SyndicationFeed $syndicationFeed): JsonResponse
    {
        $data = $this->validated($request, $syndicationFeed->id);
        $syndicationFeed->update($data);

        return $this->success($syndicationFeed->fresh());
    }

    public function destroy(SyndicationFeed $syndicationFeed): JsonResponse
    {
        $this->syndication->clearFeedCache($syndicationFeed);
        $syndicationFeed->delete();
        $this->syndication->clearCache();

        return $this->success(['deleted' => true]);
    }

    public function refresh(SyndicationFeed $syndicationFeed): JsonResponse
    {
        $payload = $this->syndication->refreshFeed($syndicationFeed);

        return $this->success([
            'feed' => $syndicationFeed->fresh(),
            'job_count' => count($payload['jobs']),
            'source' => $payload['source'],
        ]);
    }

    public function refreshAll(): JsonResponse
    {
        $this->syndication->clearCache();
        $merged = $this->syndication->loadFeed();

        return $this->success([
            'total_in_feed' => count($merged['jobs']),
            'sources' => $merged['source']['feeds'] ?? [],
            'source' => $merged['source'],
        ]);
    }

    public function probe(SyndicationFeed $syndicationFeed): JsonResponse
    {
        $result = $this->syndication->probeFeed($syndicationFeed);

        return $this->success($result);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'nullable',
                'string',
                'max:80',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('syndication_feeds', 'slug')->ignore($ignoreId),
            ],
            'feed_url' => ['required', 'url', 'max:2048'],
            'format' => ['sometimes', 'string', Rule::in(['jobrapido'])],
            'job_xpath' => ['sometimes', 'string', 'max:128'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'is_active' => ['sometimes', 'boolean'],
            'use_sample_when_empty' => ['sometimes', 'boolean'],
            'sample_path' => ['nullable', 'string', 'max:512'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
        ]);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'feed';
        }
        $slug = $base;
        $n = 2;
        while (SyndicationFeed::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n;
            $n++;
        }

        return $slug;
    }
}
