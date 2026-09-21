<?php

namespace App\Http\Requests;

class UpdateGradeRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'midterm_grade' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'final_grade' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
