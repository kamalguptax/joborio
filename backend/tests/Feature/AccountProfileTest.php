<?php

namespace Tests\Feature;

use App\Mail\PasswordChangeOtpMail;
use App\Models\Niche;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AccountProfileTest extends TestCase
{
    use RefreshDatabase;

    private function creatorUser(string $handle = 'acctcreator'): User
    {
        $this->seed();

        $user = User::factory()->create();
        $user->assignRole('creator');

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => $handle,
            'niche_ids' => [Niche::query()->value('id')],
            'audience_countries' => ['US'],
            'social_links' => ['website' => 'https://example.com/creator'],
        ])->assertCreated();

        return $user->fresh();
    }

    public function test_photo_and_cover_can_be_uploaded_and_removed(): void
    {
        Storage::fake('public');
        $user = $this->creatorUser();

        $photo = $this->actingAs($user, 'sanctum')->post('/api/v1/auth/profile/photo', [
            'photo' => UploadedFile::fake()->image('me.jpg', 300, 300),
        ], ['Accept' => 'application/json']);
        $photo->assertOk()->assertJsonPath('success', true);
        $this->assertNotEmpty($photo->json('data.avatar_url'));

        $cover = $this->actingAs($user, 'sanctum')->post('/api/v1/auth/profile/cover', [
            'cover' => UploadedFile::fake()->image('cover.png', 1500, 400),
        ], ['Accept' => 'application/json']);
        $cover->assertOk()->assertJsonPath('success', true);
        $this->assertNotEmpty($cover->json('data.cover_url'));

        $me = $this->actingAs($user, 'sanctum')->getJson('/api/v1/auth/me');
        $me->assertOk();
        $this->assertNotEmpty($me->json('data.avatar_url'));
        $this->assertNotEmpty($me->json('data.cover_url'));

        $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/auth/profile/cover')->assertOk();
        $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/auth/profile/photo')->assertOk();

        $me = $this->actingAs($user, 'sanctum')->getJson('/api/v1/auth/me');
        $this->assertNull($me->json('data.avatar_url'));
        $this->assertNull($me->json('data.cover_url'));
    }

    public function test_photo_must_be_an_image(): void
    {
        Storage::fake('public');
        $user = $this->creatorUser();

        $this->actingAs($user, 'sanctum')->post('/api/v1/auth/profile/photo', [
            'photo' => UploadedFile::fake()->create('notes.pdf', 50, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_name_and_username_can_be_changed_and_username_must_be_unique(): void
    {
        $user = $this->creatorUser('firstcreator');

        $other = User::factory()->create();
        $other->assignRole('creator');
        $this->actingAs($other, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'takenhandle',
            'niche_ids' => [Niche::query()->value('id')],
            'audience_countries' => ['US'],
            'social_links' => ['website' => 'https://example.com/other'],
        ])->assertCreated();

        $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/profile', [
            'name' => 'New Name',
            'username' => 'takenhandle',
        ])->assertStatus(422);

        $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/profile', [
            'name' => 'New Name',
            'username' => 'freshhandle',
        ])->assertOk()->assertJsonPath('data.user.creator.handle', 'freshhandle');

        $this->assertSame('New Name', $user->fresh()->name);
    }

    public function test_bio_can_be_saved_and_cleared_without_sending_social_links(): void
    {
        $user = $this->creatorUser();

        $this->actingAs($user, 'sanctum')->putJson('/api/v1/creator/onboarding', [
            'bio' => 'Hello there',
            'accent_color' => '#112233',
        ])->assertOk();
        $this->assertSame('Hello there', $user->creator->fresh()->bio);

        $this->actingAs($user, 'sanctum')->putJson('/api/v1/creator/onboarding', [
            'bio' => '',
        ])->assertOk();
        $this->assertNull($user->creator->fresh()->bio);
    }

    public function test_extra_social_platforms_are_saved(): void
    {
        $user = $this->creatorUser();

        $this->actingAs($user, 'sanctum')->putJson('/api/v1/creator/onboarding', [
            'social_links' => [
                'website' => 'https://example.com/creator',
                'youtube' => 'https://www.youtube.com/@someone',
                'telegram' => 'https://t.me/somechannel',
            ],
        ])->assertOk();

        $links = $user->creator->fresh()->social_links;
        $this->assertSame('https://www.youtube.com/@someone', $links['youtube']);
        $this->assertSame('https://t.me/somechannel', $links['telegram']);
    }

    public function test_password_change_needs_a_valid_otp(): void
    {
        Mail::fake();
        $user = $this->creatorUser();
        $oldHash = $user->password;

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/auth/password/otp')
            ->assertOk()->assertJsonPath('data.otp_sent', true);

        $code = null;
        Mail::assertSent(PasswordChangeOtpMail::class, function (PasswordChangeOtpMail $mail) use (&$code) {
            $code = $mail->otp;

            return true;
        });
        $this->assertNotNull($code);

        $payload = [
            'current_password' => 'password',
            'password' => 'N3w-Passw0rd!x',
            'password_confirmation' => 'N3w-Passw0rd!x',
        ];

        // Missing OTP and wrong OTP are rejected and the password is unchanged.
        $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', $payload)->assertStatus(422);
        $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', $payload + ['otp' => '000000'])
            ->assertStatus(422);
        $this->assertSame($oldHash, $user->fresh()->password);

        $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', $payload + ['otp' => $code])
            ->assertOk();
        $this->assertNotSame($oldHash, $user->fresh()->password);

        // The code is single use.
        $this->actingAs($user, 'sanctum')->putJson('/api/v1/auth/password', [
            'otp' => $code,
            'current_password' => 'N3w-Passw0rd!x',
            'password' => 'An0ther-Passw0rd!y',
            'password_confirmation' => 'An0ther-Passw0rd!y',
        ])->assertStatus(422);
    }

    public function test_otp_cannot_be_requested_twice_in_a_row(): void
    {
        Mail::fake();
        $user = $this->creatorUser();

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/auth/password/otp')->assertOk();
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/auth/password/otp')->assertStatus(422);
    }
}
