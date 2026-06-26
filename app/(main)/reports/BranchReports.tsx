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
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
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
    ChevronDown,
    Fingerprint,
    CalendarDays,
    ShieldAlert,
    Plane,
    GitCompare,
    BarChart2,
    MapPin,
    Trophy,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    X,
    Plus,
    Landmark,
    Stethoscope,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BranchSummary {
    id: string;
    name: string;
    code?: string;
    city?: string | null;
    state?: string | null;
    status: boolean;
    _count: { leads: number; students: number };
}

interface BranchAnalytics {
    branchId: string;
    branchName: string;
    branchCode?: string;
    city?: string | null;
    state?: string | null;
    status: boolean;
    analytics: {
        profile: BranchSummary[];
        summary: {
            totalLeads: number;
            newLeadsThisMonth: number;
            totalStudents: number;
            newStudentsThisMonth: number;
            convertedLeads: number;
            conversionRate: number;
            upcomingFollowups: number;
            totalDocs: number;
            totalMbbsLeads: number;
            totalLoanAmountApproved: number;
            totalVisaApplications: number;
            visaApproved: number;
            visaRejected: number;
            visaApprovalRate: number;
        };
        leads: {
            byStatus: { status: string; count: number }[];
            byStage: { stage: string; count: number }[];
            bySource: { source: string; count: number }[];
            byCountry: { country: string | null; count: number }[];
            byQualification: { qualification: string | null; count: number }[];
            byIntakeSeason: { season: string | null; count: number }[];
            byVisaStage: { stage: string; count: number }[];
            overTime: { month: string; count: number }[];
        };
        students: {
            byStatus: { status: string; count: number }[];
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
        mbbsLeads: { total: number; byStatus: { status: string; count: number }[] };
        counselors: {
            topByLeadAssignments?: { counselorId: string; counselor: { name: string; email: string } | null; assignedLeads: number; convertedLeads?: number; conversionRate?: number }[];
        };
    };
}

interface AllBranchesData {
    meta: { generatedAt: string; mode: string; totalBranches: number; filters: any };
    globalSummary: { totalLeads: number; totalStudents: number; convertedLeads: number; conversionRate: number };
    rankedByLeads: {
        rank: number;
        branchId: string;
        branchName: string;
        totalLeads: number;
        totalStudents: number;
        conversionRate: number;
        visaApproved: number;
        visaApprovalRate: number;
        newLeadsThisMonth: number;
    }[];
    branches: BranchAnalytics[];
}

interface CompareData {
    meta: { generatedAt: string; filters: any; branches: { id: string; name: string }[] };
    branches: any[];
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
        students: { byStatus: { keys: string[]; series: number[][] }; overTime: { months: string[]; series: number[][] } };
        visa: { byStatus: { keys: string[]; series: number[][] }; byType: { keys: string[]; series: number[][] }; upcoming: any };
        loans: { byStatus: { keys: string[]; countSeries: number[][]; amountSeries: number[][] } };
        courses: { byApplicationStatus: { keys: string[]; series: number[][] } };
        mbbsLeads: { byStatus: { keys: string[]; series: number[][] } };
    };
    winners: Record<string, { branchId: string; branchName: string; value: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — deep navy/charcoal base, indigo accent, teal for data
// ─────────────────────────────────────────────────────────────────────────────

const C = {
    bg: "#0b0c14",
    surface: "#13141f",
    border: "rgba(255,255,255,0.07)",
    accent: "#4f6ef7",
    accentSoft: "#7b93ff",
    teal: "#2dd4bf",
    amber: "#f59e0b",
    good: "#22c55e",
    bad: "#ef4444",
    slate: "#64748b",
    text: "#e2e8f0",
    muted: "#94a3b8",
};

const BRANCH_PALETTE = [
    "#4f6ef7", "#2dd4bf", "#f59e0b", "#a78bfa", "#34d399", "#fb7185", "#60a5fa",
];

const STATUS_COLORS: Record<string, string> = {
    NEW: "#4f6ef7", CONTACTED: "#60a5fa", QUALIFIED: "#22c55e", CONVERTED: "#16a34a",
    LOST: "#ef4444", ACTIVE: "#22c55e", INACTIVE: "#64748b", APPROVED: "#22c55e",
    REJECTED: "#ef4444", PENDING: "#f59e0b", DISBURSED: "#4f6ef7",
    NOT_STARTED: "#64748b", APPLIED: "#4f6ef7", UNDER_REVIEW: "#f59e0b",
};

const COMPARE_COLORS = [
    {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-500",
        dot: "bg-red-500",
    },
    {
        bg: "bg-sky-500/10",
        border: "border-sky-500/30",
        text: "text-sky-500",
        dot: "bg-sky-500",
    },
    {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-500",
        dot: "bg-emerald-500",
    },
];

const titleCase = (s: string) =>
    (s ?? "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const fmtNum = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
        : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
            : String(n ?? 0);

const fmtCurrency = (n: number | string) => {
    const num = Number(n ?? 0);
    if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
    if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
    if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
    return `₹${num}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
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
            className={`rounded-2xl border border-red-500/10 bg-white p-5 dark:bg-[#1a1b24] dark:border-red-500/10 ${className}`}
        >
            {children}
        </div>
    );
}

function SectionHeader({
    eyebrow,
    title,
    subtitle,
}: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="mb-6">
            {eyebrow && (
                <div className="mb-2 flex items-center gap-2">
                    <span className="h-px w-8 bg-red-500/40" />

                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-400">
                        {eyebrow}
                    </span>
                </div>
            )}

            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function Badge({ label, color }: { label: string; color?: string }) {
    const c = color ?? C.accent;
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ background: `${c}18`, color: c }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
            {label}
        </span>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10" style={{ color: C.slate }}>
            <AlertCircle className="w-6 h-6 mb-2 opacity-40" />
            <p className="text-[13px]">{label}</p>
        </div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl px-3.5 py-2.5 shadow-2xl text-[12px] border"
            style={{ background: "#0b0c14", borderColor: "rgba(255,255,255,0.12)" }}>
            {label && <p className="font-medium mb-1.5" style={{ color: C.muted }}>{label}</p>}
            {payload.map((p: any, i: number) => (
                <p key={i} className="flex items-center gap-2 tabular-nums" style={{ color: p.color ?? p.fill }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color ?? p.fill }} />
                    {p.name}: <span className="font-semibold" style={{ color: C.text }}>{p.value?.toLocaleString()}</span>
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
                const color = item.color ?? BRANCH_PALETTE[i % BRANCH_PALETTE.length];
                const pct = Math.round((item.count / maxVal) * 100);
                return (
                    <div key={item.label} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-[12px]" style={{ color: C.muted }}>
                            {titleCase(item.label)}
                        </span>
                        <div className="h-[6px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
                        </div>
                        <span className="w-8 text-right text-[12px] font-semibold tabular-nums" style={{ color: C.text }}>
                            {item.count}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function Kpi({ label, value, icon, hint, delta, tone = "primary",
}: {
    label: string; value: string; icon: React.ReactNode; hint?: string; delta?: number; tone?:
    | "primary"
    | "danger"
    | "rose"
    | "warning"
    | "success"
    | "default";
}) {
    const toneClasses = {
        primary: {
            icon: "bg-red-500/10 text-red-500",
            value: "text-red-500",
        },
        danger: {
            icon: "bg-red-600/10 text-red-600",
            value: "text-red-600",
        },
        rose: {
            icon: "bg-rose-500/10 text-rose-500",
            value: "text-rose-500",
        },
        warning: {
            icon: "bg-orange-500/10 text-orange-500",
            value: "text-orange-500",
        },
        success: {
            icon: "bg-emerald-500/10 text-emerald-500",
            value: "text-emerald-500",
        },
        default: {
            icon: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
            value: "text-slate-900 dark:text-white",
        },
    }[tone];

    return (
        <div className="group flex flex-col gap-2.5 rounded-2xl border border-red-500/10 bg-white px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/5 dark:bg-[#1a1b24]">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    {label}
                </span>

                <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${toneClasses.icon}`}
                >
                    {icon}
                </span>
            </div>

            <span
                className={`text-2xl font-bold tracking-tight tabular-nums ${toneClasses.value}`}
            >
                {value}
            </span>

            {(hint || delta !== undefined) && (
                <div className="flex items-center gap-2">
                    {delta !== undefined && (
                        <span
                            className={`flex items-center gap-1 text-[11px] font-medium ${delta > 0
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

function Skel({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-2xl ${className}`} style={{ background: "rgba(255,255,255,0.04)" }} />;
}

function Skeleton() {
    return (
        <div className="space-y-6">
            <Skel className="h-32" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => <Skel key={i} className="h-24" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-56" />)}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison helpers
// ─────────────────────────────────────────────────────────────────────────────

function CompareBar({
    keys,
    series,
    labels,
}: {
    keys: string[];
    series: number[][];
    labels: string[];
}) {
    if (!keys.length) return <EmptyState label="No data available" />;

    const chartData = keys.map((key, ki) => {
        const row: any = { key: titleCase(key) };

        series.forEach((s, si) => {
            row[labels[si]] = s[ki] ?? 0;
        });

        return row;
    });

    const COMPARE_COLORS = [
        "#FF746C", // Branch 1
        "#F05F56", // Branch 2
        "#D94B43", // Branch 3
    ];

    return (
        <ResponsiveContainer width="100%" height={230}>
            <BarChart
                data={chartData}
                margin={{ top: 8, right: 10, left: -16, bottom: 0 }}
                barGap={4}
            >
                <CartesianGrid
                    vertical={false}
                    stroke="currentColor"
                    className="text-red-500/10"
                />

                <XAxis
                    dataKey="key"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                />

                <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                />

                <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(239,68,68,.05)" }}
                />

                <Legend
                    wrapperStyle={{
                        fontSize: 12,
                        paddingTop: 10,
                    }}
                    iconType="circle"
                    iconSize={8}
                />

                {labels.map((lbl, i) => (
                    <Bar
                        key={lbl}
                        dataKey={lbl}
                        radius={[6, 6, 0, 0]}
                        barSize={16}
                        fill={COMPARE_COLORS[i % COMPARE_COLORS.length]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

function WinnerBadge({ winner, label }: { winner: { branchName: string; value: number }; label: string }) {
    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: `${C.accent}10`, border: `1px solid ${C.accent}20` }}>
            <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5" style={{ color: C.amber }} />
                <span className="text-[12px]" style={{ color: C.muted }}>{label}</span>
            </div>
            <span className="text-[12px] font-semibold" style={{ color: C.accentSoft }}>
                {winner.branchName} · {fmtNum(winner.value)}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: All Branches
// ─────────────────────────────────────────────────────────────────────────────

function AllBranchesView({ data, selectedBranch, onSelectBranch, }: { data: AllBranchesData; selectedBranch: string | null; onSelectBranch: (id: string | null) => void; }) {
    const { globalSummary, rankedByLeads, branches } = data;

    const branchDetail = selectedBranch
        ? branches.find((b) => b.branchId === selectedBranch)
        : null;

    const a = branchDetail?.analytics;

    const trend = useMemo(() => {
        if (!a) return [];
        const lm = Object.fromEntries(a.leads.overTime.map((r) => [r.month, r.count]));
        const sm = Object.fromEntries(a.students.overTime.map((r) => [r.month, r.count]));
        const months = [...new Set([...a.leads.overTime.map((r) => r.month), ...a.students.overTime.map((r) => r.month)])].sort();
        return months.map((m) => ({ month: m.slice(5), leads: lm[m] ?? 0, students: sm[m] ?? 0 }));
    }, [a]);

    return (
        <div className="space-y-7">
            {/* Global summary */}
            <div className="relative overflow-hidden rounded-2xl border border-red-500/10 bg-[#15161d] p-6">
                {/* Background Glow */}
                <div className="pointer-events-none absolute inset-0 opacity-20">
                    <div className="absolute left-[-10%] top-[-20%] h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
                    <div className="absolute bottom-[-20%] right-[-10%] h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
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
                            {
                                label: "Total leads",
                                value: fmtNum(globalSummary.totalLeads),
                                color: "text-red-400",
                            },
                            {
                                label: "Total students",
                                value: fmtNum(globalSummary.totalStudents),
                                color: "text-rose-400",
                            },
                            {
                                label: "Converted",
                                value: fmtNum(globalSummary.convertedLeads),
                                color: "text-red-500",
                            },
                            {
                                label: "Conversion rate",
                                value: `${globalSummary.conversionRate}%`,
                                color: "text-orange-400",
                            },
                        ].map((item) => (
                            <div key={item.label}>
                                <div
                                    className={`text-[26px] font-bold tracking-tight tabular-nums ${item.color}`}
                                >
                                    {item.value}
                                </div>

                                <div className="mt-0.5 text-[12px] text-slate-400">
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ranked leaderboard */}
            <section>
                <SectionHeader
                    eyebrow="Rankings"
                    title="Branch leaderboard"
                    subtitle="Ranked by total leads"
                />

                <Panel className="overflow-x-auto p-0 border border-red-500/10">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-red-500/10">
                                {[
                                    "Rank",
                                    "Branch",
                                    "Location",
                                    "Leads",
                                    "Students",
                                    "Conversion",
                                    "Visa Approved",
                                    "New This Month",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className={`px-4 py-3 text-left text-[12px] font-medium text-slate-500 dark:text-slate-400 ${[
                                            "Leads",
                                            "Students",
                                            "Conversion",
                                            "Visa Approved",
                                            "New This Month",
                                        ].includes(h)
                                            ? "text-right"
                                            : ""
                                            }`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {rankedByLeads.map((b) => {
                                const hasRanking =
                                    rankedByLeads.length > 1 &&
                                    rankedByLeads.some((item) => item.totalLeads > 0);

                                return (
                                    <tr
                                        key={b.branchId}
                                        onClick={() =>
                                            onSelectBranch(
                                                selectedBranch === b.branchId ? null : b.branchId
                                            )
                                        }
                                        className={`cursor-pointer border-b border-red-500/5 transition-all duration-200 hover:bg-red-500/5 ${selectedBranch === b.branchId
                                            ? "ring-1 ring-inset ring-red-500/20"
                                            : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3">
                                            {hasRanking ? (
                                                <span
                                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${b.rank <= 3
                                                        ? "border border-red-300 bg-red-500/10 text-red-500"
                                                        : "border border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                                                        }`}
                                                >
                                                    {b.rank === 1
                                                        ? "🥇"
                                                        : b.rank === 2
                                                            ? "🥈"
                                                            : b.rank === 3
                                                                ? "🥉"
                                                                : `#${b.rank}`}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                            {b.branchName}
                                        </td>

                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                            —
                                        </td>

                                        <td className="px-4 py-3 text-right font-bold tabular-nums text-red-500">
                                            {b.totalLeads.toLocaleString()}
                                        </td>

                                        <td className="px-4 py-3 text-right tabular-nums text-rose-500">
                                            {b.totalStudents.toLocaleString()}
                                        </td>

                                        <td
                                            className={`px-4 py-3 text-right font-medium tabular-nums ${b.conversionRate >= 50
                                                ? "text-red-500"
                                                : "text-slate-500 dark:text-slate-400"
                                                }`}
                                        >
                                            {b.conversionRate}%
                                        </td>

                                        <td className="px-4 py-3 text-right tabular-nums text-red-400">
                                            {b.visaApproved.toLocaleString()}
                                        </td>

                                        <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900 dark:text-slate-200">
                                            {b.newLeadsThisMonth > 0
                                                ? `+${b.newLeadsThisMonth}`
                                                : b.newLeadsThisMonth}
                                        </td>
                                    </tr>
                                );
                            })}
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
            {branchDetail && a && (
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <SectionHeader
                            eyebrow="Branch detail"
                            title={branchDetail.branchName}
                            subtitle={[branchDetail.city, branchDetail.state].filter(Boolean).join(", ") || "Branch analytics"}
                        />
                        <button onClick={() => onSelectBranch(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] transition-colors"
                            style={{ background: `${C.bad}15`, color: C.bad }}>
                            <X className="w-3.5 h-3.5" /> Close
                        </button>
                    </div>

                    {/* KPIs */}
                    <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        <Kpi
                            label="Total Leads"
                            value={fmtNum(a.summary.totalLeads)}
                            icon={<Users className="h-4 w-4" />}
                            hint={`+${a.summary.newLeadsThisMonth} this month`}
                            tone="primary"
                        />

                        <Kpi
                            label="Students"
                            value={fmtNum(a.summary.totalStudents)}
                            icon={<GraduationCap className="h-4 w-4" />}
                            hint={`+${a.summary.newStudentsThisMonth} this month`}
                            tone="rose"
                        />

                        <Kpi
                            label="Converted"
                            value={fmtNum(a.summary.convertedLeads)}
                            icon={<BadgeCheck className="h-4 w-4" />}
                            tone="success"
                        />

                        <Kpi
                            label="Conversion Rate"
                            value={`${a.summary.conversionRate}%`}
                            icon={<TrendingUp className="h-4 w-4" />}
                            tone="success"
                        />

                        <Kpi
                            label="Visa Approved"
                            value={fmtNum(a.summary.visaApproved)}
                            icon={<FileCheck2 className="h-4 w-4" />}
                            hint={`${a.summary.visaApprovalRate}% rate`}
                            tone="danger"
                        />

                        <Kpi
                            label="Visa Applications"
                            value={fmtNum(a.summary.totalVisaApplications)}
                            icon={<Plane className="h-4 w-4" />}
                            tone="primary"
                        />

                        <Kpi
                            label="Follow-ups (7d)"
                            value={fmtNum(a.summary.upcomingFollowups)}
                            icon={<CalendarClock className="h-4 w-4" />}
                            tone="warning"
                        />

                        <Kpi
                            label="Loan Approved"
                            value={fmtCurrency(a.summary.totalLoanAmountApproved)}
                            icon={<CreditCard className="h-4 w-4" />}
                            tone="rose"
                        />

                        <Kpi
                            label="MBBS Leads"
                            value={fmtNum(a.summary.totalMbbsLeads)}
                            icon={<Star className="h-4 w-4" />}
                            tone="danger"
                        />

                        <Kpi
                            label="Documents"
                            value={fmtNum(a.summary.totalDocs)}
                            icon={<FileCheck2 className="h-4 w-4" />}
                            tone="default"
                        />
                    </div>

                    {/* Visa urgency hero */}
                    <div className="relative mb-7 overflow-hidden rounded-2xl border border-red-500/10 bg-[#15161d] p-5">
                        {/* Background Glow */}
                        <div className="pointer-events-none absolute inset-0 opacity-20">
                            <div className="absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-red-500/20 blur-3xl" />
                            <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
                        </div>

                        <div className="relative">
                            <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
                                <Plane className="h-3.5 w-3.5" />
                                Visa Pipeline
                            </p>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {[
                                    {
                                        label: "Biometrics in 7 days",
                                        value: a.visa.upcoming.biometricsNext7Days,
                                        icon: <Fingerprint className="h-4 w-4" />,
                                        iconClass: "bg-red-500/10 text-red-400",
                                    },
                                    {
                                        label: "Interviews in 7 days",
                                        value: a.visa.upcoming.interviewsNext7Days,
                                        icon: <CalendarDays className="h-4 w-4" />,
                                        iconClass: "bg-rose-500/10 text-rose-400",
                                    },
                                    {
                                        label: "Expiring in 30 days",
                                        value: a.visa.upcoming.expiringNext30Days,
                                        icon: <ShieldAlert className="h-4 w-4" />,
                                        iconClass: "bg-orange-500/10 text-orange-400",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="group flex items-center gap-3 rounded-xl border border-red-500/10 bg-white/[0.03] px-4 py-3 transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/[0.03]"
                                    >
                                        <span
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClass}`}
                                        >
                                            {item.icon}
                                        </span>

                                        <div className="min-w-0">
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

                    {/* Growth chart */}
                    <Panel className="mb-5 border border-red-500/10">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                    Leads & Students Over Time
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    Monthly lead acquisition and student conversion
                                </p>
                            </div>

                            <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-1 text-[11px] font-medium text-red-400">
                                Monthly Trend
                            </div>
                        </div>

                        {trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <ComposedChart
                                    data={trend}
                                    margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
                                    barGap={6}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="currentColor"
                                        className="text-red-500/10"
                                    />

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

                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: "rgba(239,68,68,.05)" }}
                                    />

                                    <Legend
                                        wrapperStyle={{
                                            fontSize: 12,
                                            paddingTop: 8,
                                        }}
                                        iconType="circle"
                                        iconSize={8}
                                    />

                                    <Bar
                                        dataKey="leads"
                                        name="Leads"
                                        fill="#ef4444"
                                        radius={[6, 6, 0, 0]}
                                        barSize={18}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="students"
                                        name="Students"
                                        stroke="#fb7185"
                                        strokeWidth={3}
                                        dot={{
                                            r: 3,
                                            fill: "#fb7185",
                                            strokeWidth: 0,
                                        }}
                                        activeDot={{
                                            r: 6,
                                            fill: "#fb7185",
                                        }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState label="No timeline data available" />
                        )}
                    </Panel>

                    {/* Lead analytics grid */}
                    <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

                        {/* Lead Status */}
                        <Panel className="border border-red-500/10">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                        Leads by Status
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        Current pipeline distribution
                                    </p>
                                </div>

                                <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">
                                    Status
                                </div>
                            </div>

                            {a.leads.byStatus.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={a.leads.byStatus.map((r) => ({
                                                    name: r.status,
                                                    value: r.count,
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={72}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="#1f2937"
                                                strokeWidth={2}
                                            >
                                                {a.leads.byStatus.map((_, i) => (
                                                    <Cell
                                                        key={i}
                                                        fill={
                                                            [
                                                                "#ef4444",
                                                                "#fb7185",
                                                                "#f87171",
                                                                "#dc2626",
                                                                "#ea580c",
                                                                "#b91c1c",
                                                            ][i % 6]
                                                        }
                                                    />
                                                ))}
                                            </Pie>

                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {a.leads.byStatus.map((r, i) => (
                                            <Badge
                                                key={r.status}
                                                label={`${r.status}: ${r.count}`}
                                                color={
                                                    [
                                                        "#ef4444",
                                                        "#fb7185",
                                                        "#f87171",
                                                        "#dc2626",
                                                        "#ea580c",
                                                        "#b91c1c",
                                                    ][i % 6]
                                                }
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <EmptyState label="No status data available" />
                            )}
                        </Panel>

                        {/* Lead Stage */}
                        <Panel className="border border-red-500/10">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                        Leads by Stage
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        Funnel progression
                                    </p>
                                </div>

                                <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">
                                    Stage
                                </div>
                            </div>

                            <HBarList
                                data={a.leads.byStage.map((r, i) => ({
                                    label: r.stage,
                                    count: r.count,
                                    color: [
                                        "#ef4444",
                                        "#fb7185",
                                        "#f87171",
                                        "#dc2626",
                                        "#ea580c",
                                        "#b91c1c",
                                    ][i % 6],
                                }))}
                            />
                        </Panel>

                        {/* Lead Source */}
                        <Panel className="border border-red-500/10">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                        Leads by Source
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        Acquisition channels
                                    </p>
                                </div>

                                <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">
                                    Source
                                </div>
                            </div>

                            <HBarList
                                data={a.leads.bySource.map((r, i) => ({
                                    label: r.source ?? "Unknown",
                                    count: r.count,
                                    color: [
                                        "#ef4444",
                                        "#fb7185",
                                        "#f87171",
                                        "#dc2626",
                                        "#ea580c",
                                        "#b91c1c",
                                    ][i % 6],
                                }))}
                            />
                        </Panel>

                    </div>

                    {/* Counselors + universities */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* Top Counselors */}
                        <Panel className="border border-red-500/10">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                        Top Counselors
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        Ranked by assigned leads
                                    </p>
                                </div>

                                <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">
                                    Performance
                                </span>
                            </div>

                            {(a.counselors.topByLeadAssignments ?? []).length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart
                                        data={(a.counselors.topByLeadAssignments ?? []).map((c) => ({
                                            name: c.counselor?.name ?? "Unknown",
                                            leads: c.assignedLeads,
                                        }))}
                                        layout="vertical"
                                        margin={{ left: 8, right: 20, top: 4, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            horizontal={false}
                                            stroke="currentColor"
                                            className="text-red-500/10"
                                        />

                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11, fill: "#94A3B8" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={110}
                                            tick={{ fontSize: 11, fill: "#94A3B8" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            content={<CustomTooltip />}
                                            cursor={{ fill: "rgba(239,68,68,.05)" }}
                                        />

                                        <Bar
                                            dataKey="leads"
                                            name="Assigned Leads"
                                            radius={[0, 6, 6, 0]}
                                            barSize={16}
                                        >
                                            {(a.counselors.topByLeadAssignments ?? []).map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={
                                                        [
                                                            "#ef4444",
                                                            "#fb7185",
                                                            "#f87171",
                                                            "#dc2626",
                                                            "#ea580c",
                                                            "#b91c1c",
                                                        ][i % 6]
                                                    }
                                                />
                                            ))}
                                        </Bar>
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
                                    <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                        Top Universities
                                    </h3>
                                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        Applications by university
                                    </p>
                                </div>

                                <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">
                                    Universities
                                </span>
                            </div>

                            <HBarList
                                data={(a.courses.topUniversities ?? []).map((u, i) => ({
                                    label: u.universityName,
                                    count: u.applications,
                                    color: [
                                        "#ef4444",
                                        "#fb7185",
                                        "#f87171",
                                        "#dc2626",
                                        "#ea580c",
                                        "#b91c1c",
                                    ][i % 6],
                                }))}
                            />
                        </Panel>
                    </div>
                </section>
            )}

            {/* Visual comparison: leads by branch bar chart */}
            {!selectedBranch && (
                <section>
                    <SectionHeader eyebrow="Analytics" title="Lead volume by branch" />
                    <Panel>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart
                                data={rankedByLeads.map((b) => ({ name: b.branchName.slice(0, 14), leads: b.totalLeads, students: b.totalStudents }))}
                                margin={{ left: -8, right: 8, top: 4, bottom: 0 }} barGap={4}>
                                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={32} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
                                <Bar dataKey="leads" name="Leads" fill={C.accent} radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="students" name="Students" fill={C.teal} radius={[4, 4, 0, 0]} barSize={16} />
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

function CompareBranchesView({ data, branches, selectedIds, onChangeIds, onCompare, loading, from, to,
}: { data: CompareData | null; branches: { id: string; name: string }[]; selectedIds: string[]; onChangeIds: (ids: string[]) => void; onCompare: () => void; loading: boolean; from: string; to: string; }) {
    const toggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onChangeIds(selectedIds.filter((x) => x !== id));
        } else if (selectedIds.length < 3) {
            onChangeIds([...selectedIds, id]);
        }
    };

    const c = data?.comparison;
    const labels = c?.branchLabels ?? [];

    return (
        <div className="space-y-7">
            {/* Branch selector */}
            <Panel>
                <p className="text-[13px] font-medium mb-3" style={{ color: C.text }}>
                    Select 2–3 branches to compare
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                    {branches.map((b) => {
                        const selected = selectedIds.includes(b.id);
                        const idx = selectedIds.indexOf(b.id);
                        const active =
                            idx >= 0 ? COMPARE_COLORS[idx] : null;

                        return (
                            <button
                                key={b.id}
                                onClick={() => toggle(b.id)}
                                disabled={!selected && selectedIds.length >= 3}
                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all duration-200 ${selected
                                    ? `${active?.bg} ${active?.border} ${active?.text}`
                                    : "border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-white/10 dark:bg-[#1a1b24] dark:text-slate-400 dark:hover:border-red-500/20 dark:hover:bg-red-500/5 dark:hover:text-red-400"
                                    } ${!selected && selectedIds.length >= 3
                                        ? "cursor-not-allowed opacity-40"
                                        : ""
                                    }`}
                            >
                                {selected && (
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${active?.dot}`}
                                    />
                                )}

                                <span>{b.name}</span>
                            </button>
                        );
                    })}
                </div>

                {selectedIds.length >= 2 && (
                    <button
                        onClick={onCompare}
                        disabled={loading}
                        className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-r from-red-500 via-red-500 to-rose-500 px-5 py-2.5 text-[13px] font-medium text-white shadow-md shadow-red-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                    >
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                        <GitCompare
                            className={`relative h-4 w-4 ${loading ? "animate-spin" : "transition-transform group-hover:rotate-12"
                                }`}
                        />

                        <span className="relative">
                            {loading ? "Comparing..." : "Compare Branches"}
                        </span>
                    </button>
                )}
            </Panel>

            {loading && <Skeleton />}

            {data && c && (
                <div className="space-y-7">
                    {/* Winners summary */}
                    <section>
                        <SectionHeader
                            eyebrow="Insights"
                            title="KPI Winners"
                            subtitle="Top-performing branch for every business metric"
                        />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                { key: "totalLeads", label: "Most Total Leads", icon: Users },
                                { key: "totalStudents", label: "Most Students", icon: GraduationCap },
                                { key: "conversionRate", label: "Best Conversion", icon: TrendingUp },
                                { key: "visaApprovalRate", label: "Best Visa Approval", icon: BadgeCheck },
                                { key: "visaApproved", label: "Most Visas Approved", icon: Plane },
                                { key: "newLeadsThisMonth", label: "Monthly Growth", icon: CalendarDays },
                                { key: "totalLoanAmountApproved", label: "Highest Loan", icon: Landmark },
                                { key: "totalMbbsLeads", label: "Most MBBS Leads", icon: Stethoscope },
                            ]
                                .filter((item) => data.winners[item.key])
                                .map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.key}
                                            className="group relative overflow-hidden rounded-2xl border border-red-500/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/20 hover:shadow-xl hover:shadow-red-500/5 dark:bg-[#1a1b24]"
                                        >
                                            {/* Glow */}
                                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 blur-3xl transition-all duration-300 group-hover:bg-red-500/20" />

                                            <div className="relative">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                                                        <Icon className="h-5 w-5" />
                                                    </div>

                                                    <div className="rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                                                        Winner
                                                    </div>
                                                </div>

                                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    {item.label}
                                                </p>

                                                <div className="mt-3">
                                                    <WinnerBadge
                                                        winner={data.winners[item.key]}
                                                        label={item.label}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </section>

                    {/* KPI comparison bars */}
                    <section>
                        <SectionHeader
                            eyebrow="KPIs"
                            title="Side-by-side Comparison"
                            subtitle="Compare branch performance across key business metrics"
                        />

                        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                {
                                    key: "totalLeads",
                                    label: "Total Leads",
                                    icon: <Users className="h-4 w-4" />,
                                },
                                {
                                    key: "totalStudents",
                                    label: "Students",
                                    icon: <GraduationCap className="h-4 w-4" />,
                                },
                                {
                                    key: "convertedLeads",
                                    label: "Converted",
                                    icon: <BadgeCheck className="h-4 w-4" />,
                                },
                                {
                                    key: "conversionRate",
                                    label: "Conversion %",
                                    icon: <TrendingUp className="h-4 w-4" />,
                                },
                                {
                                    key: "visaApproved",
                                    label: "Visa Approved",
                                    icon: <FileCheck2 className="h-4 w-4" />,
                                },
                                {
                                    key: "visaApprovalRate",
                                    label: "Visa Rate %",
                                    icon: <Plane className="h-4 w-4" />,
                                },
                                {
                                    key: "upcomingFollowups",
                                    label: "Follow-ups",
                                    icon: <CalendarClock className="h-4 w-4" />,
                                },
                                {
                                    key: "totalLoanAmountApproved",
                                    label: "Loan Approved",
                                    icon: <CreditCard className="h-4 w-4" />,
                                },
                            ].map(({ key, label, icon }) => {
                                const kd = c.kpis[key];
                                if (!kd) return null;

                                const maxVal = Math.max(...kd.values, 1);

                                return (
                                    <div
                                        key={key}
                                        className="group relative overflow-hidden rounded-2xl border border-red-500/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/20 hover:shadow-xl hover:shadow-red-500/5 dark:bg-[#1a1b24]"
                                    >
                                        {/* Glow */}
                                        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-500/5 blur-3xl transition-all duration-300 group-hover:bg-red-500/10" />

                                        <div className="relative">
                                            {/* Header */}
                                            <div className="mb-5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                                                        {icon}
                                                    </div>

                                                    <div>
                                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                                            {label}
                                                        </h3>

                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            Comparison
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Values */}
                                            <div className="space-y-3">
                                                {labels.map((lbl, i) => {
                                                    const val = kd.values[i] ?? 0;
                                                    const pct = Math.round((val / maxVal) * 100);

                                                    const colors = [
                                                        {
                                                            bar: "bg-red-500",
                                                            text: "text-red-500",
                                                            bg: "bg-red-500/10",
                                                        },
                                                        {
                                                            bar: "bg-sky-500",
                                                            text: "text-sky-500",
                                                            bg: "bg-sky-500/10",
                                                        },
                                                        {
                                                            bar: "bg-emerald-500",
                                                            text: "text-emerald-500",
                                                            bg: "bg-emerald-500/10",
                                                        },
                                                    ];

                                                    const active = colors[i % colors.length];

                                                    return (
                                                        <div key={lbl}>
                                                            <div className="mb-1.5 flex items-center justify-between">
                                                                <div
                                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ${active.bg} ${active.text}`}
                                                                >
                                                                    {lbl}
                                                                </div>

                                                                <span className="text-[12px] font-semibold tabular-nums text-slate-900 dark:text-white">
                                                                    {key === "totalLoanAmountApproved"
                                                                        ? fmtCurrency(val)
                                                                        : key.includes("Rate")
                                                                            ? `${val}%`
                                                                            : fmtNum(val)}
                                                                </span>
                                                            </div>

                                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-700 ${active.bar}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
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
                        <SectionHeader
                            eyebrow="Lead Analytics"
                            title="Lead Breakdown Comparison"
                            subtitle="Compare lead distribution across selected branches"
                        />

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {/* Status */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            By Status
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Status distribution comparison
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Status
                                    </span>
                                </div>

                                <CompareBar
                                    keys={c.leads.byStatus.keys}
                                    series={c.leads.byStatus.series}
                                    labels={labels}
                                />
                            </Panel>

                            {/* Stage */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            By Stage
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Pipeline stage comparison
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Stage
                                    </span>
                                </div>

                                <CompareBar
                                    keys={c.leads.byStage.keys}
                                    series={c.leads.byStage.series}
                                    labels={labels}
                                />
                            </Panel>

                            {/* Source */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            By Source
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Lead acquisition channels
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Source
                                    </span>
                                </div>

                                <CompareBar
                                    keys={c.leads.bySource.keys}
                                    series={c.leads.bySource.series}
                                    labels={labels}
                                />
                            </Panel>

                            {/* Timeline */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            Leads Over Time
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Monthly trend comparison
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Timeline
                                    </span>
                                </div>

                                {c.leads.overTime.months.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <ComposedChart
                                            data={c.leads.overTime.months.map((m, mi) => {
                                                const row: any = {
                                                    month: m.slice(5),
                                                };

                                                c.leads.overTime.series.forEach((s, si) => {
                                                    row[labels[si]] = s[mi] ?? 0;
                                                });

                                                return row;
                                            })}
                                            margin={{ left: -16, right: 10, top: 8, bottom: 0 }}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                stroke="currentColor"
                                                className="text-red-500/10"
                                            />

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

                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ fill: "rgba(239,68,68,.05)" }}
                                            />

                                            <Legend
                                                wrapperStyle={{
                                                    fontSize: 12,
                                                    paddingTop: 8,
                                                }}
                                                iconType="circle"
                                                iconSize={8}
                                            />

                                            {labels.map((lbl, i) => {
                                                const colors = [
                                                    "#FF746C", // Primary Brand
                                                    "#F05F56", // Hover
                                                    "#D94B43", // Active
                                                ];

                                                return (
                                                    <Line
                                                        key={lbl}
                                                        type="monotone"
                                                        dataKey={lbl}
                                                        stroke={colors[i % colors.length]}
                                                        strokeWidth={3}
                                                        dot={{
                                                            r: 3,
                                                            fill: colors[i % colors.length],
                                                            strokeWidth: 0,
                                                        }}
                                                        activeDot={{
                                                            r: 6,
                                                            fill: colors[i % colors.length],
                                                        }}
                                                    />
                                                );
                                            })}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState label="No timeline data available" />
                                )}
                            </Panel>
                        </div>
                    </section>

                    {/* Students comparison */}
                    <section>
                        <SectionHeader eyebrow="Students" title="Student comparison" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Panel>
                                <p className="text-[13px] font-medium mb-3" style={{ color: C.text }}>By status</p>
                                <CompareBar keys={c.students.byStatus.keys} series={c.students.byStatus.series} labels={labels} />
                            </Panel>
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            Students Over Time
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Monthly enrollment comparison across selected branches
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Timeline
                                    </span>
                                </div>

                                {c.students.overTime.months.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={230}>
                                        <ComposedChart
                                            data={c.students.overTime.months.map((m, mi) => {
                                                const row: any = {
                                                    month: m.slice(5),
                                                };

                                                c.students.overTime.series.forEach((s, si) => {
                                                    row[labels[si]] = s[mi] ?? 0;
                                                });

                                                return row;
                                            })}
                                            margin={{ top: 8, right: 10, left: -16, bottom: 0 }}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                stroke="currentColor"
                                                className="text-red-500/10"
                                            />

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
                                                width={32}
                                            />

                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ fill: "rgba(239,68,68,.05)" }}
                                            />

                                            <Legend
                                                wrapperStyle={{
                                                    fontSize: 12,
                                                    paddingTop: 8,
                                                }}
                                                iconType="circle"
                                                iconSize={8}
                                            />

                                            {labels.map((lbl, i) => {
                                                const COLORS = [
                                                    "#FF746C", // Branch 1
                                                    "#F05F56", // Branch 2
                                                    "#D94B43", // Branch 3
                                                ];

                                                return (
                                                    <Line
                                                        key={lbl}
                                                        type="monotone"
                                                        dataKey={lbl}
                                                        stroke={COLORS[i % COLORS.length]}
                                                        strokeWidth={3}
                                                        dot={{
                                                            r: 4,
                                                            fill: COLORS[i % COLORS.length],
                                                            stroke: "#15161d",
                                                            strokeWidth: 2,
                                                        }}
                                                        activeDot={{
                                                            r: 6,
                                                            fill: COLORS[i % COLORS.length],
                                                            stroke: "#fff",
                                                            strokeWidth: 2,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState label="No student timeline data available" />
                                )}
                            </Panel>
                        </div>
                    </section>

                    {/* Visa + Loans */}
                    <section>
                        <SectionHeader
                            eyebrow="Applications"
                            title="Visa & Loan Comparison"
                            subtitle="Compare visa pipeline and loan performance across branches"
                        />

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {/* Visa Status */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            Visa by Status
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Current visa application status
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Status
                                    </span>
                                </div>

                                <CompareBar
                                    keys={c.visa.byStatus.keys}
                                    series={c.visa.byStatus.series}
                                    labels={labels}
                                />
                            </Panel>

                            {/* Visa Type */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            Visa by Type
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Distribution by visa category
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Type
                                    </span>
                                </div>

                                <CompareBar
                                    keys={c.visa.byType.keys}
                                    series={c.visa.byType.series}
                                    labels={labels}
                                />
                            </Panel>

                            {/* Visa Urgency */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            Visa Urgency
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Upcoming deadlines across branches
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Priority
                                    </span>
                                </div>

                                <div className="space-y-5">
                                    {[
                                        {
                                            key: "biometricsNext7Days",
                                            label: "Biometrics (7 Days)",
                                        },
                                        {
                                            key: "interviewsNext7Days",
                                            label: "Interviews (7 Days)",
                                        },
                                        {
                                            key: "expiringNext30Days",
                                            label: "Expiring (30 Days)",
                                        },
                                    ].map(({ key, label }) => {
                                        const values: number[] = labels.map(
                                            (_, i) =>
                                                data.branches[i]?.visa?.upcoming?.[
                                                key as keyof typeof data.branches[0]["visa"]["upcoming"]
                                                ] ?? 0
                                        );

                                        const maxVal = Math.max(...values, 1);

                                        const COLORS = [
                                            "#FF746C",
                                            "#F05F56",
                                            "#D94B43",
                                        ];

                                        return (
                                            <div key={key}>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                                                        {label}
                                                    </p>

                                                    <span className="text-[10px] text-slate-400">
                                                        Highest {maxVal}
                                                    </span>
                                                </div>

                                                <div className="space-y-2.5">
                                                    {labels.map((lbl, i) => (
                                                        <div
                                                            key={lbl}
                                                            className="flex items-center gap-3"
                                                        >
                                                            <span
                                                                className="w-24 truncate text-[11px] font-medium"
                                                                style={{
                                                                    color: COLORS[i % COLORS.length],
                                                                }}
                                                            >
                                                                {lbl}
                                                            </span>

                                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-700"
                                                                    style={{
                                                                        width: `${Math.round(
                                                                            (values[i] / maxVal) * 100
                                                                        )}%`,
                                                                        background:
                                                                            COLORS[i % COLORS.length],
                                                                    }}
                                                                />
                                                            </div>

                                                            <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-slate-900 dark:text-white">
                                                                {values[i]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Panel>

                            {/* Loan Status */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            Loan by Status
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Compare education loan pipeline
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Loans
                                    </span>
                                </div>

                                <CompareBar
                                    keys={c.loans.byStatus.keys}
                                    series={c.loans.byStatus.countSeries}
                                    labels={labels}
                                />
                            </Panel>
                        </div>
                    </section>

                    {/* Courses + MBBS */}
                    <section>
                        <SectionHeader
                            eyebrow="More"
                            title="Courses & MBBS"
                            subtitle="Application pipeline and MBBS lead comparison across selected branches"
                        />

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {/* Course Applications */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            Course Application Status
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Compare application progress between branches
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        Courses
                                    </span>
                                </div>

                                <CompareBar
                                    keys={c.courses.byApplicationStatus.keys}
                                    series={c.courses.byApplicationStatus.series}
                                    labels={labels}
                                />
                            </Panel>

                            {/* MBBS Leads */}
                            <Panel className="border border-red-500/10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                            MBBS Leads by Status
                                        </h3>
                                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                            Compare MBBS pipeline performance across branches
                                        </p>
                                    </div>

                                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
                                        MBBS
                                    </span>
                                </div>

                                <CompareBar
                                    keys={c.mbbsLeads.byStatus.keys}
                                    series={c.mbbsLeads.byStatus.series}
                                    labels={labels}
                                />
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

    // All branches
    const [allData, setAllData] = useState<AllBranchesData | null>(null);
    const [allLoading, setAllLoading] = useState(true);
    const [allError, setAllError] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

    // Compare
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [compareData, setCompareData] = useState<CompareData | null>(null);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState<string | null>(null);

    const branchList = useMemo(() =>
        (allData?.rankedByLeads ?? []).map((b) => ({ id: b.branchId, name: b.branchName })),
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
        } catch (e: any) {
            setAllError(e.message ?? "Failed to load");
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
        } catch (e: any) {
            setCompareError(e.message ?? "Failed to compare");
        } finally {
            setCompareLoading(false);
        }
    }, [compareIds, filters]);

    useEffect(() => { fetchAll(); }, []);

    const handleFilterChange = (partial: Partial<typeof filters>) =>
        setFilters((prev) => ({ ...prev, ...partial }));

    const handleRefresh = () => {
        fetchAll();
        if (tab === "compare" && compareIds.length >= 2) fetchCompare();
    };

    return (
        <div className="min-h-screen bg-white p-5 font-sans text-slate-900 sm:p-7 dark:bg-[#0f1117] dark:text-slate-100">
            {/* Page header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
                        Branch Reports
                    </h1>

                    <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                        {allData
                            ? `${allData.meta.totalBranches} branches · updated ${new Date(
                                allData.meta.generatedAt
                            ).toLocaleTimeString()}`
                            : "Branch-level CRM analytics across your network"}
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-red-500/10 bg-white/70 p-2 backdrop-blur-sm dark:border-red-500/10 dark:bg-[#1a1b24]/80">
                    <input
                        type="date"
                        value={filters.from}
                        onChange={(e) => handleFilterChange({ from: e.target.value })}
                        className="rounded-xl border border-red-200/40 bg-white px-3.5 py-2 text-[13px] text-slate-700 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#232530] dark:text-slate-200 dark:focus:border-red-400"
                    />

                    <span className="px-1 text-[12px] text-slate-400 dark:text-slate-500">
                        to
                    </span>

                    <input
                        type="date"
                        value={filters.to}
                        onChange={(e) => handleFilterChange({ to: e.target.value })}
                        className="rounded-xl border border-red-200/40 bg-white px-3.5 py-2 text-[13px] text-slate-700 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#232530] dark:text-slate-200 dark:focus:border-red-400"
                    />

                    <button
                        onClick={handleRefresh}
                        disabled={allLoading}
                        className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-red-500/20 transition-all hover:bg-red-600 hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 ${allLoading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-7 flex w-fit gap-1 rounded-2xl border border-red-500/10 bg-white p-1 dark:border-red-500/10 dark:bg-[#1a1b24]">
                {[
                    {
                        key: "all",
                        label: "All branches",
                        icon: <Building2 className="h-3.5 w-3.5" />,
                    },
                    {
                        key: "compare",
                        label: "Compare branches",
                        icon: <GitCompare className="h-3.5 w-3.5" />,
                    },
                ].map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key as "all" | "compare")}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all duration-200 ${tab === key
                            ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                            : "text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                            }`}
                    >
                        {icon}
                        {label}
                    </button>
                ))}
            </div>

            {/* Error states */}
            {allError && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-[13px] text-red-500">
                    <AlertCircle className="h-4 w-4 shrink-0" />

                    <span className="flex-1">{allError}</span>

                    <button
                        onClick={fetchAll}
                        className="text-[12px] font-medium text-red-600 underline underline-offset-2 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                        Retry
                    </button>
                </div>
            )}

            {compareError && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-[13px] text-red-500">
                    <AlertCircle className="h-4 w-4 shrink-0" />

                    <span className="flex-1">{compareError}</span>

                    <button
                        onClick={fetchCompare}
                        className="text-[12px] font-medium text-red-600 underline underline-offset-2 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                        Retry
                    </button>
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
                    from={filters.from}
                    to={filters.to}
                />
            )}

            {/* Footer */}
            <div className="text-center text-[12px] mt-10 pb-3" style={{ color: C.slate }}>
                Data from {new Date(filters.from).toLocaleDateString()} to {new Date(filters.to).toLocaleDateString()}
            </div>
        </div>
    );
}