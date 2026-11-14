<?php

namespace Database\Seeders;

use App\Models\CommunityMember;
use App\Models\MemberActivityEvent;
use App\Models\MemberSettlementRecord;
use App\Models\NetworkMember;
use App\Models\Niche;
use App\Models\Program;
use App\Models\Publisher;
use App\Models\PublisherApiCredential;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherCommission;
use App\Models\PublisherCommunity;
use App\Models\PublisherInvitation;
use App\Models\PublisherLedgerEntry;
use App\Models\PublisherUser;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublisherDemoSeeder extends Seeder
{
    public function run(): void
    {
        $nicheIds = Niche::query()->pluck('id')->take(3)->all();
        if ($nicheIds === []) {
            $this->command?->warn('PublisherDemoSeeder: niches missing — run NicheSeeder first.');

            return;
        }

        $owner = User::firstOrCreate(
            ['email' => 'publisher@joborio.com'],
            [
                'name' => 'Demo Publisher',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if (! $owner->hasRole('publisher')) {
            $owner->assignRole('publisher');
        }

        $manager = User::firstOrCreate(
            ['email' => 'publisher.manager@joborio.com'],
            [
                'name' => 'Demo Pub Manager',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        if (! $manager->hasRole('publisher')) {
            $manager->assignRole('publisher');
        }

        $publisher = Publisher::firstOrCreate(
            ['username' => 'demopub'],
            [
                'code' => 'PUBDEMO1',
                'display_name' => 'Demo Publisher Network',
                'country_code' => 'IN',
                'network_type' => 'publisher',
                'social_url' => 'https://linkedin.com/company/joborio-demo-pub',
                'website_url' => 'https://joborio.com',
                'integration_preference' => 'dashboard',
                'niche_ids' => $nicheIds,
                'job_preferences' => ['full_time', 'remote'],
                'status' => Publisher::STATUS_ACTIVATED,
                'email_verified_at' => now()->subDays(14),
                'social_reviewed_at' => now()->subDays(10),
                'commercial_approved_at' => now()->subDays(7),
                'activated_at' => now()->subDays(5),
                'notification_preferences' => [
                    'email_invites' => true,
                    'email_earnings' => true,
                    'email_member_activity' => true,
                ],
            ]
        );

        if ($publisher->status !== Publisher::STATUS_ACTIVATED) {
            $publisher->update([
                'status' => Publisher::STATUS_ACTIVATED,
                'email_verified_at' => $publisher->email_verified_at ?? now()->subDays(14),
                'social_reviewed_at' => $publisher->social_reviewed_at ?? now()->subDays(10),
                'commercial_approved_at' => $publisher->commercial_approved_at ?? now()->subDays(7),
                'activated_at' => $publisher->activated_at ?? now()->subDays(5),
            ]);
        }

        PublisherUser::firstOrCreate(
            ['publisher_id' => $publisher->id, 'user_id' => $owner->id],
            ['role' => 'owner', 'is_active' => true]
        );
        PublisherUser::firstOrCreate(
            ['publisher_id' => $publisher->id, 'user_id' => $manager->id],
            ['role' => 'manager', 'is_active' => true]
        );

        $techCommunity = PublisherCommunity::firstOrCreate(
            ['publisher_id' => $publisher->id, 'code' => 'TECHIN'],
            [
                'name' => 'India Tech Creators',
                'category' => 'technology',
                'description' => 'Software and IT job seekers across India.',
                'country_code' => 'IN',
                'campaign_access' => 'all_eligible',
                'manager_user_id' => $manager->id,
                'status' => 'active',
            ]
        );

        $eduCommunity = PublisherCommunity::firstOrCreate(
            ['publisher_id' => $publisher->id, 'code' => 'EDUGL'],
            [
                'name' => 'Global Learning Hub',
                'category' => 'education',
                'description' => 'Courses and bootcamp audiences.',
                'country_code' => 'US',
                'campaign_access' => 'selected',
                'manager_user_id' => null,
                'status' => 'active',
            ]
        );

        PublisherCommission::firstOrCreate(
            ['publisher_id' => $publisher->id, 'version' => 1],
            [
                'commission_percent' => 70.00,
                'currency' => 'USD',
                'status' => 'active',
                'effective_from' => now()->subDays(5),
                'approved_by_user_id' => User::query()->where('email', 'admin@joborio.com')->value('id'),
                'notes' => 'Demo default split — publisher keeps 70%.',
            ]
        );

        $programs = Program::query()->where('status', 'active')->orderBy('id')->get();
        $assignments = [];
        if ($programs->isNotEmpty()) {
            $first = $programs->first();
            $assignments[] = PublisherCampaignAssignment::firstOrCreate(
                [
                    'publisher_id' => $publisher->id,
                    'community_id' => $techCommunity->id,
                    'program_id' => $first->id,
                ],
                [
                    'status' => 'active',
                    'pricing_model' => $first->pricing_model ?? 'ppc',
                    'accepted_rate_usd' => $first->rate_usd ?? 0.05,
                    'rate_version' => 1,
                    'accepted_at' => now()->subDays(4),
                    'assigned_by_user_id' => $owner->id,
                ]
            );

            $second = $programs->skip(1)->first() ?? $first;
            $assignments[] = PublisherCampaignAssignment::firstOrCreate(
                [
                    'publisher_id' => $publisher->id,
                    'community_id' => $eduCommunity->id,
                    'program_id' => $second->id,
                ],
                [
                    'status' => 'active',
                    'pricing_model' => $second->pricing_model ?? 'ppr',
                    'accepted_rate_usd' => $second->rate_usd ?? 0.35,
                    'rate_version' => 1,
                    'accepted_at' => now()->subDays(3),
                    'assigned_by_user_id' => $owner->id,
                ]
            );
        }

        $memberSpecs = [
            [
                'email' => 'member.tech1@joborio.com',
                'name' => 'Asha Verma',
                'display_name' => 'Asha V',
                'community' => $techCommunity,
            ],
            [
                'email' => 'member.tech2@joborio.com',
                'name' => 'Rohan Mehta',
                'display_name' => 'Rohan M',
                'community' => $techCommunity,
            ],
            [
                'email' => 'member.edu1@joborio.com',
                'name' => 'Priya Shah',
                'display_name' => 'Priya S',
                'community' => $eduCommunity,
            ],
        ];

        $networkMembers = [];
        foreach ($memberSpecs as $spec) {
            $memberUser = User::firstOrCreate(
                ['email' => $spec['email']],
                [
                    'name' => $spec['name'],
                    'password' => Hash::make('password'),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
            if (! $memberUser->hasRole('network_member')) {
                $memberUser->assignRole('network_member');
            }

            $nm = NetworkMember::firstOrCreate(
                ['user_id' => $memberUser->id, 'publisher_id' => $publisher->id],
                [
                    'display_name' => $spec['display_name'],
                    'status' => 'active',
                    'joined_at' => now()->subDays(4),
                ]
            );

            CommunityMember::firstOrCreate(
                [
                    'community_id' => $spec['community']->id,
                    'network_member_id' => $nm->id,
                ],
                [
                    'status' => 'active',
                    'joined_at' => now()->subDays(4),
                ]
            );

            $networkMembers[] = ['member' => $nm, 'community' => $spec['community']];
        }

        PublisherInvitation::firstOrCreate(
            [
                'publisher_id' => $publisher->id,
                'email' => 'invite.pending@joborio.com',
                'status' => 'pending',
            ],
            [
                'community_id' => $techCommunity->id,
                'token' => PublisherInvitation::makeToken(),
                'channel' => 'email',
                'created_by_user_id' => $owner->id,
                'expires_at' => now()->addDays(14),
            ]
        );

        PublisherInvitation::firstOrCreate(
            ['token' => 'demo_invite_link_token_edu_hub_2026'],
            [
                'publisher_id' => $publisher->id,
                'community_id' => $eduCommunity->id,
                'email' => null,
                'channel' => 'link',
                'status' => 'pending',
                'created_by_user_id' => $manager->id,
                'expires_at' => now()->addDays(30),
            ]
        );

        $assignment = $assignments[0] ?? null;
        if ($assignment && ! PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->where('idempotency_key', 'demo-pub-credit-001')
            ->exists()) {
            PublisherLedgerEntry::create([
                'publisher_id' => $publisher->id,
                'community_id' => $techCommunity->id,
                'campaign_assignment_id' => $assignment->id,
                'entry_type' => 'credit',
                'source' => 'partner_confirmed',
                'state' => 'payable',
                'gross_usd' => 42.5000,
                'platform_fee_usd' => 12.7500,
                'net_usd' => 29.7500,
                'currency' => 'USD',
                'reference' => 'DEMO-PPC-WEEK-1',
                'idempotency_key' => 'demo-pub-credit-001',
                'meta' => ['label' => 'Demo PPC week 1'],
                'occurred_at' => now()->subDays(3),
                'approved_at' => now()->subDays(2),
            ]);

            PublisherLedgerEntry::create([
                'publisher_id' => $publisher->id,
                'community_id' => $eduCommunity->id,
                'campaign_assignment_id' => $assignments[1]->id ?? $assignment->id,
                'entry_type' => 'credit',
                'source' => 'partner_confirmed',
                'state' => 'paid',
                'gross_usd' => 18.0000,
                'platform_fee_usd' => 5.4000,
                'net_usd' => 12.6000,
                'currency' => 'USD',
                'reference' => 'DEMO-PPR-WEEK-0',
                'idempotency_key' => 'demo-pub-credit-002',
                'meta' => ['label' => 'Demo PPR prior week'],
                'occurred_at' => now()->subDays(10),
                'approved_at' => now()->subDays(8),
                'paid_at' => now()->subDays(6),
            ]);

            PublisherLedgerEntry::create([
                'publisher_id' => $publisher->id,
                'community_id' => $techCommunity->id,
                'campaign_assignment_id' => $assignment->id,
                'entry_type' => 'credit',
                'source' => 'partner_confirmed',
                'state' => 'pending',
                'gross_usd' => 8.2500,
                'platform_fee_usd' => 2.4750,
                'net_usd' => 5.7750,
                'currency' => 'USD',
                'reference' => 'DEMO-PPC-WEEK-2',
                'idempotency_key' => 'demo-pub-credit-003',
                'meta' => ['label' => 'Demo PPC awaiting approval'],
                'occurred_at' => now()->subDay(),
            ]);
        }

        if ($networkMembers !== []) {
            $first = $networkMembers[0];
            MemberSettlementRecord::firstOrCreate(
                [
                    'publisher_id' => $publisher->id,
                    'network_member_id' => $first['member']->id,
                    'period_label' => '2026-10',
                ],
                [
                    'community_id' => $first['community']->id,
                    'status' => 'settled',
                    'amount_usd' => 4.5000,
                    'currency' => 'USD',
                    'period_start' => now()->subMonth()->startOfMonth(),
                    'period_end' => now()->subMonth()->endOfMonth(),
                    'settled_at' => now()->subDays(6),
                    'notes' => 'Demo member payout for October.',
                    'created_by_user_id' => $owner->id,
                ]
            );

            MemberSettlementRecord::firstOrCreate(
                [
                    'publisher_id' => $publisher->id,
                    'network_member_id' => $first['member']->id,
                    'period_label' => '2026-11',
                ],
                [
                    'community_id' => $first['community']->id,
                    'status' => 'pending',
                    'amount_usd' => 2.1000,
                    'currency' => 'USD',
                    'period_start' => now()->startOfMonth(),
                    'period_end' => now()->endOfMonth(),
                    'notes' => 'Demo in-progress November settlement.',
                    'created_by_user_id' => $owner->id,
                ]
            );
        }

        foreach ($networkMembers as $i => $row) {
            $types = ['click', 'click_valid', 'application', 'lead'];
            $assignmentId = $assignments !== []
                ? $assignments[$i % count($assignments)]->id
                : null;
            foreach ($types as $t => $type) {
                $extId = 'demo-act-'.$publisher->id.'-'.$row['member']->id.'-'.$type;
                MemberActivityEvent::firstOrCreate(
                    [
                        'publisher_id' => $publisher->id,
                        'external_event_id' => $extId,
                    ],
                    [
                        'network_member_id' => $row['member']->id,
                        'community_id' => $row['community']->id,
                        'campaign_assignment_id' => $assignmentId,
                        'activity_type' => $type,
                        'status' => 'counted',
                        'tracking_id' => 'trk_demo_'.Str::lower(Str::random(8)),
                        'meta' => ['source' => 'seed', 'member' => $row['member']->display_name],
                        'occurred_at' => now()->subHours(($i + 1) * ($t + 1) * 3),
                    ]
                );
            }
        }

        if (! PublisherApiCredential::query()->where('publisher_id', $publisher->id)->where('name', 'Demo Dashboard Key')->exists()) {
            $key = PublisherApiCredential::generateApiKey();
            $secret = PublisherApiCredential::generateWebhookSecret();
            PublisherApiCredential::create([
                'publisher_id' => $publisher->id,
                'name' => 'Demo Dashboard Key',
                'key_prefix' => $key['key_prefix'],
                'key_hash' => $key['key_hash'],
                'webhook_secret_prefix' => $secret['webhook_secret_prefix'],
                'webhook_secret_hash' => $secret['webhook_secret_hash'],
                'outbound_webhook_url' => 'https://example.com/webhooks/joborio-publisher',
                'is_active' => true,
                'created_by_user_id' => $owner->id,
            ]);
        }

        $this->command?->info('Publisher demo ready:');
        $this->command?->info('  Owner:    publisher@joborio.com / password  (username: demopub)');
        $this->command?->info('  Manager:  publisher.manager@joborio.com / password');
        $this->command?->info('  Members:  member.tech1@joborio.com, member.tech2@joborio.com, member.edu1@joborio.com / password');
    }
}
