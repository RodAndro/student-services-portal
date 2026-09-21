<?php

use App\Http\Controllers\Api\V1\AcademicTermController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\Api\V1\CourseOfferingController;
use App\Http\Controllers\Api\V1\EnrollmentController;
use App\Http\Controllers\Api\V1\GradeController;
use App\Http\Controllers\Api\V1\ProgramController;
use App\Http\Controllers\Api\V1\StudentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (versioned under /api/v1)
|--------------------------------------------------------------------------
|
| All routes in this file are automatically prefixed with "/api" by the
| framework. We add the "v1" prefix so the full path becomes "/api/v1".
|
*/

Route::prefix('v1')->group(function () {
    // Smoke-test endpoint used to verify the server is running.
    Route::get('/ping', function () {
        return response()->json([
            'success' => true,
            'message' => 'API is running.',
            'data' => [
                'service' => 'Student Information Management API',
                'version' => 'v1',
                'time' => now()->toIso8601String(),
            ],
        ]);
    });

    // Authentication
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

    // Core resources (protected; role authorization is added in a later phase)
    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('programs', ProgramController::class);
        Route::apiResource('students', StudentController::class);
        Route::apiResource('courses', CourseController::class);
        Route::apiResource('academic-terms', AcademicTermController::class);
        Route::apiResource('course-offerings', CourseOfferingController::class);
        Route::apiResource('enrollments', EnrollmentController::class);
        Route::apiResource('grades', GradeController::class)->except(['destroy']);

        // Nested / relational routes
        Route::get('students/{student}/enrollments', [StudentController::class, 'enrollments']);
        Route::get('students/{student}/grades', [StudentController::class, 'grades']);
        Route::get('students/{student}/academic-record', [StudentController::class, 'academicRecord']);
        Route::get('course-offerings/{course_offering}/students', [CourseOfferingController::class, 'students']);
    });
});
