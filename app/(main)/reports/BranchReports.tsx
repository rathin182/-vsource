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
  Building2,
  GraduationCap,
  CreditCard,
  CalendarClock,
  TrendingUp,
  BadgeCheck,
  AlertCircle,
  RefreshCw,
  Fingerprint,
  CalendarDays,
  ShieldAlert,
  Plane,
  GitCompare,
  Trophy,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  Landmark,
  Stethoscope,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types — matched exactly to backend response shapes
// ─────────────────────────────────────────────────────────────────────────────

interface BranchProfile {
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  address: string | null;
  status: boolean;
  createdAt: string;
  _count: { leads: number; students: number };
}

interface BranchAnalyticsSummary {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalCounselors: number;
  convertedLeads: number;
  conversionRate: number;
  upcomingFollowups: number;
  totalDocs: number;
  totalLoanAmountApproved: number;
  totalVisaApplications: number;
  visaApproved: number;
  visaRejected: number;
  visaApprovalRate: number;
}

interface CounselorEntry {
  counselorId: string;
  counselor: { id: string; name: string; email: string; monthlyTarget: number } | null;
  assignedLeads: number;
  convertedLeads?: number;
  conversionRate?: number;
  leadStatusBreakdown?: Record<string, number>;
}

interface TopPerformingCounselor {
  rank: number;
  counselorId: string;
  name: string;
  email: string;
  monthlyTarget: number;
  visaCount: number;
  tier: "target_met" | "target_not_met";
  targetCompletionRatio: number | null;
  performanceScore?: number;
}

interface BranchAnalytics {
  profile: BranchProfile[];
  summary: BranchAnalyticsSummary;
  leads: {
    byStatus: { status: string; count: number }[];
    byStage: { stage: string; count: number }[];
    bySource: { source: string; count: number }[];
    byCountry: { country: string | null; count: number }[];
    byIntakeSeason: { season: string | null; count: number }[];
    byVisaStage: { stage: string; count: number }[];
    overTime: { month: string; count: number }[];
  };
  visa: {
    total: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    byStatus: { status: string; count: number }[];
    byType: { visaType: string | null; count: number }[];
    upcoming: {
      biometricsNext7Days: number;
      interviewsNext7Days: number;
      expiringNext30Days: number;
    };
  };
  loans: {
    byStatus: { status: string; count: number; totalAmount: number }[];
  };
  courses: {
    byApplicationStatus: { status: string; count: number }[];
    topUniversities: { universityName: string; applications: number }[];
  };
  counselors: {
    total: number;
    topByLeadAssignments: CounselorEntry[];
    topPerformingCounselors: TopPerformingCounselor[];
  };
}

interface BranchAnalyticsEntry {
  branchId: string;
  branchName: string;
  branchCode: string | null;
  city: string | null;
  state: string | null;
  status: boolean;
  analytics: BranchAnalytics;
}

interface AllBranchesData {
  meta: {
    generatedAt: string;
    mode: string;
    totalBranches: number;
    filters: { from: string; to: string };
  };
  globalSummary: {
    totalLeads: number;
    totalCounselors: number;
    convertedLeads: number;
    conversionRate: number;
  };
  rankedByLeads: {
    rank: number;
    branchId: string;
    branchName: string;
    totalLeads: number;
    totalCounselors: number;
    conversionRate: number;
    visaApproved: number;
    visaApprovalRate: number;
    newLeadsThisMonth: number;
  }[];
  branches: BranchAnalyticsEntry[];
}

// Compare endpoint types
interface CompareData {
  meta: {
    generatedAt: string;
    filters: Record<string, unknown>;
    branches: { id: string; name: string }[];
  };
  branches: {
    branchId: string;
    branchName: string;
    analytics: BranchAnalytics;
  }[];
  comparison: {
    branchLabels: string[];
    branchIds: string[];
    kpis: Record<string, { labels: string[]; values: number[] }>;
    leads: {
      byStatus: { keys: string[]; series: number[][] };
      byStage: { keys: string[]; series: number[][] };
      bySource: { keys: string[]; series: number[][] };
      overTime: { months: string[]; series: number[][] };
    };
    students: {
      byStatus: { keys: string[]; series: number[][] };
      overTime: { months: string[]; series: number[][] };
    };
    visa: {
      byStatus: { keys: string[]; series: number[][] };
      byType: { keys: string[]; series: number[][] };
      upcoming: Record<string, number[]>;
    };
    loans: {
      byStatus: { keys: string[]; countSeries: number[][]; amountSeries: number[][] };
    };
    courses: {
      byApplicationStatus: { keys: string[]; series: number[][] };
    };
    mbbsLeads: {
      byStatus: { keys: string[]; series: number[][] };
    };
  };
  winners: Record<string, { branchId: string; branchName: string; value: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const RED_PALETTE = ["#ef4444", "#fb7185", "#f87171", "#dc2626", "#ea580c", "#b91c1c"];

const COMPARE_COLORS = [
  { bar: "bg-red-500", text: "text-red-500", bg: "bg-red-500/10", hex: "#FF746C", dot: "bg-red-500", border: "border-red-500/30" },
  { bar: "bg-sky-500", text: "text-sky-500", bg: "bg-sky-500/10", hex: "#38bdf8", dot: "bg-sky-500", border: "border-sky-500/30" },
  { bar: "bg-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10", hex: "#34d399", dot: "bg-emerald-500", border: "border-emerald-500/30" },
];

const titleCase = (s: string) =>
  (s ?? "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

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

// ─────────────────────────────────────────────────────────────────────────────
// Primitive UI components
// ─────────────────────────────────────────────────────────────────────────────

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-red-500/10 bg-white p-5 dark:bg-[#1a1b24] ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <div className="mb-2 flex items-center gap-2">
          <span className="h-px w-8 bg-red-500/40" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">{eyebrow}</span>
        </div>
      )}
      <h2 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}

function Badge({ label, color }: { label: string; color?: string }) {
  const c = color ?? "#4f6ef7";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: `${c}18`, color: c }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {label}
    </span>
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

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color?: string; fill?: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0c14] px-3.5 py-2.5 text-[12px] shadow-2xl">
      {label && <p className="mb-1.5 font-medium text-slate-400">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 tabular-nums" style={{ color: p.color ?? p.fill }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color ?? p.fill }} />
          {p.name}:{" "}
          <span className="font-semibold text-slate-200">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

function HBarList({ data }: { data: { label: string; count: number; color?: string }[] }) {
  if (!data.length) return <EmptyState label="No data yet" />;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((item, i) => {
        const color = item.color ?? RED_PALETTE[i % RED_PALETTE.length];
        const pct = Math.round((item.count / maxVal) * 100);
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-[12px] text-slate-500 dark:text-slate-400">
              {titleCase(item.label)}
            </span>
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/5 dark:bg-white/5 bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}40` }}
              />
            </div>
            <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-slate-900 dark:text-slate-200">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type KpiTone = "primary" | "danger" | "rose" | "warning" | "success" | "default";

function Kpi({
  label, value, icon, hint, delta, tone = "primary",
}: {
  label: string; value: string; icon: React.ReactNode; hint?: string; delta?: number; tone?: KpiTone;
}) {
  const tones: Record<KpiTone, { icon: string; value: string }> = {
    primary: { icon: "bg-red-500/10 text-red-500", value: "text-red-500" },
    danger:  { icon: "bg-red-600/10 text-red-600", value: "text-red-600" },
    rose:    { icon: "bg-rose-500/10 text-rose-500", value: "text-rose-500" },
    warning: { icon: "bg-orange-500/10 text-orange-500", value: "text-orange-500" },
    success: { icon: "bg-emerald-500/10 text-emerald-500", value: "text-emerald-500" },
    default: { icon: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300", value: "text-slate-900 dark:text-white" },
  };
  const t = tones[tone];
  return (
    <div className="group flex flex-col gap-2.5 rounded-2xl border border-red-500/10 bg-white px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/5 dark:bg-[#1a1b24]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.icon}`}>{icon}</span>
      </div>
      <span className={`text-2xl font-bold tracking-tight tabular-nums ${t.value}`}>{value}</span>
      {(hint !== undefined || delta !== undefined) && (
        <div className="flex items-center gap-2">
          {delta !== undefined && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${delta > 0 ? "text-emerald-500" : delta < 0 ? "text-red-500" : "text-slate-400"}`}>
              {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : delta < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="text-[11.5px] text-slate-400 dark:text-slate-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}

function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-white/4 ${className}`} />;
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <Skel className="h-32" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skel key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-56" />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare bar chart helper
// ─────────────────────────────────────────────────────────────────────────────

function CompareBar({ keys, series, labels }: { keys: string[]; series: number[][]; labels: string[] }) {
  if (!keys.length) return <EmptyState label="No data available" />;
  const chartData = keys.map((key, ki) => {
    const row: Record<string, string | number> = { key: titleCase(key) };
    series.forEach((s, si) => { row[labels[si]] = s[ki] ?? 0; });
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={chartData} margin={{ top: 8, right: 10, left: -16, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="currentColor" className="text-red-500/10" />
        <XAxis dataKey="key" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" iconSize={8} />
        {labels.map((lbl, i) => (
          <Bar key={lbl} dataKey={lbl} radius={[6, 6, 0, 0]} barSize={16} fill={COMPARE_COLORS[i % COMPARE_COLORS.length].hex} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function WinnerBadge({ winner, label }: { winner: { branchName: string; value: number }; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[12px] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <span className="text-[12px] font-semibold text-indigo-400">
        {winner.branchName} · {fmtNum(winner.value)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Branch drilldown panel (shared between "All Branches" and a possible single view)
// ─────────────────────────────────────────────────────────────────────────────

function BranchDrilldown({
  entry,
  onClose,
}: {
  entry: BranchAnalyticsEntry;
  onClose: () => void;
}) {
  const { analytics: a, branchName, city, state } = entry;

  // Build trend from leads.overTime only (backend does NOT return students.overTime)
  const trend = useMemo(() => {
    return a.leads.overTime.map((r) => ({ month: r.month.slice(5), leads: r.count }));
  }, [a.leads.overTime]);

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <SectionHeader
          eyebrow="Branch detail"
          title={branchName}
          subtitle={[city, state].filter(Boolean).join(", ") || "Branch analytics"}
        />
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] text-red-500 transition-colors hover:bg-red-500/10"
        >
          <X className="h-3.5 w-3.5" /> Close
        </button>
      </div>

      {/* KPIs — only fields actually returned by backend summary */}
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Kpi label="Total Leads" value={fmtNum(a.summary.totalLeads)} icon={<Users className="h-4 w-4" />} hint={`+${a.summary.newLeadsThisMonth} this month`} tone="primary" />
        <Kpi label="Counselors" value={fmtNum(a.summary.totalCounselors)} icon={<GraduationCap className="h-4 w-4" />} tone="default" />
        <Kpi label="Converted" value={fmtNum(a.summary.convertedLeads)} icon={<BadgeCheck className="h-4 w-4" />} tone="success" />
        <Kpi label="Conversion Rate" value={`${a.summary.conversionRate}%`} icon={<TrendingUp className="h-4 w-4" />} tone="success" />
        <Kpi label="Visa Approved" value={fmtNum(a.summary.visaApproved)} icon={<FileCheck2 className="h-4 w-4" />} hint={`${a.summary.visaApprovalRate}% rate`} tone="danger" />
        <Kpi label="Visa Applications" value={fmtNum(a.summary.totalVisaApplications)} icon={<Plane className="h-4 w-4" />} tone="primary" />
        <Kpi label="Visa Rejected" value={fmtNum(a.summary.visaRejected)} icon={<AlertCircle className="h-4 w-4" />} tone="danger" />
        <Kpi label="Follow-ups (7d)" value={fmtNum(a.summary.upcomingFollowups)} icon={<CalendarClock className="h-4 w-4" />} tone="warning" />
        <Kpi label="Loan Approved" value={fmtCurrency(a.summary.totalLoanAmountApproved)} icon={<CreditCard className="h-4 w-4" />} tone="rose" />
        <Kpi label="Documents" value={fmtNum(a.summary.totalDocs)} icon={<FileCheck2 className="h-4 w-4" />} tone="default" />
      </div>

      {/* Visa pipeline urgency */}
      <div className="relative mb-7 overflow-hidden rounded-2xl border border-red-500/10 bg-[#15161d] p-5">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-red-500/20 blur-3xl" />
        </div>
        <p className="relative mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
          <Plane className="h-3.5 w-3.5" /> Visa Pipeline — Upcoming
        </p>
        <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Biometrics in 7 days", value: a.visa.upcoming.biometricsNext7Days, icon: <Fingerprint className="h-4 w-4" />, cls: "bg-red-500/10 text-red-400" },
            { label: "Interviews in 7 days", value: a.visa.upcoming.interviewsNext7Days, icon: <CalendarDays className="h-4 w-4" />, cls: "bg-rose-500/10 text-rose-400" },
            { label: "Expiring in 30 days", value: a.visa.upcoming.expiringNext30Days, icon: <ShieldAlert className="h-4 w-4" />, cls: "bg-orange-500/10 text-orange-400" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-red-500/10 bg-white/[0.03] px-4 py-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.cls}`}>{item.icon}</span>
              <div>
                <div className="text-xl font-bold tabular-nums text-white">{item.value}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads over time chart */}
      <Panel className="mb-5 border border-red-500/10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads Over Time</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Monthly lead acquisition</p>
          </div>
          <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-1 text-[11px] font-medium text-red-400">Monthly Trend</div>
        </div>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="currentColor" className="text-red-500/10" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
              <Bar dataKey="leads" name="Leads" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState label="No timeline data available" />
        )}
      </Panel>

      {/* Lead breakdowns */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* By Status — pie */}
        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Status</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Current pipeline distribution</p>
            </div>
            <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Status</div>
          </div>
          {a.leads.byStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={a.leads.byStatus.map((r) => ({ name: titleCase(r.status), value: r.count }))}
                    cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}
                    dataKey="value" stroke="#1f2937" strokeWidth={2}
                  >
                    {a.leads.byStatus.map((_, i) => <Cell key={i} fill={RED_PALETTE[i % RED_PALETTE.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.leads.byStatus.map((r, i) => (
                  <Badge key={r.status} label={`${titleCase(r.status)}: ${r.count}`} color={RED_PALETTE[i % RED_PALETTE.length]} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState label="No status data" />
          )}
        </Panel>

        {/* By Stage */}
        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Stage</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Funnel progression</p>
            </div>
            <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Stage</div>
          </div>
          <HBarList data={a.leads.byStage.map((r, i) => ({ label: r.stage, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
        </Panel>

        {/* By Source */}
        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Source</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Acquisition channels</p>
            </div>
            <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Source</div>
          </div>
          <HBarList data={a.leads.bySource.map((r, i) => ({ label: r.source ?? "Unknown", count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
        </Panel>
      </div>

      {/* Visa status + Loans */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Visa by Status</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Application pipeline</p>
            </div>
            <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Visa</div>
          </div>
          <HBarList data={a.visa.byStatus.map((r, i) => ({ label: r.status, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
        </Panel>

        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Loans by Status</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Education loan pipeline</p>
            </div>
            <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Loans</div>
          </div>
          {a.loans.byStatus.length > 0 ? (
            <div className="space-y-2">
              {a.loans.byStatus.map((r, i) => {
                const color = RED_PALETTE[i % RED_PALETTE.length];
                return (
                  <div key={r.status} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: `${color}10` }}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{titleCase(r.status)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] font-semibold tabular-nums text-slate-900 dark:text-white">{r.count}</span>
                      {r.totalAmount > 0 && (
                        <span className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">{fmtCurrency(r.totalAmount)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState label="No loan data" />
          )}
        </Panel>
      </div>

      {/* Courses + Countries */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Course Applications</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">By application status</p>
            </div>
            <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Courses</div>
          </div>
          <HBarList data={a.courses.byApplicationStatus.map((r, i) => ({ label: r.status, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
        </Panel>

        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Country</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Destination country breakdown</p>
            </div>
            <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Country</div>
          </div>
          <HBarList data={a.leads.byCountry.map((r, i) => ({ label: r.country ?? "Unknown", count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
        </Panel>
      </div>

      {/* Counselors + Universities */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top Counselors by Lead Assignments */}
        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Top Counselors by Leads</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Ranked by assigned leads</p>
            </div>
            <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Performance</span>
          </div>
          {a.counselors.topByLeadAssignments.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={a.counselors.topByLeadAssignments.map((c) => ({
                  name: c.counselor?.name ?? "Unknown",
                  leads: c.assignedLeads,
                  converted: c.convertedLeads ?? 0,
                }))}
                layout="vertical"
                margin={{ left: 8, right: 20, top: 4, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="currentColor" className="text-red-500/10" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="leads" name="Assigned" radius={[0, 6, 6, 0]} barSize={14} fill="#ef4444" />
                <Bar dataKey="converted" name="Converted" radius={[0, 6, 6, 0]} barSize={14} fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No counselor data available" />
          )}
        </Panel>

        {/* Top Universities */}
        <Panel className="border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Top Universities</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Applications by university</p>
            </div>
            <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Universities</span>
          </div>
          <HBarList data={a.courses.topUniversities.map((u, i) => ({ label: u.universityName, count: u.applications, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
        </Panel>
      </div>

      {/* Top Performing Counselors (visa target-based ranking) */}
      {a.counselors.topPerformingCounselors.length > 0 && (
        <Panel className="mb-5 border border-red-500/10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Top Performing Counselors</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Ranked by visa applications vs monthly target</p>
            </div>
            <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Visa Performance</span>
          </div>
          <div className="space-y-3">
            {a.counselors.topPerformingCounselors.map((c) => {
              const pct = c.monthlyTarget > 0 ? Math.min(Math.round((c.visaCount / c.monthlyTarget) * 100), 100) : 0;
              return (
                <div key={c.counselorId} className="flex items-center gap-3 rounded-xl border border-red-500/10 bg-white/5 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[12px] font-bold text-red-500">
                    {c.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[13px] font-medium text-slate-900 dark:text-white">{c.name}</span>
                      <span className="ml-2 shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                        {c.visaCount}/{c.monthlyTarget > 0 ? c.monthlyTarget : "—"} visas
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: c.tier === "target_met" ? "#22c55e" : "#ef4444" }}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-[10px] font-medium ${c.tier === "target_met" ? "text-emerald-500" : "text-red-400"}`}>
                        {c.tier === "target_met" ? "✓ Target met" : `${pct}% of target`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Leads by intake season & visa stage */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="border border-red-500/10">
          <div className="mb-4">
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Intake Season</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Seasonal distribution</p>
          </div>
          <HBarList data={a.leads.byIntakeSeason.filter((r) => r.season).map((r, i) => ({ label: r.season!, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
        </Panel>
        <Panel className="border border-red-500/10">
          <div className="mb-4">
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Visa Stage</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Visa processing stage</p>
          </div>
          <HBarList data={a.leads.byVisaStage.map((r, i) => ({ label: r.stage, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
        </Panel>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: All Branches
// ─────────────────────────────────────────────────────────────────────────────

function AllBranchesView({
  data,
  selectedBranch,
  onSelectBranch,
}: {
  data: AllBranchesData;
  selectedBranch: string | null;
  onSelectBranch: (id: string | null) => void;
}) {
  const { globalSummary, rankedByLeads, branches } = data;

  const branchEntry = selectedBranch
    ? branches.find((b) => b.branchId === selectedBranch) ?? null
    : null;

  return (
    <div className="space-y-7">
      {/* Global summary hero */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/10 bg-[#15161d] p-6">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
        </div>
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-red-300" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
              Network overview — {data.meta.totalBranches} branches
            </span>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              { label: "Total Leads", value: fmtNum(globalSummary.totalLeads), color: "text-red-400" },
              { label: "Total Counselors", value: fmtNum(globalSummary.totalCounselors), color: "text-rose-400" },
              { label: "Converted", value: fmtNum(globalSummary.convertedLeads), color: "text-red-500" },
              { label: "Conversion Rate", value: `${globalSummary.conversionRate}%`, color: "text-orange-400" },
            ].map((item) => (
              <div key={item.label}>
                <div className={`text-[26px] font-bold tracking-tight tabular-nums ${item.color}`}>{item.value}</div>
                <div className="mt-0.5 text-[12px] text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <section>
        <SectionHeader eyebrow="Rankings" title="Branch leaderboard" subtitle="Ranked by total leads" />
        <Panel className="overflow-x-auto p-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-red-500/10">
                {["Rank", "Branch", "Leads", "Counselors", "Conversion", "Visa Approved", "Visa Rate", "New This Month"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-[12px] font-medium text-slate-500 dark:text-slate-400 ${["Leads", "Counselors", "Conversion", "Visa Approved", "Visa Rate", "New This Month"].includes(h) ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedByLeads.map((b) => (
                <tr
                  key={b.branchId}
                  onClick={() => onSelectBranch(selectedBranch === b.branchId ? null : b.branchId)}
                  className={`cursor-pointer border-b border-red-500/5 transition-all hover:bg-red-500/5 ${selectedBranch === b.branchId ? "ring-1 ring-inset ring-red-500/20" : ""}`}
                >
                  <td className="px-4 py-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${b.rank <= 3 ? "border border-red-300 bg-red-500/10 text-red-500" : "border border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"}`}>
                      {b.rank === 1 ? "🥇" : b.rank === 2 ? "🥈" : b.rank === 3 ? "🥉" : `#${b.rank}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{b.branchName}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-red-500">{b.totalLeads.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{b.totalCounselors}</td>
                  <td className={`px-4 py-3 text-right font-medium tabular-nums ${b.conversionRate >= 50 ? "text-emerald-500" : "text-slate-500 dark:text-slate-400"}`}>
                    {b.conversionRate}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-400">{b.visaApproved.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{b.visaApprovalRate}%</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900 dark:text-slate-200">
                    {b.newLeadsThisMonth > 0 ? `+${b.newLeadsThisMonth}` : b.newLeadsThisMonth}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        {!selectedBranch && (
          <p className="mt-3 text-center text-[12px] text-slate-500 dark:text-slate-400">
            Click a row to drill into that branch's full analytics
          </p>
        )}
      </section>

      {/* Branch drilldown */}
      {branchEntry && (
        <BranchDrilldown entry={branchEntry} onClose={() => onSelectBranch(null)} />
      )}

      {/* Overview bar chart (when no branch selected) */}
      {!selectedBranch && (
        <section>
          <SectionHeader eyebrow="Analytics" title="Lead volume by branch" />
          <Panel>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={rankedByLeads.map((b) => ({ name: b.branchName.slice(0, 14), leads: b.totalLeads, counselors: b.totalCounselors }))}
                margin={{ left: -8, right: 8, top: 4, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
                <Bar dataKey="leads" name="Leads" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="counselors" name="Counselors" fill="#2dd4bf" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Compare Branches
// ─────────────────────────────────────────────────────────────────────────────

function CompareBranchesView({
  data,
  branches,
  selectedIds,
  onChangeIds,
  onCompare,
  loading,
}: {
  data: CompareData | null;
  branches: { id: string; name: string }[];
  selectedIds: string[];
  onChangeIds: (ids: string[]) => void;
  onCompare: () => void;
  loading: boolean;
}) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChangeIds(selectedIds.filter((x) => x !== id));
    else if (selectedIds.length < 3) onChangeIds([...selectedIds, id]);
  };

  const c = data?.comparison;
  const labels = c?.branchLabels ?? [];

  return (
    <div className="space-y-7">
      {/* Branch selector */}
      <Panel>
        <p className="mb-3 text-[13px] font-medium text-slate-900 dark:text-slate-200">Select 2–3 branches to compare</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {branches.map((b) => {
            const selected = selectedIds.includes(b.id);
            const idx = selectedIds.indexOf(b.id);
            const cc = idx >= 0 ? COMPARE_COLORS[idx] : null;
            return (
              <button
                key={b.id}
                onClick={() => toggle(b.id)}
                disabled={!selected && selectedIds.length >= 3}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all duration-200 ${
                  selected
                    ? `${cc?.bg} ${cc?.border} ${cc?.text}`
                    : "border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-white/10 dark:bg-[#1a1b24] dark:text-slate-400 dark:hover:border-red-500/20 dark:hover:bg-red-500/5 dark:hover:text-red-400"
                } ${!selected && selectedIds.length >= 3 ? "cursor-not-allowed opacity-40" : ""}`}
              >
                {selected && <span className={`h-2.5 w-2.5 rounded-full ${cc?.dot}`} />}
                {b.name}
              </button>
            );
          })}
        </div>
        {selectedIds.length >= 2 && (
          <button
            onClick={onCompare}
            disabled={loading}
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-r from-red-500 via-red-500 to-rose-500 px-5 py-2.5 text-[13px] font-medium text-white shadow-md shadow-red-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <GitCompare className={`relative h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="relative">{loading ? "Comparing…" : "Compare Branches"}</span>
          </button>
        )}
      </Panel>

      {loading && <Skeleton />}

      {data && c && (
        <div className="space-y-7">
          {/* Winners */}
          <section>
            <SectionHeader eyebrow="Insights" title="KPI Winners" subtitle="Top-performing branch per metric" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {([
                { key: "totalLeads", label: "Most Total Leads", Icon: Users },
                { key: "convertedLeads", label: "Most Conversions", Icon: BadgeCheck },
                { key: "conversionRate", label: "Best Conversion Rate", Icon: TrendingUp },
                { key: "visaApprovalRate", label: "Best Visa Approval Rate", Icon: BadgeCheck },
                { key: "visaApproved", label: "Most Visas Approved", Icon: Plane },
                { key: "newLeadsThisMonth", label: "Monthly Growth", Icon: CalendarDays },
                { key: "totalLoanAmountApproved", label: "Highest Loan Amount", Icon: Landmark },
                { key: "upcomingFollowups", label: "Most Follow-ups", Icon: CalendarClock },
              ] as const).filter(({ key }) => data.winners[key]).map(({ key, label, Icon }) => (
                <div key={key} className="group relative overflow-hidden rounded-2xl border border-red-500/10 bg-white p-5 transition-all hover:-translate-y-1 hover:border-red-500/20 hover:shadow-xl hover:shadow-red-500/5 dark:bg-[#1a1b24]">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 blur-3xl transition-all group-hover:bg-red-500/20" />
                  <div className="relative">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">Winner</div>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                    <div className="mt-3">
                      <WinnerBadge winner={data.winners[key]} label={label} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* KPI side-by-side */}
          <section>
            <SectionHeader eyebrow="KPIs" title="Side-by-side Comparison" subtitle="Key business metrics across selected branches" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {([
                { key: "totalLeads", label: "Total Leads", Icon: Users, fmt: fmtNum },
                { key: "convertedLeads", label: "Converted", Icon: BadgeCheck, fmt: fmtNum },
                { key: "conversionRate", label: "Conversion %", Icon: TrendingUp, fmt: (v: number) => `${v}%` },
                { key: "visaApproved", label: "Visa Approved", Icon: FileCheck2, fmt: fmtNum },
                { key: "visaApprovalRate", label: "Visa Rate %", Icon: Plane, fmt: (v: number) => `${v}%` },
                { key: "upcomingFollowups", label: "Follow-ups (7d)", Icon: CalendarClock, fmt: fmtNum },
                { key: "totalLoanAmountApproved", label: "Loan Approved", Icon: CreditCard, fmt: fmtCurrency },
                { key: "newLeadsThisMonth", label: "New This Month", Icon: Star, fmt: fmtNum },
              ] as const).map(({ key, label, Icon, fmt }) => {
                const kd = c.kpis[key];
                if (!kd) return null;
                const maxVal = Math.max(...kd.values, 1);
                return (
                  <div key={key} className="group relative overflow-hidden rounded-2xl border border-red-500/10 bg-white p-5 transition-all hover:-translate-y-1 hover:border-red-500/20 hover:shadow-xl hover:shadow-red-500/5 dark:bg-[#1a1b24]">
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-500/5 blur-3xl transition-all group-hover:bg-red-500/10" />
                    <div className="relative">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">{label}</h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Branch comparison</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {labels.map((lbl, i) => {
                          const val = kd.values[i] ?? 0;
                          const pct = Math.round((val / maxVal) * 100);
                          const cc = COMPARE_COLORS[i % COMPARE_COLORS.length];
                          return (
                            <div key={lbl}>
                              <div className="mb-1.5 flex items-center justify-between">
                                <div className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ${cc.bg} ${cc.text}`}>{lbl}</div>
                                <span className="text-[12px] font-semibold tabular-nums text-slate-900 dark:text-white">{fmt(val)}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                                <div className={`h-full rounded-full transition-all duration-700 ${cc.bar}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Lead breakdowns */}
          <section>
            <SectionHeader eyebrow="Lead Analytics" title="Lead Breakdown Comparison" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {[
                { key: "byStatus" as const, label: "By Status", sub: "Status distribution" },
                { key: "byStage" as const, label: "By Stage", sub: "Pipeline stage" },
                { key: "bySource" as const, label: "By Source", sub: "Acquisition channels" },
              ].map(({ key, label, sub }) => (
                <Panel key={key} className="border border-red-500/10">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">{label}</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>
                    </div>
                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">{label}</span>
                  </div>
                  <CompareBar keys={c.leads[key].keys} series={c.leads[key].series} labels={labels} />
                </Panel>
              ))}

              {/* Leads over time */}
              <Panel className="border border-red-500/10">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads Over Time</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Monthly trend comparison</p>
                  </div>
                  <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">Timeline</span>
                </div>
                {c.leads.overTime.months.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart
                      data={c.leads.overTime.months.map((m, mi) => {
                        const row: Record<string, string | number> = { month: m.slice(5) };
                        c.leads.overTime.series.forEach((s, si) => { row[labels[si]] = s[mi] ?? 0; });
                        return row;
                      })}
                      margin={{ left: -16, right: 10, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="currentColor" className="text-red-500/10" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                      {labels.map((lbl, i) => (
                        <Line key={lbl} type="monotone" dataKey={lbl} stroke={COMPARE_COLORS[i % COMPARE_COLORS.length].hex} strokeWidth={3}
                          dot={{ r: 3, fill: COMPARE_COLORS[i % COMPARE_COLORS.length].hex, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: COMPARE_COLORS[i % COMPARE_COLORS.length].hex }} />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState label="No timeline data" />
                )}
              </Panel>
            </div>
          </section>

          {/* Visa & Loans */}
          <section>
            <SectionHeader eyebrow="Applications" title="Visa & Loan Comparison" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel className="border border-red-500/10">
                <div className="mb-4"><h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Visa by Status</h3></div>
                <CompareBar keys={c.visa.byStatus.keys} series={c.visa.byStatus.series} labels={labels} />
              </Panel>

              {/* Visa urgency from branches array */}
              <Panel className="border border-red-500/10">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Visa Urgency</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Upcoming deadlines</p>
                  </div>
                  <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">Priority</span>
                </div>
                <div className="space-y-5">
                  {(["biometricsNext7Days", "interviewsNext7Days", "expiringNext30Days"] as const).map((urgencyKey) => {
                    const urgencyLabels: Record<typeof urgencyKey, string> = {
                      biometricsNext7Days: "Biometrics (7 Days)",
                      interviewsNext7Days: "Interviews (7 Days)",
                      expiringNext30Days: "Expiring (30 Days)",
                    };
                    const values = labels.map((_, i) =>
                      data.branches[i]?.analytics?.visa?.upcoming?.[urgencyKey] ?? 0
                    );
                    const maxVal = Math.max(...values, 1);
                    return (
                      <div key={urgencyKey}>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{urgencyLabels[urgencyKey]}</p>
                          <span className="text-[10px] text-slate-400">Max {maxVal}</span>
                        </div>
                        <div className="space-y-2">
                          {labels.map((lbl, i) => {
                            const cc = COMPARE_COLORS[i % COMPARE_COLORS.length];
                            return (
                              <div key={lbl} className="flex items-center gap-3">
                                <span className={`w-24 truncate text-[11px] font-medium ${cc.text}`}>{lbl}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((values[i] / maxVal) * 100)}%`, background: cc.hex }} />
                                </div>
                                <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-slate-900 dark:text-white">{values[i]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel className="border border-red-500/10">
                <div className="mb-4"><h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Loans by Status (Count)</h3></div>
                <CompareBar keys={c.loans.byStatus.keys} series={c.loans.byStatus.countSeries} labels={labels} />
              </Panel>

              <Panel className="border border-red-500/10">
                <div className="mb-4"><h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Loans by Status (Amount)</h3></div>
                {c.loans.byStatus.amountSeries.some((s) => s.some((v) => v > 0)) ? (
                  <CompareBar keys={c.loans.byStatus.keys} series={c.loans.byStatus.amountSeries} labels={labels} />
                ) : (
                  <EmptyState label="No loan amount data" />
                )}
              </Panel>
            </div>
          </section>

          {/* Courses & MBBS */}
          <section>
            <SectionHeader eyebrow="More" title="Courses & MBBS" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel className="border border-red-500/10">
                <div className="mb-4"><h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Course Application Status</h3></div>
                <CompareBar keys={c.courses.byApplicationStatus.keys} series={c.courses.byApplicationStatus.series} labels={labels} />
              </Panel>
              <Panel className="border border-red-500/10">
                <div className="mb-4"><h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">MBBS Leads by Status</h3></div>
                <CompareBar keys={c.mbbsLeads.byStatus.keys} series={c.mbbsLeads.byStatus.series} labels={labels} />
              </Panel>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

export default function BranchReports() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [tab, setTab] = useState<"all" | "compare">("all");
  const [filters, setFilters] = useState({ from: startOfYear, to: todayStr });

  const [allData, setAllData] = useState<AllBranchesData | null>(null);
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const branchList = useMemo(
    () => (allData?.rankedByLeads ?? []).map((b) => ({ id: b.branchId, name: b.branchName })),
    [allData]
  );

  const fetchAll = useCallback(async () => {
    setAllLoading(true);
    setAllError(null);
    try {
      const params = new URLSearchParams({ from: filters.from, to: filters.to });
      const res = await fetch(`/api/report/dashboard/branches?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setAllData(json.data);
    } catch (e: unknown) {
      setAllError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setAllLoading(false);
    }
  }, [filters]);

  const fetchCompare = useCallback(async () => {
    if (compareIds.length < 2) return;
    setCompareLoading(true);
    setCompareError(null);
    try {
      const params = new URLSearchParams({
        branchIds: compareIds.join(","),
        from: filters.from,
        to: filters.to,
      });
      const res = await fetch(`/api/report/dashboard/branches/comparebranches?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Unknown error");
      setCompareData(json.data);
    } catch (e: unknown) {
      setCompareError(e instanceof Error ? e.message : "Failed to compare");
    } finally {
      setCompareLoading(false);
    }
  }, [compareIds, filters]);

  useEffect(() => { fetchAll(); }, []);

  const handleRefresh = () => {
    fetchAll();
    if (tab === "compare" && compareIds.length >= 2) fetchCompare();
  };

  return (
    <div className="min-h-screen bg-white p-5 font-sans text-slate-900 sm:p-7 dark:bg-[#0f1117] dark:text-slate-100">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">Branch Reports</h1>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            {allData
              ? `${allData.meta.totalBranches} branches · updated ${new Date(allData.meta.generatedAt).toLocaleTimeString()}`
              : "Branch-level CRM analytics across your network"}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-red-500/10 bg-white/70 p-2 backdrop-blur-sm dark:border-red-500/10 dark:bg-[#1a1b24]/80">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            className="rounded-xl border border-red-200/40 bg-white px-3.5 py-2 text-[13px] text-slate-700 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#232530] dark:text-slate-200"
          />
          <span className="px-1 text-[12px] text-slate-400">to</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            className="rounded-xl border border-red-200/40 bg-white px-3.5 py-2 text-[13px] text-slate-700 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#232530] dark:text-slate-200"
          />
          <button
            onClick={handleRefresh}
            disabled={allLoading}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-red-500/20 transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${allLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-7 flex w-fit gap-1 rounded-2xl border border-red-500/10 bg-white p-1 dark:border-red-500/10 dark:bg-[#1a1b24]">
        {[
          { key: "all", label: "All Branches", icon: <Building2 className="h-3.5 w-3.5" /> },
          { key: "compare", label: "Compare Branches", icon: <GitCompare className="h-3.5 w-3.5" /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as "all" | "compare")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
              tab === key
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Error banners */}
      {allError && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-[13px] text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{allError}</span>
          <button onClick={fetchAll} className="text-[12px] font-medium underline underline-offset-2">Retry</button>
        </div>
      )}
      {compareError && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-[13px] text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{compareError}</span>
          <button onClick={fetchCompare} className="text-[12px] font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      {/* Tab content */}
      {tab === "all" && (
        allLoading && !allData
          ? <Skeleton />
          : allData
          ? <AllBranchesView data={allData} selectedBranch={selectedBranch} onSelectBranch={setSelectedBranch} />
          : null
      )}
      {tab === "compare" && (
        <CompareBranchesView
          data={compareData}
          branches={branchList}
          selectedIds={compareIds}
          onChangeIds={setCompareIds}
          onCompare={fetchCompare}
          loading={compareLoading}
        />
      )}

      {/* Footer */}
      <div className="mt-10 pb-3 text-center text-[12px] text-slate-400">
        Data from {new Date(filters.from).toLocaleDateString()} to {new Date(filters.to).toLocaleDateString()}
      </div>
    </div>
  );
}