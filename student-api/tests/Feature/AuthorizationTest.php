<?php

namespace Tests\Feature;

use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrator_can_access_a_protected_resource(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/students')->assertStatus(200);
    }

    public function test_registrar_can_access_students(): void
    {
        Sanctum::actingAs(User::factory()->registrar()->create());

        $this->getJson('/api/v1/students')->assertStatus(200);
    }

    public function test_student_cannot_list_all_students(): void
    {
        Sanctum::actingAs(User::factory()->student()->create());

        $this->getJson('/api/v1/students')
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_student_cannot_create_a_student(): void
    {
        Sanctum::actingAs(User::factory()->student()->create());
        $program = Program::factory()->create();

        $this->postJson('/api/v1/students', [
            'student_number' => '2026-99999',
            'first_name' => 'Not',
            'last_name' => 'Allowed',
            'program_id' => $program->id,
            'year_level' => 1,
            'status' => 'ACTIVE',
        ])->assertStatus(403);
    }

    public function test_student_can_view_their_own_record(): void
    {
        [$user, $student] = $this->studentWithProfile();
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/students/{$student->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $student->id);
    }

    public function test_student_cannot_view_another_students_record(): void
    {
        [$user] = $this->studentWithProfile();
        $other = Student::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/students/{$other->id}")
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_student_can_view_their_own_academic_record(): void
    {
        [$user, $student] = $this->studentWithProfile();
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/students/{$student->id}/academic-record")->assertStatus(200);
    }

    public function test_student_cannot_view_another_students_academic_record(): void
    {
        [$user] = $this->studentWithProfile();
        $other = Student::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson("/api/v1/students/{$other->id}/academic-record")->assertStatus(403);
    }

    public function test_instructor_cannot_list_all_students(): void
    {
        Sanctum::actingAs(User::factory()->instructor()->create());

        $this->getJson('/api/v1/students')->assertStatus(403);
    }

    public function test_instructor_only_sees_their_own_course_offerings(): void
    {
        $instructor = User::factory()->instructor()->create();
        $otherInstructor = User::factory()->instructor()->create();
        CourseOffering::factory()->create(['instructor_id' => $instructor->id]);
        CourseOffering::factory()->create(['instructor_id' => $otherInstructor->id]);

        Sanctum::actingAs($instructor);

        $response = $this->getJson('/api/v1/course-offerings')->assertStatus(200);

        $this->assertSame(1, $response->json('meta.total'));
        $this->assertSame($instructor->id, $response->json('data.0.instructor_id'));
    }

    public function test_instructor_can_update_a_grade_in_their_own_offering(): void
    {
        [$instructor, $grade] = $this->instructorWithGrade();
        Sanctum::actingAs($instructor);

        $this->putJson("/api/v1/grades/{$grade->id}", ['final_grade' => 92])
            ->assertStatus(200)
            ->assertJsonPath('data.final_grade', 92);
    }

    public function test_instructor_cannot_update_a_grade_in_another_offering(): void
    {
        [, $grade] = $this->instructorWithGrade();
        $otherInstructor = User::factory()->instructor()->create();
        Sanctum::actingAs($otherInstructor);

        $this->putJson("/api/v1/grades/{$grade->id}", ['final_grade' => 60])
            ->assertStatus(403);

        $this->assertDatabaseMissing('grades', ['id' => $grade->id, 'final_grade' => 60]);
    }

    /**
     * @return array{0: User, 1: Student}
     */
    private function studentWithProfile(): array
    {
        $user = User::factory()->student()->create();
        $student = Student::factory()->create(['user_id' => $user->id]);

        return [$user, $student];
    }

    /**
     * @return array{0: User, 1: Grade}
     */
    private function instructorWithGrade(): array
    {
        $instructor = User::factory()->instructor()->create();
        $offering = CourseOffering::factory()->create(['instructor_id' => $instructor->id]);
        $enrollment = Enrollment::factory()->create(['course_offering_id' => $offering->id]);
        $grade = Grade::factory()->create(['enrollment_id' => $enrollment->id]);

        return [$instructor, $grade];
    }
}
