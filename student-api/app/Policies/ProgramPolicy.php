<?php

namespace App\Policies;

use App\Models\Program;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ProgramPolicy
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

    public function view(User $user, Program $program): bool
    {
        return $user->isInstructor();
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Program $program): bool
    {
        return false;
    }

    public function delete(User $user, Program $program): bool
    {
        return false;
    }
}
