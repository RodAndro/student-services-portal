<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_succeeds_with_valid_credentials(): void
    {
        $user = User::factory()->admin()->create([
            'email' => 'admin@test.com',
            'password' => 'secret-password',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'secret-password',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'admin@test.com')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['token', 'token_type', 'user' => ['id', 'name', 'email', 'role', 'status']],
            ]);

        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $user->id]);
    }

    public function test_login_never_returns_the_password_hash(): void
    {
        User::factory()->create([
            'email' => 'admin@test.com',
            'password' => 'secret-password',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'secret-password',
        ]);

        $response->assertStatus(200);
        $this->assertArrayNotHasKey('password', $response->json('data.user'));
    }

    public function test_login_fails_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'admin@test.com',
            'password' => 'secret-password',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'wrong-password',
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_login_fails_with_unknown_email(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@test.com',
            'password' => 'secret-password',
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_login_fails_for_an_inactive_account(): void
    {
        User::factory()->create([
            'email' => 'inactive@test.com',
            'password' => 'secret-password',
            'status' => 'INACTIVE',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@test.com',
            'password' => 'secret-password',
        ])
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_protected_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_protected_endpoint_rejects_an_invalid_token(): void
    {
        $this->withHeader('Authorization', 'Bearer this-is-not-a-real-token')
            ->getJson('/api/v1/auth/me')
            ->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_me_returns_the_authenticated_user(): void
    {
        $user = User::factory()->registrar()->create(['email' => 'reg@test.com']);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.email', 'reg@test.com')
            ->assertJsonPath('data.role', User::ROLE_REGISTRAR);
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout')
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // The test client keeps the resolved auth guard between requests, so reset
        // it to prove the revoked token is genuinely rejected on a fresh request.
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertStatus(401);
    }
}
