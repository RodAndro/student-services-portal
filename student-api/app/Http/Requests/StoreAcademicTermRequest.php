<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreAcademicTermRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year' => [
                'required',
                'string',
                'max:20',
                Rule::unique('academic_terms', 'academic_year')
                    ->where(fn ($query) => $query->where('semester', $this->semester)),
            ],
            'semester' => ['required', 'integer', Rule::in([1, 2, 3])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['required', 'string', Rule::in(['ACTIVE', 'UPCOMING', 'INACTIVE'])],
        ];
    }
}
