<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Support\ApiResponse;
use App\Traits\FiltersAndSorts;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    use FiltersAndSorts;

    #[QueryParameter('search', description: 'Partial match across course_code and course_title.', example: 'CS1')]
    #[QueryParameter('status', description: 'Filter by status.', example: 'ACTIVE')]
    #[QueryParameter('sort', description: 'Sort field: course_code, course_title, units, created_at, id.', default: 'course_title', example: 'course_title')]
    #[QueryParameter('direction', description: 'Sort direction: asc or desc.', default: 'asc', example: 'asc')]
    #[QueryParameter('per_page', description: 'Records per page (1-100).', type: 'integer', default: 15, example: 15)]
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Course::class);

        $query = Course::query();

        $this->applyFilters($query, $request, ['course_code', 'course_title'], ['status'], ['course_code', 'course_title', 'units', 'created_at', 'id'], 'course_title');

        $courses = $query->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            CourseResource::collection($courses),
            $courses,
            'Courses retrieved successfully.'
        );
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $this->authorize('create', Course::class);

        $course = Course::create($request->validated());

        return ApiResponse::created(new CourseResource($course), 'Course created successfully.');
    }

    public function show(Course $course): JsonResponse
    {
        $this->authorize('view', $course);

        return ApiResponse::success(new CourseResource($course), 'Course retrieved successfully.');
    }

    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        $this->authorize('update', $course);

        $course->update($request->validated());

        return ApiResponse::success(new CourseResource($course), 'Course updated successfully.');
    }

    public function destroy(Course $course): JsonResponse
    {
        $this->authorize('delete', $course);

        if ($course->courseOfferings()->exists()) {
            return ApiResponse::error('Cannot delete this course because it has course offerings.', 409);
        }

        $course->delete();

        return ApiResponse::success(null, 'Course deleted successfully.');
    }
}
