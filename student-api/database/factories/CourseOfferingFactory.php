<?php

namespace Database\Factories;

use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CourseOffering>
 */
class CourseOfferingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'academic_term_id' => AcademicTerm::factory(),
            'instructor_id' => User::factory()->instructor(),
            'section' => fake()->randomElement(['A', 'B', 'C', 'D']).'-'.fake()->numberBetween(1, 4),
            'schedule' => fake()->randomElement(['MWF', 'TTH', 'SAT']).' '.fake()->time('H:i'),
            'room' => 'Room '.fake()->numberBetween(101, 305),
            'capacity' => fake()->numberBetween(30, 50),
            'status' => 'ACTIVE',
        ];
    }
}
