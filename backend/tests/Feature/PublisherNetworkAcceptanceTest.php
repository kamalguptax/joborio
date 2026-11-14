<?php

namespace Tests\Feature;

use App\Models\Creator;
use App\Models\NetworkMember;
use App\Models\Niche;
use App\Models\Publisher;
use App\Models\PublisherApiCredential;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherInvitation;
use App\Models\PublisherLedgerEntry;
use App\Models\PublisherWebhookEvent;
use App\Services\Creators\CreatorOnboardingService;
use App\Services\Publishers\PublisherLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\Support\PublisherTestHelpers;
use Tests\TestCase;

class PublisherNetworkAcceptanceTest extends TestCase
{
    use RefreshDatabase;
    use PublisherTestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedPublisherBasics();
    }

    public function test_publisher_can_register_and_login(): void
    {
        $nicheId = Niche::query()->value('id');
        $captcha = $this->mathCaptcha();

        $register = $this->postJson('/api/v1/auth/publisher/register', array_merge([
            'full_name' => 'Vig Network',
            'username' => 'vignetwork',
            'email' => 'vig@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
            'country' => 'IN',
            'niche_ids' => [$nicheId],
            'job_preferences' => ['full_time', 'remote'],
            'network_type' => 'agency',
            'social_url' => 'https://linkedin.com/company/vig',
            'website_url' => 'https://vig.example.com',
            'integration_preference' => 'dashboard',
            'accepted_terms' => true,
        ], $captcha));

        $register->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.publisher.username', 'vignetwork');

        $loginCaptcha = $this->mathCaptcha();
        $login = $this->postJson('/api/v1/auth/publisher/login', array_merge([
            'email' => 'vig@example.com',
            'password' => 'Password1!',
        ], $loginCaptcha));

        $login->assertOk()->assertJsonPath('success', true);
        $this->assertNotEmpty($login->json('data.token'));

        $token = $login->json('data.token');
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/publisher/dashboard')
            ->assertOk()
            ->assertJsonPath('data.membership.role', 'owner');
    }

    public function test_publisher_can_create_multiple_communities_and_invite_members(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();

        $c1 = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/publisher/communities', ['name' => 'IT & Career'])
            ->assertCreated()
            ->json('data.community.id');

        $c2 = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/publisher/communities', ['name' => 'Education Hub'])
            ->assertCreated()
            ->json('data.community.id');

        $this->assertNotSame($c1, $c2);

        $invite = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/publisher/invitations', [
                'community_id' => $c1,
                'email' => 'member1@example.com',
                'channel' => 'email',
            ])
            ->assertCreated();

        $this->assertStringContainsString('/join/', $invite->json('data.invite_url'));
        $this->assertDatabaseHas('publisher_invitations', [
            'publisher_id' => $publisher->id,
            'email' => 'member1@example.com',
            'status' => 'pending',
        ]);
    }

    public function test_csv_import_reports_row_errors_and_skips_duplicates(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $community = $this->makeCommunity($publisher, ['code' => 'COMIT01']);

        PublisherInvitation::create([
            'publisher_id' => $publisher->id,
            'community_id' => $community->id,
            'token' => PublisherInvitation::makeToken(),
            'email' => 'dup@example.com',
            'channel' => 'csv',
            'status' => 'pending',
            'created_by_user_id' => $owner->id,
            'expires_at' => now()->addDays(14),
        ]);

        $csv = "email,community_code\n".
            "dup@example.com,COMIT01\n".
            "not-an-email,COMIT01\n".
            "good@example.com,COMIT01\n".
            "unknown@example.com,BADCODE\n";

        $file = UploadedFile::fake()->createWithContent('invites.csv', $csv);

        $res = $this->actingAs($owner, 'sanctum')
            ->post('/api/v1/publisher/invitations/import-csv', [
                'file' => $file,
                'community_id' => $community->id,
            ], ['Accept' => 'application/json']);

        $res->assertCreated();
        $summary = $res->json('data.summary');
        $this->assertSame(1, $summary['created']);
        $this->assertSame(1, $summary['skipped_duplicates']);
        $this->assertGreaterThanOrEqual(2, $summary['failed']);
        $this->assertNotEmpty($res->json('data.errors'));
    }

    public function test_invite_accept_creates_network_member_not_creator(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $community = $this->makeCommunity($publisher);

        $invite = PublisherInvitation::create([
            'publisher_id' => $publisher->id,
            'community_id' => $community->id,
            'token' => PublisherInvitation::makeToken(),
            'email' => 'joiner@example.com',
            'channel' => 'link',
            'status' => 'pending',
            'created_by_user_id' => $owner->id,
            'expires_at' => now()->addDays(7),
        ]);

        $captcha = $this->mathCaptcha();
        $accept = $this->postJson('/api/v1/join/invitation/accept', array_merge([
            'token' => $invite->token,
            'name' => 'Joiner Person',
            'email' => 'joiner@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
        ], $captcha));

        $accept->assertOk()->assertJsonPath('data.member.status', 'active');
        $this->assertDatabaseHas('network_members', [
            'publisher_id' => $publisher->id,
            'status' => 'active',
        ]);

        $memberUserId = NetworkMember::query()->where('publisher_id', $publisher->id)->value('user_id');
        $this->assertFalse(Creator::query()->where('user_id', $memberUserId)->exists());
    }

    public function test_active_and_removed_members_cannot_create_creator_until_release(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $memberUser = \App\Models\User::factory()->create(['email' => 'locked@example.com']);
        $memberUser->assignRole('network_member');

        $member = NetworkMember::create([
            'user_id' => $memberUser->id,
            'publisher_id' => $publisher->id,
            'display_name' => 'Locked',
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $service = app(CreatorOnboardingService::class);

        try {
            $service->assertNotActiveNetworkMember($memberUser);
            $this->fail('Expected validation for active member');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('membership', $e->errors());
        }

        $this->actingAs($memberUser, 'sanctum')
            ->postJson('/api/v1/network/membership/leave')
            ->assertOk()
            ->assertJsonPath('data.creator_eligible', false);

        $member->refresh();
        $this->assertSame('removed', $member->status);
        $this->assertNotNull($member->left_at);

        try {
            $service->assertNotActiveNetworkMember($memberUser->fresh());
            $this->fail('Expected validation for removed-but-unreleased member');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('membership', $e->errors());
        }

        $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/publisher/members/{$member->id}/release", [
                'settle_pending' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.creator_eligible', true);

        $member->refresh();
        $this->assertSame('released', $member->status);
        $this->assertNotNull($member->released_at);

        // Should not throw after formal release.
        $service->assertNotActiveNetworkMember($memberUser->fresh());
    }

    public function test_members_cannot_access_publisher_financial_apis_or_rates(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $memberUser = \App\Models\User::factory()->create();
        $memberUser->assignRole('network_member');
        NetworkMember::create([
            'user_id' => $memberUser->id,
            'publisher_id' => $publisher->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $this->actingAs($memberUser, 'sanctum')
            ->getJson('/api/v1/publisher/earnings')
            ->assertForbidden();

        $this->actingAs($memberUser, 'sanctum')
            ->getJson('/api/v1/publisher/payments')
            ->assertForbidden();

        $this->actingAs($memberUser, 'sanctum')
            ->getJson('/api/v1/publisher/integrations')
            ->assertForbidden();

        $dash = $this->actingAs($memberUser, 'sanctum')
            ->getJson('/api/v1/network/dashboard')
            ->assertOk();

        $payload = json_encode($dash->json('data'));
        $this->assertStringNotContainsString('accepted_rate', $payload);
        $this->assertStringNotContainsString('platform_fee', $payload);
        $this->assertStringNotContainsString('commission', $payload);
        $this->assertStringNotContainsString('balance', strtolower($payload));
    }

    public function test_owner_sees_rates_and_locked_assignment_rate_does_not_change(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $community = $this->makeCommunity($publisher);
        $program = $this->makeActiveProgram();

        $assign = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/publisher/assignments', [
                'program_id' => $program->id,
                'community_id' => $community->id,
            ])
            ->assertCreated();

        $this->assertEquals('0.3500', $assign->json('data.assignment.accepted_rate_usd'));
        $assignmentId = $assign->json('data.assignment.id');

        $program->update(['rate_usd' => 0.9900]);

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/publisher/assignments', [
                'program_id' => $program->id,
                'community_id' => $community->id,
            ])
            ->assertCreated();

        $locked = PublisherCampaignAssignment::query()->find($assignmentId);
        $this->assertEquals('0.3500', (string) $locked->accepted_rate_usd);

        $market = $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/publisher/marketplace')
            ->assertOk();
        $this->assertTrue($market->json('data.rates_visible'));
        $this->assertNotNull(collect($market->json('data.campaigns'))->first()['rate_usd'] ?? null);
    }

    public function test_managers_only_see_assigned_communities_and_cannot_access_financials(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        ['user' => $manager] = $this->makePublisherManager($publisher);

        $mine = $this->makeCommunity($publisher, [
            'name' => 'Managed',
            'code' => 'COMMINE',
            'manager_user_id' => $manager->id,
        ]);
        $other = $this->makeCommunity($publisher, [
            'name' => 'Other',
            'code' => 'COMOTHR',
        ]);

        $list = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/publisher/communities')
            ->assertOk();

        $ids = collect($list->json('data.communities'))->pluck('id')->all();
        $this->assertContains($mine->id, $ids);
        $this->assertNotContains($other->id, $ids);

        $this->actingAs($manager, 'sanctum')
            ->postJson('/api/v1/publisher/invitations', [
                'community_id' => $other->id,
                'email' => 'x@example.com',
            ])
            ->assertStatus(422);

        $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/publisher/earnings')
            ->assertStatus(422);

        $market = $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/publisher/marketplace')
            ->assertOk();
        $this->assertFalse($market->json('data.rates_visible'));
    }

    public function test_cross_publisher_community_access_is_denied(): void
    {
        ['user' => $ownerA, 'publisher' => $pubA] = $this->makePublisherOwner('ownera');
        ['publisher' => $pubB] = $this->makePublisherOwner('ownerb');
        $foreign = $this->makeCommunity($pubB);

        $this->actingAs($ownerA, 'sanctum')
            ->putJson('/api/v1/publisher/communities/'.$foreign->id, ['status' => 'paused'])
            ->assertNotFound();

        $this->assertSame('active', $foreign->fresh()->status);
        $this->assertSame($pubA->id, Publisher::query()->where('username', 'ownera')->value('id'));
    }

    public function test_expired_and_reused_invitation_tokens_are_rejected(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $invite = PublisherInvitation::create([
            'publisher_id' => $publisher->id,
            'token' => PublisherInvitation::makeToken(),
            'email' => 'expire@example.com',
            'channel' => 'link',
            'status' => 'pending',
            'created_by_user_id' => $owner->id,
            'expires_at' => now()->subDay(),
        ]);

        $this->getJson('/api/v1/join/invitation?token='.$invite->token)
            ->assertStatus(422);

        $fresh = PublisherInvitation::create([
            'publisher_id' => $publisher->id,
            'token' => PublisherInvitation::makeToken(),
            'email' => 'once@example.com',
            'channel' => 'link',
            'status' => 'pending',
            'created_by_user_id' => $owner->id,
            'expires_at' => now()->addDays(3),
        ]);

        $captcha = $this->mathCaptcha();
        $this->postJson('/api/v1/join/invitation/accept', array_merge([
            'token' => $fresh->token,
            'name' => 'Once',
            'email' => 'once@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
        ], $captcha))->assertOk();

        $captcha2 = $this->mathCaptcha();
        $this->postJson('/api/v1/join/invitation/accept', array_merge([
            'token' => $fresh->token,
            'name' => 'Twice',
            'email' => 'twice@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
        ], $captcha2))->assertStatus(422);
    }

    public function test_ledger_reversals_are_immutable_adjustments_and_settlements_are_separate(): void
    {
        ['publisher' => $publisher] = $this->makePublisherOwner();
        $ledger = app(PublisherLedgerService::class);

        $credit = $ledger->post($publisher, [
            'entry_type' => 'credit',
            'net_usd' => 10,
            'gross_usd' => 12,
            'platform_fee_usd' => 2,
            'state' => 'approved',
            'idempotency_key' => 'evt-1',
        ]);

        $again = $ledger->post($publisher, [
            'entry_type' => 'credit',
            'net_usd' => 10,
            'state' => 'approved',
            'idempotency_key' => 'evt-1',
        ]);
        $this->assertSame($credit->id, $again->id);

        $reversal = $ledger->post($publisher, [
            'entry_type' => 'reversal',
            'net_usd' => 10,
            'state' => 'approved',
            'reverses_ledger_id' => $credit->id,
            'idempotency_key' => 'evt-1-rev',
        ]);

        $this->assertDatabaseHas('publisher_ledger', ['id' => $credit->id, 'net_usd' => 10]);
        $this->assertDatabaseHas('publisher_ledger', [
            'id' => $reversal->id,
            'entry_type' => 'reversal',
            'reverses_ledger_id' => $credit->id,
        ]);
        $this->assertSame(2, PublisherLedgerEntry::query()->where('publisher_id', $publisher->id)->count());

        \App\Models\MemberSettlementRecord::create([
            'publisher_id' => $publisher->id,
            'network_member_id' => NetworkMember::create([
                'user_id' => \App\Models\User::factory()->create()->id,
                'publisher_id' => $publisher->id,
                'status' => 'active',
                'joined_at' => now(),
            ])->id,
            'status' => 'pending',
            'amount_usd' => 5,
        ]);

        $this->assertDatabaseCount('member_settlement_records', 1);
        $this->assertDatabaseCount('publisher_ledger', 2);
    }

    public function test_duplicate_publisher_webhook_events_are_idempotent(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $key = PublisherApiCredential::generateApiKey();
        $secret = PublisherApiCredential::generateWebhookSecret();

        PublisherApiCredential::create([
            'publisher_id' => $publisher->id,
            'name' => 'Test',
            'key_prefix' => $key['key_prefix'],
            'key_hash' => $key['key_hash'],
            'webhook_secret_prefix' => $secret['webhook_secret_prefix'],
            'webhook_secret_hash' => $secret['webhook_secret_hash'],
            'is_active' => true,
            'created_by_user_id' => $owner->id,
        ]);

        $payload = [
            'event_id' => 'partner-evt-99',
            'event_type' => 'action.confirmed',
            'amount' => 1.25,
        ];

        $first = $this->postJson(
            '/api/v1/webhooks/publisher/'.$publisher->code,
            $payload,
            ['X-Joborio-Webhook-Secret' => $secret['webhook_secret']],
        )->assertCreated();

        $second = $this->postJson(
            '/api/v1/webhooks/publisher/'.$publisher->code,
            $payload,
            ['X-Joborio-Webhook-Secret' => $secret['webhook_secret']],
        )->assertOk();

        $this->assertTrue($second->json('data.duplicate'));
        $this->assertSame(1, PublisherWebhookEvent::query()->where('publisher_id', $publisher->id)->count());
        $this->assertFalse($first->json('data.duplicate'));
    }

    public function test_unauthenticated_publisher_routes_are_denied(): void
    {
        $this->getJson('/api/v1/publisher/dashboard')->assertUnauthorized();
        $this->getJson('/api/v1/publisher/earnings')->assertUnauthorized();
        $this->getJson('/api/v1/network/dashboard')->assertUnauthorized();
    }

    public function test_member_activity_counts_exclude_financials_and_other_members(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $memberUser = \App\Models\User::factory()->create(['email' => 'act@example.com']);
        $memberUser->assignRole('network_member');
        $otherUser = \App\Models\User::factory()->create(['email' => 'otheract@example.com']);
        $otherUser->assignRole('network_member');

        $member = NetworkMember::create([
            'user_id' => $memberUser->id,
            'publisher_id' => $publisher->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        $other = NetworkMember::create([
            'user_id' => $otherUser->id,
            'publisher_id' => $publisher->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $activity = app(\App\Services\Publishers\MemberActivityService::class);
        $activity->record($member, [
            'activity_type' => 'click',
            'tracking_id' => 'trk-keep-me',
            'external_event_id' => 'a1',
            'meta' => ['cpc' => 9.99, 'note' => 'ok'],
        ]);
        $activity->record($member, [
            'activity_type' => 'signup',
            'external_event_id' => 'a2',
        ]);
        $activity->record($other, [
            'activity_type' => 'click',
            'external_event_id' => 'b1',
        ]);

        $stored = \App\Models\MemberActivityEvent::query()->where('external_event_id', 'a1')->first();
        $this->assertSame('trk-keep-me', $stored->tracking_id);
        $this->assertArrayNotHasKey('cpc', $stored->meta ?? []);
        $this->assertSame('ok', $stored->meta['note'] ?? null);

        $dash = $this->actingAs($memberUser, 'sanctum')
            ->getJson('/api/v1/network/dashboard')
            ->assertOk();

        $this->assertSame(1, $dash->json('data.activity.clicks_total'));
        $this->assertSame(1, $dash->json('data.activity.signups'));
        $payload = json_encode($dash->json('data'));
        $this->assertStringNotContainsString('9.99', $payload);
        $this->assertStringNotContainsString('"cpc"', $payload);

        $pubView = $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/publisher/members/'.$member->id.'/activity')
            ->assertOk();
        $this->assertSame(1, $pubView->json('data.activity.signups'));

        $this->actingAs($memberUser, 'sanctum')
            ->getJson('/api/v1/publisher/members/'.$other->id.'/activity')
            ->assertForbidden();
    }

    public function test_publisher_can_only_select_permitted_commission_percentages(): void
    {
        ['user' => $owner] = $this->makePublisherOwner();

        $this->actingAs($owner, 'sanctum')
            ->putJson('/api/v1/publisher/commission', ['commission_percent' => 17])
            ->assertStatus(422);

        $ok = $this->actingAs($owner, 'sanctum')
            ->putJson('/api/v1/publisher/commission', ['commission_percent' => 20])
            ->assertOk();

        $this->assertEquals(20, (float) $ok->json('data.commission.commission_percent'));
        $this->assertContains(20, $ok->json('data.permitted_percentages'));
    }

    public function test_webhook_activity_preserves_tracking_id_without_financial_meta(): void
    {
        ['user' => $owner, 'publisher' => $publisher] = $this->makePublisherOwner();
        $memberUser = \App\Models\User::factory()->create(['email' => 'hookmem@example.com']);
        NetworkMember::create([
            'user_id' => $memberUser->id,
            'publisher_id' => $publisher->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $key = PublisherApiCredential::generateApiKey();
        $secret = PublisherApiCredential::generateWebhookSecret();
        PublisherApiCredential::create([
            'publisher_id' => $publisher->id,
            'name' => 'Hooks',
            'key_prefix' => $key['key_prefix'],
            'key_hash' => $key['key_hash'],
            'webhook_secret_prefix' => $secret['webhook_secret_prefix'],
            'webhook_secret_hash' => $secret['webhook_secret_hash'],
            'is_active' => true,
            'created_by_user_id' => $owner->id,
        ]);

        $res = $this->postJson(
            '/api/v1/webhooks/publisher/'.$publisher->code,
            [
                'event_id' => 'partner-act-1',
                'event_type' => 'action.confirmed',
                'activity_type' => 'action_approved',
                'member_email' => 'hookmem@example.com',
                'tracking_id' => 'TRACK-123',
                'amount_usd' => 4.5,
                'platform_fee' => 1.1,
            ],
            ['X-Joborio-Webhook-Secret' => $secret['webhook_secret']],
        )->assertCreated();

        $this->assertTrue($res->json('data.activity_recorded'));
        $this->assertSame('TRACK-123', $res->json('data.tracking_id'));

        $row = \App\Models\MemberActivityEvent::query()
            ->where('external_event_id', 'partner-act-1')
            ->first();
        $this->assertSame('TRACK-123', $row->tracking_id);
        $this->assertSame('action_approved', $row->activity_type);
    }
}
