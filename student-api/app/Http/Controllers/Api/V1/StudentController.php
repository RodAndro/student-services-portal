<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\AcademicTermResource;
use App\Http\Resources\CourseResource;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\GradeResource;
use App\Http\Resources\StudentResource;
use App\Models\Grade;
use App\Models\Student;
use App\Support\ApiResponse;
use App\Traits\FiltersAndSorts;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    use FiltersAndSorts;

    #[QueryParameter('search', description: 'Partial match across first_name, middle_name, last_name, student_number, and email.', example: 'dela')]
    #[QueryParameter('program_id', description: 'Filter by program ID.', type: 'integer', example: 1)]
    #[QueryParameter('year_level', description: 'Filter by year level (1-4).', type: 'integer', example: 3)]
    #[QueryParameter('status', description: 'Filter by status.', example: 'ACTIVE')]
    #[QueryParameter('sort', description: 'Sort field: last_name, first_name, student_number, year_level, created_at, id.', default: 'last_name', example: 'last_name')]
    #[QueryParameter('direction', description: 'Sort direction: asc or desc.', default: 'asc', example: 'asc')]
    #[QueryParameter('per_page', description: 'Records per page (1-100).', type: 'integer', default: 15, example: 15)]
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Student::class);

        $query = Student::with('program');

        $this->applyFilters($query, $request, ['first_name', 'middle_name', 'last_name', 'student_number', 'email'], ['program_id', 'year_level', 'status'], ['last_name', 'first_name', 'student_number', 'year_level', 'created_at', 'id'], 'last_name');

        $students = $query->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            StudentResource::collection($students),
            $students,
            'Students retrieved successfully.'
        );
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        $this->authorize('create', Student::class);

        $student = Student::create($request->validated());
        $student->load('program');

        return ApiResponse::created(new StudentResource($student), 'Student created successfully.');
    }

    public function show(Student $student): JsonResponse
    {
        $this->authorize('view', $student);

        $student->load('program');

        return ApiResponse::success(new StudentResource($student), 'Student retrieved successfully.');
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        $this->authorize('update', $student);

        $student->update($request->validated());
        $student->load('program');

        return ApiResponse::success(new StudentResource($student), 'Student updated successfully.');
    }

    public function destroy(Student $student): JsonResponse
    {
        $this->authorize('delete', $student);

        if ($student->enrollments()->exists()) {
            return ApiResponse::error('Cannot delete this student because they have enrollments.', 409);
        }

        $student->delete();

        return ApiResponse::success(null, 'Student deleted successfully.');
    }

    public function enrollments(Request $request, Student $student): JsonResponse
    {
        $this->authorize('view', $student);

        $enrollments = $student->enrollments()
            ->with(['courseOffering.course', 'courseOffering.academicTerm', 'grade'])
            ->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            EnrollmentResource::collection($enrollments),
            $enrollments,
            'Student enrollments retrieved successfully.'
        );
    }

    public function grades(Request $request, Student $student): JsonResponse
    {
        $this->authorize('view', $student);

        $grades = Grade::whereHas('enrollment', fn ($query) => $query->where('student_id', $student->id))
            ->with(['enrollment.courseOffering.course'])
            ->paginate(max(1, min(100, $request->integer('per_page', 15))));

        return ApiResponse::paginated(
            GradeResource::collection($grades),
            $grades,
            'Student grades retrieved successfully.'
        );
    }

    public function academicRecord(Student $student): JsonResponse
    {
        $this->authorize('viewAcademicRecord', $student);

        $student->load([
            'program',
            'enrollments.courseOffering.course',
            'enrollments.courseOffering.academicTerm',
            'enrollments.grade',
        ]);

        $record = $student->enrollments
            ->groupBy(fn ($enrollment) => $enrollment->courseOffering->academicTerm->id)
            ->map(function ($enrollments) {
                $term = $enrollments->first()->courseOffering->academicTerm;

                return [
                    'academic_term' => new AcademicTermResource($term),
                    'enrollments' => $enrollments->map(fn ($enrollment) => [
                        'enrollment_id' => $enrollment->id,
                        'course' => new CourseResource($enrollment->courseOffering->course),
                        'section' => $enrollment->courseOffering->section,
                        'schedule' => $enrollment->courseOffering->schedule,
                        'status' => $enrollment->status,
                        'grade' => $enrollment->grade ? [
                            'midterm_grade' => $enrollment->grade->midterm_grade,
                            'final_grade' => $enrollment->grade->final_grade,
                            'remarks' => $enrollment->grade->remarks,
                        ] : null,
                    ])->values(),
                ];
            })
            ->sortByDesc(fn ($item) => $item['academic_term']->academic_year . str_pad((string) $item['academic_term']->semester, 2, '0', STR_PAD_LEFT))
            ->values();

        return ApiResponse::success([
            'student' => new StudentResource($student),
            'academic_record' => $record,
        ], 'Academic record retrieved successfully.');
    }
}
