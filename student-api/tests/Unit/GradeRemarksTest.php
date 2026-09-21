<?php

namespace Tests\Unit;

use App\Models\Grade;
use PHPUnit\Framework\TestCase;

class GradeRemarksTest extends TestCase
{
    public function test_a_grade_without_a_final_grade_is_in_progress(): void
    {
        $grade = new Grade(['midterm_grade' => 80]);

        $this->assertSame('IN PROGRESS', $grade->computeRemarks());
    }

    public function test_a_final_grade_at_the_passing_mark_passes(): void
    {
        $grade = new Grade(['final_grade' => 75]);

        $this->assertSame('PASSED', $grade->computeRemarks());
    }

    public function test_a_final_grade_below_the_passing_mark_fails(): void
    {
        $grade = new Grade(['final_grade' => 74.99]);

        $this->assertSame('FAILED', $grade->computeRemarks());
    }

    public function test_a_high_final_grade_passes(): void
    {
        $grade = new Grade(['midterm_grade' => 70, 'final_grade' => 95]);

        $this->assertSame('PASSED', $grade->computeRemarks());
    }
}
