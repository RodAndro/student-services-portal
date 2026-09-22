<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEnrollmentRequest;
use App\Http\Requests\UpdateEnrollmentRequest;
use App\Http\Resources\EnrollmentResource;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Support\ApiResponse;
use App\Traits\FiltersAndSorts;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    use FiltersAndSorts;

    private const RELATIONS = [
        'student.program',
        'courseOffering.course',
        'courseOffering.academicTerm',
        'grade',
    ];

    #[QueryParameter('student_id', description: 'Filter by student ID.', type: 'integer', example: 1)]
    #[QueryParameter('course_offering_id', description: 'Filter by course offering ID.', type: 'integer', example: 1)]
    #[QueryParameter('status', description: 'Filter by status: ENROLLED, DROPPED, COMPLETED.', example: 'ENROLLED')]
    #[QueryParameter('sort', description: 'Sort field: enrollment_date, status, id.', default: 'id', example: 'id')]
    #[QueryParameter('direction', description: 'Sort direction: asc or desc.', default: 'desc', example: 'desc')]
    #[QueryParameter('per_page', description: 'Records per page (1-100).', type: 'integer', default: 15, example: 15)]
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Enrollment::class);

        $query = Enrollment::with(self::RELATIONS);

        if ($request->user()->isInstructor()) {
            $query->whereHas('courseOffering', fn ($q) => $q->where('instructor_id', $request->user()->id));
        }

        $this->applyFilters($query, $request, [], ['student_id', 'course_offering_id', 'status'], ['enrollment_date', 'status', 'id'], 'id', 'desc');

        $enrollments = $query->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            EnrollmentResource::collection($enrollments),
            $enrollments,
            'Enrollments retrieved successfully.'
        );
    }

    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        $this->authorize('create', Enrollment::class);

        $data = $request->validated();

        $exists = Enrollment::where('student_id', $data['student_id'])
            ->where('course_offering_id', $data['course_offering_id'])
            ->exists();

        if ($exists) {
            return ApiResponse::error('The student is already enrolled in this course offering.', 409);
        }

        $offering = CourseOffering::withCount('enrollments')->find($data['course_offering_id']);
        if ($offering && $offering->enrollments_count >= $offering->capacity) {
            return ApiResponse::error('This course offering has reached its capacity.', 409);
        }

        $data['enrollment_date'] = $data['enrollment_date'] ?? now()->toDateString();
        $data['status'] = $data['status'] ?? 'ENROLLED';

        $enrollment = Enrollment::create($data);
        $enrollment->load(self::RELATIONS);

        return ApiResponse::created(new EnrollmentResource($enrollment), 'Enrollment created successfully.');
    }

    public function show(Enrollment $enrollment): JsonResponse
    {
        $this->authorize('view', $enrollment);

        $enrollment->load(self::RELATIONS);

        return ApiResponse::success(new EnrollmentResource($enrollment), 'Enrollment retrieved successfully.');
    }

    public function update(UpdateEnrollmentRequest $request, Enrollment $enrollment): JsonResponse
    {
        $this->authorize('update', $enrollment);

        $data = $request->validated();

        // A partial update may change only one side of the pair, so resolve the
        // effective pair from the request with the existing record as fallback.
        $studentId = $data['student_id'] ?? $enrollment->student_id;
        $offeringId = $data['course_offering_id'] ?? $enrollment->course_offering_id;

        $duplicate = Enrollment::where('student_id', $studentId)
            ->where('course_offering_id', $offeringId)
            ->where('id', '!=', $enrollment->id)
            ->exists();

        if ($duplicate) {
            return ApiResponse::error('The student is already enrolled in this course offering.', 409);
        }

        $enrollment->update($data);
        $enrollment->load(self::RELATIONS);

        return ApiResponse::success(new EnrollmentResource($enrollment), 'Enrollment updated successfully.');
    }

    public function destroy(Enrollment $enrollment): JsonResponse
    {
        $this->authorize('delete', $enrollment);

        $enrollment->delete();

        return ApiResponse::success(null, 'Enrollment deleted successfully.');
    }
}
