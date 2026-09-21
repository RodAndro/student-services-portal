<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Programs (3)
        Program::factory()->count(3)->create();

        // Courses (20)
        Course::factory()->count(20)->create();

        // Academic terms (2)
        AcademicTerm::create([
            'academic_year' => '2026-2027',
            'semester' => 1,
            'start_date' => '2026-08-10',
            'end_date' => '2026-12-18',
            'status' => 'ACTIVE',
        ]);
        AcademicTerm::create([
            'academic_year' => '2026-2027',
            'semester' => 2,
            'start_date' => '2027-01-11',
            'end_date' => '2027-05-21',
            'status' => 'UPCOMING',
        ]);

        // Test accounts for each role (development only, no real credentials).
        User::factory()->admin()->create([
            'name' => 'System Administrator',
            'email' => 'admin@example.com',
        ]);
        User::factory()->registrar()->create([
            'name' => 'Registrar Staff',
            'email' => 'registrar@example.com',
        ]);
        $instructors = collect([
            User::factory()->instructor()->create([
                'name' => 'Instructor One',
                'email' => 'instructor@example.com',
            ]),
            User::factory()->instructor()->create([
                'name' => 'Instructor Two',
                'email' => 'instructor2@example.com',
            ]),
            User::factory()->instructor()->create([
                'name' => 'Instructor Three',
                'email' => 'instructor3@example.com',
            ]),
        ]);
        $studentUser = User::factory()->student()->create([
            'name' => 'Demo Student',
            'email' => 'student@example.com',
        ]);

        // Students (100) distributed across the 3 programs.
        $programs = Program::all();
        foreach ($programs as $index => $program) {
            $count = $index === 0 ? 34 : 33;
            Student::factory()->count($count)->create([
                'program_id' => $program->id,
            ]);
        }

        // Link the demo student account to one student profile.
        Student::query()->first()->update(['user_id' => $studentUser->id]);

        // Course offerings (20) across existing courses, terms, and instructors.
        $courses = Course::all();
        $terms = AcademicTerm::all();
        $offerings = collect();
        for ($i = 0; $i < 20; $i++) {
            $offerings->push(CourseOffering::factory()->create([
                'course_id' => $courses->random()->id,
                'academic_term_id' => $terms->random()->id,
                'instructor_id' => $instructors->random()->id,
            ]));
        }

        // Enrollments (200) with unique (student, course offering) pairs.
        $students = Student::all();
        $offerings = CourseOffering::all();
        $used = [];
        $created = 0;
        while ($created < 200) {
            $studentId = $students->random()->id;
            $offeringId = $offerings->random()->id;
            $key = $studentId . '-' . $offeringId;

            if (isset($used[$key])) {
                continue;
            }

            $used[$key] = true;
            Enrollment::factory()->create([
                'student_id' => $studentId,
                'course_offering_id' => $offeringId,
            ]);
            $created++;
        }

        // Grades (100) for a random subset of enrollments.
        Enrollment::query()->inRandomOrder()->limit(100)->get()
            ->each(function (Enrollment $enrollment) {
                Grade::factory()->create(['enrollment_id' => $enrollment->id]);
            });
    }
}
