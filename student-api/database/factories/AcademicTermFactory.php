<?php

namespace Database\Factories;

use App\Models\AcademicTerm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AcademicTerm>
 */
class AcademicTermFactory extends Factory
{
    public function definition(): array
    {
        $year = fake()->unique()->numberBetween(2000, 2199);
        $start = fake()->dateTimeBetween('-1 year', 'now');

        return [
            'academic_year' => $year.'-'.($year + 1),
            'semester' => fake()->numberBetween(1, 3),
            'start_date' => $start->format('Y-m-d'),
            'end_date' => (clone $start)->modify('+5 months')->format('Y-m-d'),
            'status' => 'ACTIVE',
        ];
    }
}
