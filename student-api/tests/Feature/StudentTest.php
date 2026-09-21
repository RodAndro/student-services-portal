<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsStaff(): User
    {
        $user = User::factory()->registrar()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_staff_can_create_a_student(): void
    {
        $this->actingAsStaff();
        $program = Program::factory()->create();

        $response = $this->postJson('/api/v1/students', [
            'student_number' => '2026-00001',
            'first_name' => 'Maria',
            'middle_name' => 'Santos',
            'last_name' => 'Dela Cruz',
            'email' => 'maria@example.com',
            'program_id' => $program->id,
            'year_level' => 2,
            'status' => 'ACTIVE',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Student created successfully.')
            ->assertJsonPath('data.student_number', '2026-00001')
            ->assertJsonPath('data.full_name', 'Maria Santos Dela Cruz');

        $this->assertDatabaseHas('students', ['student_number' => '2026-00001']);
    }

    public function test_a_student_can_be_retrieved(): void
    {
        $this->actingAsStaff();
        $student = Student::factory()->create();

        $this->getJson("/api/v1/students/{$student->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $student->id);
    }

    public function test_a_student_can_be_updated(): void
    {
        $this->actingAsStaff();
        $student = Student::factory()->create(['year_level' => 1]);

        $this->putJson("/api/v1/students/{$student->id}", ['year_level' => 4])
            ->assertStatus(200)
            ->assertJsonPath('data.year_level', 4);

        $this->assertDatabaseHas('students', ['id' => $student->id, 'year_level' => 4]);
    }

    public function test_a_student_can_be_deleted(): void
    {
        $this->actingAsStaff();
        $student = Student::factory()->create();

        $this->deleteJson("/api/v1/students/{$student->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('students', ['id' => $student->id]);
    }

    public function test_a_student_with_enrollments_cannot_be_deleted(): void
    {
        $this->actingAsStaff();
        $student = Student::factory()->create();
        Enrollment::factory()->create(['student_id' => $student->id]);

        $this->deleteJson("/api/v1/students/{$student->id}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('students', ['id' => $student->id]);
    }

    public function test_a_duplicate_student_number_is_rejected(): void
    {
        $this->actingAsStaff();
        $program = Program::factory()->create();
        Student::factory()->create(['student_number' => '2026-00042']);

        $this->postJson('/api/v1/students', [
            'student_number' => '2026-00042',
            'first_name' => 'Juan',
            'last_name' => 'Tamad',
            'program_id' => $program->id,
            'year_level' => 1,
            'status' => 'ACTIVE',
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('student_number');

        $this->assertDatabaseCount('students', 1);
    }

    public function test_an_invalid_email_is_rejected(): void
    {
        $this->actingAsStaff();
        $program = Program::factory()->create();

        $this->postJson('/api/v1/students', [
            'student_number' => '2026-00055',
            'first_name' => 'Bad',
            'last_name' => 'Email',
            'email' => 'not-an-email',
            'program_id' => $program->id,
            'year_level' => 1,
            'status' => 'ACTIVE',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseMissing('students', ['student_number' => '2026-00055']);
    }

    public function test_a_nonexistent_program_is_rejected(): void
    {
        $this->actingAsStaff();

        $this->postJson('/api/v1/students', [
            'student_number' => '2026-00077',
            'first_name' => 'No',
            'last_name' => 'Program',
            'program_id' => 999999,
            'year_level' => 1,
            'status' => 'ACTIVE',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('program_id');
    }

    public function test_an_invalid_year_level_is_rejected(): void
    {
        $this->actingAsStaff();
        $program = Program::factory()->create();

        $this->postJson('/api/v1/students', [
            'student_number' => '2026-00088',
            'first_name' => 'Wrong',
            'last_name' => 'Year',
            'program_id' => $program->id,
            'year_level' => 9,
            'status' => 'ACTIVE',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('year_level');
    }

    public function test_a_missing_student_returns_404(): void
    {
        $this->actingAsStaff();

        $this->getJson('/api/v1/students/999999')
            ->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Not found.');
    }
}
