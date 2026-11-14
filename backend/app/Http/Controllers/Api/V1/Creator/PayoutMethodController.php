<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\Creator;
use App\Services\Platform\PlatformSettingsService;
use App\Support\ApiResponse;
use App\Support\MoneyCurrencies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class PayoutMethodController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        return $this->success($this->payload($creator));
    }

    public function update(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $data = $request->validate([
            'payout_method' => ['required', Rule::in(['upi', 'bank_transfer', 'paypal', 'stripe_connect'])],
            'payout_holder_name' => ['nullable', 'string', 'max:120'],
            'payout_upi_id' => ['nullable', 'string', 'max:120'],
            'payout_paypal_email' => ['nullable', 'email', 'max:190'],
            'payout_bank_name' => ['nullable', 'string', 'max:120'],
            'payout_account_number' => ['nullable', 'string', 'max:34'],
            'payout_ifsc' => ['nullable', 'string', 'max:20'],
            'payout_currency' => ['nullable', 'string', Rule::in(array_keys(MoneyCurrencies::OPTIONS))],
        ]);

        $missing = match ($data['payout_method']) {
            'upi' => blank($data['payout_upi_id'] ?? null) || blank($data['payout_holder_name'] ?? null)
                ? 'Add the account holder name and UPI ID.'
                : null,
            'paypal' => blank($data['payout_paypal_email'] ?? null)
                ? 'Add the PayPal email.'
                : null,
            'bank_transfer' => blank($data['payout_holder_name'] ?? null)
                || blank($data['payout_bank_name'] ?? null)
                || blank($data['payout_account_number'] ?? null)
                || blank($data['payout_ifsc'] ?? null)
                ? 'Add the account holder, bank name, account number, and IFSC.'
                : null,
            default => null,
        };

        if ($missing) {
            return $this->error('PAYOUT_ACCOUNT_INCOMPLETE', $missing, 422);
        }

        $fields = [
            'payout_method' => $data['payout_method'],
            'payout_holder_name' => $data['payout_holder_name'] ?? null,
            'payout_upi_id' => $data['payout_upi_id'] ?? null,
            'payout_paypal_email' => $data['payout_paypal_email'] ?? null,
            'payout_bank_name' => $data['payout_bank_name'] ?? null,
            'payout_account_number' => $data['payout_account_number'] ?? null,
            'payout_ifsc' => isset($data['payout_ifsc']) ? strtoupper($data['payout_ifsc']) : null,
        ];
        if (Schema::hasColumn('creators', 'payout_currency') && ! empty($data['payout_currency'])) {
            $fields['payout_currency'] = strtoupper($data['payout_currency']);
        }
        $creator->update($fields);

        return $this->success($this->payload($creator->fresh()));
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Creator $creator): array
    {
        $settings = app(PlatformSettingsService::class);
        $structure = $settings->payoutStructure();
        $chosen = Schema::hasColumn('creators', 'payout_currency')
            ? ($creator->payout_currency ?: $structure['currency'])
            : $structure['currency'];
        $money = MoneyCurrencies::meta($chosen);

        return [
            'payout_method' => $creator->payout_method,
            'payout_currency' => $money['code'],
            'currency_symbol' => $money['symbol'],
            'payout_holder_name' => $creator->payout_holder_name,
            'payout_upi_id' => $creator->payout_upi_id,
            'payout_paypal_email' => $creator->payout_paypal_email,
            'payout_bank_name' => $creator->payout_bank_name,
            'payout_account_number' => $creator->payout_account_number,
            'payout_ifsc' => $creator->payout_ifsc,
            'min_payout_usd' => $structure['min_payout_usd'],
            'platform_fee_percent' => $structure['platform_fee_percent'],
            'auto_payout_eligible' => app(\App\Services\Creators\TrustTierService::class)
                ->isAutoPayoutEligible($creator),
        ];
    }
}
