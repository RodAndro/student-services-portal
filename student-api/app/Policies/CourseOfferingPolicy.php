<?php

namespace App\Policies;

use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CourseOfferingPolicy
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

    public function view(User $user, CourseOffering $courseOffering): bool
    {
        return $user->isInstructor() && $courseOffering->instructor_id === $user->id;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, CourseOffering $courseOffering): bool
    {
        return false;
    }

    public function delete(User $user, CourseOffering $courseOffering): bool
    {
        return false;
    }
}
