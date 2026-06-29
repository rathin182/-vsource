"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin,
  GraduationCap,
  BookOpen,
  Globe,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Check,
  ChevronsUpDown,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ─── Local Types ─────────────────────────────────────────────────────────────

type Branch = {
  id: string;
  name: string;
};

type Country = {
  id: string;
  name: string;
};

type Intake = {
  id: string;
  name: string;
};

type LeadSource = {
  id: string;
  name: string;
};

type UniversityCourse = {
  id: string;
  name: string;
};

type University = {
  id: string;
  name: string;
  courses: UniversityCourse[];
};

type LeadFormValues = {
  // Basic / Personal
  counsellingDate: string;       // → applicationDate
  studentName: string;
  fatherName: string;
  phone: string;                 // → phone (backend also accepts mobileNumber)
  email: string;                 // → email (backend also accepts emailId)
  place: string;                 // informational only — not in backend schema, sent as-is
  passport: string;
  passportExpireDate: string;
  source: string;
  branchId: string;

  // Academic — Schooling
  tenthPercentage: string;       // → tenthPassingPercentage
  tenthYearOfPassing: string;    // → tenthPassingYear
  twelfthPercentage: string;     // → twelfthPercentage ✓
  twelfthYearOfPassing: string;  // → twelfthYearOfPassing ✓

  // Academic — Bachelor's
  bachelorsCourse: string;
  bachelorsUniversityId: string;
  bachelorsUniversityName: string;
  bachelorsPercentage: string;
  bachelorsYearOfPassing: string;
  backlogs: string;
  gapsIfAny: string;
  workExperience: string;

  // EPT — English
  englishTestType: string;       // "IELTS" | "TOEFL" | "DUOLINGO" | "PTE"
  listeningScore: string;
  readingScore: string;
  writingScore: string;
  speakingScore: string;
  // Per-test overall score (TOEFL, PTE, DUOLINGO don't use sub-scores on the backend)
  toeflScore: string;
  pteScore: string;
  duolingoScore: string;

  // GRE / GMAT
  greGmatScore: string;
  quantitativeScore: string;
  verbalScore: string;
  analyticalWritingScore: string;

  // Preferences
  preferredCountry: string;
  preferredIntake: string;
  preferredCourse: string;
  preferredTiers: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ENGLISH_TEST_OPTIONS = ["IELTS", "TOEFL", "DUOLINGO", "PTE"] as const;
const TIER_OPTIONS = ["T1", "T2", "T3", "T4"];

const MOCK_LEAD_SOURCES: LeadSource[] = [
  { id: "1", name: "Walk-in" },
  { id: "2", name: "Referral" },
  { id: "3", name: "Social Media" },
  { id: "4", name: "Website" },
  { id: "5", name: "Event" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

/** Convert a string to number, or return undefined if blank / NaN */
const toNumberOrUndef = (v: string): number | undefined => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

/** Return undefined for blank strings */
const strOrUndef = (v: string): string | undefined =>
  v.trim() === "" ? undefined : v.trim();

const INITIAL_FORM: LeadFormValues = {
  counsellingDate: getCurrentDateTimeLocal(),
  studentName: "",
  fatherName: "",
  phone: "",
  email: "",
  place: "",
  passport: "",
  passportExpireDate: "",
  source: "",
  branchId: "",

  tenthPercentage: "",
  tenthYearOfPassing: "",
  twelfthPercentage: "",
  twelfthYearOfPassing: "",
  bachelorsCourse: "",
  bachelorsUniversityId: "",
  bachelorsUniversityName: "",
  bachelorsPercentage: "",
  bachelorsYearOfPassing: "",
  backlogs: "",
  gapsIfAny: "",
  workExperience: "",

  englishTestType: "",
  listeningScore: "",
  readingScore: "",
  writingScore: "",
  speakingScore: "",
  toeflScore: "",
  pteScore: "",
  duolingoScore: "",

  greGmatScore: "",
  quantitativeScore: "",
  verbalScore: "",
  analyticalWritingScore: "",

  preferredCountry: "",
  preferredIntake: "",
  preferredCourse: "",
  preferredTiers: [],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionPanel({
  label,
  icon,
  iconColor,
  accentColor = "border-t-red-500",
  open,
  onToggle,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  accentColor?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between border-t-4 ${accentColor} rounded-t-2xl px-6 py-4 text-left hover:bg-gray-50 transition-colors`}
      >
        <span className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <span className={iconColor}>{icon}</span>
          {label}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 mb-1.5"
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function TextInput({
  id,
  placeholder,
  type = "text",
  value,
  onChange,
  maxLength,
  step,
  min,
  onInput,
}: {
  id?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  step?: string;
  min?: number;
  onInput?: React.FormEventHandler<HTMLInputElement>;
}) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      step={step}
      min={min}
      onInput={onInput}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
    />
  );
}

function TextareaInput({
  id,
  placeholder,
  value,
  onChange,
  rows = 2,
}: {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      placeholder={placeholder}
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-none"
    />
  );
}

// ─── University Combobox ──────────────────────────────────────────────────────

function UniversityCombobox({
  value,
  onChange,
  universities,
}: {
  value: string;
  onChange: (id: string, name: string, courses: UniversityCourse[]) => void;
  universities: University[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = universities.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Select or Type University"}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              placeholder="Search university..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!search.trim()) return;
                    onChange("", search.trim(), []);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 w-full text-left"
                >
                  <Plus className="h-4 w-4" />
                  Add "{search}"
                </button>
              </li>
            ) : (
              filtered.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(u.id, u.name, u.courses ?? []);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Check
                      className={`h-4 w-4 shrink-0 ${
                        value === u.name ? "text-primary opacity-100" : "opacity-0"
                      }`}
                    />
                    {u.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Multi-select Tiers ───────────────────────────────────────────────────────

function TierMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tiers: string[]) => void;
}) {
  const remaining = TIER_OPTIONS.filter((t) => !selected.includes(t));

  return (
    <div className="space-y-2">
      <Select
        value=""
        onValueChange={(tier) => {
          if (tier) onChange([...selected, tier]);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select University Tier(s)" />
        </SelectTrigger>
        <SelectContent>
          {remaining.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((tier) => (
            <span
              key={tier}
              className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1"
            >
              {tier}
              <button
                type="button"
                onClick={() => onChange(selected.filter((t) => t !== tier))}
                className="ml-0.5 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {children}
    </div>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddNewLead() {
  const router = useRouter();

  // ── Form State ──
  const [form, setForm] = useState<LeadFormValues>({
    ...INITIAL_FORM,
    counsellingDate: getCurrentDateTimeLocal(),
  });
  const [isSaving, setIsSaving] = useState(false);

  // ── Accordion State ──
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    education: true,
    scores: false,
    preferences: false,
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Dropdown Data State ──
  const [branches, setBranches] = useState<Branch[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [availableCourses, setAvailableCourses] = useState<UniversityCourse[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);

  // ── Fetch all master data on mount ──
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [branchRes, uniRes, countryRes, intakeRes] = await Promise.all([
          axios.get("/api/branches/all", { withCredentials: true }),
          axios.get("/api/universities/all", { params: { course: true }, withCredentials: true }),
          axios.get("/api/countries/all", { withCredentials: true }),
          axios.get("/api/intakes/all", { withCredentials: true }),
        ]);

        setBranches(branchRes.data?.data ?? []);
        setUniversities(uniRes.data?.data ?? []);
        setCountries(countryRes.data?.data ?? []);
        setIntakes(intakeRes.data?.data ?? []);
      } catch (err) {
        console.error("Failed to load master data:", err);
        toast.error("Failed to load dropdown data");
      }
    };

    fetchAll();
  }, []);

  // ── Generic field setter ──
  const set = <K extends keyof LeadFormValues>(
    key: K,
    value: LeadFormValues[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // ── University selection: update name, id, and derive courses ──
  const handleUniversityChange = (
    id: string,
    name: string,
    courses: UniversityCourse[],
  ) => {
    setForm((prev) => ({
      ...prev,
      bachelorsUniversityId: id,
      bachelorsUniversityName: name,
      bachelorsCourse: "", // reset course when university changes
    }));
    setAvailableCourses(courses);
  };

  // ── Reset ──
  const handleReset = () => {
    setForm({ ...INITIAL_FORM, counsellingDate: getCurrentDateTimeLocal() });
    setAvailableCourses([]);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    // ── Client-side validation ──
    if (!form.studentName.trim()) {
      toast.error("Student name is required");
      return;
    }
    if (!form.phone || form.phone.length !== 10) {
      toast.error("A valid 10-digit mobile number is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email address is required");
      return;
    }
    if (!form.branchId) {
      toast.error("Please select a branch");
      return;
    }

    setIsSaving(true);

    try {
      /**
       * Build the payload using the exact field names the backend's
       * LeadCreateSchema expects (see POST /api/leads handler).
       *
       * Field-name mapping (frontend → backend):
       *   counsellingDate       → applicationDate   (via payload.counsellingDate)
       *   tenthPercentage       → tenthPassingPercentage
       *   tenthYearOfPassing    → tenthPassingYear
       *   phone                 → phone             (backend also accepts mobileNumber)
       *   email                 → email             (backend also accepts emailId)
       *   status                → must be uppercase ("NEW")
       */
      const payload = {
        // ── Personal ──
        studentName:        form.studentName.trim(),
        fatherName:         strOrUndef(form.fatherName),
        email:              form.email.trim(),
        phone:              form.phone,
        passport:           strOrUndef(form.passport),
        passportExpireDate: strOrUndef(form.passportExpireDate),
        counsellingDate:    strOrUndef(form.counsellingDate), // backend maps this → applicationDate
        source:             strOrUndef(form.source),
        branchId:           form.branchId,

        // ── Academic — Schooling ──
        // Backend maps tenthPercentage → tenthPassingPercentage
        // and tenthYearOfPassing → tenthPassingYear
        tenthPercentage:       toNumberOrUndef(form.tenthPercentage),
        tenthYearOfPassing:    toNumberOrUndef(form.tenthYearOfPassing),
        twelfthPercentage:     toNumberOrUndef(form.twelfthPercentage),
        twelfthYearOfPassing:  toNumberOrUndef(form.twelfthYearOfPassing),

        // ── Academic — Bachelor's ──
        bachelorsUniversityName: strOrUndef(form.bachelorsUniversityName),
        bachelorsCourse:         strOrUndef(form.bachelorsCourse),
        bachelorsPercentage:     toNumberOrUndef(form.bachelorsPercentage),
        bachelorsYearOfPassing:  toNumberOrUndef(form.bachelorsYearOfPassing),
        backlogs:                toNumberOrUndef(form.backlogs),
        gapsIfAny:               strOrUndef(form.gapsIfAny),
        workExperience:          strOrUndef(form.workExperience),

        // ── EPT — English ──
        englishTestType: strOrUndef(form.englishTestType),
        // Sub-scores (used by IELTS; backend auto-calculates ieltsScore from these)
        listeningScore:  toNumberOrUndef(form.listeningScore),
        readingScore:    toNumberOrUndef(form.readingScore),
        writingScore:    toNumberOrUndef(form.writingScore),
        speakingScore:   toNumberOrUndef(form.speakingScore),
        // Per-test overall scores for other test types
        toeflScore:      form.englishTestType === "TOEFL"    ? toNumberOrUndef(form.toeflScore)    : undefined,
        pteScore:        form.englishTestType === "PTE"      ? toNumberOrUndef(form.pteScore)      : undefined,
        duolingoScore:   form.englishTestType === "DUOLINGO" ? toNumberOrUndef(form.duolingoScore) : undefined,

        // ── GRE / GMAT ──
        greGmatScore:           toNumberOrUndef(form.greGmatScore),
        quantitativeScore:      toNumberOrUndef(form.quantitativeScore),
        verbalScore:            toNumberOrUndef(form.verbalScore),
        analyticalWritingScore: toNumberOrUndef(form.analyticalWritingScore),

        // ── Preferences ──
        preferredCountry: strOrUndef(form.preferredCountry),
        preferredCourse:  strOrUndef(form.preferredCourse),
        preferredIntake:  strOrUndef(form.preferredIntake),
        preferredTiers:   form.preferredTiers,

        // ── Lead meta ──
        status: "NEW",          // backend expects uppercase
      };

      await axios.post("/api/leads", payload, {
        withCredentials: true,
      });

      toast.success("Lead created successfully");
      router.push("/leads/all");
    } catch (err: any) {
      console.error(err);
      // axios wraps HTTP errors — extract backend message if available
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Something went wrong";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived: show overall score input for non-IELTS tests ──

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen relative">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6 pb-32">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Add New Lead</h1>
          <p className="text-sm text-muted-foreground">
            Register a new student for counselling and process tracking.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>

            {/* ── Basic Information ──────────────────────────────────── */}
            <SectionPanel
              label="Basic Information"
              icon={<MapPin className="h-5 w-5" />}
              iconColor="text-primary"
              accentColor="border-t-primary"
              open={openSections.basic}
              onToggle={() => toggleSection("basic")}
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                {/* Branch */}
                <div>
                  <FieldLabel required>Branch</FieldLabel>
                  <Select value={form.branchId} onValueChange={(v) => set("branchId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Application Date */}
                <div>
                  <FieldLabel htmlFor="counsellingDate">Application Date</FieldLabel>
                  <TextInput
                    id="counsellingDate"
                    type="datetime-local"
                    value={form.counsellingDate}
                    onChange={(v) => set("counsellingDate", v)}
                  />
                </div>

                {/* Student Name */}
                <div>
                  <FieldLabel htmlFor="studentName" required>Student Name</FieldLabel>
                  <TextInput
                    id="studentName"
                    placeholder="ex: Rahul"
                    value={form.studentName}
                    onChange={(v) => set("studentName", v)}
                  />
                </div>

                {/* Father Name */}
                <div>
                  <FieldLabel htmlFor="fatherName">Father Name</FieldLabel>
                  <TextInput
                    id="fatherName"
                    placeholder="ex: Venkatesh"
                    value={form.fatherName}
                    onChange={(v) => set("fatherName", v)}
                  />
                </div>

                {/* Mobile */}
                <div>
                  <FieldLabel htmlFor="phone" required>Mobile Number</FieldLabel>
                  <TextInput
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <FieldLabel htmlFor="email" required>Email Address</FieldLabel>
                  <TextInput
                    id="email"
                    type="email"
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={(v) => set("email", v)}
                  />
                </div>

                {/* City */}
                <div>
                  <FieldLabel htmlFor="place">City / Place</FieldLabel>
                  <TextInput
                    id="place"
                    placeholder="Hyderabad"
                    value={form.place}
                    onChange={(v) => set("place", v)}
                  />
                </div>

                {/* Passport */}
                <div>
                  <FieldLabel htmlFor="passport">Passport Number</FieldLabel>
                  <TextInput
                    id="passport"
                    placeholder="U12345678"
                    value={form.passport}
                    onChange={(v) => set("passport", v)}
                  />
                </div>

                {/* Passport Expiry */}
                <div>
                  <FieldLabel htmlFor="passportExpireDate">Passport Expiry Date</FieldLabel>
                  <TextInput
                    id="passportExpireDate"
                    type="date"
                    value={form.passportExpireDate}
                    onChange={(v) => set("passportExpireDate", v)}
                  />
                </div>

                {/* Lead Source */}
                <div>
                  <FieldLabel>Lead Source</FieldLabel>
                  <Select value={form.source} onValueChange={(v) => set("source", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_LEAD_SOURCES.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionPanel>

            {/* ── Educational Information ────────────────────────────── */}
            <SectionPanel
              label="Educational Information"
              icon={<GraduationCap className="h-5 w-5" />}
              iconColor="text-blue-500"
              accentColor="border-t-blue-500"
              open={openSections.education}
              onToggle={() => toggleSection("education")}
            >
              <div className="space-y-6">
                {/* Schooling */}
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                  <div>
                    <FieldLabel>10th Percentage (%)</FieldLabel>
                    <TextInput
                      type="number"
                      placeholder="e.g. 85"
                      min={0}
                      value={form.tenthPercentage}
                      onChange={(v) => set("tenthPercentage", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel>10th Year of Passing</FieldLabel>
                    <TextInput
                      type="number"
                      placeholder="YYYY"
                      min={0}
                      value={form.tenthYearOfPassing}
                      onChange={(v) => set("tenthYearOfPassing", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel>12th Percentage (%)</FieldLabel>
                    <TextInput
                      type="number"
                      placeholder="e.g. 88"
                      min={0}
                      value={form.twelfthPercentage}
                      onChange={(v) => set("twelfthPercentage", v)}
                    />
                  </div>
                  <div>
                    <FieldLabel>12th Year of Passing</FieldLabel>
                    <TextInput
                      type="number"
                      placeholder="YYYY"
                      min={0}
                      value={form.twelfthYearOfPassing}
                      onChange={(v) => set("twelfthYearOfPassing", v)}
                    />
                  </div>
                </div>

                <SectionDivider label="Bachelor's Degree" />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {/* University Combobox */}
                  <div className="lg:col-span-2">
                    <FieldLabel>University / College Name</FieldLabel>
                    <UniversityCombobox
                      value={form.bachelorsUniversityName}
                      onChange={handleUniversityChange}
                      universities={universities}
                    />
                  </div>

                  {/* Course — driven by selected university's courses */}
                  <div>
                    <FieldLabel>Course / Major</FieldLabel>
                    <Select
                      value={form.bachelorsCourse}
                      onValueChange={(v) => set("bachelorsCourse", v)}
                      disabled={availableCourses.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableCourses.length === 0
                              ? "Select a university first"
                              : "Select Course"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CGPA */}
                  <div>
                    <FieldLabel>CGPA / Percentage</FieldLabel>
                    <TextInput
                      type="number"
                      placeholder="e.g. 75 or 8.5"
                      step="0.01"
                      min={0}
                      value={form.bachelorsPercentage}
                      onChange={(v) => set("bachelorsPercentage", v)}
                    />
                  </div>

                  {/* Year of Passing */}
                  <div>
                    <FieldLabel>Year of Passing</FieldLabel>
                    <TextInput
                      type="number"
                      placeholder="YYYY"
                      min={0}
                      value={form.bachelorsYearOfPassing}
                      onChange={(v) => set("bachelorsYearOfPassing", v)}
                    />
                  </div>

                  {/* Backlogs */}
                  <div>
                    <FieldLabel>Active Backlogs</FieldLabel>
                    <TextInput
                      type="number"
                      placeholder="0"
                      min={0}
                      value={form.backlogs}
                      onChange={(v) => set("backlogs", v)}
                    />
                  </div>
                </div>

                {/* Education Gaps */}
                <div>
                  <FieldLabel>Education Gaps (If Any)</FieldLabel>
                  <TextareaInput
                    placeholder="Explain any gaps in education..."
                    value={form.gapsIfAny}
                    onChange={(v) => set("gapsIfAny", v)}
                  />
                </div>

                {/* Work Experience (moved here from preferences for logical grouping) */}
                <div>
                  <FieldLabel>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Work Experience
                    </span>
                  </FieldLabel>
                  <TextareaInput
                    placeholder="Details of current or past employment..."
                    value={form.workExperience}
                    onChange={(v) => set("workExperience", v)}
                  />
                </div>
              </div>
            </SectionPanel>

            {/* ── EPT Details ───────────────────────────────────────── */}
            <SectionPanel
              label="EPT Details"
              icon={<BookOpen className="h-5 w-5" />}
              iconColor="text-red-500"
              accentColor="border-t-red-500"
              open={openSections.scores}
              onToggle={() => toggleSection("scores")}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* English Proficiency */}
                <ScoreCard title="English Proficiency Test">
                  <div>
                    <FieldLabel>Test Type</FieldLabel>
                    <Select
                      value={form.englishTestType}
                      onValueChange={(v) => {
                        // Clear all score fields when test type changes
                        setForm((prev) => ({
                          ...prev,
                          englishTestType: v,
                          listeningScore: "",
                          readingScore: "",
                          writingScore: "",
                          speakingScore: "",
                          toeflScore: "",
                          pteScore: "",
                          duolingoScore: "",
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Test" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENGLISH_TEST_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(
                        [
                          { label: "Listening", key: "listeningScore" },
                          { label: "Reading",   key: "readingScore"   },
                          { label: "Writing",   key: "writingScore"   },
                          { label: "Speaking",  key: "speakingScore"  },
                        ] as { label: string; key: keyof LeadFormValues }[]
                      ).map(({ label, key }) => (
                        <div key={key}>
                          <FieldLabel>{label}</FieldLabel>
                          <TextInput
                            type="number"
                            placeholder="0.0"
                            step="0.5"
                            min={0}
                            value={form[key] as string}
                            onChange={(v) => set(key, v)}
                          />
                        </div>
                      ))}
                    </div>
                </ScoreCard>

                {/* GRE / GMAT */}
                <ScoreCard title="GRE / GMAT">
                  <div>
                    <FieldLabel>Total Score</FieldLabel>
                    <TextInput
                      type="number"
                      placeholder="Overall Score"
                      min={0}
                      value={form.greGmatScore}
                      onChange={(v) => set("greGmatScore", v)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>Quantitative (Q)</FieldLabel>
                      <TextInput
                        type="number"
                        placeholder="Q Score"
                        min={0}
                        value={form.quantitativeScore}
                        onChange={(v) => set("quantitativeScore", v)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Verbal (V)</FieldLabel>
                      <TextInput
                        type="number"
                        placeholder="V Score"
                        min={0}
                        value={form.verbalScore}
                        onChange={(v) => set("verbalScore", v)}
                      />
                    </div>
                    <div className="col-span-2">
                      <FieldLabel>Analytical Writing (AWA)</FieldLabel>
                      <TextInput
                        type="number"
                        placeholder="AWA Score"
                        step="0.5"
                        min={0}
                        value={form.analyticalWritingScore}
                        onChange={(v) => set("analyticalWritingScore", v)}
                      />
                    </div>
                  </div>
                </ScoreCard>
              </div>
            </SectionPanel>

            {/* ── Study Preferences ─────────────────────────────────── */}
            <SectionPanel
              label="Study Preferences"
              icon={<Globe className="h-5 w-5" />}
              iconColor="text-emerald-500"
              accentColor="border-t-emerald-500"
              open={openSections.preferences}
              onToggle={() => toggleSection("preferences")}
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

                {/* Preferred Country */}
                <div>
                  <FieldLabel>Preferred Country</FieldLabel>
                  <Select
                    value={form.preferredCountry}
                    onValueChange={(v) => set("preferredCountry", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferred Intake */}
                <div>
                  <FieldLabel>Preferred Intake</FieldLabel>
                  <Select
                    value={form.preferredIntake}
                    onValueChange={(v) => set("preferredIntake", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Intake" />
                    </SelectTrigger>
                    <SelectContent>
                      {intakes.map((i) => (
                        <SelectItem key={i.id} value={i.name}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* University Tiers */}
                <div>
                  <FieldLabel>Preferred University Tiers</FieldLabel>
                  <TierMultiSelect
                    selected={form.preferredTiers}
                    onChange={(tiers) => set("preferredTiers", tiers)}
                  />
                </div>

                {/* Preferred Course (free text) */}
                <div>
                  <FieldLabel>Preferred Course</FieldLabel>
                  <TextInput
                    placeholder="e.g. MS in Data Science"
                    value={form.preferredCourse}
                    onChange={(v) => set("preferredCourse", v)}
                  />
                </div>
              </div>
            </SectionPanel>
          </form>
        </div>
      </div>

      {/* ── Sticky Footer ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex flex-col-reverse gap-3 border-t border-border bg-background/90 backdrop-blur-md px-4 py-4 shadow-lg sm:flex-row sm:justify-end sm:px-8">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="rounded-lg border border-border bg-background px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
        >
          Reset Form
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Lead…
            </>
          ) : (
            "Save Lead & Continue"
          )}
        </button>
      </div>
    </div>
  );
}