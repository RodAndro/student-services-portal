<?php

namespace App\Providers;

use App\Models\AcademicTerm;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Program;
use App\Models\Student;
use App\Policies\AcademicTermPolicy;
use App\Policies\CourseOfferingPolicy;
use App\Policies\CoursePolicy;
use App\Policies\EnrollmentPolicy;
use App\Policies\GradePolicy;
use App\Policies\ProgramPolicy;
use App\Policies\StudentPolicy;
use Dedoc\Scramble\Scramble;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Program::class, ProgramPolicy::class);
        Gate::policy(Course::class, CoursePolicy::class);
        Gate::policy(AcademicTerm::class, AcademicTermPolicy::class);
        Gate::policy(CourseOffering::class, CourseOfferingPolicy::class);
        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(Enrollment::class, EnrollmentPolicy::class);
        Gate::policy(Grade::class, GradePolicy::class);

        // Expose the generated OpenAPI documentation at /api/docs (instead of
        // Scramble's default /docs/api), so it sits alongside the API itself.
        // The JSON specification is served at /api/docs.json.
        Scramble::configure()->expose(
            fn (Router $router, $action) => $router->get('api/docs', $action)->name('scramble.docs.ui'),
            fn (Router $router, $action) => $router->get('api/docs.json', $action)->name('scramble.docs.document'),
        );
    }
}
