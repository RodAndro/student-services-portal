<?php

namespace App\Http\Requests;

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
            'end_date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'string', Rule::in(['ACTIVE', 'UPCOMING', 'INACTIVE'])],
        ];
    }
}
