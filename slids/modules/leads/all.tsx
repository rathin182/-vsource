"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  PageHeader,
  PageTransition,
} from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Badge } from "@/slids/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
import { Label } from "@/slids/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/slids/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Eye, Loader2, X } from "lucide-react";
import { Skeleton } from "@/slids/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MODULES } from "@/lib/module-codes";
// import type { Lead, LeadStatus } from "@/types";
import { useAuth } from "@/slids/store";
import { UniversityCombobox } from "./new";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  draft:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  new: "bg-info/15 text-info border-info/20",
  contacted: "bg-warning/15 text-warning border-warning/20",
  qualified: "bg-primary/10 text-primary border-primary/20",
  converted: "bg-success/15 text-success border-success/20",
  lost: "bg-muted text-muted-foreground border-border",
};

const STATUS_TABS: Array<any | "all"> = [
  "all",
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
  "draft",
];

const ENGLISH_TEST_OPTIONS = ["IELTS", "TOEFL", "DUOLINGO", "PTE"];
const TIER_OPTIONS = ["T1", "T2", "T3", "T4"];
const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Init {
  id: string;
  name: string;
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const strOrUndef = (v: string | undefined | null): string | undefined =>
  v?.trim() === "" || v == null ? undefined : v.trim();

const toNumberOrUndef = (
  v: string | number | undefined | null,
): number | undefined => {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type EditForm = {
  studentName: string;
  fatherName: string;
  phone: string;
  email: string;
  place: string;
  source: string;
  passport: string;
  passportExpireDate: string;
  counsellingDate: string;
  nextFollowup: string;

  tenthPercentage: string;
  tenthYearOfPassing: string;
  twelfthPercentage: string;
  twelfthYearOfPassing: string;
  bachelorsUniversityName: string;
  bachelorsCourse: string;
  bachelorsPercentage: string;
  bachelorsYearOfPassing: string;
  backlogs: string;
  gapsIfAny: string;
  workExperience: string;

  englishTestType: string;
  listeningScore: string;
  readingScore: string;
  writingScore: string;
  speakingScore: string;
  toeflScore: string;
  pteScore: string;
  duolingoScore: string;
  greGmatScore: string;
  quantitativeScore: string;
  verbalScore: string;
  analyticalWritingScore: string;

  preferredCountry: string;
  preferredIntake: string;
  preferredCourse: string;
  preferredTiers: string[];
  status: string;
  counsellorId: string;
};

const leadToEditForm = (lead: any): EditForm => ({
  studentName: lead.studentName ?? "",
  fatherName: lead.fatherName ?? "",
  phone: lead.phone ?? "",
  email: lead.email ?? "",
  place: (lead as any).place ?? "",
  source: lead.source ?? "",
  passport: lead.passport ?? "",
  passportExpireDate: lead.passportExpireDate ?? "",
  counsellingDate: lead.applicationDate ?? "",
  nextFollowup: new Date(lead.nextFollowup).toISOString() ?? "",

  tenthPercentage: String(lead.tenthPassingPercentage ?? ""),
  tenthYearOfPassing: String(lead.tenthPassingYear ?? ""),
  twelfthPercentage: String(lead.twelfthPercentage ?? ""),
  twelfthYearOfPassing: String(lead.twelfthYearOfPassing ?? ""),
  bachelorsUniversityName: lead.bachelorsUniversityName ?? "",
  bachelorsCourse: lead.bachelorsCourse ?? "",
  bachelorsPercentage: String(lead.bachelorsPercentage ?? ""),
  bachelorsYearOfPassing: String(lead.bachelorsYearOfPassing ?? ""),
  backlogs: String(lead.backlogs ?? ""),
  gapsIfAny: lead.gapsIfAny ?? "",
  workExperience: lead.workExperience ?? "",

  englishTestType: lead.englishTestType ?? "",
  listeningScore: String(lead.listeningScore ?? ""),
  readingScore: String(lead.readingScore ?? ""),
  writingScore: String(lead.writingScore ?? ""),
  speakingScore: String(lead.speakingScore ?? ""),
  toeflScore: String(lead.toeflScore ?? ""),
  pteScore: String(lead.pteScore ?? ""),
  duolingoScore: String(lead.duolingoScore ?? ""),
  greGmatScore: String(lead.greGmatScore ?? ""),
  quantitativeScore: String(lead.quantitativeScore ?? ""),
  verbalScore: String(lead.verbalScore ?? ""),
  analyticalWritingScore: String(lead.analyticalWritingScore ?? ""),

  preferredCountry: lead.preferredCountry ?? "",
  preferredIntake: lead.preferredIntake ?? "",
  preferredCourse: lead.preferredCourse ?? "",
  preferredTiers: Array.isArray(lead.preferredTiers) ? lead.preferredTiers : [],
  status: lead.status ?? "new",
  counsellorId: lead.counselorId ?? "",
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-muted-foreground mb-1"
    >
      {children}
    </label>
  );
}

function EditInput({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  step,
  min,
  max,
  maxLength,
  inputMode,
  onKeyDown,
  onPaste,
}: {
  id?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "decimal" | "tel";
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      step={step}
      min={min}
      max={max}
      maxLength={maxLength}
      inputMode={inputMode}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
    />
  );
}

function EditTextarea({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      rows={2}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
    />
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-3 pb-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ── View Row helper ──
function ViewRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground truncate">
        {value ?? "—"}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AllLeadsPage() {
  const router = useRouter();

  // ── Data ──
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filters ──
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<any | "all">("all");
  const [branch, setBranch] = useState("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);

  // ── Modals ──
  const [viewLead, setViewLead] = useState<any | null>(null);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [countries, setCountries] = useState<Init[]>([]);
  const [intakes, setIntakes] = useState<Init[]>([]);
  const [universities, setUniversities] = useState<Init[]>([]);
  const [leadSource, setLeadSource] = useState<Init[]>([]);
  const [degrees, setDegrees] = useState<Init[]>([]);
  const [counsellorList, setCounsellorList] = useState<Init[]>([]);

  const fetchAll = async () => {
    try {
      const requests = [
        axios.get("/api/lead-universities", {
          withCredentials: true,
        }),
        axios.get("/api/countries/all", {
          withCredentials: true,
        }),
        axios.get("/api/intakes/all", {
          withCredentials: true,
        }),

        axios.get("/api/lead-sources", {
          withCredentials: true,
        }),

        axios.get("/api/lead-degrees", {
          withCredentials: true,
        }),

        axios.get("/api/users/counsellor?few=true", {
          withCredentials: true,
        }),
      ];

      const responses = await Promise.all(requests);

      const [uniRes, countryRes, intakeRes, leadSource, degrees, usersRes] =
        responses;

      setUniversities(uniRes.data?.data ?? []);
      setCountries(countryRes.data?.data ?? []);
      setIntakes(intakeRes.data?.data ?? []);
      setLeadSource(leadSource.data?.data ?? []);
      setDegrees(degrees?.data?.data ?? []);
      setCounsellorList(usersRes.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load master data:", err);
      toast.error("Failed to load dropdown data");
    }
  };
  // ── Load leads ──
  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`/api/leads`, { withCredentials: true });
      setLeads(Array.isArray(data?.data) ? data.data : []);
      console.log(data.data);
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leads");
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [query, status, branch, source]);

  // ── Derived filter options from live data ──
  const uniqueBranches = useMemo(
    () => [
      ...new Set(leads.map((l) => l.branch?.name).filter(Boolean) as string[]),
    ],
    [leads],
  );

  const uniqueSources = useMemo(
    () => [
      ...new Set(
        leads
          .map((l) => l.source)
          .filter((s): s is string => Boolean(s?.trim())),
      ),
    ],
    [leads],
  );

  // ── Filtered + paginated ──
  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads
      .filter((l) => {
        const matchQuery =
          !q ||
          l.studentName?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.includes(q);
        const matchStatus = status === "all" || l.status === status;
        const matchBranch = branch === "all" || l.branch?.name === branch;
        const matchSource = source === "all" || l.source === source;
        return matchQuery && matchStatus && matchBranch && matchSource;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [leads, query, status, branch, source]);

  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageLeads = filteredLeads.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  // ── Edit handlers ──
  const openEdit = (lead: any) => {
    setEditingLead(lead);
    setEditForm(leadToEditForm(lead));
    fetchAll();
  };

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSaveEdit = async () => {
    if (!editingLead || !editForm) return;

    if (!editForm.studentName.trim()) {
      toast.error("Student name is required");
      return;
    }
    if (!editForm.phone || editForm.phone.length !== 10) {
      toast.error("A valid 10-digit mobile number is required");
      return;
    }
    if (!editForm.email.trim()) {
      toast.error("Email address is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        studentName: editForm.studentName.trim(),
        fatherName: strOrUndef(editForm.fatherName),
        email: editForm.email.trim(),
        phone: editForm.phone,
        passport: strOrUndef(editForm.passport),
        passportExpireDate: strOrUndef(editForm.passportExpireDate),
        counsellingDate: strOrUndef(editForm.counsellingDate),
        source: strOrUndef(editForm.source),

        tenthPercentage: toNumberOrUndef(editForm.tenthPercentage),
        tenthYearOfPassing: toNumberOrUndef(editForm.tenthYearOfPassing),
        twelfthPercentage: toNumberOrUndef(editForm.twelfthPercentage),
        twelfthYearOfPassing: toNumberOrUndef(editForm.twelfthYearOfPassing),
        bachelorsUniversityName: strOrUndef(editForm.bachelorsUniversityName),
        bachelorsCourse: strOrUndef(editForm.bachelorsCourse),
        bachelorsPercentage: toNumberOrUndef(editForm.bachelorsPercentage),
        bachelorsYearOfPassing: toNumberOrUndef(
          editForm.bachelorsYearOfPassing,
        ),
        backlogs: toNumberOrUndef(editForm.backlogs),
        gapsIfAny: strOrUndef(editForm.gapsIfAny),
        workExperience: strOrUndef(editForm.workExperience),
        nextFollowup: strOrUndef(editForm.nextFollowup),

        englishTestType: strOrUndef(editForm.englishTestType),
        listeningScore: toNumberOrUndef(editForm.listeningScore),
        readingScore: toNumberOrUndef(editForm.readingScore),
        writingScore: toNumberOrUndef(editForm.writingScore),
        speakingScore: toNumberOrUndef(editForm.speakingScore),
        toeflScore:
          editForm.englishTestType === "TOEFL"
            ? toNumberOrUndef(editForm.toeflScore)
            : undefined,
        pteScore:
          editForm.englishTestType === "PTE"
            ? toNumberOrUndef(editForm.pteScore)
            : undefined,
        duolingoScore:
          editForm.englishTestType === "DUOLINGO"
            ? toNumberOrUndef(editForm.duolingoScore)
            : undefined,
        greGmatScore: toNumberOrUndef(editForm.greGmatScore),
        quantitativeScore: toNumberOrUndef(editForm.quantitativeScore),
        verbalScore: toNumberOrUndef(editForm.verbalScore),
        analyticalWritingScore: toNumberOrUndef(
          editForm.analyticalWritingScore,
        ),

        preferredCountry: strOrUndef(editForm.preferredCountry),
        preferredCourse: strOrUndef(editForm.preferredCourse),
        preferredIntake: strOrUndef(editForm.preferredIntake),
        preferredTiers: editForm.preferredTiers,
        status: editForm.status.toUpperCase(),
        counselorId: editForm.counsellorId,
      };

      await axios.put(`/api/leads/${editingLead.id}`, payload, {
        withCredentials: true,
      });
      toast.success("Lead updated successfully");
      setEditingLead(null);
      setEditForm(null);
      await loadLeads();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Failed to update lead";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete handlers ──
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/leads/${deleteId}`, { withCredentials: true });
      setLeads((prev) => prev.filter((l) => l.id !== deleteId));
      toast.success("Lead deleted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to delete lead");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  const setNumericField = (key: any, v: string) => {
    setField(key, v.replace(/-/g, "")); // strip minus signs
  };

  const blockInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const blockInvalidNumberPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = e.clipboardData.getData("text");
    if (/[-+eE]/.test(pasted)) {
      e.preventDefault();
      document.execCommand("insertText", false, pasted.replace(/[-+eE]/g, ""));
    }
  };

  const handlePhoneField = (v: string) => {
    setField("phone", v.replace(/[^0-9]/g, "").slice(0, 10));
  };

  const blockInvalidPhoneKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [
        "Backspace",
        "Delete",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // -------------------------------------------------
  return (
    <PageTransition>
      <PageHeader
        title="All Leads"
        description="Manage every enquiry with search, filters, and status tracking."
        actions={
          <Button size="sm" onClick={() => router.push("/leads/add")}>
            <Plus className="mr-2 size-4" />
            Add Lead
          </Button>
        }
      />

      {/* ── Filters ── */}
      <Card className="mb-6 border-border shadow-sm">
        <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.9fr_2.1fr]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <Input
              className="w-full bg-background pl-10"
              placeholder="Search by name, email, mobile or lead ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as any | "all")}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    {STATUS_TABS.filter((t) => t !== "all").map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground">
                Branch
              </Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Any branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Branch</SelectLabel>
                    <SelectItem value="all">All Branches</SelectItem>
                    {uniqueBranches.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground">
                Source
              </Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Any source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Source</SelectLabel>
                    <SelectItem value="all">Any</SelectItem>
                    {uniqueSources.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Status tab pills ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab}
            variant={tab === status ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatus(tab)}
            className="whitespace-nowrap"
          >
            {tab === "all"
              ? "All Leads"
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* ── Table ── */}
      <Card className="w-full overflow-hidden border-border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y divide-border lg:hidden">
                {pageLeads.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No leads match your filters.
                  </p>
                ) : (
                  pageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="space-y-3 bg-card p-4 hover:bg-secondary/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Badge
                          variant="outline"
                          className={`capitalize font-semibold ${STATUS_STYLE[lead.status ?? "draft"]}`}
                        >
                          {lead.status ?? "draft"}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-base font-semibold">
                          {lead.studentName || "—"}
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {lead.phone || "—"}
                          {lead.email ? ` | ${lead.email}` : ""}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-2 text-xs">
                        <ViewRow label="Branch" value={lead.branch?.name} />
                        <ViewRow label="Source" value={lead.source} />
                        <ViewRow
                          label="Country"
                          value={lead.preferredCountry}
                        />
                        <ViewRow
                          label="Created"
                          value={formatDate(lead.createdAt)}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => setViewLead(lead)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => openEdit(lead)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(lead.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden w-full lg:block">
                <table className="w-full table-fixed border-collapse text-[12px] xl:text-[13px]">
                  <colgroup>
                    <col className="w-[5%]" />
                    <col className="w-[9%]" />
                    <col className="w-[8%]" />
                    <col className="w-[13%]" />
                    <col className="w-[6%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[7%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      {[
                        "S.No",
                        "Student Name",
                        "Mobile",
                        "Email",
                        "Source",
                        "Branch",
                        "Counselor",
                        "Country",
                        "Status",
                        "Created",
                        "Actions",
                      ].map((h) => (
                        <th key={h} className="px-2 py-3 font-semibold xl:px-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageLeads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={12}
                          className="py-12 text-center text-sm text-muted-foreground"
                        >
                          No leads match your filters.
                        </td>
                      </tr>
                    ) : (
                      pageLeads.map((lead, i) => (
                        <tr
                          key={lead.id}
                          className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                        >
                          <td className="px-2 py-3 xl:px-3 font-mono text-xs text-muted-foreground">
                            <span className="block truncate">{i + 1}</span>
                          </td>
                          <td className="px-2 py-3 xl:px-3 font-medium">
                            <span
                              className="block truncate"
                              title={lead.studentName || "—"}
                            >
                              {lead.studentName || "—"}
                            </span>
                          </td>
                          <td className="px-2 py-3 xl:px-3">
                            <span className="block truncate">
                              {lead.phone || "—"}
                            </span>
                          </td>
                          <td className="px-2 py-3 xl:px-3 text-muted-foreground">
                            <span
                              className="block truncate"
                              title={lead.email || "—"}
                            >
                              {lead.email || "—"}
                            </span>
                          </td>
                          <td className="px-2 py-3 xl:px-3">
                            <span className="block truncate">
                              {lead.source || "—"}
                            </span>
                          </td>
                          <td className="px-2 py-3 xl:px-3">
                            <span
                              className="block truncate"
                              title={lead.branch?.name || "—"}
                            >
                              {lead.branch?.name || "—"}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 xl:px-3">
                            <div className="flex flex-col gap-1 items-start">
                              {lead.counselor ? (
                                <Badge
                                  key={lead.counselor?.id || i}
                                  className="h-5 max-w-full px-2 text-[10px] font-semibold"
                                  title={lead.counselor?.name || ""}
                                >
                                  <span className="block truncate">
                                    {lead.counselor?.name || "—"}
                                  </span>
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-3 xl:px-3">
                            <span className="block truncate">
                              {lead.preferredCountry || "—"}
                            </span>
                          </td>
                          <td className="px-2 py-3 xl:px-3">
                            <button
                              type="button"
                              onClick={() => openEdit(lead)}
                              className="disabled:cursor-default cursor-pointer"
                            >
                              <Badge
                                variant="outline"
                                className={`h-6 whitespace-nowrap px-2 text-[10px] font-semibold capitalize ${STATUS_STYLE[lead.status ?? "draft"]}`}
                              >
                                {lead.status ?? "draft"}
                              </Badge>
                            </button>
                          </td>
                          <td className="px-2 py-3 xl:px-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(lead.createdAt)}
                          </td>
                          <td className="px-1 py-2.5 xl:px-2">
                            <div className="flex items-center justify-center gap-0.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                onClick={() => setViewLead(lead)}
                                title="View"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                onClick={() => openEdit(lead)}
                                title="Edit"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteId(lead.id)}
                                title="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Pagination ── */}
      <div className="mt-4 flex flex-col gap-3 px-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing{" "}
          <span className="font-semibold text-foreground">
            {filteredLeads.length === 0 ? 0 : start + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-foreground">
            {Math.min(start + PAGE_SIZE, filteredLeads.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">
            {filteredLeads.length}
          </span>{" "}
          result{filteredLeads.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="rounded bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          VIEW DIALOG
      ════════════════════════════════════════════════════════════ */}
      <Dialog open={Boolean(viewLead)} onOpenChange={() => setViewLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Lead Details</span>
            </DialogTitle>
          </DialogHeader>

          {viewLead && (
            <div className="space-y-4 text-sm">
              <SectionDivider label="Personal" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <ViewRow label="Student Name" value={viewLead.studentName} />
                <ViewRow label="Father Name" value={viewLead.fatherName} />
                <ViewRow label="Mobile" value={viewLead.phone} />
                <ViewRow label="Email" value={viewLead.email} />
                <ViewRow label="Passport" value={viewLead.passport} />
                <ViewRow
                  label="Passport Expiry"
                  value={formatDate(viewLead.passportExpireDate)}
                />
                <ViewRow label="Source" value={viewLead.source} />
                <ViewRow label="Branch" value={viewLead.branch?.name} />
                <ViewRow label="Status" value={viewLead.status} />
                <ViewRow
                  label="Application Date"
                  value={formatDate(viewLead.applicationDate)}
                />
                <ViewRow
                  label="Created"
                  value={formatDate(viewLead.createdAt)}
                />
                <ViewRow
                  label="Next Followup"
                  value={formatDate(viewLead.nextFollowup)}
                />
              </div>

              <SectionDivider label="Education" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <ViewRow
                  label="10th %"
                  value={viewLead.tenthPassingPercentage}
                />
                <ViewRow label="10th Year" value={viewLead.tenthPassingYear} />
                <ViewRow label="12th %" value={viewLead.twelfthPercentage} />
                <ViewRow
                  label="12th Year"
                  value={viewLead.twelfthYearOfPassing}
                />
                <ViewRow
                  label="University"
                  value={viewLead.bachelorsUniversityName}
                />
                <ViewRow label="Course" value={viewLead.bachelorsCourse} />
                <ViewRow
                  label="Bachelor's %"
                  value={viewLead.bachelorsPercentage}
                />
                <ViewRow
                  label="Bachelor's Year"
                  value={viewLead.bachelorsYearOfPassing}
                />
                <ViewRow label="Backlogs" value={viewLead.backlogs} />
              </div>
              {viewLead.gapsIfAny && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Education Gaps
                  </p>
                  <p className="mt-0.5 text-sm">{viewLead.gapsIfAny}</p>
                </div>
              )}
              {viewLead.workExperience && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Work Experience
                  </p>
                  <p className="mt-0.5 text-sm">{viewLead.workExperience}</p>
                </div>
              )}

              <SectionDivider label="EPT / Test Scores" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <ViewRow label="Test Type" value={viewLead.englishTestType} />
                <ViewRow label="Listening" value={viewLead.listeningScore} />
                <ViewRow label="Reading" value={viewLead.readingScore} />
                <ViewRow label="Writing" value={viewLead.writingScore} />
                <ViewRow label="Speaking" value={viewLead.speakingScore} />
                <ViewRow label="GRE/GMAT" value={viewLead.greGmatScore} />
                <ViewRow label="Quant" value={viewLead.quantitativeScore} />
                <ViewRow label="Verbal" value={viewLead.verbalScore} />
                <ViewRow label="AWA" value={viewLead.analyticalWritingScore} />
              </div>

              <SectionDivider label="Preferences" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <ViewRow label="Country" value={viewLead.preferredCountry} />
                <ViewRow label="Intake" value={viewLead.preferredIntake} />
                <ViewRow label="Course" value={viewLead.preferredCourse} />
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Tiers
                  </p>
                  <p className="mt-0.5 text-sm">
                    {viewLead.preferredTiers?.join(", ") || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLead(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════
          EDIT DIALOG
      ════════════════════════════════════════════════════════════ */}
<Dialog
  open={Boolean(editingLead)}
  onOpenChange={() => {
    setEditingLead(null);
    setEditForm(null);
  }}
>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Edit Lead</DialogTitle>
    </DialogHeader>
    {editForm && (
      <div className="space-y-4">
        <div className="flex justify-start gap-4 items-center">
        <div className="w-48">
          <FieldLabel>Status</FieldLabel>
          <Select value={editForm.status} onValueChange={(v) => setField("status", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["new", "contacted", "qualified", "converted", "lost", "draft"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

                <div className="w-48">
          <FieldLabel>Next Follow up</FieldLabel>
          <Input 
          type="date"
          value={new Date(editForm.nextFollowup).toISOString().slice(0, 10)}
          onChange={(e) => setField("nextFollowup", e.target.value as any)}
          />
        </div>
        </div>

        

        <SectionDivider label="Personal" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel>Student Name *</FieldLabel>
            <EditInput
              value={editForm.studentName}
              onChange={(v) => setField("studentName", v)}
              placeholder="Rahul"
            />
          </div>
          <div>
            <FieldLabel>Father Name</FieldLabel>
            <EditInput
              value={editForm.fatherName}
              onChange={(v) => setField("fatherName", v)}
              placeholder="Venkatesh"
            />
          </div>
          <div>
            <FieldLabel>Mobile *</FieldLabel>
            <EditInput
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={editForm.phone}
              onChange={handlePhoneField}
              onKeyDown={blockInvalidPhoneKeys}
              onPaste={blockInvalidNumberPaste}
              placeholder="9876543210"
            />
          </div>
          <div>
            <FieldLabel>Email *</FieldLabel>
            <EditInput
              type="email"
              value={editForm.email}
              onChange={(v) => setField("email", v)}
              placeholder="rahul@example.com"
            />
          </div>
          <div>
            <FieldLabel>Source</FieldLabel>
            <Select value={editForm.source} onValueChange={(v) => setField("source", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>
              <SelectContent>
                {leadSource.length > 0 &&
                  leadSource.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Passport Number</FieldLabel>
            <EditInput
              value={editForm.passport}
              onChange={(v) => setField("passport", v)}
              placeholder="U12345678"
            />
          </div>
          <div>
            <FieldLabel>Passport Expiry</FieldLabel>
            <EditInput
              type="date"
              value={editForm.passportExpireDate}
              onChange={(v) => setField("passportExpireDate", v)}
            />
          </div>
          <div>
            <FieldLabel>Application Date</FieldLabel>
            <EditInput
              type="datetime-local"
              value={editForm.counsellingDate}
              onChange={(v) => setField("counsellingDate", v)}
            />
          </div>
          <div>
            <FieldLabel>Counsellor</FieldLabel>
            <Select
              value={editForm.counsellorId}
              onValueChange={(v) => setField("counsellorId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {counsellorList.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SectionDivider label="Education" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div>
            <FieldLabel>10th %</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.tenthPercentage}
              onChange={(v) => setNumericField("tenthPercentage", v)}
              placeholder="85"
            />
          </div>
          <div>
            <FieldLabel>10th Year</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.tenthYearOfPassing}
              onChange={(v) => setNumericField("tenthYearOfPassing", v)}
              placeholder="YYYY"
            />
          </div>
          <div>
            <FieldLabel>12th %</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.twelfthPercentage}
              onChange={(v) => setNumericField("twelfthPercentage", v)}
              placeholder="88"
            />
          </div>
          <div>
            <FieldLabel>12th Year</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.twelfthYearOfPassing}
              onChange={(v) => setNumericField("twelfthYearOfPassing", v)}
              placeholder="YYYY"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <FieldLabel>University / College</FieldLabel>
            <UniversityCombobox
              onChange={(v) => setField("bachelorsUniversityName", v)}
              value={editForm.bachelorsUniversityName}
              universities={universities as any}
            />
          </div>
          <div>
            <FieldLabel>Course / Major</FieldLabel>
            <EditInput
              value={editForm.bachelorsCourse}
              onChange={(v) => setField("bachelorsCourse", v)}
              placeholder="B.Tech"
            />
          </div>
          <div>
            <FieldLabel>CGPA / %</FieldLabel>
            <EditInput
              type="number"
              step="0.01"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.bachelorsPercentage}
              onChange={(v) => setNumericField("bachelorsPercentage", v)}
              placeholder="75"
            />
          </div>
          <div>
            <FieldLabel>Year of Passing</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.bachelorsYearOfPassing}
              onChange={(v) => setNumericField("bachelorsYearOfPassing", v)}
              placeholder="YYYY"
            />
          </div>
          <div>
            <FieldLabel>Backlogs</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.backlogs}
              onChange={(v) => setNumericField("backlogs", v)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Education Gaps</FieldLabel>
            <EditTextarea
              value={editForm.gapsIfAny}
              onChange={(v) => setField("gapsIfAny", v)}
              placeholder="Explain any gaps..."
            />
          </div>
          <div>
            <FieldLabel>Work Experience</FieldLabel>
            <EditTextarea
              value={editForm.workExperience}
              onChange={(v) => setField("workExperience", v)}
              placeholder="Employment details..."
            />
          </div>
        </div>

        <SectionDivider label="EPT / Test Scores" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <FieldLabel>Test Type</FieldLabel>
            <Select
              value={editForm.englishTestType}
              onValueChange={(v) => {
                setEditForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        englishTestType: v,
                        listeningScore: "",
                        readingScore: "",
                        writingScore: "",
                        speakingScore: "",
                        toeflScore: "",
                        pteScore: "",
                        duolingoScore: "",
                      }
                    : prev
                );
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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

          {editForm.englishTestType === "IELTS" && (
            <>
              {(["listeningScore", "readingScore", "writingScore", "speakingScore"] as const).map(
                (k) => (
                  <div key={k}>
                    <FieldLabel>{k.replace("Score", "")}</FieldLabel>
                    <EditInput
                      type="number"
                      step="0.5"
                      min={0}
                      onKeyDown={blockInvalidNumberKeys}
                      onPaste={blockInvalidNumberPaste}
                      value={editForm[k]}
                      onChange={(v) => setNumericField(k, v)}
                      placeholder="0.0"
                    />
                  </div>
                )
              )}
            </>
          )}

          {editForm.englishTestType === "TOEFL" && (
            <div>
              <FieldLabel>TOEFL Score</FieldLabel>
              <EditInput
                type="number"
                min={0}
                onKeyDown={blockInvalidNumberKeys}
                onPaste={blockInvalidNumberPaste}
                value={editForm.toeflScore}
                onChange={(v) => setNumericField("toeflScore", v)}
                placeholder="100"
              />
            </div>
          )}

          {editForm.englishTestType === "PTE" && (
            <div>
              <FieldLabel>PTE Score</FieldLabel>
              <EditInput
                type="number"
                min={0}
                onKeyDown={blockInvalidNumberKeys}
                onPaste={blockInvalidNumberPaste}
                value={editForm.pteScore}
                onChange={(v) => setNumericField("pteScore", v)}
                placeholder="65"
              />
            </div>
          )}

          {editForm.englishTestType === "DUOLINGO" && (
            <div>
              <FieldLabel>Duolingo Score</FieldLabel>
              <EditInput
                type="number"
                min={0}
                onKeyDown={blockInvalidNumberKeys}
                onPaste={blockInvalidNumberPaste}
                value={editForm.duolingoScore}
                onChange={(v) => setNumericField("duolingoScore", v)}
                placeholder="120"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <FieldLabel>GRE/GMAT Total</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.greGmatScore}
              onChange={(v) => setNumericField("greGmatScore", v)}
              placeholder="320"
            />
          </div>
          <div>
            <FieldLabel>Quantitative</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.quantitativeScore}
              onChange={(v) => setNumericField("quantitativeScore", v)}
              placeholder="165"
            />
          </div>
          <div>
            <FieldLabel>Verbal</FieldLabel>
            <EditInput
              type="number"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.verbalScore}
              onChange={(v) => setNumericField("verbalScore", v)}
              placeholder="155"
            />
          </div>
          <div>
            <FieldLabel>AWA</FieldLabel>
            <EditInput
              type="number"
              step="0.5"
              min={0}
              onKeyDown={blockInvalidNumberKeys}
              onPaste={blockInvalidNumberPaste}
              value={editForm.analyticalWritingScore}
              onChange={(v) => setNumericField("analyticalWritingScore", v)}
              placeholder="4.5"
            />
          </div>
        </div>

        <SectionDivider label="Preferences" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FieldLabel>Country</FieldLabel>
            <Select
              value={editForm.preferredCountry}
              onValueChange={(v) => setField("preferredCountry", v)}
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
          <div>
            <FieldLabel>Intake</FieldLabel>
            <Select
              value={editForm.preferredIntake}
              onValueChange={(v) => setField("preferredIntake", v)}
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
          <div>
            <FieldLabel>Course</FieldLabel>
            <EditInput
              value={editForm.preferredCourse}
              onChange={(v) => setField("preferredCourse", v)}
              placeholder="MS in CS"
            />
          </div>
          <div>
            <FieldLabel>Tiers</FieldLabel>
            <Select
              value=""
              onValueChange={(t) => {
                if (!editForm.preferredTiers.includes(t))
                  setField("preferredTiers", [...editForm.preferredTiers, t]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add tier" />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.filter((t) => !editForm.preferredTiers.includes(t)).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editForm.preferredTiers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {editForm.preferredTiers.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          "preferredTiers",
                          editForm.preferredTiers.filter((x) => x !== t)
                        )
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    <DialogFooter className="mt-4 gap-2">
      <Button
        variant="outline"
        disabled={isSaving}
        onClick={() => {
          setEditingLead(null);
          setEditForm(null);
        }}
      >
        Cancel
      </Button>
      <Button onClick={handleSaveEdit} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* ════════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
      ════════════════════════════════════════════════════════════ */}
      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The lead will be permanently removed.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
