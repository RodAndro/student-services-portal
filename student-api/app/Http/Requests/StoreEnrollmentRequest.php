<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreEnrollmentRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'course_offering_id' => ['required', 'integer', 'exists:course_offerings,id'],
            'enrollment_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', Rule::in(['ENROLLED', 'DROPPED', 'COMPLETED'])],
        ];
    }
}
