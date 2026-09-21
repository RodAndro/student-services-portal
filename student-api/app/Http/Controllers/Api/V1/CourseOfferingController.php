<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseOfferingRequest;
use App\Http\Requests\UpdateCourseOfferingRequest;
use App\Http\Resources\CourseOfferingResource;
use App\Http\Resources\EnrollmentResource;
use App\Models\CourseOffering;
use App\Support\ApiResponse;
use App\Traits\FiltersAndSorts;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseOfferingController extends Controller
{
    use FiltersAndSorts;

    private const RELATIONS = ['course', 'academicTerm', 'instructor'];

    #[QueryParameter('search', description: 'Partial match across section, schedule, and room.', example: 'MWF')]
    #[QueryParameter('course_id', description: 'Filter by course ID.', type: 'integer', example: 1)]
    #[QueryParameter('academic_term_id', description: 'Filter by academic term ID.', type: 'integer', example: 1)]
    #[QueryParameter('instructor_id', description: 'Filter by instructor (user) ID.', type: 'integer', example: 3)]
    #[QueryParameter('status', description: 'Filter by status.', example: 'ACTIVE')]
    #[QueryParameter('sort', description: 'Sort field: section, capacity, created_at, id.', default: 'id', example: 'id')]
    #[QueryParameter('direction', description: 'Sort direction: asc or desc.', default: 'asc', example: 'asc')]
    #[QueryParameter('per_page', description: 'Records per page (1-100).', type: 'integer', default: 15, example: 15)]
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CourseOffering::class);

        $query = CourseOffering::with(self::RELATIONS)->withCount('enrollments');

        if ($request->user()->isInstructor()) {
            $query->where('instructor_id', $request->user()->id);
        }

        $this->applyFilters($query, $request, ['section', 'schedule', 'room'], ['course_id', 'academic_term_id', 'instructor_id', 'status'], ['section', 'capacity', 'created_at', 'id'], 'id');

        $offerings = $query->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            CourseOfferingResource::collection($offerings),
            $offerings,
            'Course offerings retrieved successfully.'
        );
    }

    public function store(StoreCourseOfferingRequest $request): JsonResponse
    {
        $this->authorize('create', CourseOffering::class);

        $offering = CourseOffering::create($request->validated());
        $offering->load(self::RELATIONS)->loadCount('enrollments');

        return ApiResponse::created(new CourseOfferingResource($offering), 'Course offering created successfully.');
    }

    public function show(CourseOffering $courseOffering): JsonResponse
    {
        $this->authorize('view', $courseOffering);

        $courseOffering->load(self::RELATIONS)->loadCount('enrollments');

        return ApiResponse::success(new CourseOfferingResource($courseOffering), 'Course offering retrieved successfully.');
    }

    public function update(UpdateCourseOfferingRequest $request, CourseOffering $courseOffering): JsonResponse
    {
        $this->authorize('update', $courseOffering);

        $courseOffering->update($request->validated());
        $courseOffering->load(self::RELATIONS)->loadCount('enrollments');

        return ApiResponse::success(new CourseOfferingResource($courseOffering), 'Course offering updated successfully.');
    }

    public function destroy(CourseOffering $courseOffering): JsonResponse
    {
        $this->authorize('delete', $courseOffering);

        if ($courseOffering->enrollments()->exists()) {
            return ApiResponse::error('Cannot delete this course offering because it has enrollments.', 409);
        }

        $courseOffering->delete();

        return ApiResponse::success(null, 'Course offering deleted successfully.');
    }

    public function students(Request $request, CourseOffering $courseOffering): JsonResponse
    {
        $this->authorize('view', $courseOffering);

        $enrollments = $courseOffering->enrollments()
            ->with(['student.program'])
            ->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            EnrollmentResource::collection($enrollments),
            $enrollments,
            'Enrolled students retrieved successfully.'
        );
    }
}
