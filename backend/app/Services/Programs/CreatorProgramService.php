<?php

namespace App\Services\Programs;

use App\Models\Creator;
use App\Models\Program;
use Illuminate\Validation\ValidationException;

class CreatorProgramService
{
    public function __construct(private ProgramMatchingService $matching) {}

    /**
     * @return \Illuminate\Support\Collection<int, Program>
     */
    public function availableFor(Creator $creator)
    {
        return Program::query()
            ->where('status', 'active')
            ->with(['listing', 'employer'])
            ->get()
            ->filter(fn (Program $p) => $this->matching->creatorEligible($p, $creator))
            ->values();
    }

    public function optIn(Creator $creator, Program $program): void
    {
        if ($program->status !== 'active') {
            throw ValidationException::withMessages(['program' => ['Program is not active.']]);
        }

        if (! $this->matching->creatorEligible($program, $creator)) {
            throw ValidationException::withMessages(['program' => ['You do not match this campaign.']]);
        }

        $program->creators()->syncWithoutDetaching([
            $creator->id => [
                'opted_in_at' => now(),
                'status' => 'active',
            ],
        ]);
    }

    public function optOut(Creator $creator, Program $program): void
    {
        $program->creators()->updateExistingPivot($creator->id, ['status' => 'left']);
    }

    /**
     * @return list<string>
     */
    private function allowedTiers(Program $program): array
    {
        $order = ['nano', 'micro', 'mid', 'macro'];
        if (! $program->min_trust_tier) {
            return $order;
        }
        $idx = array_search($program->min_trust_tier, $order, true);

        return $idx === false ? $order : array_slice($order, $idx);
    }
}
