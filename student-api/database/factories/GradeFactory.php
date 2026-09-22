<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\Grade;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Grade>
 */
class GradeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'enrollment_id' => Enrollment::factory(),
            'midterm_grade' => fake()->randomFloat(2, 60, 100),
            'final_grade' => fake()->randomFloat(2, 60, 100),
        ];
    }
}
