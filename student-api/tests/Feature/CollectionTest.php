<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CollectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->registrar()->create());
    }

    public function test_students_can_be_searched(): void
    {
        Student::factory()->create(['first_name' => 'Maria', 'last_name' => 'Dela Cruz']);
        Student::factory()->create(['first_name' => 'Jose', 'last_name' => 'Reyes']);

        $response = $this->getJson('/api/v1/students?search=Dela')->assertStatus(200);

        $this->assertSame(1, $response->json('meta.total'));
        $this->assertSame('Dela Cruz', $response->json('data.0.last_name'));
    }

    public function test_students_can_be_filtered(): void
    {
        $bsit = Program::factory()->create();
        $bscs = Program::factory()->create();
        Student::factory()->count(2)->create(['program_id' => $bsit->id, 'year_level' => 3, 'status' => 'ACTIVE']);
        Student::factory()->create(['program_id' => $bscs->id, 'year_level' => 3, 'status' => 'ACTIVE']);
        Student::factory()->create(['program_id' => $bsit->id, 'year_level' => 1, 'status' => 'INACTIVE']);

        $response = $this->getJson("/api/v1/students?program_id={$bsit->id}&year_level=3&status=ACTIVE")
            ->assertStatus(200);

        $this->assertSame(2, $response->json('meta.total'));
    }

    public function test_students_can_be_sorted(): void
    {
        Student::factory()->create(['last_name' => 'Alpha']);
        Student::factory()->create(['last_name' => 'Zeta']);

        $ascending = $this->getJson('/api/v1/students?sort=last_name&direction=asc')->assertStatus(200);
        $this->assertSame('Alpha', $ascending->json('data.0.last_name'));

        $descending = $this->getJson('/api/v1/students?sort=last_name&direction=desc')->assertStatus(200);
        $this->assertSame('Zeta', $descending->json('data.0.last_name'));
    }

    public function test_students_are_paginated(): void
    {
        Student::factory()->count(3)->create();

        $firstPage = $this->getJson('/api/v1/students?per_page=2&page=1')->assertStatus(200);
        $this->assertCount(2, $firstPage->json('data'));
        $this->assertSame(3, $firstPage->json('meta.total'));
        $this->assertSame(2, $firstPage->json('meta.last_page'));
        $this->assertSame(2, $firstPage->json('meta.per_page'));
        $this->assertSame(1, $firstPage->json('meta.current_page'));
        $this->assertSame(1, $firstPage->json('meta.from'));
        $this->assertSame(2, $firstPage->json('meta.to'));

        $secondPage = $this->getJson('/api/v1/students?per_page=2&page=2')->assertStatus(200);
        $this->assertCount(1, $secondPage->json('data'));
        $this->assertSame(2, $secondPage->json('meta.current_page'));
    }

    public function test_per_page_is_capped_at_one_hundred(): void
    {
        $response = $this->getJson('/api/v1/students?per_page=500')->assertStatus(200);

        $this->assertSame(100, $response->json('meta.per_page'));
    }

    public function test_an_unknown_sort_field_falls_back_to_the_default(): void
    {
        Student::factory()->create(['last_name' => 'Alpha']);

        $response = $this->getJson('/api/v1/students?sort=not_a_column&direction=desc')
            ->assertStatus(200);

        $this->assertSame('Alpha', $response->json('data.0.last_name'));
    }

    public function test_programs_can_be_searched_and_paginated(): void
    {
        Program::factory()->create(['code' => 'BSIT', 'name' => 'Information Technology']);
        Program::factory()->create(['code' => 'BSCE', 'name' => 'Civil Engineering']);

        $response = $this->getJson('/api/v1/programs?search=Information&per_page=1')->assertStatus(200);

        $this->assertSame(1, $response->json('meta.total'));
        $this->assertSame('BSIT', $response->json('data.0.code'));
    }
}
