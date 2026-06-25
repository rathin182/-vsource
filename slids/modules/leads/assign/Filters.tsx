"use client";

import { LeadStage } from "@/slids/types/lead.types";



export interface FilterState {
  search: string;
  stage: LeadStage | "";
  country: string;
  source: string;
}

interface LeadFiltersProps {
  filters: FilterState;
  countries: string[];
  sources: string[];
  onChange: (filters: FilterState) => void;
}

const STAGES: { value: LeadStage | ""; label: string }[] = [
  { value: "", label: "All stages" },
  { value: "INQUIRY", label: "Inquiry" },
  { value: "HOT", label: "Hot" },
  { value: "WARM", label: "Warm" },
  { value: "COLD", label: "Cold" },
];

export function LeadFilters({ filters, countries, sources, onChange }: LeadFiltersProps) {
  function update(patch: Partial<FilterState>) {
    onChange({ ...filters, ...patch });
  }

  const hasActiveFilters =
    filters.search || filters.stage || filters.country || filters.source;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by name, email, phone…"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Stage filter */}
      <select
        value={filters.stage}
        onChange={(e) => update({ stage: e.target.value as LeadStage | "" })}
        aria-label="Filter by stage"
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Country filter */}
      <select
        value={filters.country}
        onChange={(e) => update({ country: e.target.value })}
        aria-label="Filter by country"
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Source filter */}
      <select
        value={filters.source}
        onChange={(e) => update({ source: e.target.value })}
        aria-label="Filter by source"
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">All sources</option>
        {sources.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={() =>
            onChange({ search: "", stage: "", country: "", source: "" })
          }
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}