<?php

namespace App\Services\Payouts;

use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\PayoutBatch;
use App\Models\PayoutLine;
use App\Models\User;
use App\Services\Creators\TrustTierService;
use App\Services\Earnings\EarningLedgerService;
use App\Services\Notifications\UserNotificationService;
use App\Services\Payments\PaymentEvidenceService;
use App\Services\Platform\PlatformSettingsService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PayoutBatchService
{
    public function __construct(
        private EarningLedgerService $earnings,
        private TrustTierService $trustTiers,
        private UserNotificationService $notifications,
        private PlatformSettingsService $settings,
        private PaymentEvidenceService $evidence,
    ) {}

    /**
     * @return array{min_payout_usd: float, creators: Collection, total_usd: float, source: string}
     */
    public function preview(string $mode = 'all'): array
    {
        $min = $this->settings->payoutStructure()['min_payout_usd'];
        $creators = $this->eligibleCreators($mode, $min);

        return [
            'min_payout_usd' => $min,
            'mode' => $mode,
            'creators' => $creators->map(fn (Creator $c) => [
                'creator_id' => $c->id,
                'handle' => $c->handle,
                'trust_tier' => $c->trust_tier,
                'amount_usd' => (float) $c->approved_total,
                'auto_payout_eligible' => $this->trustTiers->isAutoPayoutEligible($c),
                'requires_manual_review' => $this->trustTiers->requiresManualPayoutReview($c),
            ])->values(),
            'total_usd' => (float) $creators->sum('approved_total'),
        ];
    }

    public function createBatch(string $mode = 'manual', ?User $approvedBy = null): PayoutBatch
    {
        $min = $this->settings->payoutStructure()['min_payout_usd'];
        $source = $mode === 'auto' ? 'auto' : 'manual';

        return DB::transaction(function () use ($mode, $min, $source, $approvedBy) {
            $batch = PayoutBatch::create([
                'status' => 'draft',
                'source' => $source,
                'total_usd' => 0,
                'approved_by' => $approvedBy?->id,
            ]);

            $total = 0.0;
            $creators = $this->eligibleCreators($mode, $min);

            foreach ($creators as $creator) {
                $amount = $this->earnings->markPayableForCreator($creator);
                if ($amount < $min) {
                    continue;
                }

                PayoutLine::create([
                    'payout_batch_id' => $batch->id,
                    'creator_id' => $creator->id,
                    'amount_usd' => $amount,
                    'method' => $creator->payout_method,
                    'status' => 'pending',
                ]);

                $total += $amount;
            }

            $batch->update([
                'total_usd' => $total,
                'status' => $total > 0 ? 'pending_transfer' : 'draft',
                'processed_at' => $total > 0 ? now() : null,
            ]);

            return $batch->fresh('lines');
        });
    }

    public function runScheduledAutoBatch(): ?PayoutBatch
    {
        if (! config('joborio.auto_payout_enabled', true)) {
            return null;
        }

        $preview = $this->preview('auto');
        if ($preview['creators']->isEmpty()) {
            return null;
        }

        return $this->createBatch('auto');
    }

    /**
     * @param  array{evidence_note?: string|null, external_reference?: string|null}  $meta
     */
    public function completeBatch(
        PayoutBatch $batch,
        UploadedFile $evidenceFile,
        ?User $releasedBy = null,
        array $meta = [],
    ): PayoutBatch {
        if ($batch->status === 'completed') {
            throw new InvalidArgumentException('Batch already completed.');
        }

        $stored = $this->evidence->store(
            $evidenceFile,
            'payment-evidence/payout-batches/'.$batch->id,
        );

        return DB::transaction(function () use ($batch, $stored, $releasedBy, $meta) {
            $batch->load('lines.creator.user');

            foreach ($batch->lines as $line) {
                EarningLedger::query()
                    ->where('creator_id', $line->creator_id)
                    ->where('state', 'payable')
                    ->update([
                        'state' => 'paid',
                        'paid_at' => now(),
                    ]);

                $lineUpdate = ['status' => 'paid'];
                if (! empty($meta['external_reference'])) {
                    $lineUpdate['external_reference'] = (string) $meta['external_reference'];
                }
                $line->update($lineUpdate);

                $creator = $line->creator;
                if ($creator?->user) {
                    $amount = number_format((float) $line->amount_usd, 2);
                    $this->notifications->notify(
                        $creator->user,
                        'payout_completed',
                        'Payout sent',
                        "Your payout of \${$amount} USD has been marked paid.",
                        ['payout_line_id' => $line->id, 'batch_id' => $batch->id],
                    );
                }
            }

            $batch->update([
                'status' => 'completed',
                'processed_at' => $batch->processed_at ?? now(),
                'evidence_path' => $stored['evidence_path'],
                'evidence_original_name' => $stored['evidence_original_name'],
                'evidence_mime' => $stored['evidence_mime'],
                'evidence_size' => $stored['evidence_size'],
                'evidence_uploaded_at' => $stored['evidence_uploaded_at'],
                'evidence_note' => $meta['evidence_note'] ?? null,
                'released_by_user_id' => $releasedBy?->id,
            ]);

            return $batch->fresh('lines');
        });
    }

    /**
     * @return Collection<int, Creator>
     */
    private function eligibleCreators(string $mode, float $min): Collection
    {
        $query = Creator::query()
            ->withSum(['earnings as approved_total' => fn ($q) => $q->where('state', 'approved')], 'net_usd');

        if ($mode === 'auto') {
            $query->whereNotNull('payout_method');
        } elseif ($mode === 'manual') {
            $query->whereNull('payout_method');
        }

        return $query->get()->filter(function (Creator $creator) use ($mode, $min) {
            if ((float) $creator->approved_total < $min) {
                return false;
            }

            if ($mode === 'auto') {
                return $this->trustTiers->isAutoPayoutEligible($creator);
            }

            if ($mode === 'manual') {
                return $this->trustTiers->requiresManualPayoutReview($creator);
            }

            return true;
        })->values();
    }
}
