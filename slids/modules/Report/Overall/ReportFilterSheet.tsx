"use client";

// app/reports/performance/ReportFilterSheet.tsx
//
// Slide-over filter panel for PerformanceReportsPage. Every dropdown here
// maps 1:1 to a PerformanceReportFilters query param consumed by
// GET /api/report/dashboard/performance. Dynamic option lists (branches,
// counselors, countries, universities, intakes, nbfcs, fintechAssignees)
// come from `filterOptions` in that SAME response — this component never
// calls a second endpoint. Enum-backed dropdowns (leadStatus,
// applicationStatus, casStatus, visaStatus, loanStatus) also read their
// values from filterOptions, which the backend built directly from the
// Prisma schema enums, so this file never hardcodes an enum list that can
// drift out of sync with schema.prisma.

import { useEffect, useMemo, useState } from "react";
import { X, ChevronDown, RotateCcw, Check } from "lucide-react";
import type {
  PerformanceReportFilterOptions,
  PerformanceReportFilters,
  ReportDatePreset,
  ReportRecordScope,
} from "@/lib/performance-report";

interface ReportFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: PerformanceReportFilters;
  onChange: (partial: Partial<PerformanceReportFilters>) => void;
  onReset: () => void;
  filterOptions: PerformanceReportFilterOptions | null;
}

const RECORD_SCOPES: { value: ReportRecordScope; label: string }[] = [
  { value: "all", label: "All records" },
  { value: "leads", label: "Leads only" },
  { value: "students", label: "Students only" },
];

const DATE_PRESETS: { value: ReportDatePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "last_quarter", label: "Last quarter" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

const titleCase = (s: string | null | undefined) =>
  (s ?? "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none bg-white dark:bg-[#15161d] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-3.5 pr-8 py-2.5 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map((o, i) => (
          <option key={`${o.value}-${i}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-2 rounded-lg text-[11.5px] font-medium border transition-colors ${
            value === o.value
              ? "bg-red-500 border-red-500 text-white"
              : "bg-white dark:bg-[#15161d] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-red-300 dark:hover:border-red-500/30"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 mt-6 first:mt-0">
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main sheet
// ─────────────────────────────────────────────────────────────────────────

export default function ReportFilterSheet({
  open,
  onClose,
  filters,
  onChange,
  onReset,
  filterOptions,
}: ReportFilterSheetProps) {
  // Local draft so typing in text/date fields doesn't refetch on every
  // keystroke — committed onChange on blur / explicit apply, matching
  // the "Apply / Refresh" pattern already used elsewhere in this app.
  const [draft, setDraft] = useState<PerformanceReportFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  // Universities filtered by selected country, if any — countryId is a
  // separate filter from universityId, but narrowing the dropdown avoids
  // picking a university that can never match the country filter.
  const filteredUniversities = useMemo(() => {
    if (!filterOptions) return [];
    if (!draft.countryId) return filterOptions.universities;
    return filterOptions.universities.filter((u) => u.countryId === draft.countryId);
  }, [filterOptions, draft.countryId]);

  // Counselors filtered by selected branch, if any.
  const filteredCounselors = useMemo(() => {
    if (!filterOptions) return [];
    if (!draft.branchId) return filterOptions.counselors;
    return filterOptions.counselors.filter((c) => c.branchIds.includes(draft.branchId));
  }, [filterOptions, draft.branchId]);

  const setDraftField = (partial: Partial<PerformanceReportFilters>) =>
    setDraft((prev) => ({ ...prev, ...partial }));

  const apply = () => {
    onChange(draft);
    onClose();
  };

  const resetAndClose = () => {
    onReset();
    onClose();
  };

  const activeCount = (Object.keys(draft) as (keyof PerformanceReportFilters)[]).filter((k) => {
    if (k === "recordScope") return draft[k] !== "all";
    if (k === "datePreset") return draft[k] !== "all";
    return Boolean(draft[k]);
  }).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-[#f7f7fa] dark:bg-[#0d0e13] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1b24]">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Filters</h2>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
              {activeCount > 0 ? `${activeCount} active` : "No filters applied"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!filterOptions ? (
            <div className="flex items-center justify-center py-16 text-[12.5px] text-slate-400">
              Loading filter options…
            </div>
          ) : (
            <>
              {/* Record scope */}
              <SectionTitle>Record scope</SectionTitle>
              <SegmentedControl value={draft.recordScope} onChange={(v) => setDraftField({ recordScope: v })} options={RECORD_SCOPES} />

              {/* Date range */}
              <SectionTitle>Date range</SectionTitle>
              <div className="space-y-2.5">
                <Select
                  value={draft.datePreset}
                  onChange={(v) => setDraftField({ datePreset: v as ReportDatePreset })}
                  placeholder="All time"
                  options={DATE_PRESETS.map((d) => ({ value: d.value, label: d.label }))}
                />
                {draft.datePreset === "custom" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <FieldLabel>Start date</FieldLabel>
                      <input
                        type="date"
                        value={draft.startDate}
                        onChange={(e) => setDraftField({ startDate: e.target.value })}
                        className="w-full bg-white dark:bg-[#15161d] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-[12.5px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      />
                    </div>
                    <div>
                      <FieldLabel>End date</FieldLabel>
                      <input
                        type="date"
                        value={draft.endDate}
                        onChange={(e) => setDraftField({ endDate: e.target.value })}
                        className="w-full bg-white dark:bg-[#15161d] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-[12.5px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Search */}
              <SectionTitle>Search</SectionTitle>
              <input
                value={draft.search}
                onChange={(e) => setDraftField({ search: e.target.value })}
                placeholder="Name, email, phone, university, course…"
                className="w-full bg-white dark:bg-[#15161d] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[12.5px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />

              {/* Branch / counselor */}
              <SectionTitle>Branch &amp; counselor</SectionTitle>
              <div className="space-y-2.5">
                <div>
                  <FieldLabel>Branch</FieldLabel>
                  <Select
                    value={draft.branchId}
                    onChange={(v) => setDraftField({ branchId: v, counselorId: "" })}
                    placeholder="All branches"
                    options={filterOptions.branches}
                  />
                </div>
                <div>
                  <FieldLabel>Counselor</FieldLabel>
                  <Select
                    value={draft.counselorId}
                    onChange={(v) => setDraftField({ counselorId: v })}
                    placeholder="All counselors"
                    options={filteredCounselors.map((c) => ({ value: c.value, label: c.label }))}
                  />
                </div>
              </div>

              {/* Lead filters */}
              <SectionTitle>Lead</SectionTitle>
              <div className="space-y-2.5">
                <div>
                  <FieldLabel>Lead status</FieldLabel>
                  <Select
                    value={draft.leadStatus}
                    onChange={(v) => setDraftField({ leadStatus: v })}
                    placeholder="All statuses"
                    options={filterOptions.leadStatuses.map((s) => ({ value: s, label: titleCase(s) }))}
                  />
                </div>
                <div>
                  <FieldLabel>Lead source</FieldLabel>
                  <Select
                    value={draft.leadSource}
                    onChange={(v) => setDraftField({ leadSource: v })}
                    placeholder="All sources"
                    options={filterOptions.leadSources.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              </div>

              {/* Destination */}
              <SectionTitle>Destination</SectionTitle>
              <div className="space-y-2.5">
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <Select
                    value={draft.countryId}
                    onChange={(v) => setDraftField({ countryId: v, universityId: "" })}
                    placeholder="All countries"
                    options={filterOptions.countries}
                  />
                </div>
                <div>
                  <FieldLabel>University</FieldLabel>
                  <Select
                    value={draft.universityId}
                    onChange={(v) => setDraftField({ universityId: v })}
                    placeholder="All universities"
                    options={filteredUniversities.map((u) => ({ value: u.value, label: u.label }))}
                  />
                </div>
                <div>
                  <FieldLabel>Intake</FieldLabel>
                  <Select
                    value={draft.intakeId}
                    onChange={(v) => setDraftField({ intakeId: v })}
                    placeholder="All intakes"
                    options={filterOptions.intakes}
                  />
                </div>
              </div>

              {/* Application */}
              <SectionTitle>Application</SectionTitle>
              <div>
                <FieldLabel>Application status</FieldLabel>
                <Select
                  value={draft.applicationStatus}
                  onChange={(v) => setDraftField({ applicationStatus: v })}
                  placeholder="All statuses"
                  options={filterOptions.applicationStatuses.map((s) => ({ value: s, label: titleCase(s) }))}
                />
              </div>

              {/* Visa */}
              <SectionTitle>Visa</SectionTitle>
              <div className="space-y-2.5">
                <div>
                  <FieldLabel>Visa status</FieldLabel>
                  <Select
                    value={draft.visaStatus}
                    onChange={(v) => setDraftField({ visaStatus: v })}
                    placeholder="All statuses"
                    options={filterOptions.visaStatuses.map((s) => ({ value: s, label: titleCase(s) }))}
                  />
                </div>
                <div>
                  <FieldLabel>CAS status</FieldLabel>
                  <Select
                    value={draft.casStatus}
                    onChange={(v) => setDraftField({ casStatus: v })}
                    placeholder="All statuses"
                    options={filterOptions.casStatuses.map((s) => ({ value: s, label: titleCase(s) }))}
                  />
                </div>
              </div>

              {/* Loan */}
              <SectionTitle>Loan</SectionTitle>
              <div className="space-y-2.5">
                <div>
                  <FieldLabel>Loan status</FieldLabel>
                  <Select
                    value={draft.loanStatus}
                    onChange={(v) => setDraftField({ loanStatus: v })}
                    placeholder="All statuses"
                    options={filterOptions.loanStatuses.map((s) => ({ value: s, label: titleCase(s) }))}
                  />
                </div>
                <div>
                  <FieldLabel>NBFC / bank</FieldLabel>
                  <Select
                    value={draft.nbfc}
                    onChange={(v) => setDraftField({ nbfc: v })}
                    placeholder="All banks"
                    options={filterOptions.nbfcs.map((n) => ({ value: n, label: n }))}
                  />
                </div>
                <div>
                  <FieldLabel>Fintech assignee</FieldLabel>
                  <Select
                    value={draft.fintechAssigneeId}
                    onChange={(v) => setDraftField({ fintechAssigneeId: v })}
                    placeholder="All assignees"
                    options={filterOptions.fintechAssignees}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-t border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1b24]">
          <button
            onClick={resetAndClose}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12.5px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:border-red-300 dark:hover:border-red-500/30 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={apply}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold bg-[#15161d] hover:bg-[#23242e] text-white transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}