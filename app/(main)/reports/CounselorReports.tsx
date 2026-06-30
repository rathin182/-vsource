"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  CalendarDays,
  ShieldAlert,
  Plane,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  MessageSquare,
  Phone,
  FileText,
  Clock,
  Stethoscope,
  Landmark,
  ChevronRight,
  Mail,
  Zap,
  Search,
  Building2,
  Wallet,
  Globe2,
  Filter,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types — mirrors the ACTUAL backend response exactly
// ─────────────────────────────────────────────────────────────────────────────

interface Branch {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  state?: string | null;
}

interface CounselorProfile {
  id: string;
  name: string;
  email: string;
  monthlyTarget: number | null;
  role: { id: string; name: string };
  branches: Branch[];
  createdAt: string;
}

interface CounselorSummary {
  totalLeads: number;
  newLeadsThisMonth: number;
  convertedLeads: number;
  conversionRate: number;
  monthlyTarget: number;
  monthlyTargetAchievement: number;
  totalAssignedLeads: number;
  primaryAssignedLeads: number;
  sharedAssignedLeads: number;
  assignedConvertedLeads: number;
  assignedConversionRate: number;
  totalStudents: number;
  newStudentsThisMonth: number;
  upcomingFollowups: number;
  overdueFollowups: number;
  totalVisaApplications: number;
  visaApproved: number;
  visaRejected: number;
  visaApprovalRate: number;
  totalLoanAmountApproved: number | string;
  totalRemarks: number;
  totalTimelinesCreated: number;
  totalDocs: number;
  totalMbbsLeads: number;
}

interface TimelineEntry {
  id: string;
  description: string;
  nextFollowup: string | null;
  createdAt: string;
  lead: {
    id: string;
    studentName: string;
    email: string;
    phone: string;
    status: string;
  } | null;
}

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  country: string | null;
  intakeSeason: string | null;
  passport: string | null;
  visaStage: string | null;
  createdAt: string;
  leadId: string | null;
  leadSource: string | null;
  leadStatus: string | null;
  counselorId?: string;
  counselorName?: string;
}

interface CounselorAnalytics {
  profile: CounselorProfile | null;
  summary: CounselorSummary;
  leads: {
    byStatus: { status: string; count: number }[];
    byStage: { stage: string; count: number }[];
    bySource: { source: string; count: number }[];
    byCountry: { country: string | null; count: number }[];
    byIntakeSeason: { season: string | null; count: number }[];
    byVisaStage: { stage: string; count: number }[];
    overTime: { month: string; count: number }[];
    assignedBreakdown: {
      total: number;
      primary: number;
      shared: number;
      byStatus: Record<string, number>;
    };
  };
  students: {
    total: number;
    newThisMonth: number;
    convertedFromLeads: number;
    conversionRate: number;
    byStatus: { status: string; count: number }[];
    overTime: { month: string; count: number }[];
    list: StudentRecord[];
  };
  followups: {
    upcoming7Days: number;
    overdue: number;
    recentActivity: TimelineEntry[];
  };
  visa: {
    total: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    byStatus: { status: string; count: number }[];
    upcoming: {
      depositDeadlinesNext7Days: number;
      casDeadlinesNext7Days: number;
      universityStartsNext30Days: number;
    };
  };
  loans: {
    byStatus: { status: string; count: number; totalAmount: number | string }[];
    totalApproved: number | string;
  };
  courses: {
    byApplicationStatus: { status: string; count: number }[];
    topUniversities: { universityName: string; applications: number }[];
  };
  activity: {
    totalRemarks: number;
    remarksByType: { type: string; count: number }[];
    totalTimelinesCreated: number;
    recentTimelines: TimelineEntry[];
  };
  mbbsLeads: { total: number; byStatus: { status: string; count: number }[] };
}

interface LeaderboardEntry {
  rank: number;
  counselorId: string;
  counselorName: string;
  email: string;
  monthlyTarget: number | null;
  branches: Branch[];
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  newLeadsThisMonth: number;
  monthlyTargetAchievement: number;
  totalStudents: number;
  visaApproved: number;
  visaApprovalRate: number;
  upcomingFollowups: number;
  overdueFollowups: number;
  totalRemarks: number;
  totalMbbsLeads: number;
}

interface TopThisMonth {
  counselorId: string;
  counselorName: string;
  newLeadsThisMonth: number;
  monthlyTarget: number | null;
  monthlyTargetAchievement: number;
}

interface AllCounselorsData {
  meta: {
    generatedAt: string;
    mode: string;
    totalCounselors: number;
    filters: Record<string, unknown>;
  };
  globalSummary: {
    totalLeads: number;
    totalStudents: number;
    convertedLeads: number;
    conversionRate: number;
    upcomingFollowups: number;
    overdueFollowups: number;
  };
  leaderboard: LeaderboardEntry[];
  topThisMonth: TopThisMonth[];
  students: StudentRecord[];
  counselors: {
    counselorId: string;
    counselorName: string;
    email: string;
    monthlyTarget: number | null;
    role: { id: string; name: string };
    branches: Branch[];
    analytics: CounselorAnalytics;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#ef4444",
  "#fb7185",
  "#f87171",
  "#dc2626",
  "#ea580c",
  "#b91c1c",
  "#fca5a5",
];
const DATA_COLORS = [
  "#4f6ef7",
  "#2dd4bf",
  "#f59e0b",
  "#a78bfa",
  "#34d399",
  "#fb7185",
  "#60a5fa",
];

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const titleCase = (s: string) =>
  (s ?? "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const fmtNum = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}K`
    : String(n ?? 0);

const fmtCurrency = (n: number | string) => {
  const num = Number(n ?? 0);
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
  return `₹${num}`;
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const initials = (name: string) =>
  (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

// ─────────────────────────────────────────────────────────────────────────────
// Primitive components
// ─────────────────────────────────────────────────────────────────────────────

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-red-100 bg-white shadow-sm dark:border-red-500/10 dark:bg-[#1a1b24] ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "red" | "green" | "orange" | "blue";
}) {
  const cls = {
    default:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    red: "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    orange:
      "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400",
    blue: "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
  }[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0e14] px-3.5 py-2.5 text-[12px] shadow-2xl">
      {label && <p className="mb-1.5 font-medium text-slate-400">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p
          key={i}
          className="flex items-center gap-2 tabular-nums"
          style={{ color: p.color ?? p.fill }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: p.color ?? p.fill }}
          />
          {p.name}:{" "}
          <span className="font-semibold text-slate-100">
            {p.value?.toLocaleString()}
          </span>
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

function HBarList({
  data,
}: {
  data: { label: string; count: number; color?: string }[];
}) {
  if (!data.length) return <EmptyState label="No data yet" />;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {data.slice(0, 8).map((item, i) => {
        const color = item.color ?? PIE_COLORS[i % PIE_COLORS.length];
        const pct = Math.round((item.count / maxVal) * 100);
        return (
          <div key={item.label + i} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-[12px] text-slate-500 dark:text-slate-400">
              {titleCase(item.label || "Unknown")}
            </span>
            <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: color,
                  boxShadow: `0 0 6px ${color}50`,
                }}
              />
            </div>
            <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type KpiTone =
  | "primary"
  | "danger"
  | "rose"
  | "warning"
  | "success"
  | "default"
  | "blue";

function KpiCard({
  label,
  value,
  icon,
  hint,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
  delta?: number;
  tone?: KpiTone;
}) {
  const tones: Record<KpiTone, { icon: string; value: string }> = {
    primary: {
      icon: "bg-red-50 text-red-500 dark:bg-red-500/10",
      value: "text-red-500",
    },
    danger: {
      icon: "bg-red-100 text-red-600 dark:bg-red-600/10",
      value: "text-red-600",
    },
    rose: {
      icon: "bg-rose-50 text-rose-500 dark:bg-rose-500/10",
      value: "text-rose-500",
    },
    warning: {
      icon: "bg-orange-50 text-orange-500 dark:bg-orange-500/10",
      value: "text-orange-500",
    },
    success: {
      icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
      value: "text-emerald-600",
    },
    blue: {
      icon: "bg-blue-50 text-blue-500 dark:bg-blue-500/10",
      value: "text-blue-500",
    },
    default: {
      icon: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
      value: "text-slate-900 dark:text-white",
    },
  };
  const t = tones[tone];

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md dark:border-red-500/10 dark:bg-[#1a1b24] dark:hover:border-red-500/20">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.icon}`}
        >
          {icon}
        </span>
      </div>
      <span
        className={`text-[26px] font-bold leading-none tracking-tight tabular-nums ${t.value}`}
      >
        {value}
      </span>
      {(hint || delta !== undefined) && (
        <div className="flex items-center gap-2">
          {delta !== undefined && (
            <span
              className={`flex items-center gap-1 text-[11px] font-medium ${
                delta > 0
                  ? "text-emerald-500"
                  : delta < 0
                  ? "text-red-500"
                  : "text-slate-400"
              }`}
            >
              {delta > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : delta < 0 ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && (
            <span className="text-[11.5px] text-slate-400 dark:text-slate-500">
              {hint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  const Skel = ({ className = "" }: { className?: string }) => (
    <div
      className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.04] ${className}`}
    />
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

// ─────────────────────────────────────────────────────────────────────────────
// Target Progress Ring
// ─────────────────────────────────────────────────────────────────────────────

function TargetRing({
  pct,
  achieved,
  target,
}: {
  pct: number;
  achieved: number;
  target: number;
}) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  const color = pct >= 100 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(239,68,68,0.1)"
            strokeWidth="8"
          />
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
          <span className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
            of target
          </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Remark type icon
// ─────────────────────────────────────────────────────────────────────────────

function RemarkIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; color: string }> = {
    NOTE: { icon: <FileText className="h-3.5 w-3.5" />, color: "#4f6ef7" },
    FOLLOW_UP: { icon: <Clock className="h-3.5 w-3.5" />, color: "#f59e0b" },
    CALL: { icon: <Phone className="h-3.5 w-3.5" />, color: "#22c55e" },
    MEETING: { icon: <Users className="h-3.5 w-3.5" />, color: "#a78bfa" },
    WARNING: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "#ef4444" },
  };
  const m = map[type] ?? map.NOTE;
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-lg"
      style={{ background: `${m.color}18`, color: m.color }}
    >
      {m.icon}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel header helper
// ─────────────────────────────────────────────────────────────────────────────

function PanelHeader({
  title,
  subtitle,
  tag,
}: {
  title: string;
  subtitle?: string;
  tag: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-2">
      <div>
        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
        {tag}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status color helper
// ─────────────────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  const s = (status ?? "").toUpperCase();
  if (["APPROVED", "ACTIVE", "COMPLETED", "CONVERTED", "ENROLLED", "DISBURSED"].includes(s))
    return "#22c55e";
  if (["REJECTED", "LOST", "CANCELLED", "CLOSED"].includes(s)) return "#ef4444";
  if (["PENDING", "IN_PROGRESS", "PROCESSING"].includes(s)) return "#f59e0b";
  if (["NEW", "OPEN"].includes(s)) return "#60a5fa";
  return PIE_COLORS[Math.abs(s.charCodeAt(0) - 65) % PIE_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Students table panel (used inside CounselorDetail)
// ─────────────────────────────────────────────────────────────────────────────

function StudentsTable({ list }: { list: StudentRecord[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(needle) ||
        s.email?.toLowerCase().includes(needle) ||
        s.phone?.toLowerCase().includes(needle) ||
        s.passport?.toLowerCase().includes(needle)
    );
  }, [list, q]);

  return (
    <Panel className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
            Converted Students
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {list.length} student record{list.length === 1 ? "" : "s"} (lead → student)
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student…"
            className="w-52 rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-[12px] text-slate-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#1a1b24] dark:text-slate-200"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-red-500/10">
              {["Student", "Country", "Intake", "Status", "Visa Stage", "Source", "Created"].map(
                (h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-2.5 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="border-b border-slate-50 transition hover:bg-red-50/40 dark:border-red-500/5 dark:hover:bg-red-500/5"
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-bold text-red-500">
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {s.name || "Unnamed"}
                      </p>
                      <p className="truncate text-[10.5px] text-slate-400">
                        {s.email || s.phone || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                  {s.country || "—"}
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                  {s.intakeSeason || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                    style={{
                      background: `${statusColor(s.status)}18`,
                      color: statusColor(s.status),
                    }}
                  >
                    {titleCase(s.status || "Unknown")}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                  {s.visaStage ? titleCase(s.visaStage) : "—"}
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                  {s.leadSource ? titleCase(s.leadSource) : "—"}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-400">
                  {new Date(s.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  {q ? `No students match "${q}"` : "No converted students yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single counselor detail view
// ─────────────────────────────────────────────────────────────────────────────

function CounselorDetail({
  data,
  onBack,
}: {
  data: CounselorAnalytics;
  onBack: () => void;
}) {
  const {
    profile,
    summary,
    leads,
    students,
    followups,
    visa,
    loans,
    courses,
    activity,
    mbbsLeads,
  } = data;

  const trendData = useMemo(() => {
    const lm = Object.fromEntries(leads.overTime.map((r) => [r.month, r.count]));
    const sm = Object.fromEntries(students.overTime.map((r) => [r.month, r.count]));
    const months = [
      ...new Set([
        ...leads.overTime.map((r) => r.month),
        ...students.overTime.map((r) => r.month),
      ]),
    ].sort();
    return months.map((m) => ({
      month: m.slice(5),
      Leads: lm[m] ?? 0,
      Students: sm[m] ?? 0,
    }));
  }, [leads.overTime, students.overTime]);

  const assignedStatusData = Object.entries(leads.assignedBreakdown.byStatus).map(
    ([status, count]) => ({ status, count })
  );

  return (
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
              {initials(profile?.name ?? "?")}
            </div>
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold text-white">
                {profile?.name ?? "Counselor"}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-[12px] text-slate-400">
                  <Mail className="h-3 w-3" /> {profile?.email}
                </span>
                {profile?.role && (
                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
                    {profile.role.name}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile?.branches?.map((b) => (
                  <span
                    key={b.id}
                    className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300"
                  >
                    {b.name}
                    {b.city ? ` · ${b.city}` : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <TargetRing
              pct={summary.monthlyTargetAchievement}
              achieved={summary.newLeadsThisMonth}
              target={summary.monthlyTarget}
            />
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 self-start rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[12px] text-red-400 transition hover:bg-red-500/20"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Total Leads"
          value={fmtNum(summary.totalLeads)}
          icon={<Users className="h-4 w-4" />}
          hint={`+${summary.newLeadsThisMonth} this month`}
          tone="primary"
        />
        <KpiCard
          label="Converted"
          value={fmtNum(summary.convertedLeads)}
          icon={<BadgeCheck className="h-4 w-4" />}
          hint={`${summary.conversionRate}% rate`}
          tone="success"
        />
        <KpiCard
          label="Total Students"
          value={fmtNum(summary.totalStudents)}
          icon={<GraduationCap className="h-4 w-4" />}
          hint={`+${summary.newStudentsThisMonth} this month`}
          tone="rose"
        />
        <KpiCard
          label="Assigned Leads"
          value={fmtNum(summary.totalAssignedLeads)}
          icon={<Zap className="h-4 w-4" />}
          hint={`${summary.primaryAssignedLeads} primary · ${summary.sharedAssignedLeads} shared`}
          tone="warning"
        />
        <KpiCard
          label="Visa Approved"
          value={fmtNum(summary.visaApproved)}
          icon={<FileCheck2 className="h-4 w-4" />}
          hint={`${summary.visaApprovalRate}% approval rate`}
          tone="danger"
        />
        <KpiCard
          label="Follow-ups (7d)"
          value={fmtNum(summary.upcomingFollowups)}
          icon={<CalendarClock className="h-4 w-4" />}
          tone="blue"
        />
        <KpiCard
          label="Overdue"
          value={fmtNum(summary.overdueFollowups)}
          icon={<AlertCircle className="h-4 w-4" />}
          tone="danger"
        />
        <KpiCard
          label="Loan Approved"
          value={fmtCurrency(summary.totalLoanAmountApproved)}
          icon={<Landmark className="h-4 w-4" />}
          tone="rose"
        />
        <KpiCard
          label="Total Remarks"
          value={fmtNum(summary.totalRemarks)}
          icon={<MessageSquare className="h-4 w-4" />}
          tone="default"
        />
        <KpiCard
          label="MBBS Leads"
          value={fmtNum(summary.totalMbbsLeads)}
          icon={<Stethoscope className="h-4 w-4" />}
          tone="primary"
        />
      </div>

      {/* ── Assigned breakdown strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Assigned",
            value: summary.totalAssignedLeads,
            sub: "via LeadCounselor",
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10",
          },
          {
            label: "Primary Owner",
            value: summary.primaryAssignedLeads,
            sub: `${summary.assignedConversionRate}% conversion`,
            color: "text-rose-500",
            bg: "bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/10",
          },
          {
            label: "Shared / Collab",
            value: summary.sharedAssignedLeads,
            sub: `${summary.assignedConvertedLeads} converted`,
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/10",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 ${item.bg}`}
          >
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {item.label}
            </span>
            <span className={`text-[24px] font-bold tabular-nums ${item.color}`}>
              {item.value}
            </span>
            <span className="text-[11px] text-slate-400">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Visa & deadline urgency (FIXED to actual backend fields) ── */}
      <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-r from-[#1a0a0a] to-[#1a1b24] p-5 dark:border-red-500/10">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-red-500/20 blur-3xl" />
        </div>
        <div className="relative">
          <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
            <Plane className="h-3.5 w-3.5" /> Upcoming Deadlines
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: "Deposit deadlines (7d)",
                value: visa.upcoming.depositDeadlinesNext7Days,
                icon: <Wallet className="h-4 w-4" />,
                cls: "bg-red-500/10 text-red-400",
              },
              {
                label: "CAS deadlines (7d)",
                value: visa.upcoming.casDeadlinesNext7Days,
                icon: <CalendarDays className="h-4 w-4" />,
                cls: "bg-rose-500/10 text-rose-400",
              },
              {
                label: "University starts (30d)",
                value: visa.upcoming.universityStartsNext30Days,
                icon: <ShieldAlert className="h-4 w-4" />,
                cls: "bg-orange-500/10 text-orange-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition hover:border-red-500/20"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.cls}`}
                >
                  {item.icon}
                </span>
                <div>
                  <div className="text-xl font-bold tabular-nums text-white">
                    {item.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Growth chart ── */}
      <Panel className="p-5">
        <PanelHeader
          title="Leads & Students Over Time"
          subtitle="Monthly acquisition and conversion trend"
          tag="Monthly"
        />
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart
              data={trendData}
              margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
              barGap={6}
            >
              <CartesianGrid vertical={false} stroke="rgba(239,68,68,0.07)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
              <Bar dataKey="Leads" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={18} />
              <Line
                type="monotone"
                dataKey="Students"
                stroke="#fb7185"
                strokeWidth={3}
                dot={{ r: 3, fill: "#fb7185", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#fb7185" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState label="No timeline data available" />
        )}
      </Panel>

      {/* ── Lead breakdowns row ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="p-5">
          <PanelHeader title="Leads by Status" subtitle="Pipeline distribution" tag="Status" />
          {leads.byStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={leads.byStatus.map((r) => ({ name: r.status, value: r.count }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={74}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {leads.byStatus.map((r, i) => (
                      <Cell key={i} fill={statusColor(r.status)} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-2">
                {leads.byStatus.map((r) => (
                  <span
                    key={r.status}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      background: `${statusColor(r.status)}18`,
                      color: statusColor(r.status),
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: statusColor(r.status) }}
                    />
                    {titleCase(r.status)}: {r.count}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <EmptyState label="No status data" />
          )}
        </Panel>

        <Panel className="p-5">
          <PanelHeader title="Leads by Stage" subtitle="Funnel progression" tag="Stage" />
          <HBarList
            data={leads.byStage.map((r, i) => ({
              label: r.stage,
              count: r.count,
              color: PIE_COLORS[i % PIE_COLORS.length],
            }))}
          />
        </Panel>

        <Panel className="p-5">
          <PanelHeader title="Leads by Source" subtitle="Acquisition channels" tag="Source" />
          <HBarList
            data={leads.bySource.map((r, i) => ({
              label: r.source ?? "Unknown",
              count: r.count,
              color: DATA_COLORS[i % DATA_COLORS.length],
            }))}
          />
        </Panel>
      </div>

      {/* ── Additional lead breakdowns (qualification removed — not in backend) ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <PanelHeader title="By Country" subtitle="Top destination countries" tag="Country" />
          <HBarList
            data={leads.byCountry
              .filter((r) => r.country)
              .map((r, i) => ({
                label: r.country!,
                count: r.count,
                color: DATA_COLORS[i % DATA_COLORS.length],
              }))}
          />
        </Panel>
        <Panel className="p-5">
          <PanelHeader
            title="By Intake Season"
            subtitle="Preferred intake periods"
            tag="Intake"
          />
          <HBarList
            data={leads.byIntakeSeason
              .filter((r) => r.season)
              .map((r, i) => ({
                label: r.season!,
                count: r.count,
                color: DATA_COLORS[i % DATA_COLORS.length],
              }))}
          />
        </Panel>
      </div>

      <Panel className="p-5">
        <PanelHeader title="By Visa Stage" subtitle="Lead visa-stage distribution" tag="Visa Stage" />
        <HBarList
          data={leads.byVisaStage.map((r, i) => ({
            label: r.stage,
            count: r.count,
            color: PIE_COLORS[i % PIE_COLORS.length],
          }))}
        />
      </Panel>

      {/* ── Assigned status breakdown ── */}
      {assignedStatusData.length > 0 && (
        <Panel className="p-5">
          <PanelHeader
            title="Assigned Leads by Status"
            subtitle="Status breakdown for all leads assigned via LeadCounselor"
            tag="Assigned"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {assignedStatusData.map((item) => (
              <div
                key={item.status}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-red-500/10 dark:bg-white/[0.02]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: statusColor(item.status) }}
                />
                <span className="text-[18px] font-bold tabular-nums text-slate-900 dark:text-white">
                  {item.count}
                </span>
                <span className="text-[11px] text-slate-500">{titleCase(item.status)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── Students summary strip + table (REAL student data) ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <PanelHeader
            title="Students by Status"
            subtitle="Enrollment pipeline"
            tag="Students"
          />
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: students.total, color: "text-slate-700 dark:text-white" },
              {
                label: "New this month",
                value: students.newThisMonth,
                color: "text-emerald-600",
              },
              {
                label: "Conv. rate",
                value: `${students.conversionRate}%`,
                color: "text-red-500",
              },
            ].map((v) => (
              <div
                key={v.label}
                className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center dark:border-white/5 dark:bg-white/[0.03]"
              >
                <div className={`text-[16px] font-bold tabular-nums ${v.color}`}>{v.value}</div>
                <div className="text-[10px] text-slate-500">{v.label}</div>
              </div>
            ))}
          </div>
          <HBarList
            data={students.byStatus.map((r) => ({
              label: r.status,
              count: r.count,
              color: statusColor(r.status),
            }))}
          />
        </Panel>
        <Panel className="p-5">
          <PanelHeader title="Visa by Status" subtitle="Application status breakdown" tag="Visa" />
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: visa.total, color: "text-slate-700 dark:text-white" },
              { label: "Approved", value: visa.approved, color: "text-emerald-600" },
              { label: "Rejected", value: visa.rejected, color: "text-red-600" },
            ].map((v) => (
              <div
                key={v.label}
                className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center dark:border-white/5 dark:bg-white/[0.03]"
              >
                <div className={`text-[18px] font-bold tabular-nums ${v.color}`}>{v.value}</div>
                <div className="text-[10px] text-slate-500">{v.label}</div>
              </div>
            ))}
          </div>
          <HBarList
            data={visa.byStatus.map((r) => ({
              label: r.status,
              count: r.count,
              color: statusColor(r.status),
            }))}
          />
        </Panel>
      </div>

      {/* ── Full student records table ── */}
      <StudentsTable list={students.list} />

      {/* ── Courses + Universities ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <PanelHeader title="Course Applications" subtitle="By application status" tag="Courses" />
          <HBarList
            data={courses.byApplicationStatus.map((r) => ({
              label: r.status,
              count: r.count,
              color: statusColor(r.status),
            }))}
          />
        </Panel>
        <Panel className="p-5">
          <PanelHeader
            title="Top Universities"
            subtitle="Applications by institution"
            tag="Universities"
          />
          <HBarList
            data={courses.topUniversities.map((u, i) => ({
              label: u.universityName,
              count: u.applications,
              color: DATA_COLORS[i % DATA_COLORS.length],
            }))}
          />
        </Panel>
      </div>

      {/* ── Activity + Loans ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <PanelHeader
            title="Activity Breakdown"
            subtitle="Remarks by type & timeline count"
            tag="Activity"
          />
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: "Total Remarks", value: summary.totalRemarks, color: "text-red-500" },
              {
                label: "Timelines",
                value: summary.totalTimelinesCreated,
                color: "text-rose-500",
              },
              { label: "Documents", value: summary.totalDocs, color: "text-orange-500" },
            ].map((v) => (
              <div
                key={v.label}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-white/5 dark:bg-white/[0.02]"
              >
                <span className={`text-[20px] font-bold tabular-nums ${v.color}`}>{v.value}</span>
                <span className="mt-1 text-[10px] text-slate-500">{v.label}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {activity.remarksByType.map((r) => (
              <div key={r.type} className="flex items-center gap-3">
                <RemarkIcon type={r.type} />
                <span className="flex-1 text-[12px] text-slate-600 dark:text-slate-300">
                  {titleCase(r.type)}
                </span>
                <span className="text-[12px] font-semibold tabular-nums text-slate-900 dark:text-white">
                  {r.count}
                </span>
              </div>
            ))}
            {!activity.remarksByType.length && <EmptyState label="No activity data" />}
          </div>
        </Panel>

        <Panel className="p-5">
          <PanelHeader
            title="Loan Pipeline"
            subtitle="Education loan status breakdown"
            tag="Loans"
          />
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-500/10 dark:bg-red-500/5">
            <Landmark className="h-4 w-4 text-red-400" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Approved</p>
              <p className="text-[18px] font-bold text-red-500 tabular-nums">
                {fmtCurrency(loans.totalApproved)}
              </p>
            </div>
          </div>
          <HBarList
            data={loans.byStatus.map((r, i) => ({
              label: r.status,
              count: r.count,
              color: statusColor(r.status),
            }))}
          />
          <div className="mt-4 space-y-2">
            {loans.byStatus.map((r) => (
              <div key={r.status} className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500 dark:text-slate-400">{titleCase(r.status)}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {fmtCurrency(r.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── MBBS Leads ── */}
      {mbbsLeads.total > 0 && (
        <Panel className="p-5">
          <PanelHeader title="MBBS Leads" subtitle="Medical program lead status" tag="MBBS" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {mbbsLeads.byStatus.map((item) => (
              <div
                key={item.status}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-red-500/10 dark:bg-white/[0.02]"
              >
                <span className="text-[18px] font-bold tabular-nums text-slate-900 dark:text-white">
                  {item.count}
                </span>
                <span className="text-[11px] text-slate-500">{titleCase(item.status)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── Recent follow-up activity (FIXED: lead.studentName instead of firstName/lastName) ── */}
      <Panel className="p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
              Recent Follow-up Activity
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Last 5 timeline entries
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {summary.overdueFollowups > 0 && (
              <Badge variant="red">
                <AlertCircle className="h-3 w-3" />
                {summary.overdueFollowups} overdue
              </Badge>
            )}
            <Badge variant="green">
              <CalendarClock className="h-3 w-3" />
              {summary.upcomingFollowups} upcoming
            </Badge>
          </div>
        </div>
        <div className="space-y-3">
          {followups.recentActivity.length > 0 ? (
            followups.recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition hover:border-red-100 dark:border-red-500/10 dark:bg-white/[0.02] dark:hover:border-red-500/20"
              >
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[12px] text-slate-700 dark:text-slate-200">
                    {item.description}
                  </p>
                  {item.lead && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.lead.studentName} · {item.lead.phone}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</p>
                  {item.nextFollowup && (
                    <p className="mt-0.5 text-[10px] text-orange-400">
                      Follow: {new Date(item.nextFollowup).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState label="No recent activity" />
          )}
        </div>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// All Counselors View
// ─────────────────────────────────────────────────────────────────────────────

function AllCounselorsView({
  data,
  selectedId,
  onSelect,
}: {
  data: AllCounselorsData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [showStudents, setShowStudents] = useState(false);
  const { globalSummary, leaderboard, topThisMonth, counselors, students } = data;

  const selectedCounselor = selectedId
    ? counselors.find((c) => c.counselorId === selectedId)
    : null;

  const filteredLeaderboard = useMemo(
    () =>
      leaderboard.filter(
        (c) =>
          c.counselorName.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.branches.some((b) => b.name.toLowerCase().includes(search.toLowerCase()))
      ),
    [leaderboard, search]
  );

  return (
    <div className="space-y-7">
      {/* ── Global summary hero ── */}
      <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-[#1a1b24] to-[#0d0e14] p-6 dark:border-red-500/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-rose-500/5 blur-3xl" />
        </div>
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-red-300" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
              Team overview — {data.meta.totalCounselors} counselors
            </span>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                label: "Total Leads",
                value: fmtNum(globalSummary.totalLeads),
                color: "text-red-400",
              },
              {
                label: "Total Students",
                value: fmtNum(globalSummary.totalStudents),
                color: "text-rose-400",
              },
              {
                label: "Converted",
                value: fmtNum(globalSummary.convertedLeads),
                color: "text-red-500",
              },
              {
                label: "Conversion Rate",
                value: `${globalSummary.conversionRate}%`,
                color: "text-orange-400",
              },
              {
                label: "Upcoming Follow-ups",
                value: fmtNum(globalSummary.upcomingFollowups),
                color: "text-amber-400",
              },
              {
                label: "Overdue Follow-ups",
                value: fmtNum(globalSummary.overdueFollowups),
                color: "text-rose-500",
              },
            ].map((item) => (
              <div key={item.label}>
                <div
                  className={`text-[22px] font-bold tracking-tight tabular-nums ${item.color}`}
                >
                  {item.value}
                </div>
                <div className="mt-0.5 text-[12px] text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top this month ── */}
      <section>
        <div className="mb-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-px w-8 bg-red-400/40" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">
              This Month
            </span>
          </div>
          <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">
            Monthly Leaders
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            Top 5 counselors by new leads acquired this month
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {topThisMonth.map((c, i) => (
            <button
              key={c.counselorId}
              onClick={() => onSelect(selectedId === c.counselorId ? null : c.counselorId)}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-red-100 hover:shadow-lg hover:shadow-red-500/5 dark:border-red-500/10 dark:bg-[#1a1b24] dark:hover:border-red-500/20"
            >
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-red-500/5 blur-2xl transition group-hover:bg-red-500/10" />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                      i === 0
                        ? "border border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                        : "border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <span className="text-[12px] font-bold tabular-nums text-red-500">
                    +{c.newLeadsThisMonth}
                  </span>
                </div>
                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                  {c.counselorName}
                </p>
                {c.monthlyTarget ? (
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Target: {c.monthlyTarget}
                      </span>
                      <span className="text-[10px] font-medium text-red-400">
                        {Math.round(c.monthlyTargetAchievement)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(c.monthlyTargetAchievement, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">No target set</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Lead volume chart ── */}
      <Panel className="p-5">
        <PanelHeader
          title="Lead Volume by Counselor"
          subtitle="Leads vs converted across all counselors"
          tag="Analytics"
        />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={leaderboard.slice(0, 12).map((c) => ({
              name: c.counselorName.split(" ")[0],
              Leads: c.totalLeads,
              Converted: c.convertedLeads,
            }))}
            margin={{ left: -8, right: 8, top: 4, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid vertical={false} stroke="rgba(239,68,68,0.07)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
            <Bar dataKey="Leads" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="Converted" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* ── Leaderboard ── */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-px w-8 bg-red-400/40" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">
                Rankings
              </span>
            </div>
            <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">
              Counselor Leaderboard
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Ranked by conversion rate · click a row to drill in
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search counselor…"
              className="w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#1a1b24] dark:text-slate-200"
            />
          </div>
        </div>
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-red-500/10">
                  {[
                    { label: "Rank", right: false },
                    { label: "Counselor", right: false },
                    { label: "Branch", right: false },
                    { label: "Leads", right: true },
                    { label: "Converted", right: true },
                    { label: "Rate", right: true },
                    { label: "Students", right: true },
                    { label: "This Month", right: true },
                    { label: "Target %", right: true },
                    { label: "Visa ✓", right: true },
                    { label: "Follow-ups", right: true },
                    { label: "Overdue", right: true },
                    { label: "", right: false },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className={`whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 ${
                        h.right ? "text-right" : "text-left"
                      }`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((c) => (
                  <tr
                    key={c.counselorId}
                    onClick={() =>
                      onSelect(selectedId === c.counselorId ? null : c.counselorId)
                    }
                    className={`cursor-pointer border-b border-slate-50 transition-all hover:bg-red-50/50 dark:border-red-500/5 dark:hover:bg-red-500/5 ${
                      selectedId === c.counselorId
                        ? "bg-red-50 ring-1 ring-inset ring-red-500/20 dark:bg-red-500/5"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                          c.rank <= 3
                            ? "border border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            : "border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {c.rank === 1
                          ? "🥇"
                          : c.rank === 2
                          ? "🥈"
                          : c.rank === 3
                          ? "🥉"
                          : `#${c.rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[11px] font-bold text-red-500">
                          {initials(c.counselorName)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {c.counselorName}
                          </p>
                          <p className="text-[11px] text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400">
                      {c.branches.map((b) => b.name).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-red-500">
                      {c.totalLeads}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-500">
                      {c.convertedLeads}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        c.conversionRate >= 50
                          ? "text-emerald-600"
                          : c.conversionRate >= 25
                          ? "text-amber-500"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {c.conversionRate}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-400">
                      {c.totalStudents}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      +{c.newLeadsThisMonth}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.monthlyTarget ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                            <div
                              className="h-full rounded-full bg-red-500"
                              style={{
                                width: `${Math.min(c.monthlyTargetAchievement, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-red-400">
                            {Math.round(c.monthlyTargetAchievement)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600">
                      {c.visaApproved}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-500">
                      {c.upcomingFollowups}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        c.overdueFollowups > 0 ? "text-red-500" : "text-slate-400"
                      }`}
                    >
                      {c.overdueFollowups}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    </td>
                  </tr>
                ))}
                {filteredLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={13} className="py-10 text-center text-[13px] text-slate-400">
                      No counselors match "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      {/* ── Global converted students list (collapsible) ── */}
      <section>
        <button
          onClick={() => setShowStudents((v) => !v)}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm transition hover:border-red-100 dark:border-red-500/10 dark:bg-[#1a1b24] dark:hover:border-red-500/20"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
              <GraduationCap className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">
                All Converted Students
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                {students?.length} students across all counselors — click to{" "}
                {showStudents ? "collapse" : "expand"}
              </p>
            </div>
          </div>
          <ChevronRight
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              showStudents ? "rotate-90" : ""
            }`}
          />
        </button>
        {showStudents && <GlobalStudentsTable list={students} />}
      </section>

      {/* ── Drilldown ── */}
      {selectedCounselor && (
        <section>
          <div className="mb-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-px w-8 bg-red-400/40" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">
                Counselor Detail
              </span>
            </div>
            <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">
              {selectedCounselor.counselorName}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              Deep analytics · {selectedCounselor.email}
            </p>
          </div>
          <CounselorDetail
            data={selectedCounselor.analytics}
            onBack={() => onSelect(null)}
          />
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Global students table (counselor-tagged, used in AllCounselorsView)
// ─────────────────────────────────────────────────────────────────────────────

function GlobalStudentsTable({ list }: { list: StudentRecord[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(needle) ||
        s.email?.toLowerCase().includes(needle) ||
        s.counselorName?.toLowerCase().includes(needle) ||
        s.country?.toLowerCase().includes(needle)
    );
  }, [list, q]);

  return (
    <Panel className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-slate-500 dark:text-slate-400">
          {filtered.length} of {list.length} students
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student or counselor…"
            className="w-64 rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-[12px] text-slate-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#1a1b24] dark:text-slate-200"
          />
        </div>
      </div>
      <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead className="sticky top-0 bg-white dark:bg-[#1a1b24]">
            <tr className="border-b border-slate-100 dark:border-red-500/10">
              {["Student", "Counselor", "Country", "Status", "Visa Stage", "Created"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2.5 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="border-b border-slate-50 transition hover:bg-red-50/40 dark:border-red-500/5 dark:hover:bg-red-500/5"
              >
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {s.name || "Unnamed"}
                  </p>
                  <p className="text-[10.5px] text-slate-400">{s.email || s.phone || "—"}</p>
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                  {s.counselorName || "—"}
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                  {s.country || "—"}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                    style={{
                      background: `${statusColor(s.status)}18`,
                      color: statusColor(s.status),
                    }}
                  >
                    {titleCase(s.status || "Unknown")}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                  {s.visaStage ? titleCase(s.visaStage) : "—"}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-400">
                  {new Date(s.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  {q ? `No students match "${q}"` : "No converted students yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

export default function CounselorReports() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from: startOfYear,
    to: todayStr,
    branchId: "",
  });
  const [pendingFilters, setPendingFilters] = useState({
    from: startOfYear,
    to: todayStr,
    branchId: "",
  });

  const [allData, setAllData] = useState<AllCounselorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCounselor, setSelectedCounselor] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (f = filters) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ from: f.from, to: f.to });
        if (f.branchId) params.set("branchId", f.branchId);
        const res = await fetch(`/api/report/dashboard/counselor?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Unknown error");
        
        setAllData(json.data);
        setFilters(f);
      } catch (e: any) {
        setError(e.message ?? "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    setSelectedCounselor(null);
    fetchAll(pendingFilters);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-5 font-sans text-slate-900 sm:p-7 dark:bg-[#0f1117] dark:text-slate-100">
      {/* ── Page header ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
            Counselor Reports
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            {allData
              ? `${allData.meta.totalCounselors} counselors · generated ${new Date(
                  allData.meta.generatedAt
                ).toLocaleTimeString()}`
              : "Counselor-level CRM analytics"}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-red-500/10 dark:bg-[#1a1b24]">
          <input
            type="date"
            value={pendingFilters.from}
            onChange={(e) =>
              setPendingFilters((p) => ({ ...p, from: e.target.value }))
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#232530] dark:text-slate-200"
          />
          <span className="text-[12px] text-slate-400">to</span>
          <input
            type="date"
            value={pendingFilters.to}
            onChange={(e) =>
              setPendingFilters((p) => ({ ...p, to: e.target.value }))
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#232530] dark:text-slate-200"
          />
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-red-500/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Apply"}
          </button>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600 dark:border-red-500/15 dark:bg-red-500/5 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => fetchAll()}
            className="text-[12px] font-medium underline underline-offset-2 transition hover:text-red-700 dark:hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading && !allData ? (
        <Skeleton />
      ) : allData ? (
        <AllCounselorsView
          data={allData}
          selectedId={selectedCounselor}
          onSelect={setSelectedCounselor}
        />
      ) : null}

      {/* ── Footer ── */}
      <div className="mt-10 pb-3 text-center text-[12px] text-slate-400">
        Showing data from {new Date(filters.from).toLocaleDateString()} to{" "}
        {new Date(filters.to).toLocaleDateString()}
      </div>
    </div>
  );
}