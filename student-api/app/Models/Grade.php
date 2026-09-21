<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    use HasFactory;

    public const PASSING_GRADE = 75;

    protected $fillable = [
        'enrollment_id',
        'midterm_grade',
        'final_grade',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'midterm_grade' => 'float',
            'final_grade' => 'float',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Grade $grade) {
            $grade->remarks = $grade->computeRemarks();
        });
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function computeRemarks(): string
    {
        if ($this->final_grade === null) {
            return 'IN PROGRESS';
        }

        return (float) $this->final_grade >= self::PASSING_GRADE ? 'PASSED' : 'FAILED';
    }
}
