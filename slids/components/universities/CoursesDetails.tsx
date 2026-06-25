"use client";

import { Course, DegreeType } from "@/slids/types/university.types";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";

interface Props {
  data: Course[];
  onChange: (data: Course[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEGREE_TYPES: { value: DegreeType; label: string }[] = [
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "mba", label: "MBA" },
  { value: "certificate", label: "Certificate" },
];

const CURRENCIES = ["USD", "AUD", "GBP", "CAD", "EUR", "INR"];

const emptyCourse = (): Course => ({
  id: crypto.randomUUID(),
  name: "",
  degree: "bachelors",
  durationMonths: "",
  annualTuitionFee: "",
  totalTuitionFee: "",
  currency: "USD",
  intakeId: "",
  minimumPercentage: "",
  backlogLimit: "",
  englishRequirement: "",
  ieltsOverall: "",
  ieltsListening: "",
  ieltsReading: "",
  ieltsWriting: "",
  ieltsSpeaking: "",
  greRequired: false,
  gmatRequired: false,
  courseCode: "",
  description: "",
  applicationDeadline: "",
  status: true,
});

function validateCourse(c: Course): Partial<Record<keyof Course, string>> {
  const errs: Partial<Record<keyof Course, string>> = {};
  if (!c.name.trim()) errs.name = "Course name is required.";
  return errs;
}

interface CourseCardProps {
  course: Course;
  index: number;
  onUpdate: (updated: Course) => void;
  onRemove: () => void;
}

function CourseCard({ course, index, onUpdate, onRemove }: CourseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof Course, string>>>(
    {},
  );
  const [touched, setTouched] = useState<
    Partial<Record<keyof Course, boolean>>
  >({});

  const [intakeYear, setIntake] = useState<{id: string, name: string}[]>([])

  async function getIntake() {
    const req = await axios.get("/api/intakes/all");
    if (req.status === 200) {
      console.log(req.data.data);
      
      setIntake(req.data.data)
    }
  }

  useEffect(() => {
    getIntake()
  }, [])

  const set = <K extends keyof Course>(key: K, value: Course[K]) => {
    const updated = { ...course, [key]: value };
    onUpdate(updated);
    if (touched[key]) {
      setErrors(validateCourse(updated));
    }
  };

  const blur = (key: keyof Course) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validateCourse(course));
  };

  const inputClass = (key: keyof Course) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 ${
      errors[key]
        ? "border-red-300 focus:ring-red-200"
        : "border-slate-300 focus:border-red-500 focus:ring-red-100"
    }`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Card header */}
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {course.name || "Untitled Course"}
            </p>
            {course.degree && (
              <p className="text-xs text-slate-400 capitalize">
                {course.degree}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            title="Remove course"
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
            className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
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
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={course.name}
                placeholder="e.g. Bachelor of Computer Science"
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
                Degree Type
              </label>
              <Select
                value={course.degree}
                onValueChange={(value) => set("degree", value as DegreeType)}
              >
                <SelectTrigger className={inputClass("degree")}>
                  <SelectValue placeholder="Select degree type" />
                </SelectTrigger>

                <SelectContent>
                  {DEGREE_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Course Code
              </label>
              <input
                type="text"
                value={course.courseCode}
                placeholder="e.g. CS-101"
                onChange={(e) => set("courseCode", e.target.value)}
                className={inputClass("courseCode")}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Duration (months)
              </label>
              <input
                type="number"
                value={course.durationMonths}
                placeholder="e.g. 36"
                onChange={(e) => set("durationMonths", e.target.value)}
                className={inputClass("durationMonths")}
              />
            </div>
          </div>

          {/* Tuition */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tuition Fees
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Currency
                </label>
                <Select
                  value={course.currency}
                  onValueChange={(value) => set("currency", value)}
                >
                  <SelectTrigger className="w-full rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-100">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>

                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Annual Fee
                </label>
                <input
                  type="number"
                  value={course.annualTuitionFee}
                  placeholder="0.00"
                  onChange={(e) => set("annualTuitionFee", e.target.value)}
                  className={inputClass("annualTuitionFee")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Total Fee
                </label>
                <input
                  type="number"
                  value={course.totalTuitionFee}
                  placeholder="0.00"
                  onChange={(e) => set("totalTuitionFee", e.target.value)}
                  className={inputClass("totalTuitionFee")}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Intake Year
                </label>
                                <Select
                  value={course.intakeId}
                  onValueChange={(value) => set("intakeId", value)}
                >
                  <SelectTrigger className="w-full rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-100">
                    <SelectValue placeholder="Select Intake Year" />
                  </SelectTrigger>

                  <SelectContent>
                    {intakeYear.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
              
              </div>

            </div>
          </div>

          {/* Entry Requirements */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Entry Requirements
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Minimum Percentage (%)
                </label>
                <input
                  type="number"
                  value={course.minimumPercentage}
                  placeholder="e.g. 60"
                  onChange={(e) => set("minimumPercentage", e.target.value)}
                  className={inputClass("minimumPercentage")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Backlog Limit
                </label>
                <input
                  type="number"
                  value={course.backlogLimit}
                  placeholder="e.g. 5"
                  onChange={(e) => set("backlogLimit", e.target.value)}
                  className={inputClass("backlogLimit")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  English Requirement
                </label>
                <input
                  type="text"
                  value={course.englishRequirement}
                  placeholder="e.g. IELTS 6.5"
                  onChange={(e) => set("englishRequirement", e.target.value)}
                  className={inputClass("englishRequirement")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={course.applicationDeadline}
                  onChange={(e) => set("applicationDeadline", e.target.value)}
                  className={inputClass("applicationDeadline")}
                />
              </div>
            </div>

            {/* IELTS */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">
                IELTS Scores
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {(
                  [
                    ["ieltsOverall", "Overall"],
                    ["ieltsListening", "Listening"],
                    ["ieltsReading", "Reading"],
                    ["ieltsWriting", "Writing"],
                    ["ieltsSpeaking", "Speaking"],
                  ] as [keyof Course, string][]
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs text-slate-500">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={course[key] as string}
                      placeholder="0.0"
                      onChange={(e) => set(key, e.target.value as never)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* GRE / GMAT */}
            <div className="mt-4 flex flex-wrap gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={course.greRequired}
                  onChange={(e) => set("greRequired", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 accent-red-600"
                />
                GRE Required
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={course.gmatRequired}
                  onChange={(e) => set("gmatRequired", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 accent-red-600"
                />
                GMAT Required
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={course.status}
                  onChange={(e) => set("status", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 accent-red-600"
                />
                Course Active
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={course.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Brief overview of this course..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CoursesForm({ data, onChange, onNext, onBack }: Props) {
  const addCourse = () => onChange([...data, emptyCourse()]);

  const updateCourse = (id: string, updated: Course) =>
    onChange(data.map((c) => (c.id === id ? updated : c)));

  const removeCourse = (id: string) =>
    onChange(data.filter((c) => c.id !== id));

  const handleNext = () => {
    // No courses is fine — scholarships step can still be visited
    onNext();
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Courses</h2>
          <p className="text-sm text-slate-500">
            Add all programs offered by this university.
          </p>
        </div>
        <button
          onClick={addCourse}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Course
        </button>
      </div>

      {/* Course cards */}
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">
            No courses added yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Click &ldquo;Add Course&rdquo; to get started.
          </p>
          <button
            onClick={addCourse}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add First Course
          </button>
        </div>
      ) : (
        <div className="space-y-4 flex gap-4 flex-col-reverse">
          {data.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              index={idx}
              onUpdate={(updated) => updateCourse(course.id, updated)}
              onRemove={() => removeCourse(course.id)}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Continue to Scholarships
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
