"use client";

import { useEffect, useState } from "react";
// import { BasicDetails, UniversityStatus } from "./page";
import { BasicDetails, UniversityStatus } from "@/slids/types/university.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";

interface Props {
  data: BasicDetails;
  onChange: (data: BasicDetails) => void;
  onNext: () => void;
}


const tier = [
  {
    id: "T1",
    name: "Premium Universities",
  },
    {
    id: "T2",
    name: "High Ranking Universities",
  },
    {
    id: "T3",
    name: "Standard Universities",
  },
    {
    id: "T4",
    name: "Easy Admission Universities",
  },
];
const STATUSES: { value: UniversityStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

// Simple validation
function validate(
  data: BasicDetails,
): Partial<Record<keyof BasicDetails, string>> {
  const errors: Partial<Record<keyof BasicDetails, string>> = {};
  if (!data.name.trim()) errors.name = "University name is required.";
  if (!data.countryId.trim()) errors.countryId = "Country is required.";
  if (data.contactEmail && !/^\S+@\S+\.\S+$/.test(data.contactEmail))
    errors.contactEmail = "Enter a valid email address.";
  if (data.website && !/^https?:\/\//i.test(data.website))
    errors.website = "Website must start with http:// or https://";
  return errors;
}

export default function BasicDetailsForm({ data, onChange, onNext }: Props) {
  const [touched, setTouched] = useState<
    Partial<Record<keyof BasicDetails, boolean>>
  >({});
  const [errors, setErrors] = useState<
    Partial<Record<keyof BasicDetails, string>>
  >({});

  const [countries, setCountries] = useState<{id: string, name: string, currency: string, code: string}[]>([])
  async function getCountries() {
    const req = await axios.get("/api/countries/all");
    if (req.status === 200) {
      setCountries(req.data.data)
    }
  }

  useEffect(() => {
    getCountries()
  }, [])

  // Raw file picked from the local device for the logo. Kept separately so
  // it's ready to hand off to an upload endpoint later. `data.logo` keeps
  // holding a string: a local preview URL while a file is selected, or the
  // existing hosted URL if one was already saved.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>("");

  const MAX_LOGO_SIZE_MB = 5;
  const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

  const revokeIfBlobUrl = (url?: string) => {
    if (url && url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // no-op
      }
    }
  };

  const handleLogoSelect = (file: File | null) => {
    setLogoError("");

    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Please upload a PNG, JPG, WEBP, or SVG file.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE_MB * 1024 * 1024) {
      setLogoError(`File is too large. Max size is ${MAX_LOGO_SIZE_MB}MB.`);
      return;
    }

    // Replace any previous local preview to avoid leaking object URLs
    revokeIfBlobUrl(data.logo);

    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    set("logo", previewUrl);
  };

  const removeLogo = () => {
    revokeIfBlobUrl(data.logo);
    setLogoFile(null);
    setLogoError("");
    set("logo", "");
  };

  // Clean up any local preview URL when the component unmounts
  useEffect(() => {
    return () => {
      revokeIfBlobUrl(data.logo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof BasicDetails>(
    key: K,
    value: BasicDetails[K],
  ) => {
    const updated = { ...data, [key]: value };
    onChange(updated);
    if (touched[key]) {
      const newErrors = validate(updated);
      setErrors(newErrors);
    }
  };

  const blur = (key: keyof BasicDetails) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(data));
  };

  const handleNext = () => {
    const allTouched = Object.keys(data).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Partial<Record<keyof BasicDetails, boolean>>,
    );
    setTouched(allTouched);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  };

  const field = (
    key: keyof BasicDetails,
    label: string,
    opts?: {
      type?: string;
      placeholder?: string;
      required?: boolean;
    },
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {opts?.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        type={opts?.type ?? "text"}
        value={data[key] as string}
        placeholder={opts?.placeholder}
        onChange={(e) => set(key, e.target.value as never)}
        onBlur={() => blur(key)}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2
          ${errors[key] ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:border-red-500 focus:ring-red-100"}
        `}
      />
      {errors[key] && (
        <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Section: University Info */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          University Information
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          Core details about the institution.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {field("name", "University Name", {
            required: true,
            placeholder: "e.g. University of Melbourne",
          })}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Country
            </label>
            <Select
              value={data.countryId}
              onValueChange={(value) => set("countryId", value)}
            >
              <SelectTrigger className="w-full rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>

              <SelectContent>
                {countries.length > 0 && countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {field("website", "Website", {
            type: "url",
            placeholder: "https://university.edu",
          })}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Logo
            </label>

            {data.logo ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-300 p-2">
                <img
                  src={data.logo}
                  alt="University logo preview"
                  className="h-12 w-12 shrink-0 rounded-md border border-slate-200 object-contain bg-white"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-700">
                    {logoFile ? logoFile.name : "Current logo"}
                  </p>
                  {logoFile && (
                    <p className="text-xs text-slate-400">
                      {(logoFile.size / 1024).toFixed(0)} KB
                    </p>
                  )}
                </div>
                <label className="cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  Replace
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleLogoSelect(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  onClick={removeLogo}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-6 text-center transition
                  ${logoError ? "border-red-300 bg-red-50" : "border-slate-300 hover:border-red-400 hover:bg-red-50/40"}
                `}
              >
                <svg
                  className="h-6 w-6 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V4.5m0 0L7.5 9m4.5-4.5L16.5 9M4.5 16.5v1.8a2.7 2.7 0 002.7 2.7h9.6a2.7 2.7 0 002.7-2.7v-1.8"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-600">
                  Click to upload a logo
                </span>
                <span className="text-xs text-slate-400">
                  PNG, JPG, WEBP or SVG, up to {MAX_LOGO_SIZE_MB}MB
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => handleLogoSelect(e.target.files?.[0] ?? null)}
                />
              </label>
            )}

            {logoError && (
              <p className="mt-1 text-xs text-red-500">{logoError}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Status
            </label>
            <Select
              value={data.status}
              onValueChange={(value) =>
                set("status", value as UniversityStatus)
              }
            >
              <SelectTrigger className="w-full rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {field("ranking", "Ranking", {
            type: "number",
            required: true,
            placeholder: "e.g. 42",
          })}
          {field("establishedYear", "Established Year", {
            type: "number",
            placeholder: "e.g. 1853",
          })}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Currency
            </label>
            <Select
              value={data.currency}
              onValueChange={(value) => set("currency", value)}
            >
              <SelectTrigger className="w-full rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>

              <SelectContent>
                {countries.length > 0 && countries.map((c) => (
                  <SelectItem key={c.id} value={c.currency}>
                    {c.currency === null ? `${c.code} - N/A` : `${c.code} - ${c.currency}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {field("applicationFee", "Application Fee", {
            type: "number",
            placeholder: "e.g. 100.00",
          })}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              University Tier
            </label>
            <Select
              value={data.tier}
              onValueChange={(value) => set("tier", value)}
            >
              <SelectTrigger className="w-full rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-100">
                <SelectValue placeholder="Select Tier" />
              </SelectTrigger>

              <SelectContent>
                {tier.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.id} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Brief overview of the university..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </div>
      </section>

      {/* Section: Address */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Address</h2>
        <p className="mb-5 text-sm text-slate-500">
          Physical location of the campus.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {field("address", "Street Address", {
              placeholder: "123 University Ave",
            })}
          </div>
          {field("city", "City", { placeholder: "Melbourne" })}
          {field("state", "State / Province", { placeholder: "Victoria" })}
          {field("postalCode", "Postal Code", { placeholder: "3000" })}
        </div>
      </section>

      {/* Section: Contact */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Contact Details
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          Primary point of contact at this university.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {field("contactPerson", "Contact Person", {
            placeholder: "Jane Smith",
          })}
          {field("contactEmail", "Contact Email", {
            type: "email",
            placeholder: "admissions@university.edu",
          })}
          {field("contactPhone", "Contact Phone", {
            type: "tel",
            placeholder: "+61 3 9000 0000",
          })}
        </div>

                <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Intake Notes
          </label>
          <textarea
            value={data.intakeNotes}
            onChange={(e) => set("intakeNotes", e.target.value)}
            rows={3}
            placeholder="Additional Notes..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Continue to Courses
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