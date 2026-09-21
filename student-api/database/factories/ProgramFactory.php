<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Program>
 */
class ProgramFactory extends Factory
{
    public function definition(): array
    {
        $programs = [
            ['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology'],
            ['code' => 'BSCS', 'name' => 'Bachelor of Science in Computer Science'],
            ['code' => 'BSIS', 'name' => 'Bachelor of Science in Information Systems'],
            ['code' => 'BSBA', 'name' => 'Bachelor of Science in Business Administration'],
            ['code' => 'BSCE', 'name' => 'Bachelor of Science in Civil Engineering'],
        ];

        $program = fake()->unique()->randomElement($programs);

        return [
            'code' => $program['code'],
            'name' => $program['name'],
            'description' => fake()->sentence(),
            'status' => 'ACTIVE',
        ];
    }
}
