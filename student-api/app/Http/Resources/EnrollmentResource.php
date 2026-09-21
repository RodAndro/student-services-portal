<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'student' => $this->whenLoaded('student', fn () => new StudentResource($this->student)),
            'course_offering_id' => $this->course_offering_id,
            'course_offering' => $this->whenLoaded('courseOffering', fn () => new CourseOfferingResource($this->courseOffering)),
            'enrollment_date' => $this->enrollment_date?->toDateString(),
            'status' => $this->status,
            'grade' => $this->whenLoaded('grade', fn () => new GradeResource($this->grade)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
