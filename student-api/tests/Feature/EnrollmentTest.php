<?php

namespace Tests\Feature;

use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_valid_enrollment_can_be_created(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $student = Student::factory()->create();
        $offering = CourseOffering::factory()->create(['capacity' => 40]);

        $this->postJson('/api/v1/enrollments', [
            'student_id' => $student->id,
            'course_offering_id' => $offering->id,
        ])
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'ENROLLED');

        $this->assertDatabaseHas('enrollments', [
            'student_id' => $student->id,
            'course_offering_id' => $offering->id,
        ]);
    }

    public function test_duplicate_enrollment_is_prevented(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $student = Student::factory()->create();
        $offering = CourseOffering::factory()->create(['capacity' => 40]);
        Enrollment::factory()->create([
            'student_id' => $student->id,
            'course_offering_id' => $offering->id,
        ]);

        $this->postJson('/api/v1/enrollments', [
            'student_id' => $student->id,
            'course_offering_id' => $offering->id,
        ])
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_enrollment_requires_a_valid_student(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $offering = CourseOffering::factory()->create();

        $this->postJson('/api/v1/enrollments', [
            'student_id' => 999999,
            'course_offering_id' => $offering->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('student_id');
    }

    public function test_enrollment_requires_a_valid_course_offering(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $student = Student::factory()->create();

        $this->postJson('/api/v1/enrollments', [
            'student_id' => $student->id,
            'course_offering_id' => 999999,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('course_offering_id');
    }

    public function test_enrollment_beyond_capacity_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $offering = CourseOffering::factory()->create(['capacity' => 1]);
        Enrollment::factory()->create(['course_offering_id' => $offering->id]);

        $student = Student::factory()->create();

        $this->postJson('/api/v1/enrollments', [
            'student_id' => $student->id,
            'course_offering_id' => $offering->id,
        ])
            ->assertStatus(409)
            ->assertJsonPath('success', false);
    }

    public function test_a_students_enrollments_can_be_listed(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $student = Student::factory()->create();
        Enrollment::factory()->count(2)->create(['student_id' => $student->id]);

        $this->getJson("/api/v1/students/{$student->id}/enrollments")
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 2);
    }

    public function test_students_in_a_course_offering_can_be_listed(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());
        $offering = CourseOffering::factory()->create();
        Enrollment::factory()->count(3)->create(['course_offering_id' => $offering->id]);

        $this->getJson("/api/v1/course-offerings/{$offering->id}/students")
            ->assertStatus(200)
            ->assertJsonPath('meta.total', 3);
    }
}
