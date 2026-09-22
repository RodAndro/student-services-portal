<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Validation\Rule;

class UpdateAcademicTermRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year' => [
                'sometimes',
                'string',
                'max:20',
                Rule::unique('academic_terms', 'academic_year')
                    ->where(fn ($query) => $query->where('semester', $this->semester))
                    ->ignore($this->route('academic_term')),
            ],
            'semester' => ['sometimes', 'integer', Rule::in([1, 2, 3])],
            'start_date' => ['sometimes', 'date'],
            'end_date' => [
                'sometimes',
                'date',
                function (string $attribute, mixed $value, Closure $fail): void {
                    // On a partial update the start_date may not be sent, so fall back to
                    // the existing record's value before comparing (mirrors the store rule
                    // `after:start_date`, which is why a term is never left with an
                    // end_date before its start_date).
                    $startDate = $this->input('start_date')
                        ?? $this->route('academic_term')?->start_date?->toDateString();

                    if ($startDate && strtotime((string) $value) <= strtotime((string) $startDate)) {
                        $fail('The end date must be a date after start date.');
                    }
                },
            ],
            'status' => ['sometimes', 'string', Rule::in(['ACTIVE', 'UPCOMING', 'INACTIVE'])],
        ];
    }
}
