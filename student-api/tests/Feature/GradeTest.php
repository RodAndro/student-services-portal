<?php

namespace Tests\Feature;

use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GradeTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_valid_grade_can_be_created_and_remarks_are_computed(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $enrollment = Enrollment::factory()->create();

        $this->postJson('/api/v1/grades', [
            'enrollment_id' => $enrollment->id,
            'midterm_grade' => 88,
            'final_grade' => 90,
        ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.remarks', 'PASSED');

        $this->assertDatabaseHas('grades', [
            'enrollment_id' => $enrollment->id,
            'remarks' => 'PASSED',
        ]);
    }

    public function test_a_failing_final_grade_is_marked_failed(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $enrollment = Enrollment::factory()->create();

        $this->postJson('/api/v1/grades', [
            'enrollment_id' => $enrollment->id,
            'final_grade' => 60,
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.remarks', 'FAILED');
    }

    public function test_a_grade_without_a_final_grade_is_in_progress(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $enrollment = Enrollment::factory()->create();

        $this->postJson('/api/v1/grades', [
            'enrollment_id' => $enrollment->id,
            'midterm_grade' => 80,
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.remarks', 'IN PROGRESS');
    }

    public function test_a_grade_requires_a_valid_enrollment(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());

        $this->postJson('/api/v1/grades', [
            'enrollment_id' => 999999,
            'final_grade' => 85,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('enrollment_id');
    }

    public function test_a_grade_is_limited_to_a_valid_range(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $enrollment = Enrollment::factory()->create();

        $this->postJson('/api/v1/grades', [
            'enrollment_id' => $enrollment->id,
            'final_grade' => 150,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('final_grade');
    }

    public function test_a_duplicate_grade_for_an_enrollment_is_prevented(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $enrollment = Enrollment::factory()->create();
        Grade::factory()->create(['enrollment_id' => $enrollment->id]);

        $this->postJson('/api/v1/grades', [
            'enrollment_id' => $enrollment->id,
            'final_grade' => 75,
        ])
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('grades', 1);
    }

    public function test_an_instructor_cannot_create_a_grade_for_another_offering(): void
    {
        $instructor = User::factory()->instructor()->create();
        $otherInstructor = User::factory()->instructor()->create();
        $offering = CourseOffering::factory()->create(['instructor_id' => $instructor->id]);
        $enrollment = Enrollment::factory()->create(['course_offering_id' => $offering->id]);

        Sanctum::actingAs($otherInstructor);

        $this->postJson('/api/v1/grades', [
            'enrollment_id' => $enrollment->id,
            'final_grade' => 90,
        ])->assertStatus(403);

        $this->assertDatabaseCount('grades', 0);
    }

    public function test_a_student_cannot_modify_a_grade(): void
    {
        $enrollment = Enrollment::factory()->create();
        $grade = Grade::factory()->create(['enrollment_id' => $enrollment->id]);

        Sanctum::actingAs(User::factory()->student()->create());

        $this->putJson("/api/v1/grades/{$grade->id}", ['final_grade' => 99])
            ->assertStatus(403);
    }
}
