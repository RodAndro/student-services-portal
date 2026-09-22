<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'course_code' => fake()->unique()->bothify('CS###'),
            'course_title' => ucwords(fake()->words(3, true)),
            'description' => fake()->sentence(),
            'units' => fake()->numberBetween(1, 5),
            'status' => 'ACTIVE',
        ];
    }
}
