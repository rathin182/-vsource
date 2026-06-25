"use client";

import { Course, Scholarship, UniversityStatus } from "@/slids/types/university.types";
import { useState } from "react";

interface Props {
  data: Scholarship[];
  courses: Course[];
  onChange: (data: Scholarship[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const STATUSES: { value: UniversityStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const emptyScholarship = (): Scholarship => ({
  id: crypto.randomUUID(),
  name: "",
  amount: "",
  percentage: "",
  description: "",
  status: "active",
  courseId: "",
});

function validateScholarship(
  s: Scholarship
): Partial<Record<keyof Scholarship, string>> {
  const errs: Partial<Record<keyof Scholarship, string>> = {};
  if (!s.name.trim()) errs.name = "Scholarship name is required.";
  if (s.amount && isNaN(Number(s.amount)))
    errs.amount = "Must be a valid number.";
  if (s.percentage) {
    const p = Number(s.percentage);
    if (isNaN(p) || p < 0 || p > 100)
      errs.percentage = "Must be between 0 and 100.";
  }
  return errs;
}

interface ScholarshipCardProps {
  scholarship: Scholarship;
  index: number;
  courses: Course[];
  onUpdate: (updated: Scholarship) => void;
  onRemove: () => void;
}

function ScholarshipCard({
  scholarship,
  index,
  courses,
  onUpdate,
  onRemove,
}: ScholarshipCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [errors, setErrors] =
    useState<Partial<Record<keyof Scholarship, string>>>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof Scholarship, boolean>>
  >({});

  const set = <K extends keyof Scholarship>(key: K, value: Scholarship[K]) => {
    const updated = { ...scholarship, [key]: value };
    onUpdate(updated);
    if (touched[key]) setErrors(validateScholarship(updated));
  };

  const blur = (key: keyof Scholarship) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validateScholarship(scholarship));
  };

  const inputClass = (key: keyof Scholarship) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 ${
      errors[key]
        ? "border-red-300 focus:ring-red-200"
        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
    }`;

  // Derive a label for the linked course
  const linkedCourse = courses.find((c) => c.id === scholarship.courseId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Card header */}
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {scholarship.name || "Untitled Scholarship"}
            </p>
            <p className="text-xs text-slate-400">
              {scholarship.percentage
                ? `${scholarship.percentage}% off`
                : scholarship.amount
                ? `$${scholarship.amount}`
                : "No amount set"}
              {linkedCourse ? ` · ${linkedCourse.name}` : " · All courses"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            title="Remove scholarship"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Card body */}
      {expanded && (
        <div className="space-y-5 border-t border-slate-100 px-5 pb-5 pt-4">
          {/* Row 1: Name + Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Scholarship Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scholarship.name}
                placeholder="e.g. Merit Excellence Award"
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => blur("name")}
                className={inputClass("name")}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={scholarship.status}
                onChange={(e) =>
                  set("status", e.target.value as UniversityStatus)
                }
                className={inputClass("status")}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Amount + Percentage */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Award Value
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Fixed Amount
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={scholarship.amount}
                    placeholder="0.00"
                    onChange={(e) => set("amount", e.target.value)}
                    onBlur={() => blur("amount")}
                    className={`${inputClass("amount")} pl-7`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={scholarship.percentage}
                    placeholder="e.g. 25"
                    onChange={(e) => set("percentage", e.target.value)}
                    onBlur={() => blur("percentage")}
                    className={`${inputClass("percentage")} pr-8`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                    %
                  </span>
                </div>
                {errors.percentage && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.percentage}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Leave both blank if amount is TBD.
                </p>
              </div>
            </div>
          </div>

          {/* Row 3: Linked course */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Linked Course{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            {courses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
                No courses added yet — go back to Step 2 to add courses first.
              </div>
            ) : (
              <select
                value={scholarship.courseId}
                onChange={(e) => set("courseId", e.target.value)}
                className={inputClass("courseId")}
              >
                <option value="">All courses (university-wide)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || "Untitled Course"}{" "}
                    {c.degree ? `(${c.degree})` : ""}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Tie this scholarship to a specific course, or leave blank to apply
              university-wide.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={scholarship.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Eligibility criteria, application process, renewal conditions..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary panel ─────────────────────────────────────────────────────────────

interface SummaryProps {
  courses: Course[];
  scholarships: Scholarship[];
}

function ReviewSummary({ courses, scholarships }: SummaryProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">
        Review Summary
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
              <svg
                className="h-4 w-4 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Courses</p>
              <p className="text-xs text-slate-400">
                {courses.length === 0
                  ? "None added"
                  : courses.map((c) => c.name || "Untitled").join(", ")}
              </p>
            </div>
          </div>
          <span
            className={`text-lg font-bold ${
              courses.length > 0 ? "text-indigo-600" : "text-slate-300"
            }`}
          >
            {courses.length}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-4 w-4 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Scholarships</p>
              <p className="text-xs text-slate-400">
                {scholarships.length === 0
                  ? "None added"
                  : scholarships.map((s) => s.name || "Untitled").join(", ")}
              </p>
            </div>
          </div>
          <span
            className={`text-lg font-bold ${
              scholarships.length > 0 ? "text-amber-600" : "text-slate-300"
            }`}
          >
            {scholarships.length}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ScholarshipsForm({
  data,
  courses,
  onChange,
  onBack,
  onSubmit,
  isSubmitting,
}: Props) {
  const addScholarship = () => onChange([...data, emptyScholarship()]);

  const updateScholarship = (id: string, updated: Scholarship) =>
    onChange(data.map((s) => (s.id === id ? updated : s)));

  const removeScholarship = (id: string) =>
    onChange(data.filter((s) => s.id !== id));

  // Validate all cards before final submit
  const hasErrors = data.some(
    (s) => Object.keys(validateScholarship(s)).length > 0
  );

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Scholarships
          </h2>
          <p className="text-sm text-slate-500">
            Add funding and awards available at this university.
          </p>
        </div>
        <button
          onClick={addScholarship}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Scholarship
        </button>
      </div>

      {/* Scholarship cards */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-6 w-6 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">
            No scholarships added yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Scholarships are optional — you can submit without them.
          </p>
          <button
            onClick={addScholarship}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add First Scholarship
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((scholarship, idx) => (
            <ScholarshipCard
              key={scholarship.id}
              scholarship={scholarship}
              index={idx}
              courses={courses}
              onUpdate={(updated) => updateScholarship(scholarship.id, updated)}
              onRemove={() => removeScholarship(scholarship.id)}
            />
          ))}
        </div>
      )}

      {/* Review summary */}
      <ReviewSummary courses={courses} scholarships={data} />

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || hasErrors}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              Save University
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}