<?php

namespace App\Policies;

use App\Models\AcademicTerm;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AcademicTermPolicy
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

    public function view(User $user, AcademicTerm $academicTerm): bool
    {
        return $user->isInstructor();
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, AcademicTerm $academicTerm): bool
    {
        return false;
    }

    public function delete(User $user, AcademicTerm $academicTerm): bool
    {
        return false;
    }
}
