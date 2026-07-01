"use client";

// app/reports/my-performance/MyCounselorReport.tsx
//
// Single-counselor 360° report for the CURRENTLY LOGGED-IN user.
//
// This component is PROPS-DRIVEN: the parent owns the /api/auth/me fetch
// and passes the result down as `me`, plus a `reload` callback to re-run
// that fetch (e.g. after a retry). This component never calls
// /api/auth/me itself.
//
// Confirmed real /api/auth/me shape (no {success,data} wrapper — the
// fetch resolves directly to the user object):
//   {
//     id, name, email, phone, monthlyTarget, roleId, createdAt, updatedAt,
//     role: { id, name: "Counsellor", description, isSystem, modulePermissions },
//     branches: [ { id, name, code, city, state, country, ... }, ... ]
//   }
//
// Report data comes from:
//   GET /api/report/counselor/singlecounsellor?counselorId={me.id}&...filters
// (fixed path — counselorId is passed purely as a query param, matching
// how this route is actually wired up on the backend.)
//
// No data is invented. Every field below traces back to the real
// route response and the real /api/auth/me payload.

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
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import {
  Users,
  FileCheck2,
  GraduationCap,
  CalendarClock,
  BadgeCheck,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  X,
  MessageSquare,
  FileText,
  Landmark,
  Mail,
  Search,
  Wallet,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  RotateCcw,
  ChevronDown,
  Lock,
} from "lucide-react";

import type {
  AuthMeUser,
  CounselorReportData,
  CounselorReportFilters,
  DatePreset,
} from "@/slids/types/counselor-report";

// ─────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────

const EMPTY_FILTERS: CounselorReportFilters = {
  datePreset: "all",
  startDate: "",
  endDate: "",
  branchId: "",
  page: 1,
  pageSize: 20,
};

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
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

// Backend role name is "Counsellor" (British spelling, capitalized-only
// first letter) — compare case-insensitively so this doesn't silently
// break if the casing ever shifts.
const isCounselorRole = (roleName: string | null | undefined) =>
  (roleName ?? "").trim().toLowerCase() === "counsellor";

// ─────────────────────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#ef4444", "#fb7185", "#f87171", "#dc2626", "#ea580c", "#b91c1c", "#fca5a5"];
const DATA_COLORS = ["#4f6ef7", "#2dd4bf", "#f59e0b", "#a78bfa", "#34d399", "#fb7185", "#60a5fa"];

// ─────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────

const titleCase = (s: string | null | undefined) =>
  (s ?? "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || "Unknown";

const fmtNum = (n: number | null | undefined) => {
  const num = Number(n ?? 0);
  return num >= 1_000_000
    ? `${(num / 1_000_000).toFixed(1)}M`
    : num >= 1_000
    ? `${(num / 1_000).toFixed(1)}K`
    : String(num);
};

const fmtCurrency = (n: number | string | null | undefined) => {
  const num = Number(n ?? 0);
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const initials = (name: string) =>
  (name || "?").split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function statusColor(status: string | null | undefined): string {
  const s = (status ?? "").toUpperCase();
  if (["APPROVED", "ACTIVE", "COMPLETED", "CONVERTED", "ENROLLED", "DISBURSED", "RECEIVED", "PAID"].includes(s))
    return "#22c55e";
  if (["REJECTED", "LOST", "CANCELLED", "CLOSED", "WITHDRAWN"].includes(s)) return "#ef4444";
  if (["PENDING", "IN_PROGRESS", "PROCESSING", "DOCUMENTS_PENDING", "DECISION_PENDING", "UNDER_REVIEW"].includes(s))
    return "#f59e0b";
  if (["NEW", "OPEN", "NOT_STARTED"].includes(s)) return "#60a5fa";
  if (!s) return "#94a3b8";
  return PIE_COLORS[Math.abs(s.charCodeAt(0) - 65) % PIE_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-red-100 bg-white shadow-sm dark:border-red-500/10 dark:bg-[#1a1b24] ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "red" | "green" | "orange" | "blue" }) {
  const cls = {
    default: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    red: "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
    green: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    orange: "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400",
    blue: "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
  }[variant];
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0e14] px-3.5 py-2.5 text-[12px] shadow-2xl">
      {label && <p className="mb-1.5 font-medium text-slate-400">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 tabular-nums" style={{ color: p.color ?? p.fill }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color ?? p.fill }} />
          {p.name}: <span className="font-semibold text-slate-100">{Number(p.value ?? 0).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <AlertCircle className="mb-2 h-6 w-6 opacity-40" />
      <p className="text-[13px]">{label}</p>
    </div>
  );
}

function HBarList({ data }: { data: { label: string; count: number; color?: string }[] }) {
  if (!data.length) return <EmptyState label="No data yet" />;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.slice(0, 10).map((item, i) => {
        const color = item.color ?? PIE_COLORS[i % PIE_COLORS.length];
        const pct = Math.round((item.count / maxVal) * 100);
        return (
          <div key={item.label + i} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-[12px] text-slate-500 dark:text-slate-400">{titleCase(item.label)}</span>
            <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}50` }}
              />
            </div>
            <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

type KpiTone = "primary" | "danger" | "rose" | "warning" | "success" | "default" | "blue";

function KpiCard({
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
  tone?: KpiTone;
}) {
  const tones: Record<KpiTone, { icon: string; value: string }> = {
    primary: { icon: "bg-red-50 text-red-500 dark:bg-red-500/10", value: "text-red-500" },
    danger: { icon: "bg-red-100 text-red-600 dark:bg-red-600/10", value: "text-red-600" },
    rose: { icon: "bg-rose-50 text-rose-500 dark:bg-rose-500/10", value: "text-rose-500" },
    warning: { icon: "bg-orange-50 text-orange-500 dark:bg-orange-500/10", value: "text-orange-500" },
    success: { icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10", value: "text-emerald-600" },
    blue: { icon: "bg-blue-50 text-blue-500 dark:bg-blue-500/10", value: "text-blue-500" },
    default: { icon: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300", value: "text-slate-900 dark:text-white" },
  };
  const t = tones[tone];
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md dark:border-red-500/10 dark:bg-[#1a1b24] dark:hover:border-red-500/20">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.icon}`}>{icon}</span>
      </div>
      <span className={`text-[26px] font-bold leading-none tracking-tight tabular-nums ${t.value}`}>{value}</span>
      {hint && <span className="text-[11.5px] text-slate-400 dark:text-slate-500">{hint}</span>}
    </div>
  );
}

function PanelHeader({ title, subtitle, tag }: { title: string; subtitle?: string; tag: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-2">
      <div>
        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <span className="shrink-0 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
        {tag}
      </span>
    </div>
  );
}

function TargetRing({ pct, achieved, target }: { pct: number; achieved: number; target: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  const color = pct >= 100 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-bold tabular-nums" style={{ color }}>
            {Math.round(pct)}%
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-slate-500">of target</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[13px] font-semibold text-slate-800 dark:text-white">
          {achieved} / {target || "—"}
        </p>
        <p className="text-[11px] text-slate-500">Monthly target</p>
      </div>
    </div>
  );
}

function Skeleton() {
  const Skel = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.04] ${className}`} />
  );
  return (
    <div className="space-y-6">
      <Skel className="h-36" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skel key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skel key={i} className="h-60" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Filter sheet — datePreset / custom range / branchId (only real params
// this backend route accepts)
// ─────────────────────────────────────────────────────────────────────────

function FilterSheet({
  open,
  onClose,
  filters,
  branches,
  onApply,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  filters: CounselorReportFilters;
  branches: { id: string; name: string }[];
  onApply: (f: CounselorReportFilters) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<CounselorReportFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  if (!open) return null;

  const activeCount = (draft.datePreset !== "all" ? 1 : 0) + (draft.branchId ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-[#f7f7fa] shadow-2xl dark:bg-[#0d0e13]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-white/[0.06] dark:bg-[#1a1b24]">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Filters</h2>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
              {activeCount > 0 ? `${activeCount} active` : "No filters applied"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 mt-0 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Date range</p>
          <div className="relative mb-2.5">
            <select
              value={draft.datePreset}
              onChange={(e) => setDraft((p) => ({ ...p, datePreset: e.target.value as DatePreset }))}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-[12.5px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-white/[0.08] dark:bg-[#15161d] dark:text-slate-300"
            >
              {DATE_PRESETS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
          {draft.datePreset === "custom" && (
            <div className="mb-4 grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">Start date</label>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-white/[0.08] dark:bg-[#15161d] dark:text-slate-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">End date</label>
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => setDraft((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-white/[0.08] dark:bg-[#15161d] dark:text-slate-300"
                />
              </div>
            </div>
          )}

          <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Branch</p>
          <div className="relative">
            <select
              value={draft.branchId}
              onChange={(e) => setDraft((p) => ({ ...p, branchId: e.target.value }))}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-[12.5px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-white/[0.08] dark:bg-[#15161d] dark:text-slate-300"
            >
              <option value="">All branches I work in</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/[0.06] dark:bg-[#1a1b24]">
          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-[12.5px] font-medium text-slate-600 transition-colors hover:border-red-300 dark:border-white/[0.08] dark:text-slate-300 dark:hover:border-red-500/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            onClick={() => {
              onApply({ ...draft, page: 1 });
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#15161d] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#23242e]"
          >
            <Check className="h-3.5 w-3.5" />
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Unified table row badge
// ─────────────────────────────────────────────────────────────────────────

function RecordTypeBadge({ type }: { type: "lead" | "student" }) {
  return type === "student" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <GraduationCap className="h-3 w-3" /> Student
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
      <Users className="h-3 w-3" /> Lead
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

interface MyCounselorReportProps {
  /** Raw user object from /api/auth/me — passed down by the parent. `null`/`undefined` while the parent is still resolving auth. */
  me: AuthMeUser | null | undefined;
  /** Ask the parent to re-fetch /api/auth/me (used by the retry button). */
  reload: () => Promise<void>;
}

type LoadState = "waiting_for_me" | "not_counselor" | "loading_report" | "ready" | "error";

export default function MyCounselorReport({ me, reload }: MyCounselorReportProps) {
  const [loadState, setLoadState] = useState<LoadState>("waiting_for_me");
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CounselorReportFilters>(EMPTY_FILTERS);
  const [data, setData] = useState<CounselorReportData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rowSearch, setRowSearch] = useState("");

  // ── Fetch this counselor's report ───────────────────────────────────
  const fetchReport = useCallback(async (f: CounselorReportFilters, counselorId: string) => {
    setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("counselorId", counselorId);
      if (f.datePreset !== "all") params.set("datePreset", f.datePreset);
      if (f.datePreset === "custom") {
        if (f.startDate) params.set("startDate", f.startDate);
        if (f.endDate) params.set("endDate", f.endDate);
      }
      if (f.branchId) params.set("branchId", f.branchId);
      params.set("page", String(f.page));
      params.set("pageSize", String(f.pageSize));

      const res = await fetch(`/api/report/dashboard/counselor/singlecounsellor?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load your report");

      setData(json.data);
      setLoadState("ready");
    } catch (e: any) {
      setError(e.message ?? "Failed to load your report");
      setLoadState("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ── React to `me` arriving / changing from the parent ───────────────
  useEffect(() => {
    if (!me) {
      setLoadState("waiting_for_me");
      return;
    }
    if (!isCounselorRole(me.role?.name)) {
      setLoadState("not_counselor");
      return;
    }
    setLoadState("loading_report");
    fetchReport(filters, me.id);
    // Only re-run when the identity of `me` changes (new login), not on
    // every filter tweak — filter changes go through applyFilters below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, me?.role?.name]);

  const applyFilters = (f: CounselorReportFilters) => {
    setFilters(f);
    if (me) fetchReport(f, me.id);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    if (me) fetchReport(EMPTY_FILTERS, me.id);
  };

  const goToPage = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    if (me) fetchReport(next, me.id);
  };

  const refresh = () => {
    if (me) fetchReport(filters, me.id);
  };

  // ── Derived data ─────────────────────────────────────────────────────
  const { profile, summary, monthlyActivity, branchPerformance, statusBreakdowns, rows, pagination } = data ?? ({} as CounselorReportData);

  const trendData = useMemo(
    () =>
      (monthlyActivity ?? []).map((m) => ({
        month: m.label,
        Leads: m.leads,
        Students: m.students,
        Applications: m.applications,
      })),
    [monthlyActivity]
  );

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!rowSearch.trim()) return rows;
    const needle = rowSearch.toLowerCase();
    return rows.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(needle) ||
        r.email?.toLowerCase().includes(needle) ||
        r.phone?.toLowerCase().includes(needle) ||
        r.branchName?.toLowerCase().includes(needle) ||
        r.country?.toLowerCase().includes(needle)
    );
  }, [rows, rowSearch]);

  const activeFilterCount = (filters.datePreset !== "all" ? 1 : 0) + (filters.branchId ? 1 : 0);

  // ── Gating states ────────────────────────────────────────────────────
  if (loadState === "waiting_for_me") {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-5 dark:bg-[#0f1117] sm:p-7">
        <Skeleton />
      </div>
    );
  }

  if (loadState === "not_counselor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-6 dark:bg-[#0f1117]">
        <Panel className="max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">This report is for counselors</h2>
          <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
            You&apos;re signed in as <span className="font-semibold">{me?.name}</span> ({titleCase(me?.role?.name)}). This page shows a
            counselor&apos;s own performance and is only available to accounts with the Counsellor role.
          </p>
        </Panel>
      </div>
    );
  }

  if (loadState === "error" && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] p-6 dark:bg-[#0f1117]">
        <Panel className="max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Couldn&apos;t load your report</h2>
          <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">{error}</p>
          <button
            onClick={() => {
              reload();
              if (me) fetchReport(filters, me.id);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#15161d] px-4 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[#23242e]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </Panel>
      </div>
    );
  }

  if (!data || !profile) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-5 dark:bg-[#0f1117] sm:p-7">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-5 font-sans text-slate-900 dark:bg-[#0f1117] dark:text-slate-100 sm:p-7">
      {/* ── Page header ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">My Performance</h1>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            Your personal counselor report · generated {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12.5px] font-medium text-slate-700 transition-colors hover:border-red-300 dark:border-white/[0.08] dark:bg-[#1a1b24] dark:text-slate-200 dark:hover:border-red-500/30"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-[12.5px] font-medium text-white shadow-sm shadow-red-500/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 dark:border-red-500/15 dark:bg-red-500/5 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={refresh} className="text-[12px] font-medium underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300">
            Retry
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Profile hero ── */}
        <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-[#1a1b24] to-[#0f1117] p-6 dark:border-red-500/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-rose-500/5 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-lg font-bold text-red-300">
                {initials(profile.name)}
              </div>
              <div className="min-w-0">
                <h2 className="text-[20px] font-bold text-white">{profile.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[12px] text-slate-400">
                    <Mail className="h-3 w-3" /> {profile.email}
                  </span>
                  {profile.role && (
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
                      {profile.role.name}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.branches?.map((b) => (
                    <span key={b.id} className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300">
                      {b.name}
                      {b.city ? ` · ${b.city}` : ""}
                    </span>
                  ))}
                  {profile.branches?.length === 0 && <span className="text-[11px] text-slate-500">No branch assigned</span>}
                </div>
              </div>
            </div>
            <TargetRing pct={safeAchievementPct(summary, profile)} achieved={summary.totalLeadsAssigned} target={profile.monthlyTarget ?? 0} />
          </div>
        </div>

        {/* ── KPI grid — every field from `summary` ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Assigned Leads"
            value={fmtNum(summary.totalLeadsAssigned)}
            icon={<Users className="h-4 w-4" />}
            hint={`${summary.primaryLeadsCount} primary · ${summary.joinedLeadsCount} shared`}
            tone="primary"
          />
          <KpiCard
            label="Converted"
            value={fmtNum(summary.convertedLeadsCount)}
            icon={<BadgeCheck className="h-4 w-4" />}
            hint={`${summary.conversionRate}% conversion rate`}
            tone="success"
          />
          <KpiCard label="Unconverted Leads" value={fmtNum(summary.unconvertedLeadsCount)} icon={<Users className="h-4 w-4" />} tone="warning" />
          <KpiCard label="Qualified" value={fmtNum(summary.qualifiedLeadsCount)} icon={<BadgeCheck className="h-4 w-4" />} tone="blue" />
          <KpiCard label="Lost" value={fmtNum(summary.lostLeadsCount)} icon={<X className="h-4 w-4" />} tone="danger" />
          <KpiCard label="Total Students" value={fmtNum(summary.totalStudents)} icon={<GraduationCap className="h-4 w-4" />} tone="rose" />
          <KpiCard
            label="Applications"
            value={fmtNum(summary.totalApplications)}
            icon={<FileText className="h-4 w-4" />}
            hint={`${summary.offerApplications} with offers`}
            tone="default"
          />
          <KpiCard label="Visa Approved" value={fmtNum(summary.visaApprovedCount)} icon={<FileCheck2 className="h-4 w-4" />} tone="success" />
          <KpiCard label="CAS Received" value={fmtNum(summary.casReceivedCount)} icon={<FileCheck2 className="h-4 w-4" />} tone="blue" />
          <KpiCard
            label="Loan Sanctioned"
            value={fmtCurrency(summary.totalSanctionedAmount)}
            icon={<Wallet className="h-4 w-4" />}
            hint={`${summary.loanSanctionedCount} of ${summary.totalLoanInquiries} inquiries`}
            tone="rose"
          />
          <KpiCard label="Loan Disbursed" value={fmtCurrency(summary.totalDisbursedAmount)} icon={<Landmark className="h-4 w-4" />} tone="warning" />
          <KpiCard label="Docs Uploaded" value={fmtNum(summary.totalDocsUploaded)} icon={<FileText className="h-4 w-4" />} tone="default" />
          <KpiCard label="Remarks Authored" value={fmtNum(summary.totalRemarksAuthored)} icon={<MessageSquare className="h-4 w-4" />} tone="default" />
          <KpiCard
            label="Lead Timeline Entries"
            value={fmtNum(summary.totalLeadTimelineEntriesCreated)}
            icon={<CalendarClock className="h-4 w-4" />}
            hint={`+${summary.totalLeadTimelineEntriesUpdatedOnly} updates only`}
            tone="default"
          />
          <KpiCard
            label="Student Timeline Entries"
            value={fmtNum(summary.totalStudentTimelineEntriesCreated)}
            icon={<CalendarClock className="h-4 w-4" />}
            tone="default"
          />
          <KpiCard
            label="Created Not Assigned"
            value={fmtNum(summary.leadsCreatedNotAssigned)}
            icon={<Users className="h-4 w-4" />}
            hint={`${summary.leadsUpdatedNotAssigned} updated not assigned`}
            tone="default"
          />
        </div>

        {/* ── Monthly activity trend ── */}
        <Panel className="p-5">
          <PanelHeader title="Monthly Activity" subtitle="Leads, students and applications — trailing 6 months" tag="Trend" />
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trendData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }} barGap={6}>
                <CartesianGrid vertical={false} stroke="rgba(239,68,68,0.07)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="Leads" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={16} />
                <Bar dataKey="Applications" fill="#a78bfa" radius={[6, 6, 0, 0]} barSize={16} />
                <Line type="monotone" dataKey="Students" stroke="#fb7185" strokeWidth={3} dot={{ r: 3, fill: "#fb7185", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#fb7185" }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No activity in this range" />
          )}
        </Panel>

        {/* ── Branch performance ── */}
        <Panel className="overflow-hidden p-0">
          <div className="p-5 pb-0">
            <PanelHeader title="Branch Performance" subtitle="Your leads, students and applications per branch" tag="Branches" />
          </div>
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-red-500/10">
                  <th className="px-3 py-2.5 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Branch</th>
                  <th className="px-3 py-2.5 text-right text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Leads</th>
                  <th className="px-3 py-2.5 text-right text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Students</th>
                  <th className="px-3 py-2.5 text-right text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Applications</th>
                </tr>
              </thead>
              <tbody>
                {(branchPerformance ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No branch activity in scope
                    </td>
                  </tr>
                ) : (
                  branchPerformance.map((b) => (
                    <tr key={b.branchId} className="border-b border-slate-50 transition hover:bg-red-50/40 dark:border-red-500/5 dark:hover:bg-red-500/5">
                      <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">{b.branch}</td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-red-500">{b.leads}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{b.students}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{b.applications}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ── Status breakdowns ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Panel className="p-5">
            <PanelHeader title="Leads by Status" subtitle="Your pipeline distribution" tag="Status" />
            {statusBreakdowns.leadStatus.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusBreakdowns.leadStatus.map((r) => ({ name: r.status, value: r.count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={74}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusBreakdowns.leadStatus.map((r, i) => (
                        <Cell key={i} fill={statusColor(r.status)} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusBreakdowns.leadStatus.map((r) => (
                    <span
                      key={r.status}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: `${statusColor(r.status)}18`, color: statusColor(r.status) }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor(r.status) }} />
                      {titleCase(r.status)}: {r.count}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState label="No lead status data" />
            )}
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="By Source" subtitle="Where your leads come from" tag="Source" />
            <HBarList data={statusBreakdowns.leadSource.map((r, i) => ({ label: r.status, count: r.count, color: DATA_COLORS[i % DATA_COLORS.length] }))} />
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="By Country" subtitle="Top destination countries" tag="Country" />
            <HBarList data={statusBreakdowns.country.map((r, i) => ({ label: r.status, count: r.count, color: DATA_COLORS[i % DATA_COLORS.length] }))} />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel className="p-5">
            <PanelHeader title="Students by Status" subtitle="Your enrollment pipeline" tag="Students" />
            <HBarList data={statusBreakdowns.studentStatus.map((r) => ({ label: r.status, count: r.count, color: statusColor(r.status) }))} />
          </Panel>
          <Panel className="p-5">
            <PanelHeader title="Applications by Status" subtitle="Course application outcomes" tag="Applications" />
            <HBarList data={statusBreakdowns.applicationStatus.map((r) => ({ label: r.status, count: r.count, color: statusColor(r.status) }))} />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Panel className="p-5">
            <PanelHeader title="Visa Status" subtitle="Visa detail records" tag="Visa" />
            <HBarList data={statusBreakdowns.visaStatus.map((r) => ({ label: r.status, count: r.count, color: statusColor(r.status) }))} />
          </Panel>
          <Panel className="p-5">
            <PanelHeader title="CAS Status" subtitle="CAS progress" tag="CAS" />
            <HBarList data={statusBreakdowns.casStatus.map((r) => ({ label: r.status, count: r.count, color: statusColor(r.status) }))} />
          </Panel>
          <Panel className="p-5">
            <PanelHeader title="Loan Status" subtitle="Loan inquiries" tag="Loans" />
            <HBarList data={statusBreakdowns.loanStatus.map((r) => ({ label: r.status, count: r.count, color: statusColor(r.status) }))} />
          </Panel>
        </div>

        {/* ── Unified paginated leads + students table ── */}
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">My Leads &amp; Students</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Unconverted leads and converted students — converted leads appear only as students
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={rowSearch}
                onChange={(e) => setRowSearch(e.target.value)}
                placeholder="Search this page…"
                className="w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[12.5px] text-slate-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#1a1b24] dark:text-slate-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-red-500/10">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Type</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Name</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Contact</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Branch</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Source</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Country</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Stage</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">University</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Apps</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">App status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Visa</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Loan</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Assignment</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-10 text-center text-slate-400">
                      {rowSearch ? `No records match "${rowSearch}"` : "No records in this range"}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={`${r.recordType}-${r.recordId}`} className="border-b border-slate-50 transition hover:bg-red-50/40 dark:border-red-500/5 dark:hover:bg-red-500/5">
                      <td className="px-4 py-2.5">
                        <RecordTypeBadge type={r.recordType} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-bold text-red-500">
                            {initials(r.studentName)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">{r.studentName}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">
                        <span className="block">{r.email ?? "—"}</span>
                        <span className="block text-[10.5px]">{r.phone ?? "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-700 dark:text-slate-300">{r.branchName}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">{r.source || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">{r.country || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                          style={{ background: `${statusColor(r.status)}18`, color: statusColor(r.status) }}
                        >
                          {titleCase(r.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">{r.stage ? titleCase(r.stage) : "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">{r.latestUniversity || "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{r.applicationsCount ?? 0}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">
                        {r.latestApplicationStatus ? titleCase(r.latestApplicationStatus) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {r.visaStatus ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: `${statusColor(r.visaStatus)}18`, color: statusColor(r.visaStatus) }}
                          >
                            {titleCase(r.visaStatus)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">{r.loanStatus ? titleCase(r.loanStatus) : "—"}</td>
                      <td className="px-4 py-2.5">
                        {r.assignmentType ? <Badge variant={r.assignmentType === "primary" ? "blue" : "orange"}>{titleCase(r.assignmentType)}</Badge> : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between border-t border-red-100 px-5 py-3.5 dark:border-red-500/10">
              <span className="text-[12px] text-slate-500 dark:text-slate-400">
                Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-red-300 disabled:opacity-40 dark:border-white/[0.08] dark:text-slate-300 dark:hover:border-red-500/30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <span className="text-[12px] tabular-nums text-slate-500 dark:text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => goToPage(Math.min(pagination.totalPages, pagination.page + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-red-300 disabled:opacity-40 dark:border-white/[0.08] dark:text-slate-300 dark:hover:border-red-500/30"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </Panel>

        {/* ── Recent remarks ── */}
        <Panel className="p-5">
          <PanelHeader title="Recent Remarks" subtitle={`${data.remarks.length} authored by you`} tag="Remarks" />
          <div className="space-y-3">
            {data.remarks.slice(0, 8).map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition hover:border-red-100 dark:border-red-500/10 dark:bg-white/[0.02] dark:hover:border-red-500/20"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "#4f6ef718", color: "#4f6ef7" }}>
                  <MessageSquare className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  {r.title && <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{r.title}</p>}
                  <p className="line-clamp-2 text-[12px] text-slate-600 dark:text-slate-300">{r.message}</p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(r.createdAt)}</span>
              </div>
            ))}
            {data.remarks.length === 0 && <EmptyState label="No remarks authored in this range" />}
          </div>
        </Panel>

        {/* ── Recent lead timeline / follow-ups ── */}
        <Panel className="p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Recent Follow-up Activity</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Latest lead timeline entries you created</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.leadTimelines.created.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition hover:border-red-100 dark:border-red-500/10 dark:bg-white/[0.02] dark:hover:border-red-500/20"
              >
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[12px] text-slate-700 dark:text-slate-200">{item.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</p>
                  {item.nextFollowup && <p className="mt-0.5 text-[10px] text-orange-400">Follow: {fmtDate(item.nextFollowup)}</p>}
                </div>
              </div>
            ))}
            {data.leadTimelines.created.length === 0 && <EmptyState label="No timeline entries in this range" />}
          </div>
        </Panel>
      </div>

      {/* ── Filters footer note ── */}
      <div className="mt-8 pb-3 text-center text-[12px] text-slate-400">
        Date field: created date · Preset: {titleCase(data.appliedFilters.datePreset)}
        {data.appliedFilters.branchId ? " · Branch filter applied" : ""}
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} filters={filters} branches={profile.branches ?? []} onApply={applyFilters} onReset={resetFilters} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Small helper: monthly target achievement, guarded against divide-by-zero
// (backend does not compute this itself, so we derive it purely from
// summary.totalLeadsAssigned vs profile.monthlyTarget — both real fields)
// ─────────────────────────────────────────────────────────────────────────

function safeAchievementPct(summary: { totalLeadsAssigned: number }, profile: { monthlyTarget: number | null }): number {
  const target = profile.monthlyTarget ?? 0;
  if (!target) return 0;
  return Math.min(999, Number(((summary.totalLeadsAssigned / target) * 100).toFixed(1)));
}