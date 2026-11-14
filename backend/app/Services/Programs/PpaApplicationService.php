<?php

namespace App\Services\Programs;

use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\Listing;
use App\Models\PpaApplication;
use App\Models\Program;
use App\Models\TrackingToken;
use App\Services\Creators\TrustTierService;
use App\Services\Earnings\EarningLedgerService;
use App\Services\Fraud\FraudDetectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PpaApplicationService
{
    public function __construct(
        private FraudDetectionService $fraud,
        private EarningLedgerService $earnings,
        private ProgramBudgetService $budget,
        private TrustTierService $trustTiers,
    ) {}

    /**
     * @return array{application: PpaApplication, duplicate: bool}
     */
    public function recordFromWebhook(string $tokenValue, Request $request, array $data): array
    {
        $token = TrackingToken::query()->where('token', $tokenValue)->firstOrFail();
        $creator = $token->creator;
        $listing = $token->listing;
        $program = $listing->program;

        if (! $program || $program->pricing_model !== 'ppa') {
            abort(422, 'Listing is not a PPA program.');
        }

        if (! $this->creatorCanParticipate($program, $creator)) {
            abort(422, 'Creator cannot earn on this program.');
        }

        $externalId = $data['external_application_id'];
        $existing = PpaApplication::query()
            ->where('listing_id', $listing->id)
            ->where('external_application_id', $externalId)
            ->first();

        if ($existing) {
            return ['application' => $existing, 'duplicate' => true];
        }

        $gross = (float) ($listing->ppa_rate_usd ?? $program->rate_usd);
        if (! $this->budget->canSpend($program, $gross)) {
            abort(422, 'Program budget exhausted.');
        }

        $event = AttributionEvent::create([
            'tracking_token_id' => $token->id,
            'creator_id' => $creator->id,
            'listing_id' => $listing->id,
            'event_type' => 'application',
            'ip_address' => $request->ip(),
            'geo_country' => $this->geoCountry($request),
            'referrer' => $request->headers->get('referer'),
            'is_counted' => false,
            'fraud_status' => 'clean',
            'meta' => $data['meta'] ?? [],
        ]);

        $fraudResult = $this->fraud->evaluateRegistration($creator, $event);
        if ($fraudResult['block']) {
            $event->update(['fraud_status' => $fraudResult['reason']]);
            if ($fraudResult['queue_review']) {
                $this->fraud->queueReview($event, $fraudResult['reason']);
            }

            $application = PpaApplication::create([
                'tracking_token_id' => $token->id,
                'creator_id' => $creator->id,
                'listing_id' => $listing->id,
                'program_id' => $program->id,
                'external_application_id' => $externalId,
                'email' => $data['email'] ?? null,
                'status' => 'rejected',
                'attribution_event_id' => $event->id,
                'meta' => $data['meta'] ?? [],
            ]);

            return ['application' => $application, 'duplicate' => false];
        }

        $application = PpaApplication::create([
            'tracking_token_id' => $token->id,
            'creator_id' => $creator->id,
            'listing_id' => $listing->id,
            'program_id' => $program->id,
            'external_application_id' => $externalId,
            'email' => $data['email'] ?? null,
            'status' => 'pending_employer',
            'attribution_event_id' => $event->id,
            'meta' => $data['meta'] ?? [],
        ]);

        return ['application' => $application, 'duplicate' => false];
    }

    public function confirmByEmployer(PpaApplication $application, Program $program): PpaApplication
    {
        if ((int) $application->program_id !== (int) $program->id) {
            abort(404);
        }

        if ($application->status !== 'pending_employer') {
            abort(422, 'Application is not awaiting confirmation.');
        }

        $event = $application->attributionEvent;
        if (! $event || $event->fraud_status !== 'clean') {
            abort(422, 'Application cannot be confirmed.');
        }

        return DB::transaction(function () use ($application, $event, $program) {
            $listing = $application->listing;
            $gross = (float) ($listing->ppa_rate_usd ?? $program->rate_usd);

            if (! $this->budget->canSpend($program, $gross)) {
                abort(422, 'Program budget exhausted.');
            }

            $event->update(['is_counted' => true]);

            $earning = $this->earnings->createPpaEarning(
                $application->creator,
                $event,
                $listing
            );

            $this->budget->recordSpend($program, $gross);

            $application->update([
                'status' => 'confirmed',
                'employer_confirmed_at' => now(),
                'earning_ledger_id' => $earning->id,
            ]);

            return $application->fresh(['earningLedger', 'listing']);
        });
    }

    public function rejectByEmployer(PpaApplication $application, Program $program): PpaApplication
    {
        if ((int) $application->program_id !== (int) $program->id) {
            abort(404);
        }

        if ($application->status !== 'pending_employer') {
            abort(422, 'Application is not pending.');
        }

        $application->update(['status' => 'rejected']);

        return $application->fresh();
    }

    private function creatorCanParticipate(Program $program, Creator $creator): bool
    {
        if (! $this->trustTiers->canEarnPpa($creator)) {
            return false;
        }

        if (! in_array($program->status, ['active'], true)) {
            return false;
        }

        return $program->creators()
            ->where('creators.id', $creator->id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    private function geoCountry(Request $request): ?string
    {
        $geo = $request->header('CF-IPCountry') ?? $request->header('X-Geo-Country');

        return $geo ? strtoupper(substr($geo, 0, 2)) : null;
    }
}
