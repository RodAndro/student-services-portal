import { useEffect, useRef, useState } from "react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Field } from "../ui/Field";
import { Input, Select } from "../ui/Input";

export interface SelectOption {
  value: string;
  label: string;
}

export interface RemoteSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called with the (debounced) search text; returns the options to show. */
  loadOptions: (search: string) => Promise<SelectOption[]>;
  /** Wording shown when nothing is selected, e.g. "All students". */
  placeholder: string;
  searchPlaceholder?: string;
  /**
   * Set false when the endpoint cannot be searched (e.g. the class list of an
   * offering) so the UI does not offer a search box that does nothing.
   */
  searchable?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

/**
 * A `<select>` whose options are loaded from the API and can be narrowed with a
 * search box below it.
 *
 * This exists because the backend caps collections at 100 rows and — for students —
 * has more than that, so a plain select could not list everything. The search text is
 * debounced, and the request is re-issued only when it changes.
 */
export function RemoteSelect({
  id,
  label,
  value,
  onChange,
  loadOptions,
  placeholder,
  searchPlaceholder = "Type to search…",
  searchable = true,
  required = false,
  error,
  hint,
  disabled = false
}: RemoteSelectProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const loaderRef = useRef(loadOptions);
  useEffect(() => {
    loaderRef.current = loadOptions;
  });

  const query = useApiQuery(() => loaderRef.current(debouncedSearch), [debouncedSearch]);
  const options = query.data ?? [];

  const searchId = `${id}-search`;
  const statusId = `${id}-status`;

  return (
    <div className="space-y-1.5">
      <Field htmlFor={id} label={label} required={required} error={error} hint={hint}>
        <Select
          id={id}
          value={value}
          invalid={Boolean(error)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder}</option>

          {/* Keep the current selection visible even if it is not in the loaded page. */}
          {value !== "" && !options.some((option) => option.value === value) ? (
            <option value={value}>Selected: #{value}</option>
          ) : null}

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      {searchable ? (
        <div>
          <label htmlFor={searchId} className="block text-xs font-medium text-slate-600">
            {`Search ${label.toLowerCase()}`}
          </label>
          <Input
            id={searchId}
            type="search"
            value={search}
            placeholder={searchPlaceholder}
            className="mt-1 min-h-10 text-xs"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      ) : null}

      <p id={statusId} className="text-xs text-slate-500" role="status">
        {query.loading
          ? "Loading options…"
          : query.error
            ? ""
            : options.length === 0
              ? "No matches."
              : `${options.length} option${options.length === 1 ? "" : "s"} available.`}
      </p>

      {query.error ? (
        <p className="text-xs font-medium text-red-700" role="alert">
          {query.error.message}
        </p>
      ) : null}
    </div>
  );
}
