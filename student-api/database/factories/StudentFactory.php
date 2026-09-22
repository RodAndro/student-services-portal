<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_number' => fake()->unique()->numerify('2026-#####'),
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->lastName(),
            'last_name' => fake()->lastName(),
            'suffix' => null,
            'birth_date' => fake()->dateTimeBetween('-25 years', '-17 years')->format('Y-m-d'),
            'email' => fake()->unique()->safeEmail(),
            'contact_number' => '09'.fake()->numerify('#########'),
            'address' => fake()->address(),
            'program_id' => Program::factory(),
            'year_level' => fake()->numberBetween(1, 4),
            'status' => fake()->randomElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE']),
            'user_id' => null,
        ];
    }
}
