<?php

namespace App\Policies;

use App\Models\Grade;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class GradePolicy
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

    public function view(User $user, Grade $grade): bool
    {
        if ($user->isInstructor()) {
            return $grade->enrollment->courseOffering->instructor_id === $user->id;
        }

        return $user->isStudent() && $user->student?->id === $grade->enrollment->student_id;
    }

    public function update(User $user, Grade $grade): bool
    {
        return $user->isInstructor() && $grade->enrollment->courseOffering->instructor_id === $user->id;
    }
}
