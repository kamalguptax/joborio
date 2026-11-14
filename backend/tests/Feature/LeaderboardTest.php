<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_leaderboard_returns_json(): void
    {
        $response = $this->getJson('/api/v1/public/leaderboard');
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['period_days', 'leaderboard']]);
    }
}
