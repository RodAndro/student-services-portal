<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicTermRequest;
use App\Http\Requests\UpdateAcademicTermRequest;
use App\Http\Resources\AcademicTermResource;
use App\Models\AcademicTerm;
use App\Support\ApiResponse;
use App\Traits\FiltersAndSorts;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicTermController extends Controller
{
    use FiltersAndSorts;

    #[QueryParameter('search', description: 'Partial match on academic_year.', example: '2026')]
    #[QueryParameter('semester', description: 'Filter by semester (1-3).', type: 'integer', example: 1)]
    #[QueryParameter('status', description: 'Filter by status.', example: 'ACTIVE')]
    #[QueryParameter('sort', description: 'Sort field: academic_year, semester, start_date, id.', default: 'academic_year', example: 'academic_year')]
    #[QueryParameter('direction', description: 'Sort direction: asc or desc.', default: 'desc', example: 'desc')]
    #[QueryParameter('per_page', description: 'Records per page (1-100).', type: 'integer', default: 15, example: 15)]
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AcademicTerm::class);

        $query = AcademicTerm::query();

        $this->applyFilters($query, $request, ['academic_year'], ['semester', 'status'], ['academic_year', 'semester', 'start_date', 'id'], 'academic_year', 'desc');

        $terms = $query->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            AcademicTermResource::collection($terms),
            $terms,
            'Academic terms retrieved successfully.'
        );
    }

    public function store(StoreAcademicTermRequest $request): JsonResponse
    {
        $this->authorize('create', AcademicTerm::class);

        $term = AcademicTerm::create($request->validated());

        return ApiResponse::created(new AcademicTermResource($term), 'Academic term created successfully.');
    }

    public function show(AcademicTerm $academicTerm): JsonResponse
    {
        $this->authorize('view', $academicTerm);

        return ApiResponse::success(new AcademicTermResource($academicTerm), 'Academic term retrieved successfully.');
    }

    public function update(UpdateAcademicTermRequest $request, AcademicTerm $academicTerm): JsonResponse
    {
        $this->authorize('update', $academicTerm);

        $academicTerm->update($request->validated());

        return ApiResponse::success(new AcademicTermResource($academicTerm), 'Academic term updated successfully.');
    }

    public function destroy(AcademicTerm $academicTerm): JsonResponse
    {
        $this->authorize('delete', $academicTerm);

        if ($academicTerm->courseOfferings()->exists()) {
            return ApiResponse::error('Cannot delete this academic term because it has course offerings.', 409);
        }

        $academicTerm->delete();

        return ApiResponse::success(null, 'Academic term deleted successfully.');
    }
}
