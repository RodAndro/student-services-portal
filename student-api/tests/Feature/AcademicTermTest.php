<?php

namespace Tests\Feature;

use App\Models\AcademicTerm;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AcademicTermTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->registrar()->create());
    }

    public function test_a_term_can_be_created_with_upcoming_status(): void
    {
        $this->postJson('/api/v1/academic-terms', [
            'academic_year' => '2027-2028',
            'semester' => 1,
            'start_date' => '2027-08-01',
            'end_date' => '2027-12-15',
            'status' => 'UPCOMING',
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.status', 'UPCOMING');

        $this->assertDatabaseHas('academic_terms', ['academic_year' => '2027-2028', 'semester' => 1]);
    }

    public function test_an_unknown_status_is_rejected(): void
    {
        $this->postJson('/api/v1/academic-terms', [
            'academic_year' => '2027-2028',
            'semester' => 1,
            'start_date' => '2027-08-01',
            'end_date' => '2027-12-15',
            'status' => 'CANCELLED',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_the_end_date_must_be_after_the_start_date(): void
    {
        $this->postJson('/api/v1/academic-terms', [
            'academic_year' => '2027-2028',
            'semester' => 2,
            'start_date' => '2027-12-15',
            'end_date' => '2027-08-01',
            'status' => 'ACTIVE',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('end_date');
    }

    public function test_duplicate_academic_year_and_semester_is_rejected(): void
    {
        AcademicTerm::factory()->create(['academic_year' => '2026-2027', 'semester' => 1]);

        $this->postJson('/api/v1/academic-terms', [
            'academic_year' => '2026-2027',
            'semester' => 1,
            'start_date' => '2026-08-01',
            'end_date' => '2026-12-15',
            'status' => 'ACTIVE',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('academic_year');
    }

    public function test_a_term_with_course_offerings_cannot_be_deleted(): void
    {
        $term = AcademicTerm::factory()->create();
        CourseOffering::factory()->create(['academic_term_id' => $term->id]);

        $this->deleteJson("/api/v1/academic-terms/{$term->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('academic_terms', ['id' => $term->id]);
    }

    public function test_updating_a_term_end_date_before_the_existing_start_date_is_rejected(): void
    {
        $term = AcademicTerm::factory()->create([
            'start_date' => '2027-08-01',
            'end_date' => '2027-12-15',
        ]);

        $this->putJson("/api/v1/academic-terms/{$term->id}", [
            'end_date' => '2027-07-01',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('end_date');

        $this->assertDatabaseHas('academic_terms', ['id' => $term->id, 'end_date' => '2027-12-15']);
    }

    public function test_updating_a_term_with_both_dates_end_before_start_is_rejected(): void
    {
        $term = AcademicTerm::factory()->create();

        $this->putJson("/api/v1/academic-terms/{$term->id}", [
            'start_date' => '2027-08-01',
            'end_date' => '2027-07-01',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('end_date');
    }

    public function test_updating_a_term_end_date_only_is_allowed_when_after_the_start_date(): void
    {
        $term = AcademicTerm::factory()->create([
            'start_date' => '2027-08-01',
            'end_date' => '2027-12-15',
        ]);

        $this->putJson("/api/v1/academic-terms/{$term->id}", [
            'end_date' => '2027-12-20',
        ])
            ->assertStatus(200)
            ->assertJsonPath('data.end_date', '2027-12-20');
    }
}
