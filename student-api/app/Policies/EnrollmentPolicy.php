<?php

namespace App\Policies;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EnrollmentPolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        return $user->isStaff() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isInstructor();
    }

    public function view(User $user, Enrollment $enrollment): bool
    {
        if ($user->isInstructor()) {
            return $enrollment->courseOffering->instructor_id === $user->id;
        }

        return $user->isStudent() && $user->student?->id === $enrollment->student_id;
    }

    public function grade(User $user, Enrollment $enrollment): bool
    {
        return $user->isInstructor() && $enrollment->courseOffering->instructor_id === $user->id;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Enrollment $enrollment): bool
    {
        return false;
    }

    public function delete(User $user, Enrollment $enrollment): bool
    {
        return false;
    }
}
