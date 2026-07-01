"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BasicDetails, Course, Scholarship, UniversityFormData } from "@/slids/types/university.types";
import BasicDetailsForm from "@/slids/components/universities/BasicDetails";
import CoursesForm from "@/slids/components/universities/CoursesDetails";
import ScholarshipsForm from "@/slids/components/universities/ScolarshipDetails";


const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v);

/** Map a raw API university record back to our form shape */
function apiRecordToFormData(record: any): UniversityFormData {
  return {
    basicDetails: {
      name: str(record.name),
      countryId: str(record.countryId),
      logo: str(record.logo),
      website: str(record.website),
      address: str(record.address),
      city: str(record.city),
      state: str(record.state),
      postalCode: str(record.postalCode),
      ranking: str(record.ranking),
      establishedYear: str(record.establishedYear),
      applicationFee: str(record.applicationFee),
      currency: str(record.currency) || "USD",
      description: str(record.description),
      status: record.status ?? "active",
      contactPerson: str(record.contactPerson),
      contactEmail: str(record.contactEmail),
      contactPhone: str(record.contactPhone),
      tier: str(record.tier),
      intakeNotes: str(record.intakeNotes)
    },
    courses: (record.courses ?? []).map((c: any): Course => ({
      id: str(c.id),
      name: str(c.name),
      degree: c.degree ?? "bachelors",
      durationMonths: str(c.durationMonths),
      annualTuitionFee: str(c.annualTuitionFee),
      totalTuitionFee: str(c.totalTuitionFee),
      currency: str(c.currency) || "USD",
      intakeId: str(c.intakeId),
      minimumPercentage: str(c.minimumPercentage),
      backlogLimit: str(c.backlogLimit),
      englishRequirement: str(c.englishRequirement),
      ieltsOverall: str(c.ieltsOverall),
      ieltsListening: str(c.ieltsListening),
      ieltsReading: str(c.ieltsReading),
      ieltsWriting: str(c.ieltsWriting),
      ieltsSpeaking: str(c.ieltsSpeaking),
      greRequired: c.greRequired ?? false,
      gmatRequired: c.gmatRequired ?? false,
      courseCode: str(c.courseCode),
      description: str(c.description),
      applicationDeadline: c.applicationDeadline
        ? new Date(c.applicationDeadline).toISOString().split("T")[0]
        : "",
      status: c.status ?? true,
    })),
    scholarships: (record.scholarships ?? []).map((s: any): Scholarship => ({
      id: str(s.id),
      name: str(s.name),
      amount: str(s.amount),
      percentage: str(s.percentage),
      description: str(s.description),
      status: s.status ?? "active",
      courseId: str(s.courseId),
    })),
  };
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialBasicDetails: BasicDetails = {
  name: "",
  countryId: "",
  logo: "",
  website: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  ranking: "",
  establishedYear: "",
  applicationFee: "",
  currency: "USD",
  description: "",
  status: "active",
  contactPerson: "",
  contactEmail: "",
  contactPhone: "",
  tier: "",
  intakeNotes: ""
};

const initialFormData: UniversityFormData = {
  basicDetails: initialBasicDetails,
  courses: [],
  scholarships: [],
};

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Basic Details", description: "University information & contact" },
  { label: "Courses", description: "Programs & entry requirements" },
  { label: "Scholarships", description: "Awards & funding" },
];

// ─── Component ────────────────────────────────────────────────────────────────

function AddUniversityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // If ?id= is present we're in edit mode
  const editId = searchParams.get("id") ?? null;
  const isEditMode = Boolean(editId);

  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Load existing data in edit mode ────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/universities/${editId}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setLoadError(json.error ?? "Failed to load university.");
          return;
        }

        setFormData(apiRecordToFormData(json.data));
      } catch {
        setLoadError("Network error — could not load university.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [editId]);

  // ── Global setters ──────────────────────────────────────────────────────────
  const setBasicDetails = (data: BasicDetails) =>
    setFormData((prev) => ({ ...prev, basicDetails: data }));

  const setCourses = (data: Course[]) =>
    setFormData((prev) => ({ ...prev, courses: data }));

  const setScholarships = (data: Scholarship[]) =>
    setFormData((prev) => ({ ...prev, scholarships: data }));

  const goNext = () =>
    setCurrentStep((s) => Math.min(s + 1, 2) as 0 | 1 | 2);

  const goBack = () =>
    setCurrentStep((s) => Math.max(s - 1, 0) as 0 | 1 | 2);

  // ── Submit (create or update) ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      // Flatten basicDetails into the top level
      ...formData.basicDetails,
      // Send courses with their ids (real DB ids on edit, local uuids on create)
      courses: formData.courses,
      // Send scholarships; courseId may be local uuid (create) or real id (edit)
      scholarships: formData.scholarships,
    };
    try {
      const url = isEditMode
        ? `/api/universities/${editId}`
        : "/api/universities";

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Redirect to the university detail page (or list)
      const universityId: string = json.data.id;
      router.push(`/universities/details/${universityId}`);
    } catch {
      setSubmitError("Network error — please check your connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
          <p className="text-sm text-slate-500">Loading university…</p>
        </div>
      </div>
    );
  }

  // ── Load error ──────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-900">{loadError}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm font-medium text-red-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-medium text-slate-500">Universities</p>
          <h1 className="mt-0.5 text-xl font-semibold text-slate-900">
            {isEditMode ? "Edit University" : "Add University"}
          </h1>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <ol className="flex items-center gap-0">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;

              return (
                <li key={step.label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all
                        ${isCompleted ? "bg-red-600 text-white" : ""}
                        ${isActive ? "bg-red-600 text-white ring-4 ring-red-100" : ""}
                        ${!isCompleted && !isActive ? "bg-slate-100 text-slate-400" : ""}
                      `}
                    >
                      {isCompleted ? (
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-sm font-medium ${isActive || isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-400">{step.description}</p>
                    </div>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`mx-4 h-px flex-1 transition-colors ${
                        isCompleted ? "bg-red-600" : "bg-slate-200"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Form content */}
      <div className="mx-auto max-w-9xl px-6 py-8">
        {/* Global submit error banner */}
        {submitError && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{submitError}</p>
            <button
              onClick={() => setSubmitError(null)}
              className="ml-auto shrink-0 text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {currentStep === 0 && (
          <BasicDetailsForm
            data={formData.basicDetails}
            onChange={setBasicDetails}
            onNext={goNext}
          />
        )}
        {currentStep === 1 && (
          <CoursesForm
            data={formData.courses}
            onChange={setCourses}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 2 && (
          <ScholarshipsForm
            data={formData.scholarships}
            courses={formData.courses}
            onChange={setScholarships}
            onBack={goBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

export default function AddUniversityPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    }>
      <AddUniversityContent />
    </Suspense>
  );
}