<?php

namespace App\Services\AiStudio;

use App\Models\AiPostGeneration;
use App\Models\Creator;
use App\Models\Listing;
use App\Services\Tracking\ClickTrackingService;
use App\Support\TrackingPublicUrl;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AiPostStudioService
{
    public function __construct(private ClickTrackingService $tracking) {}

    /**
     * @return array{content: string, platform: string, remaining: int, used: int, cap: int, tracked_url: string}
     */
    public function generate(Creator $creator, Listing $listing, string $platform): array
    {
        $platform = Str::lower($platform);
        if (! in_array($platform, ['whatsapp', 'instagram', 'linkedin', 'twitter'], true)) {
            throw ValidationException::withMessages(['platform' => ['Invalid platform.']]);
        }

        $cap = (int) config('joborio.ai_studio.monthly_cap', 5);
        $used = $this->monthlyUsageCount($creator);
        if ($used >= $cap) {
            throw ValidationException::withMessages([
                'cap' => ["Monthly AI cap reached ({$cap}). Resets next calendar month."],
            ]);
        }

        $token = $this->tracking->getOrCreateToken($creator, $listing);
        $trackedUrl = TrackingPublicUrl::forToken($token->token);

        $content = $this->buildCopy($platform, $listing, $creator, $trackedUrl);

        AiPostGeneration::create([
            'creator_id' => $creator->id,
            'listing_id' => $listing->id,
            'platform' => $platform,
            'content' => $content,
            'tracked_url' => $trackedUrl,
        ]);

        return [
            'content' => $content,
            'platform' => $platform,
            'tracked_url' => $trackedUrl,
            'used' => $used + 1,
            'remaining' => max(0, $cap - $used - 1),
            'cap' => $cap,
        ];
    }

    /**
     * @return array{used: int, cap: int, remaining: int}
     */
    public function quota(Creator $creator): array
    {
        $cap = (int) config('joborio.ai_studio.monthly_cap', 5);
        $used = $this->monthlyUsageCount($creator);

        return [
            'used' => $used,
            'cap' => $cap,
            'remaining' => max(0, $cap - $used),
        ];
    }

    private function monthlyUsageCount(Creator $creator): int
    {
        return AiPostGeneration::query()
            ->where('creator_id', $creator->id)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
    }

    private function buildCopy(
        string $platform,
        Listing $listing,
        Creator $creator,
        string $url,
    ): string {
        $title = $listing->title;
        $company = $listing->company_name ?? 'a great employer';
        $loc = $listing->location_label ?? ($listing->is_remote ? 'Remote' : 'Global');
        $handle = $creator->handle;

        $companyTag = preg_replace('/[^A-Za-z0-9]+/', '', (string) $company) ?: 'Hiring';
        $city = trim(explode(',', (string) $loc)[0] ?? '');
        $cityTag = $city !== '' ? preg_replace('/[^A-Za-z0-9]+/', '', $city).'Jobs' : 'Jobs';

        return match ($platform) {
            'whatsapp' => "👋 Hi! Found a role worth sharing:\n\n*{$company} Looking for {$title}*\n📍 Location: {$loc}\n\nApply Now:\n{$url}\n\n— @{$handle} on JobOrio",
            'instagram' => "{$company} is hiring – {$title}".($city !== '' ? " in {$city}" : '')."!\n\n{$company} is looking for skilled professionals to join its team.\n\nCheck my bio link to apply for this role\n{$url}\n\n#{$companyTag} #EngineeringJobs #{$cityTag} #JobOrio",
            'linkedin' => "{$company} Looking for {$title}\n\n📍 Location: {$loc}\n\nApply Now:\n{$url}\n\n#Hiring #{$companyTag} #{$cityTag} #JobOrio",
            'twitter' => "{$company} is hiring – {$title}".($city !== '' ? " in {$city}" : '')."!\n\nCheck my bio link to apply for this role\n{$url}\n\n#{$companyTag} #{$cityTag}",
            default => "{$title} — {$url}",
        };
    }
}
