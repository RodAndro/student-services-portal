<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGradeRequest;
use App\Http\Requests\UpdateGradeRequest;
use App\Http\Resources\GradeResource;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Support\ApiResponse;
use App\Traits\FiltersAndSorts;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    use FiltersAndSorts;

    private const RELATIONS = [
        'enrollment.student',
        'enrollment.courseOffering.course',
    ];

    #[QueryParameter('enrollment_id', description: 'Filter by enrollment ID.', type: 'integer', example: 1)]
    #[QueryParameter('sort', description: 'Sort field: midterm_grade, final_grade, created_at, id.', default: 'id', example: 'id')]
    #[QueryParameter('direction', description: 'Sort direction: asc or desc.', default: 'desc', example: 'desc')]
    #[QueryParameter('per_page', description: 'Records per page (1-100).', type: 'integer', default: 15, example: 15)]
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Grade::class);

        $query = Grade::with(self::RELATIONS);

        if ($request->user()->isInstructor()) {
            $query->whereHas('enrollment.courseOffering', fn ($q) => $q->where('instructor_id', $request->user()->id));
        }

        $this->applyFilters($query, $request, [], ['enrollment_id'], ['midterm_grade', 'final_grade', 'created_at', 'id'], 'id', 'desc');

        $grades = $query->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            GradeResource::collection($grades),
            $grades,
            'Grades retrieved successfully.'
        );
    }

    public function store(StoreGradeRequest $request): JsonResponse
    {
        $data = $request->validated();

        $enrollment = Enrollment::findOrFail($data['enrollment_id']);

        $this->authorize('grade', $enrollment);

        if (Grade::where('enrollment_id', $data['enrollment_id'])->exists()) {
            return ApiResponse::error('A grade already exists for this enrollment.', 409);
        }

        $grade = Grade::create($data);
        $grade->load(self::RELATIONS);

        return ApiResponse::created(new GradeResource($grade), 'Grade created successfully.');
    }

    public function show(Grade $grade): JsonResponse
    {
        $this->authorize('view', $grade);

        $grade->load(self::RELATIONS);

        return ApiResponse::success(new GradeResource($grade), 'Grade retrieved successfully.');
    }

    public function update(UpdateGradeRequest $request, Grade $grade): JsonResponse
    {
        $this->authorize('update', $grade);

        $grade->update($request->validated());
        $grade->load(self::RELATIONS);

        return ApiResponse::success(new GradeResource($grade), 'Grade updated successfully.');
    }
}
