"use client";
import { useEffect, useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/slids/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/slids/components/ui/sheet";
import { Plus, GripVertical, Search, ChevronDown, RotateCcw, FileText, CheckCircle2, XCircle, AlertTriangle, Circle } from "lucide-react";
import type { Application, ApplicationStage } from "@/slids/types";
import { toast } from "sonner";

const STAGES: { key: ApplicationStage; label: string; color: string }[] = [
  { key: "inquiry", label: "Inquiry", color: "bg-info/15 text-info" },
  { key: "documents", label: "Documents", color: "bg-warning/15 text-warning" },
  { key: "applied", label: "Applied", color: "bg-primary/10 text-primary" },
  { key: "visa", label: "Visa Process", color: "bg-success/15 text-success" },
];

// ── Required document checklist ─────────────────────────────────────────────
// Adjust these labels to match exactly what `doc.type` values look like in your DB.
const REQUIRED_DOC_TYPES = [
  "Passport",
  "10th Marks Memo",
  "12th Marks Memo",
  "Degree Certificates",
  "MOI",
  "IELTS",
  "Resume",
  "SOP",
  "LOR",
  "Financial Documents",
  "Visa Documents",
] as const;

type CardColorState = "green" | "red" | "yellow" | "white" | "violet";

// ── Admin filter state shape ──────────────────────────────────────────────────
interface AdminFilters {
  counselor: string;
  stage: string;
  intake: string;
  country: string;
  branch: string;
  search: string;
}

// ── Dropdown option helpers ───────────────────────────────────────────────────
function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// ── Determine which required docs are present for a lead ───────────────────
function getDocCompleteness(docs: any[] = []) {
  const presentTypes = new Set(
    docs.map((d) => (d?.type ?? "").trim().toLowerCase())
  );

  const checklist = REQUIRED_DOC_TYPES.map((type) => ({
    type,
    uploaded: presentTypes.has(type.trim().toLowerCase()),
  }));

  const uploadedCount = checklist.filter((c) => c.uploaded).length;
  const totalCount = REQUIRED_DOC_TYPES.length;
  const allPresent = uploadedCount === totalCount;

  return { checklist, uploadedCount, totalCount, allPresent };
}

// ── Determine the visa status for a lead (visaDetail can be array or single object) ─
function getVisaStatus(visaDetail: any): string | null {
  if (!visaDetail) return null;
  const record = Array.isArray(visaDetail) ? visaDetail[0] : visaDetail;
  return record?.status ?? null;
}

// ── Card color decision logic ───────────────────────────────────────────────
// INQUIRY stage -> ALWAYS white, no matter what the docs or visa status are.
// For every other stage:
//   yellow -> any required doc missing (regardless of visa status)
//   green  -> all required docs uploaded AND visa status APPROVED
//   red    -> all required docs uploaded AND visa status REJECTED
//   violet -> all required docs uploaded AND visa status is anything else / no record
function getCardColorState(
  allPresent: boolean,
  visaStatus: string | null,
  stage?: string | null
): CardColorState {
  if ((stage ?? "").toUpperCase() === "INQUIRY") return "white";
  if (!allPresent) return "yellow";
  if (visaStatus === "APPROVED") return "green";
  if (visaStatus === "REJECTED") return "red";
  return "violet";
}

function getCardColorClasses(state: CardColorState): string {
  switch (state) {
    case "green":
      return "bg-green-50 dark:bg-green-950/30 border-green-300 hover:bg-green-100 dark:hover:bg-green-950/50";
    case "red":
      return "bg-red-50 dark:bg-red-950/30 border-red-300 hover:bg-red-100 dark:hover:bg-red-950/50";
    case "yellow":
      return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-950/50";
    case "violet":
      return "bg-violet-50 dark:bg-violet-950/30 border-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/50";
    case "white":
    default:
      return "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700";
  }
}

function getStatusBadgeClasses(state: CardColorState): string {
  switch (state) {
    case "green":
      return "bg-green-100 text-green-700 border-green-300";
    case "red":
      return "bg-red-100 text-red-700 border-red-300";
    case "yellow":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "violet":
      return "bg-violet-100 text-violet-700 border-violet-300";
    case "white":
    default:
      return "bg-gray-100 text-gray-600 border-gray-300";
  }
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);

  // Raw lead data kept so we can derive dropdown options + doc/visa info without extra API calls
  const [rawLeads, setRawLeads] = useState<any[]>([]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("today");
  const empty = { studentName: "", university: "", program: "MS Computer Science", intake: "Fall 2026", counselor: "Aditi Rao" };
  const [form, setForm] = useState(empty);
  const [role, setRole] = useState("");
  const [isloading, setIsloading] = useState(false);

  // ── Sidebar (detail drawer) state ───────────────────────────────────────────
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Admin filter values ─────────────────────────────────────────────────────
  const [adminFilters, setAdminFilters] = useState<AdminFilters>({
    counselor: "",
    stage: "",
    intake: "",
    country: "",
    branch: "",
    search: "",
  });

  // ── Derived dropdown options from raw data ──────────────────────────────────
  const counselorOptions = unique(
    rawLeads
      .filter((l) => l.counselor?.id)
      .map((l) => ({ id: l.counselor.id, name: l.counselor.name }))
  ).reduce<{ id: string; name: string }[]>((acc, cur) => {
    if (!acc.find((x) => x.id === cur.id)) acc.push(cur);
    return acc;
  }, []);

  const stageOptions = unique(
    rawLeads.map((l) => l.leadStage).filter(Boolean)
  );

  const intakeOptions = unique(
    rawLeads.map((l) => l.intakeSeason).filter(Boolean)
  );

  const countryOptions = unique(
    rawLeads.map((l) => l.preferredCountry).filter(Boolean)
  );

  const branchOptions = rawLeads
    .filter((l) => l.branch?.id)
    .reduce<{ id: string; name: string }[]>((acc, l) => {
      if (!acc.find((x) => x.id === l.branch.id))
        acc.push({ id: l.branch.id, name: l.branch.name });
      return acc;
    }, []);

  // ── Fetch current user + leads ──────────────────────────────────────────────
  const me = async () => {
    try {
      setIsloading(true);
      const response = await fetch("/api/auth/me");
      const user = await response.json();
      const userRole = user?.role?.name.toUpperCase();
      const id = user?.id;
      setRole(userRole);

      const leadRes = await fetch(
        `/api/leads/leadsforcounsoler?role=${userRole}&counselorId=${id}`
      );
      if (!leadRes.ok) {
        toast.error("Something went wrong");
        return;
      }

      const leadData = await leadRes.json();

      // Keep the full raw array for dropdown derivation + doc/visa lookups
      setRawLeads(leadData.data ?? []);

      const formatted = (leadData.data ?? []).map((lead: any) => {
        const { uploadedCount, totalCount, allPresent } = getDocCompleteness(lead.docs);
        const visaStatus = getVisaStatus(lead.visaDetail);
        const colorState = getCardColorState(allPresent, visaStatus, lead.leadStage);

        return {
          id: lead.id,
          stage: lead.leadStage,
          studentName: `${lead.studentName} ${lead.lastName ?? ""}`.trim(),
          university: lead.preferredCountry ?? "Not Selected",
          program: lead.preferredCourse ?? "Not Selected",
          intake: lead.intakeSeason ?? "N/A",
          counselor: lead.counselor?.id ?? "N/A",
          counselorName: lead.counselor?.name ?? "N/A",
          branch: lead.branch?.id ?? lead.branchId ?? "N/A",
          branchName: lead.branch?.name ?? "N/A",
          createdAt: lead.createdAt,
          docsUploadedCount: uploadedCount,
          docsTotalCount: totalCount,
          docsComplete: allPresent,
          visaStatus,
          colorState,
        };
      });

      setApps(formatted);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsloading(false);
    }
  };

  const moveTo = async (id: string, stage: ApplicationStage) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a)));
    try {
      await fetch(`/api/leads/leadsforcounsoler?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStage: stage }),
      });
      me();
    } catch (error) {
      console.error(error);
    }
  };

  const add = () => {
    if (!form.studentName || !form.university)
      return toast.error("Student and university required");
    setOpen(false);
    setForm(empty);
    toast.success("Application created");
  };

  useEffect(() => {
    me();
  }, []);

  // ── Filtering logic ─────────────────────────────────────────────────────────
  const isAdmin = role === "ADMIN" || role === "SUPER ADMIN";

  const filteredApps = apps.filter((app) => {
    // ── Date filter (applies to everyone) ──
    const created = new Date(app.createdAt);
    const today = new Date();

    if (filter === "today" && created.toDateString() !== today.toDateString())
      return false;

    if (filter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (created.toDateString() !== yesterday.toDateString()) return false;
    }

    if (filter === "7days") {
      const last7 = new Date();
      last7.setDate(last7.getDate() - 7);
      if (created < last7) return false;
    }

    // ── Admin-only filters ──
    if (isAdmin) {
      if (adminFilters.search.trim()) {
        const search = adminFilters.search.toLowerCase().trim();
        const matches =
          app.studentName.toLowerCase().includes(search) ||
          app.university.toLowerCase().includes(search) ||
          app.program.toLowerCase().includes(search) ||
          app.counselor.toLowerCase().includes(search) ||
          app.intake.toLowerCase().includes(search) ||
          app.branchName.toLowerCase().includes(search);

        if (!matches) return false;
      }

      if (adminFilters.counselor && app.counselor !== adminFilters.counselor)
        return false;
      if (adminFilters.stage && app.stage !== adminFilters.stage) return false;
      if (adminFilters.intake && app.intake !== adminFilters.intake) return false;
      if (adminFilters.country && app.university !== adminFilters.country)
        return false;
      if (adminFilters.branch && app.branch !== adminFilters.branch) return false;
    }

    return true;
  });

  const setAdminFilter = (key: keyof AdminFilters, value: string) =>
    setAdminFilters((prev) => ({ ...prev, [key]: value }));

  const clearAdminFilters = () =>
    setAdminFilters({ counselor: "", stage: "", intake: "", country: "", branch: "", search: "" });

  const hasActiveAdminFilters = Object.values(adminFilters).some(Boolean);

  // ── Sidebar open handler ────────────────────────────────────────────────────
  const openLeadDetail = (id: string) => {
    setSelectedLeadId(id);
    setSidebarOpen(true);
  };

  const selectedLead = rawLeads.find((l) => l.id === selectedLeadId) ?? null;

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isloading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-15 w-15 border-b-2 border-red-400" />
      </div>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Applications"
        description="Kanban pipeline from inquiry to enrollment."
        actions={
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 rounded-md border px-3 text-sm"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="all">All</option>
              </select>
            )}

            {/* <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4 mr-1.5" /> New Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New application</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-1.5">
                    <Label>Student name</Label>
                    <Input
                      value={form.studentName}
                      onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>University</Label>
                    <Input
                      value={form.university}
                      onChange={(e) => setForm({ ...form, university: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Program</Label>
                      <Input
                        value={form.program}
                        onChange={(e) => setForm({ ...form, program: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Intake</Label>
                      <Input
                        value={form.intake}
                        onChange={(e) => setForm({ ...form, intake: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Counselor</Label>
                    <Input
                      value={form.counselor}
                      onChange={(e) => setForm({ ...form, counselor: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={add}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog> */}
          </div>
        }
      />

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 mb-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-green-400" /> Docs complete + Visa approved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" /> Docs complete + Visa rejected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-yellow-400" /> Docs missing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-violet-400" /> Docs complete, visa pending/none
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-gray-300 border" /> Inquiry stage (always white)
        </span>
      </div>

      {/* ── Admin filter bar ─────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-0.5">Master tracker filters</p>
          <p className="text-xs text-muted-foreground mb-4">
            Filter applications by branch, counselor, country, intake, stage, and enrollment progress.
          </p>

          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-2.5 mb-2.5">
            {/* Search */}
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search student..."
                value={adminFilters.search ?? ""}
                onChange={(e) => setAdminFilter("search", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Date */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 days</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Branch */}
            <div className="relative">
              <select
                value={adminFilters.branch}
                onChange={(e) => setAdminFilter("branch", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All branches</option>
                {branchOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Counselor */}
            <div className="relative">
              <select
                value={adminFilters.counselor}
                onChange={(e) => setAdminFilter("counselor", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All counselors</option>
                {counselorOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-2.5">
            {/* Country */}
            <div className="relative">
              <select
                value={adminFilters.country}
                onChange={(e) => setAdminFilter("country", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All countries</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Intake */}
            <div className="relative">
              <select
                value={adminFilters.intake}
                onChange={(e) => setAdminFilter("intake", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All intakes</option>
                {intakeOptions.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Stage */}
            <div className="relative">
              <select
                value={adminFilters.stage}
                onChange={(e) => setAdminFilter("stage", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All stages</option>
                {stageOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Reset */}
            <button
              onClick={clearAdminFilters}
              className="h-9 flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <RotateCcw className="size-3.5" />
              Reset filters
            </button>
          </div>
        </div>
      )}

      {/* ── Kanban board ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        {STAGES.map((stage) => {
          const items = filteredApps.filter(
            (a) => a.stage === stage.key.toUpperCase()
          );
          return (
            <div
              key={stage.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() =>
                role === "COUNSELLOR" && dragId && moveTo(dragId, stage.key)
              }
              className="rounded-2xl bg-secondary/40 border border-border p-3 min-h-[420px]"
            >
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className={`text-[10px] ${stage.color}`}>
                  {stage.label}
                </Badge>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>

              <div className="space-y-2">
                {items.map((a) => {
                  const colorState: CardColorState = (a as any).colorState ?? "white";
                  const docsUploadedCount = (a as any).docsUploadedCount ?? 0;
                  const docsTotalCount = (a as any).docsTotalCount ?? REQUIRED_DOC_TYPES.length;

                  return (
                    <Card
                      key={a.id}
                      draggable
                      onDragStart={() => setDragId(a.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => openLeadDetail(a.id)}
                      className={`cursor-pointer active:cursor-grabbing hover:shadow-md transition-all border ${getCardColorClasses(colorState)}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="size-3.5 text-muted-foreground mt-0.5 shrink-0 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{a.studentName}</div>
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {a.university}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {a.program}
                            </div>
                            {/* Show branch name for admin */}
                            {isAdmin && (a as any).branchName && (a as any).branchName !== "N/A" && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                🏢 {(a as any).branchName}
                              </div>
                            )}

                            {/* Doc count + status pill */}
                            <div className="flex items-center justify-between mt-2">
                              <span
                                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${getStatusBadgeClasses(colorState)}`}
                              >
                                <FileText className="size-3" />
                                {docsUploadedCount}/{docsTotalCount} docs
                              </span>
                              {colorState === "green" && <CheckCircle2 className="size-3.5 text-green-600" />}
                              {colorState === "red" && <XCircle className="size-3.5 text-red-600" />}
                              {colorState === "yellow" && <AlertTriangle className="size-3.5 text-yellow-600" />}
                              {colorState === "violet" && <Circle className="size-3.5 text-violet-500" />}
                              {colorState === "white" && <Circle className="size-3.5 text-gray-300" />}
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-[9px]">{a.intake}</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {isAdmin
                                  ? (a as any).counselorName?.split(" ")[0]
                                  : a.counselor.split(" ")[0]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-center text-[11px] text-muted-foreground py-8">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Lead detail sidebar ─────────────────────────────────────────────── */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedLead ? (
            <LeadDetailPanel lead={selectedLead} />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">No lead selected.</div>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}

// ── Sidebar content: everything NOT already shown on the card ──────────────
function LeadDetailPanel({ lead }: { lead: any }) {
  const { checklist, uploadedCount, totalCount, allPresent } = getDocCompleteness(lead.docs);
  const visaStatus = getVisaStatus(lead.visaDetail);
  const colorState = getCardColorState(allPresent, visaStatus, lead.leadStage);
  const visaRecord = Array.isArray(lead.visaDetail) ? lead.visaDetail[0] : lead.visaDetail;

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  const Row = ({ label, value }: { label: string; value: any }) => (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right break-words">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {lead.studentName} {lead.lastName ?? ""}
          <Badge className={`text-[10px] ${getStatusBadgeClasses(colorState)}`}>
            {colorState === "green" && "Visa Approved"}
            {colorState === "red" && "Visa Rejected"}
            {colorState === "yellow" && "Docs Missing"}
            {colorState === "violet" && "Docs Complete · Visa Pending"}
            {colorState === "white" && "Inquiry Stage"}
          </Badge>
        </SheetTitle>
        <SheetDescription>{lead.email ?? "No email on file"}</SheetDescription>
      </SheetHeader>

      {/* Contact & personal info */}
      <section>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Contact & Personal</h4>
        <Row label="Phone" value={lead.phone} />
        <Row label="Father's Name" value={lead.fatherName} />
        <Row label="Gender" value={lead.gender} />
        <Row label="Date of Birth" value={fmtDate(lead.dob)} />
        <Row label="Status" value={lead.status} />
        <Row label="Source" value={lead.source} />
      </section>

      {/* Academic info */}
      <section>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Academic Background</h4>
        <Row label="10th %" value={lead.tenthPassingPercentage} />
        <Row label="10th Passing Year" value={lead.tenthPassingYear} />
        <Row label="12th %" value={lead.twelfthPercentage} />
        <Row label="12th Passing Year" value={lead.twelfthYearOfPassing} />
        <Row label="Bachelor's University" value={lead.bachelorsUniversityName} />
        <Row label="Bachelor's Course" value={lead.bachelorsCourse} />
        <Row label="Bachelor's %" value={lead.bachelorsPercentage} />
        <Row label="Bachelor's Passing Year" value={lead.bachelorsYearOfPassing} />
        <Row label="Backlogs" value={lead.backlogs} />
        <Row label="Gaps (if any)" value={lead.gapsIfAny} />
        <Row label="Work Experience" value={lead.workExperience} />
      </section>

      {/* Test scores */}
      <section>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Test Scores</h4>
        <Row label="English Test Type" value={lead.englishTestType} />
        <Row label="English Waiver" value={lead.englishWaiverType} />
        <Row label="IELTS Score" value={lead.ieltsScore} />
        <Row label="Listening" value={lead.listeningScore} />
        <Row label="Reading" value={lead.readingScore} />
        <Row label="Writing" value={lead.writingScore} />
        <Row label="Speaking" value={lead.speakingScore} />
        <Row label="GRE/GMAT" value={lead.greGmatScore} />
        <Row label="Verbal" value={lead.verbalScore} />
        <Row label="Quantitative" value={lead.quantitativeScore} />
        <Row label="Analytical Writing" value={lead.analyticalWritingScore} />
      </section>

      {/* Application info */}
      <section>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Application</h4>
        <Row label="Application Type" value={lead.applicationType} />
        <Row label="Application Date" value={fmtDate(lead.applicationDate)} />
        <Row label="Current Stage" value={lead.currentStage} />
        <Row label="Preferred Intake" value={lead.preferredIntake} />
        <Row label="Preferred Tiers" value={lead.preferredTiers?.join(", ")} />
        <Row label="Budget" value={lead.budget} />
        <Row label="University Start" value={fmtDate(lead.universityStart)} />
        <Row label="Admission Date" value={fmtDate(lead.admissionDate)} />
      </section>

      {/* Passport & immigration */}
      <section>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Passport & Immigration</h4>
        <Row label="Passport Number" value={lead.passport} />
        <Row label="Passport Expiry" value={fmtDate(lead.passportExpireDate)} />
        <Row label="Immigration Portal Password" value={lead.immigrationPortalPassword ? "••••••••" : "—"} />
      </section>

      {/* Visa details */}
      <section>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Visa Details</h4>
        {visaRecord ? (
          <>
            <Row label="Visa Status" value={visaRecord.status} />
            <Row label="Deposit Status" value={visaRecord.depositStatus} />
            <Row label="Deposit Deadline" value={fmtDate(visaRecord.depositDeadline)} />
            <Row label="IHS Status" value={visaRecord.ihsStatus} />
            <Row label="Visa Fee Status" value={visaRecord.visaFeeStatus} />
            <Row label="CAS Status" value={visaRecord.casStatus} />
            <Row label="CAS Deadline" value={fmtDate(visaRecord.casDeadline)} />
            <Row label="University Start Date" value={fmtDate(visaRecord.universityStartDate)} />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No visa record yet.</p>
        )}
        <Row label="Visa Stage" value={lead.visaStage} />
      </section>

      {/* Notes */}
      {lead.notes && (
        <section>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Notes</h4>
          <p className="text-xs whitespace-pre-wrap">{lead.notes}</p>
        </section>
      )}

      {/* Document checklist */}
      <section>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">
          Documents ({uploadedCount}/{totalCount})
        </h4>
        <div className="grid gap-1.5">
          {checklist.map((c) => {
            const matchedDoc = (lead.docs ?? []).find(
              (d: any) => (d?.type ?? "").trim().toLowerCase() === c.type.trim().toLowerCase()
            );
            return (
              <div
                key={c.type}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs ${
                  c.uploaded
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20"
                    : "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/20"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {c.uploaded ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                  {c.type}
                </span>
                {matchedDoc ? (
                  <a
                    href={matchedDoc.address}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:opacity-80"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-[10px] opacity-70">Missing</span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}