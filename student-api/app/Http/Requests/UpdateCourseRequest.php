<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateCourseRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'course_code' => ['sometimes', 'string', 'max:20', Rule::unique('courses', 'course_code')->ignore($this->route('course'))],
            'course_title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'units' => ['sometimes', 'integer', 'min:1', 'max:12'],
            'status' => ['sometimes', 'string', Rule::in(['ACTIVE', 'INACTIVE'])],
        ];
    }
}
