import type { ReactNode } from "react";

export interface ListToolbarProps {
  children: ReactNode;
}

/** Lays out the search box, filters and page actions above a table. */
export function ListToolbar({ children }: ListToolbarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

export interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** `value` is sent to the API, `label` is what the user reads. */
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}

/** An exact-match filter; the backend has no range or multi-value filters. */
export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder
}: FilterSelectProps) {
  return (
    <div className="w-full sm:w-48">
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
