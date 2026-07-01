"use client";

// app/reports/performance/PerformanceReportsPage.tsx
//
// Single page powered entirely by GET /api/report/dashboard/performance.
// Owns filter state (matches PerformanceReportFilters exactly), fetches
// once per filter/page change, and renders:
//   - summary cards
//   - 6 charts (monthlyVolume, countryDemand, leadSourceBreakdown,
//     leadStatusBreakdown, applicationStatusBreakdown, visaStatusBreakdown)
//   - branchPerformance table
//   - unified paginated lead+student rows table
//
// ReportFilterSheet reads/writes the same `filters` state via props —
// no second endpoint, no duplicated filter logic.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Users,
  GraduationCap,
  Building2,
  CheckCircle2,
  XCircle,
  Wallet,
  BadgeCheck,
  FileCheck2,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import ReportFilterSheet from "@/slids/modules/Report/Overall/ReportFilterSheet";
import type {
  PerformanceReportData,
  PerformanceReportFilters,
} from "@/lib/performance-report";

// ─────────────────────────────────────────────────────────────────────────
// Defaults — 1:1 with PerformanceReportFilters
// ─────────────────────────────────────────────────────────────────────────

export const EMPTY_PERFORMANCE_FILTERS: PerformanceReportFilters = {
  recordScope: "all",
  datePreset: "all",
  startDate: "",
  endDate: "",
  search: "",
  branchId: "",
  counselorId: "",
  leadStatus: "",
  leadSource: "",
  countryId: "",
  intakeId: "",
  universityId: "",
  applicationStatus: "",
  casStatus: "",
  visaStatus: "",
  loanStatus: "",
  nbfc: "",
  fintechAssigneeId: "",
};

const PAGE_SIZE_DEFAULT = 20;

// ─────────────────────────────────────────────────────────────────────────
// Design tokens (shared with ReportFilterSheet look/feel)
// ─────────────────────────────────────────────────────────────────────────

const RED_SERIES = ["#FF746C", "#F05F56", "#D94B43", "#B83933", "#8F2824", "#FF9C97", "#FFC4C1"];
const PIE_COLORS = ["#FF746C", "#FB7185", "#F87171", "#EA580C", "#DC2626", "#BE123C", "#991B1B"];

const STATUS_COLORS: Record<string, string> = {
  NEW: "#6d5ef0",
  CONTACTED: "#5b7fe8",
  QUALIFIED: "#34b37e",
  CONVERTED: "#1f8f63",
  LOST: "#e15a5a",
  APPROVED: "#34b37e",
  REJECTED: "#e15a5a",
  PENDING: "#e8a23d",
  DISBURSED: "#6d5ef0",
  NOT_STARTED: "#8b8d9b",
  APPLIED: "#5b7fe8",
  DECISION_PENDING: "#e8a23d",
  WITHDRAWN: "#8b8d9b",
  DOCUMENTS_PENDING: "#e8a23d",
  DRAFT: "#8b8d9b",
  PRIORITY_OFFER_RECEIVED: "#6d5ef0",
  OFFER_RECEIVED: "#5b7fe8",
  CONDITIONAL_OFFER: "#e8a23d",
  UNCONDITIONAL_OFFER: "#34b37e",
  DEFERRED: "#8b8d9b",
  UNDER_REVIEW: "#e8a23d",
  RECEIVED: "#34b37e",
  NOT_REQUIRED: "#8b8d9b",
};

const titleCase = (s: string | null | undefined) =>
  (s ?? "Unknown").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function fmtCurrency(n: number | null | undefined) {
  const num = Number(n ?? 0);
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}

function fmtNum(n: number | null | undefined) {
  const num = Number(n ?? 0);
  return num >= 1_000 ? `${(num / 1_000).toFixed(1)}K` : String(num);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-[#1a1b24] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,15,25,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-500/80 dark:text-red-400/80">
            {eyebrow}
          </span>
        )}
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{title}</h2>
        {subtitle && <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600">
      <AlertCircle className="w-7 h-7 mb-2 opacity-40" />
      <p className="text-[13px]">{label}</p>
    </div>
  );
}

function Badge({ label, color }: { label: string; color?: string }) {
  const c = color ?? "#FF746C";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums"
      style={{ background: `${c}16`, color: c }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {label}
    </span>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#15161d] border border-white/10 rounded-xl px-3.5 py-2.5 shadow-xl text-[12px]">
      {label && <p className="font-medium text-slate-300 mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 tabular-nums" style={{ color: p.color ?? p.fill }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color ?? p.fill }} />
          {p.name}: <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  tone?: "default" | "good" | "urgent";
}) {
  const toneColor = tone === "good" ? "#34b37e" : tone === "urgent" ? "#dc2626" : "#fb7185";
  return (
    <div className="group rounded-2xl border border-red-200/40 dark:border-red-500/10 bg-white dark:bg-[#1a1b24] px-4 py-4 flex flex-col gap-2.5 transition-all duration-300 hover:border-red-300/60 dark:hover:border-red-400/20">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-red-300/20 dark:ring-red-500/10"
          style={{ background: `${toneColor}16`, color: toneColor }}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
          {value}
        </span>
      </div>
      {hint && <span className="text-[11.5px] text-slate-400 dark:text-slate-500">{hint}</span>}
    </div>
  );
}

function RatePill({ rate }: { rate: number }) {
  const color = rate >= 60 ? "#34b37e" : rate >= 30 ? "#e8a23d" : "#e15a5a";
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold tabular-nums"
      style={{ background: `${color}18`, color }}
    >
      {rate.toFixed(1)}%
    </span>
  );
}

function HBarList({ data }: { data: { label: string; count: number; color?: string }[] }) {
  if (data.length === 0) return <EmptyState label="No data yet" />;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.slice(0, 10).map((item, i) => {
        const pct = Math.round((item.count / maxVal) * 100);
        const color = item.color ?? RED_SERIES[i % RED_SERIES.length];
        return (
          <div key={item.label + i} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-[12px] text-slate-600 dark:text-slate-400">
              {titleCase(item.label)}
            </span>
            <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}35` }}
              />
            </div>
            <span className="w-9 text-right text-[12px] font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/70 dark:bg-white/[0.06] rounded-2xl ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skel key={i} className="h-24" />
        ))}
      </div>
      <Skel className="h-64" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skel key={i} className="h-60" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Record type / status badges for the unified table
// ─────────────────────────────────────────────────────────────────────────

function RecordTypeBadge({ type }: { type: "lead" | "student" }) {
  return type === "student" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <GraduationCap className="w-3 h-3" /> Student
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
      <Users className="w-3 h-3" /> Lead
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

export default function PerformanceReportsPage() {
  const [filters, setFilters] = useState<PerformanceReportFilters>(EMPTY_PERFORMANCE_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE_DEFAULT);

  const [data, setData] = useState<PerformanceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Reset to page 1 whenever a filter (not page) changes
  const handleFilterChange = useCallback((partial: Partial<PerformanceReportFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_PERFORMANCE_FILTERS);
    setPage(1);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      (Object.entries(filters) as [keyof PerformanceReportFilters, string][]).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/report/dashboard/overview?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setData(json.data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load performance report");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const activeFilterCount = useMemo(
    () =>
      (Object.entries(filters) as [keyof PerformanceReportFilters, string][]).filter(
        ([k, v]) => k !== "recordScope" && k !== "datePreset" && Boolean(v)
      ).length + (filters.recordScope !== "all" ? 1 : 0) + (filters.datePreset !== "all" ? 1 : 0),
    [filters]
  );

  // ── derived chart data ──
  const leadStatusData = useMemo(
    () => (data?.leadStatusBreakdown ?? []).map((r) => ({ name: r.status, value: r.count })),
    [data]
  );
  const applicationStatusData = useMemo(
    () => (data?.applicationStatusBreakdown ?? []).map((r) => ({ label: r.status, count: r.count })),
    [data]
  );
  const visaStatusData = useMemo(
    () => (data?.visaStatusBreakdown ?? []).map((r) => ({ label: r.status, count: r.count })),
    [data]
  );
  const leadSourceData = useMemo(
    () => (data?.leadSourceBreakdown ?? []).map((r) => ({ label: r.source, count: r.total })),
    [data]
  );
  const countryDemand = data?.countryDemand ?? [];
  const monthlyVolume = data?.monthlyVolume ?? [];
  const branchPerformance = data?.branchPerformance ?? [];
  const rows = data?.rows ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-[#f7f7fa] dark:bg-[#0d0e13] p-5 sm:p-7">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">
            Performance Reports
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            Leads, students, applications, visa and loan performance in one place
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] hover:border-red-300 dark:hover:border-red-500/30 rounded-xl px-4 py-2.5 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-[#15161d] hover:bg-[#23242e] disabled:opacity-60 text-white rounded-xl px-4 py-2.5 text-[12.5px] font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Quick search + record scope (always visible, no sheet needed) ── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            placeholder="Search name, email, phone, university, course…"
            className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-[12px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40 min-w-[280px]"
          />
        </div>

        <div className="flex items-center bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl p-1">
          {(["all", "leads", "students"] as const).map((scope) => (
            <button
              key={scope}
              onClick={() => handleFilterChange({ recordScope: scope })}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                filters.recordScope === scope
                  ? "bg-red-500 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {scope === "all" ? "All" : titleCase(scope)}
            </button>
          ))}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-[11.5px] text-red-500 hover:text-red-700 font-medium underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-[13px]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto underline text-[12px] font-medium">
            Retry
          </button>
        </div>
      )}

      {loading && !data && <DashboardSkeleton />}

      {data && (
        <div className="space-y-8">
          {/* ── Summary cards ── */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <Kpi
                label="Total pipeline records"
                value={fmtNum(data.summary.totalPipelineRecords)}
                icon={<Users className="w-4 h-4" />}
                hint="Unconverted leads + students"
              />
              <Kpi
                label="Qualified leads"
                value={fmtNum(data.summary.qualifiedLeads)}
                icon={<CheckCircle2 className="w-4 h-4" />}
              />
              <Kpi
                label="Lost leads"
                value={fmtNum(data.summary.lostLeads)}
                icon={<XCircle className="w-4 h-4" />}
                tone="urgent"
              />
              <Kpi
                label="Total students"
                value={fmtNum(data.summary.totalStudents)}
                icon={<GraduationCap className="w-4 h-4" />}
                tone="good"
                hint={`${data.summary.conversionRate}% conversion`}
              />
              <Kpi
                label="Total applications"
                value={fmtNum(data.summary.totalApplications)}
                icon={<ClipboardList className="w-4 h-4" />}
                hint={`${data.summary.offerApplications} with offers`}
              />
              <Kpi
                label="Visa approved"
                value={fmtNum(data.summary.visaApprovedStudents)}
                icon={<BadgeCheck className="w-4 h-4" />}
                tone="good"
              />
              <Kpi
                label="CAS received"
                value={fmtNum(data.summary.casReceivedStudents)}
                icon={<FileCheck2 className="w-4 h-4" />}
              />
              <Kpi
                label="Loan sanctioned amount"
                value={fmtCurrency(data.summary.totalSanctionedAmount)}
                icon={<Wallet className="w-4 h-4" />}
                hint={`${data.summary.loanSanctionedStudents} students`}
              />
            </div>
          </section>

          {/* ── Monthly volume trend ── */}
          <section>
            <SectionHeader
              eyebrow="Growth"
              title="Monthly volume"
              subtitle="Leads, students and applications — trailing 6 months"
            />
            <Panel>
              {monthlyVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyVolume} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid
                      vertical={false}
                      stroke="currentColor"
                      className="text-red-100/40 dark:text-red-500/10"
                    />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="leads" name="Leads" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line
                      type="monotone"
                      dataKey="students"
                      name="Students"
                      stroke="#34b37e"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      name="Applications"
                      stroke="#6d5ef0"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState label="No volume data for this range" />
              )}
            </Panel>
          </section>

          {/* ── Country demand ── */}
          <section>
            <SectionHeader eyebrow="Demand" title="Country demand" subtitle="Leads, students and applications by destination country" />
            <Panel className="overflow-x-auto p-0">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-red-100 dark:border-red-500/10 bg-red-50/40 dark:bg-red-950/10">
                    <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">Country</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Leads</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Students</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Applications</th>
                  </tr>
                </thead>
                <tbody>
                  {countryDemand.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400">
                        No country demand data in scope
                      </td>
                    </tr>
                  ) : (
                    countryDemand.map((c) => (
                      <tr
                        key={c.country}
                        className="border-b border-red-100/60 dark:border-red-500/5 hover:bg-red-50/40 dark:hover:bg-red-950/10 transition-colors"
                      >
                        <td className="px-5 py-2.5 font-semibold text-slate-900 dark:text-slate-100">{c.country}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-red-500 font-bold">{c.leads}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {c.students}
                        </td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {c.applications}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Panel>
          </section>

          {/* ── Status breakdown charts ── */}
          <section>
            <SectionHeader eyebrow="Pipeline" title="Status breakdowns" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Panel>
                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Lead status</p>
                {leadStatusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie
                          data={leadStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="rgba(255,255,255,.06)"
                          strokeWidth={1}
                        >
                          {leadStatusData.map((entry, index) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? RED_SERIES[index % RED_SERIES.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {leadStatusData.map((d, index) => (
                        <Badge
                          key={d.name}
                          label={`${titleCase(d.name)}: ${d.value}`}
                          color={STATUS_COLORS[d.name] ?? RED_SERIES[index % RED_SERIES.length]}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState label="No lead status data" />
                )}
              </Panel>

              <Panel>
                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Lead source</p>
                <HBarList data={leadSourceData} />
              </Panel>

              <Panel>
                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Application status</p>
                <HBarList
                  data={applicationStatusData.map((d) => ({ ...d, color: STATUS_COLORS[d.label] }))}
                />
              </Panel>

              <Panel>
                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Visa status</p>
                <HBarList data={visaStatusData.map((d) => ({ ...d, color: STATUS_COLORS[d.label] }))} />
              </Panel>
            </div>
          </section>

          {/* ── Branch performance ── */}
          <section>
            <SectionHeader eyebrow="Locations" title="Branch performance" subtitle="Sorted by total leads in the filtered scope" />
            <Panel className="overflow-x-auto p-0">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-red-100 dark:border-red-500/10 bg-red-50/40 dark:bg-red-950/10">
                    <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">Branch</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Leads</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Students</th>
                    <th className="px-5 py-3 text-center font-medium text-red-700 dark:text-red-300">Conversion</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Applications</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Visa approved</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Sanctioned</th>
                    <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Disbursed</th>
                  </tr>
                </thead>
                <tbody>
                  {branchPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No branch data in scope
                      </td>
                    </tr>
                  ) : (
                    branchPerformance.map((b) => (
                      <tr
                        key={b.branchId}
                        className="border-b border-red-100/60 dark:border-red-500/5 hover:bg-red-50/40 dark:hover:bg-red-950/10 transition-colors"
                      >
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">{b.branch}</td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums text-red-500">{b.leads}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {b.students}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <RatePill rate={b.conversionRate} />
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {b.applications}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {b.visaApproved}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {fmtCurrency(b.sanctionedAmount)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {fmtCurrency(b.disbursedAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Panel>
          </section>

          {/* ── Unified paginated table ── */}
          <section>
            <SectionHeader
              eyebrow="Records"
              title="Leads & students"
              subtitle="Converted leads appear only as students — never duplicated"
            />
            <Panel className="overflow-x-auto p-0">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-red-100 dark:border-red-500/10 bg-red-50/40 dark:bg-red-950/10">
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Branch</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Counselor</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Source</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Country</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Stage</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">University</th>
                    <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Apps</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">App status</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Visa</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Loan</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Next follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-10 text-center text-slate-400">
                        No records match the current filters
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr
                        key={`${r.recordType}-${r.recordId}`}
                        className="border-b border-red-100/60 dark:border-red-500/5 hover:bg-red-50/40 dark:hover:bg-red-950/10 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <RecordTypeBadge type={r.recordType} />
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {r.studentName}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <span className="block">{r.emailId ?? "—"}</span>
                          <span className="block text-[10.5px]">{r.mobileNumber ?? "—"}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {r.branchName}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {r.counselorName}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.source}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.countryName}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge label={titleCase(r.lifecycleStatus)} color={STATUS_COLORS[r.lifecycleStatus]} />
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.currentStage ? titleCase(r.currentStage) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.latestUniversityName || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {r.applicationsCount}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.latestApplicationStatus ? titleCase(r.latestApplicationStatus) : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge label={titleCase(r.visaStatus)} color={STATUS_COLORS[r.visaStatus]} />
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {r.loanStatus && r.loanStatus !== "—" ? titleCase(r.loanStatus) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {fmtDate(r.createdAt)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {fmtDate(r.nextFollowup)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination footer */}
              {pagination && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-red-100 dark:border-red-500/10">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400">
                    Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}–
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-red-300 dark:hover:border-red-500/30 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 tabular-nums">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-red-300 dark:hover:border-red-500/30 transition-colors"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          </section>
        </div>
      )}

      {/* ── Filter sheet (uses filterOptions from the SAME response) ── */}
      <ReportFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        onChange={handleFilterChange}
        onReset={resetFilters}
        filterOptions={data?.filterOptions ?? null}
      />
    </div>
  );
}