<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramRequest;
use App\Http\Requests\UpdateProgramRequest;
use App\Http\Resources\ProgramResource;
use App\Models\Program;
use App\Support\ApiResponse;
use App\Traits\FiltersAndSorts;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    use FiltersAndSorts;

    #[QueryParameter('search', description: 'Partial match across code and name.', example: 'BSIT')]
    #[QueryParameter('status', description: 'Filter by status.', example: 'ACTIVE')]
    #[QueryParameter('sort', description: 'Sort field: code, name, created_at, id.', default: 'name', example: 'name')]
    #[QueryParameter('direction', description: 'Sort direction: asc or desc.', default: 'asc', example: 'asc')]
    #[QueryParameter('per_page', description: 'Records per page (1-100).', type: 'integer', default: 15, example: 15)]
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Program::class);

        $query = Program::query();

        $this->applyFilters($query, $request, ['code', 'name'], ['status'], ['code', 'name', 'created_at', 'id'], 'name');

        $programs = $query->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            ProgramResource::collection($programs),
            $programs,
            'Programs retrieved successfully.'
        );
    }

    public function store(StoreProgramRequest $request): JsonResponse
    {
        $this->authorize('create', Program::class);

        $program = Program::create($request->validated());

        return ApiResponse::created(new ProgramResource($program), 'Program created successfully.');
    }

    public function show(Program $program): JsonResponse
    {
        $this->authorize('view', $program);

        return ApiResponse::success(new ProgramResource($program), 'Program retrieved successfully.');
    }

    public function update(UpdateProgramRequest $request, Program $program): JsonResponse
    {
        $this->authorize('update', $program);

        $program->update($request->validated());

        return ApiResponse::success(new ProgramResource($program), 'Program updated successfully.');
    }

    public function destroy(Program $program): JsonResponse
    {
        $this->authorize('delete', $program);

        if ($program->students()->exists()) {
            return ApiResponse::error('Cannot delete this program because students are assigned to it.', 409);
        }

        $program->delete();

        return ApiResponse::success(null, 'Program deleted successfully.');
    }
}
