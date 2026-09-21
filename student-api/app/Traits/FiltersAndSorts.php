<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait FiltersAndSorts
{
    protected function applyFilters(
        Builder $query,
        Request $request,
        array $searchable,
        array $filters,
        array $sortable,
        string $defaultSort = 'id',
        string $defaultDirection = 'asc'
    ): Builder {
        $this->applySearch($query, $request->query('search'), $searchable);
        $this->applyExactFilters($query, $request, $filters);
        $this->applySort($query, $request, $sortable, $defaultSort, $defaultDirection);

        return $query;
    }

    private function applySearch(Builder $query, ?string $search, array $searchable): void
    {
        if (! $search || empty($searchable)) {
            return;
        }

        $query->where(function (Builder $query) use ($searchable, $search) {
            foreach ($searchable as $index => $field) {
                $index === 0
                    ? $query->where($field, 'like', "%{$search}%")
                    : $query->orWhere($field, 'like', "%{$search}%");
            }
        });
    }

    private function applyExactFilters(Builder $query, Request $request, array $filters): void
    {
        foreach ($filters as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->query($field));
            }
        }
    }

    private function applySort(Builder $query, Request $request, array $sortable, string $defaultSort, string $defaultDirection): void
    {
        $sort = $request->query('sort', $defaultSort);
        $direction = strtolower((string) $request->query('direction', $defaultDirection));

        if (! in_array($sort, $sortable, true)) {
            $sort = $defaultSort;
        }

        $direction = $direction === 'desc' ? 'desc' : 'asc';

        $query->orderBy($sort, $direction);
    }
}
