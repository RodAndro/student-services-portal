<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateEnrollmentRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['sometimes', 'integer', 'exists:students,id'],
            'course_offering_id' => ['sometimes', 'integer', 'exists:course_offerings,id'],
            'enrollment_date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'string', Rule::in(['ENROLLED', 'DROPPED', 'COMPLETED'])],
        ];
    }
}
