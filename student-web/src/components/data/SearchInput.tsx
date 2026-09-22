import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Input } from "../ui/Input";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Debounced search box. Typing updates local state immediately (so it feels
 * responsive) and only calls `onChange` once the user pauses, which is what triggers
 * the request.
 *
 * The subtlety is the two-way binding. `onChange` writes to the URL, so the value
 * comes back in as a prop: the box must follow an outside change ("Clear filters")
 * without echoing its own stale, still-debouncing value back out. A value is only
 * published when it is something the user actually typed here AND the URL does not
 * already hold it - so clearing the filters while a search is still debouncing
 * clears the search instead of re-applying it.
 */
export function SearchInput({
  value,
  onChange,
  label = "Search",
  placeholder = "Search…"
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const debounced = useDebouncedValue(local, 350);

  // Follow a change made elsewhere (Clear filters, a shared URL, back/forward).
  // Adjusted during render, which React handles without painting a stale value.
  if (value !== lastValue) {
    setLastValue(value);
    setLocal(value);
  }

  // Publish once the debounce has caught up with what is in the box, and only when
  // that differs from what the URL already holds. After an outside reset the debounce
  // is still holding the previous text, so it no longer matches `local` and is not
  // re-applied.
  useEffect(() => {
    if (debounced !== local || debounced === value) {
      return;
    }

    onChange(debounced);
  }, [debounced, local, value, onChange]);

  const id = "list-search";

  return (
    <div className="w-full sm:w-72">
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">
        {label}
      </label>
      <div className="relative mt-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          focusable="false"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <Input
          id={id}
          type="search"
          value={local}
          placeholder={placeholder}
          className="pl-9"
          onChange={(event) => setLocal(event.target.value)}
        />
      </div>
    </div>
  );
}
