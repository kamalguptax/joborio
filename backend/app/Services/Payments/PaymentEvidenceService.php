<?php

namespace App\Services\Payments;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentEvidenceService
{
    public const DISK = 'local';

    public const MAX_KB = 10240; // 10 MB

    /** @var list<string> */
    public const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    /**
     * @return array{
     *   evidence_path: string,
     *   evidence_original_name: string,
     *   evidence_mime: string,
     *   evidence_size: int,
     *   evidence_uploaded_at: \Illuminate\Support\Carbon
     * }
     */
    public function store(UploadedFile $file, string $folder): array
    {
        if (! $file->isValid()) {
            throw new InvalidArgumentException('Uploaded evidence file is invalid.');
        }

        $mime = (string) ($file->getMimeType() ?: $file->getClientMimeType());
        if (! in_array($mime, self::ALLOWED_MIMES, true)) {
            throw new InvalidArgumentException('Evidence must be a JPG, PNG, WEBP, or PDF file.');
        }

        if ($file->getSize() > self::MAX_KB * 1024) {
            throw new InvalidArgumentException('Evidence file must be 10 MB or smaller.');
        }

        $ext = strtolower((string) ($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin'));
        $safeExt = preg_replace('/[^a-z0-9]/', '', $ext) ?: 'bin';
        $name = now()->format('YmdHis').'_'.Str::random(10).'.'.$safeExt;
        $dir = trim($folder, '/');
        $path = $file->storeAs($dir, $name, self::DISK);

        if (! $path) {
            throw new InvalidArgumentException('Could not store payment evidence.');
        }

        return [
            'evidence_path' => $path,
            'evidence_original_name' => Str::limit((string) $file->getClientOriginalName(), 240, ''),
            'evidence_mime' => $mime,
            'evidence_size' => (int) $file->getSize(),
            'evidence_uploaded_at' => now(),
        ];
    }

    /**
     * @param  object{
     *   evidence_path?: string|null,
     *   evidence_original_name?: string|null,
     *   evidence_mime?: string|null
     * }  $record
     */
    public function download(object $record): StreamedResponse
    {
        $path = (string) ($record->evidence_path ?? '');
        if ($path === '' || ! Storage::disk(self::DISK)->exists($path)) {
            abort(404, 'Payment evidence not found.');
        }

        $downloadName = (string) ($record->evidence_original_name ?: basename($path));
        $mime = (string) ($record->evidence_mime ?: 'application/octet-stream');

        return Storage::disk(self::DISK)->download($path, $downloadName, [
            'Content-Type' => $mime,
        ]);
    }

    /**
     * @return array{has_evidence: bool, evidence_original_name: ?string, evidence_note: ?string, evidence_uploaded_at: ?string}
     */
    public function meta(?object $record): array
    {
        if (! $record) {
            return [
                'has_evidence' => false,
                'evidence_original_name' => null,
                'evidence_note' => null,
                'evidence_uploaded_at' => null,
            ];
        }

        $path = (string) ($record->evidence_path ?? '');

        return [
            'has_evidence' => $path !== '',
            'evidence_original_name' => $record->evidence_original_name ?? null,
            'evidence_note' => $record->evidence_note ?? null,
            'evidence_uploaded_at' => isset($record->evidence_uploaded_at)
                ? optional($record->evidence_uploaded_at)->toIso8601String()
                : null,
        ];
    }
}
