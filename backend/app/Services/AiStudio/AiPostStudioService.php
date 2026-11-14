<?php

namespace App\Services\AiStudio;

use App\Models\AiPostGeneration;
use App\Models\Creator;
use App\Models\Listing;
use App\Services\Tracking\ClickTrackingService;
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
        $trackedUrl = url('/r/'.$token->token);

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

        return match ($platform) {
            'whatsapp' => "👋 Hi! Found a role worth sharing:\n\n*{$title}* at {$company} ({$loc}).\n\nApply via my tracked link:\n{$url}\n\n— @{$handle} on JobOrio",
            'instagram' => "New opportunity 🚀\n{$title} · {$company}\n📍 {$loc}\n\nTap the link in bio or use:\n{$url}\n\n#jobs #careers #hiring #joborio",
            'linkedin' => "Sharing a role my audience may like:\n\n{$title} — {$company} ({$loc}).\n\nIf you're exploring your next move, see details here: {$url}\n\n#hiring #careers",
            'twitter' => "📣 {$title} at {$company} ({$loc})\n\nDetails: {$url}\n\n#jobs #hiring",
            default => "{$title} — {$url}",
        };
    }
}
