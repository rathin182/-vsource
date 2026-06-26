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
    ChevronDown,
    Fingerprint,
    CalendarDays,
    ShieldAlert,
    Plane,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Types — mirrors the updated /api/dashboard/overview response exactly
// ─────────────────────────────────────────────────────────────────────────

interface DashboardData {
    meta: {
        generatedAt: string;
        filters: { branchId: string; from: string; to: string };
        note?: string;
    };
    summary: {
        totalLeads: number;
        totalStudents: number;
        totalUniversities: number;
        convertedLeads: number;
        conversionRate: number;
        newLeadsThisMonth: number;
        newStudentsThisMonth: number;
        upcomingFollowups: number;
        totalLoanAmountApproved: number | string;
        totalVisaDetails: number;
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
    coursesByStatus: { status: string; count: number }[];
    loans: {
        byStatus: { status: string; count: number; totalAmount: number | string }[];
    };
    branches: {
        summary: {
            id: string;
            name: string;
            city: string | null;
            state: string | null;
            status: boolean;
            _count: { leads: number; students: number };
        }[];
        leadsByBranch: {
            branchId: string;
            branch: { name: string; city: string } | null;
            count: number;
        }[];
        studentsByBranch: {
            branchId: string;
            branch: { name: string; city: string } | null;
            count: number;
        }[];
    };
    counselors: {
        topByleadAssignments: {
            counselorId: string;
            counselor: { name: string; email: string } | null;
            assignedLeads: number;
        }[];
    };
}

// ─────────────────────────────────────────────────────────────────────────
// Design tokens — ink/slate base, one violet accent for data,
// amber reserved strictly for visa-deadline urgency
// ─────────────────────────────────────────────────────────────────────────

const INK = "#15161d";
const ACCENT = "#6d5ef0"; // primary data violet
const ACCENT_SOFT = "#a89bff";
const AMBER = "#e8a23d"; // urgency only
const GOOD = "#34b37e";
const BAD = "#e15a5a";
const SLATE = "#8b8d9b";

const SERIES = [ACCENT, "#5b7fe8", AMBER, GOOD, ACCENT_SOFT, "#3fb6c4", BAD, "#9a7be0"];

const STATUS_COLORS: Record<string, string> = {
    NEW: ACCENT,
    CONTACTED: "#5b7fe8",
    QUALIFIED: GOOD,
    CONVERTED: "#1f8f63",
    LOST: BAD,
    ACTIVE: GOOD,
    INACTIVE: SLATE,
    APPROVED: GOOD,
    REJECTED: BAD,
    PENDING: AMBER,
    DISBURSED: ACCENT,
    NOT_STARTED: SLATE,
    APPLIED: ACCENT,
    UNDER_REVIEW: AMBER,
};

const STAGE_LABEL: Record<string, string> = {
    INQUIRY: "Inquiry",
    DOCUMENTS: "Documents",
    APPLIED: "Applied",
    OFFER: "Offer",
    VISA: "Visa",
    ENROLLED: "Enrolled",
    LEAD_CREATED: "Lead created",
    APPLICATION_SUBMITTED: "App submitted",
    OFFER_RECEIVED: "Offer received",
    DEPOSIT_PAID: "Deposit paid",
    INTERVIEW_COMPLETED: "Interview done",
    CAS_RECEIVED: "CAS received",
    VISA_APPLIED: "Visa applied",
    VISA_APPROVED: "Visa approved",
};

const titleCase = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────

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
        <div className="mb-5 flex items-baseline justify-between gap-4">
            <div>
                {eyebrow && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500/80 dark:text-violet-400/80">
                        {eyebrow}
                    </span>
                )}
                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`bg-white dark:bg-[#1a1b24] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,15,25,0.04)] ${className}`}
        >
            {children}
        </div>
    );
}

function Badge({ label, color }: { label: string; color?: string }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums"
            style={{ background: color ? `${color}16` : `${ACCENT}16`, color: color ?? ACCENT }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color ?? ACCENT }} />
            {label}
        </span>
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

function HBarList({
    data,
    colorFn,
}: {
    data: {
        label: string;
        count: number;
        color?: string;
    }[];
    colorFn?: (label: string) => string;
}) {
    if (data.length === 0) return <EmptyState label="No data yet" />;

    const maxVal = Math.max(...data.map((d) => d.count), 1);

    return (
        <div className="space-y-3">
            {data.slice(0, 8).map((item, i) => {
                const pct = Math.round((item.count / maxVal) * 100);

                const color =
                    item.color ??
                    (colorFn ? colorFn(item.label) : SERIES[i % SERIES.length]);

                return (
                    <div key={item.label} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-[12px] text-slate-600 dark:text-slate-400">
                            {titleCase(item.label)}
                        </span>

                        <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${pct}%`,
                                    background: color,
                                    boxShadow: `0 0 10px ${color}35`,
                                }}
                            />
                        </div>

                        <span className="w-7 text-right text-[12px] font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                            {item.count}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// KPI tile — tighter numerals, quiet label, optional urgency tone
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
    const toneColor =
        tone === "good"
            ? "#f87171" // red-400
            : tone === "urgent"
                ? "#dc2626" // red-600
                : "#fb7185"; // rose-400

    return (
        <div className="group rounded-2xl border border-red-200/40 dark:border-red-500/10 bg-white dark:bg-[#1a1b24] px-4 py-4 flex flex-col gap-2.5 transition-all duration-300 hover:border-red-300/60 dark:hover:border-red-400/20">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    {label}
                </span>

                <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-red-300/20 dark:ring-red-500/10"
                    style={{
                        background: `${toneColor}16`,
                        color: toneColor,
                    }}
                >
                    {icon}
                </span>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
                    {value}
                </span>
            </div>

            {hint && (
                <span className="text-[11.5px] text-slate-400 dark:text-slate-500">
                    {hint}
                </span>
            )}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────
// Filter bar
// ─────────────────────────────────────────────────────────────────────────

function FilterBar({
    branches,
    filters,
    onChange,
    onRefresh,
    loading,
}: {
    branches: { id: string; name: string }[];
    filters: { branchId: string; from: string; to: string };
    onChange: (f: Partial<typeof filters>) => void;
    onRefresh: () => void;
    loading: boolean;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2.5 mb-7">
            <div className="relative">
                <select
                    value={filters.branchId}
                    onChange={(e) => onChange({ branchId: e.target.value })}
                    className="appearance-none bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-3.5 pr-9 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                >
                    <option value="">All branches</option>
                    {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <input
                type="date"
                value={filters.from}
                onChange={(e) => onChange({ from: e.target.value })}
                className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            <span className="text-slate-400 text-[12px]">to</span>
            <input
                type="date"
                value={filters.to}
                onChange={(e) => onChange({ to: e.target.value })}
                className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />

            <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-2 bg-[#15161d] hover:bg-[#23242e] disabled:opacity-60 text-white rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors ml-auto sm:ml-0"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
            </button>

            <span className="text-[12px] text-slate-400 ml-auto">
                {loading ? "Loading…" : ""}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────

function Skel({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse bg-slate-200/70 dark:bg-white/[0.06] rounded-2xl ${className}`} />;
}

function DashboardSkeleton() {
    return (
        <div className="space-y-7">
            <Skel className="h-40" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                    <Skel key={i} className="h-24" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skel key={i} className="h-60" />
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

export default function OverallReports() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    const [filters, setFilters] = useState({ branchId: "", from: startOfYear, to: todayStr });
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [branchList, setBranchList] = useState<{ id: string; name: string }[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.branchId) params.set("branchId", filters.branchId);
            if (filters.from) params.set("from", filters.from);
            if (filters.to) params.set("to", filters.to);

            const res = await fetch(`/api/report/dashboard/overview?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? "Unknown error");

            setData(json.data);
            if (json.data?.branches?.summary?.length) {
                setBranchList(json.data.branches.summary.map((b: any) => ({ id: b.id, name: b.name })));
            }
        } catch (err: any) {
            setError(err.message ?? "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (partial: Partial<typeof filters>) => {
        setFilters((prev) => ({ ...prev, ...partial }));
    };

    // ── Formatters ──
    const fmt = (n: number | string | null | undefined) => {
        const num = Number(n ?? 0);
        if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
        if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
        if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
        return `₹${num}`;
    };
    const fmtNum = (n: number) => (n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n));

    // ── Derived chart data ──
    const trend = useMemo(() => {
        if (!data) return [];
        const leadMap = Object.fromEntries(data.leads.overTime.map((r) => [r.month, r.count]));
        const studentMap = Object.fromEntries(data.students.overTime.map((r) => [r.month, r.count]));
        const months = [
            ...new Set([...data.leads.overTime.map((r) => r.month), ...data.students.overTime.map((r) => r.month)]),
        ].sort();
        return months.map((m) => ({
            month: m.slice(5),
            leads: leadMap[m] ?? 0,
            students: studentMap[m] ?? 0,
        }));
    }, [data]);

    const leadStatusData = data?.leads.byStatus.map((r) => ({ name: r.status, value: r.count })) ?? [];
    const leadStageData = data?.leads.byStage.map((r) => ({ label: STAGE_LABEL[r.stage] ?? r.stage, count: r.count })) ?? [];
    const sourceData = data?.leads.bySource.map((r) => ({ label: r.source ?? "Unknown", count: r.count })) ?? [];
    const counselorData = data?.counselors.topByleadAssignments.map((c) => ({ name: c.counselor?.name ?? "Unknown", leads: c.assignedLeads })) ?? [];
    const branchSummary = data?.branches.summary ?? [];

    const visaStatusData = data?.visa.byStatus.map((r) => ({ name: r.status.replace(/_/g, " "), raw: r.status, value: r.count })) ?? [];
    const visaTypeData = data?.visa.byType.map((r) => ({ label: r.visaType ?? "Unspecified", count: r.count })) ?? [];
    const loanData = data?.loans.byStatus.map((r) => ({ name: r.status, value: r.count, amount: Number(r.totalAmount ?? 0) })) ?? [];
    const qualData = data?.leads.byQualification.map((r) => ({ label: r.qualification ?? "Unknown", count: r.count })) ?? [];
    const coursesData = data?.coursesByStatus.map((r) => ({ label: r.status, count: r.count })) ?? [];

    const RED_SERIES = [
        "#FF746C", // Primary
        "#F05F56", // Hover
        "#D94B43", // Active
        "#B83933", // Dark
        "#8F2824", // Wine
        "#FF9C97", // Soft
        "#FFC4C1", // Light
    ];

    const BAR_COLORS = [
        "#FF746C",
        "#F05F56",
        "#D94B43",
        "#B83933",
        "#8F2824",
        "#FF9C97",
        "#FFC4C1",
    ];

    const PIE_COLORS = [
        "#FF746C",
        "#FB7185",
        "#F87171",
        "#EA580C",
        "#DC2626",
        "#BE123C",
        "#991B1B",
    ];

    const CONVERSION_COLORS = [
        "#FF746C", // Primary
        "#F05F56", // Coral
        "#FB7185", // Rose
        "#D94B43", // Deep Red
        "#EA580C", // Orange
        "#B83933", // Crimson
        "#8F2824", // Wine
    ];

    const PERFORMANCE_COLORS = [
        "#FF746C", // Primary
        "#F05F56", // Coral
        "#D94B43", // Deep Red
        "#B83933", // Crimson
        "#8F2824", // Wine
        "#FB7185", // Rose
        "#F87171", // Soft Red
    ];

    const ENROLMENT_COLORS = [
        "#FF746C", // Primary
        "#F05F56", // Coral
        "#FB7185", // Rose
        "#D94B43", // Deep Red
        "#B83933", // Crimson
        "#8F2824", // Wine
        "#F87171", // Soft Red
        "#EF4444", // Red
    ];

    return (
        <div className="min-h-screen bg-[#f7f7fa] dark:bg-[#0d0e13] p-5 sm:p-7">
            {/* Page title */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">CRM Dashboard</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {data ? `Updated ${new Date(data.meta.generatedAt).toLocaleTimeString()}` : "Overview of leads, students &amp; visas"}
                    </p>
                </div>
            </div>

            <FilterBar branches={branchList} filters={filters} onChange={handleFilterChange} onRefresh={fetchData} loading={loading} />

            {error && (
                <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-[13px]">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchData} className="ml-auto underline text-[12px] font-medium">
                        Retry
                    </button>
                </div>
            )}

            {loading && !data && <DashboardSkeleton />}

            {data && (
                <div className="space-y-8">
                    {/* ── HERO: Visa Pipeline (the signature section) ── */}
                    <section>
                        <div className="rounded-2xl bg-[#15161d] p-6 sm:p-7 relative overflow-hidden border border-red-500/10">
                            {/* Premium Red Background */}
                            <div
                                className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(248,113,113,.55) 0%, transparent 42%),
          radial-gradient(circle at 85% 80%, rgba(185,28,28,.40) 0%, transparent 38%),
          radial-gradient(circle at 55% 100%, rgba(239,68,68,.25) 0%, transparent 45%)
        `,
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-red-900/10 pointer-events-none" />

                            <div className="relative flex flex-col gap-6">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
                                            <Plane className="w-3.5 h-3.5" />
                                            Visa pipeline
                                        </span>

                                        <h2 className="text-white text-[19px] font-semibold mt-1.5">
                                            Where every visa stands right now
                                        </h2>
                                    </div>

                                    <div className="flex items-baseline gap-5">
                                        <div>
                                            <span className="block text-3xl font-bold text-white tabular-nums tracking-tight">
                                                {fmtNum(data.visa.total)}
                                            </span>
                                            <span className="text-[11.5px] text-white/50">
                                                tracked total
                                            </span>
                                        </div>

                                        <div>
                                            <span className="block text-3xl font-bold text-red-400 tabular-nums tracking-tight">
                                                {data.visa.approvalRate}%
                                            </span>
                                            <span className="text-[11.5px] text-white/50">
                                                approval rate
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Urgency Strip */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Biometrics */}
                                    <div className="rounded-xl border border-red-400/10 bg-red-500/5 px-4 py-3.5 flex items-center gap-3 backdrop-blur-sm">
                                        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-500/15 text-red-300">
                                            <Fingerprint className="w-4.5 h-4.5" />
                                        </span>

                                        <div>
                                            <span className="block text-xl font-bold text-white tabular-nums">
                                                {data.visa.upcoming.biometricsNext7Days}
                                            </span>
                                            <span className="text-[12px] text-white/55">
                                                Biometrics in next 7 days
                                            </span>
                                        </div>
                                    </div>

                                    {/* Interviews */}
                                    <div className="rounded-xl border border-rose-400/10 bg-rose-500/5 px-4 py-3.5 flex items-center gap-3 backdrop-blur-sm">
                                        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-rose-500/15 text-rose-300">
                                            <CalendarDays className="w-4.5 h-4.5" />
                                        </span>

                                        <div>
                                            <span className="block text-xl font-bold text-white tabular-nums">
                                                {data.visa.upcoming.interviewsNext7Days}
                                            </span>
                                            <span className="text-[12px] text-white/55">
                                                Interviews in next 7 days
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expiring */}
                                    <div className="rounded-xl border border-red-700/15 bg-red-900/10 px-4 py-3.5 flex items-center gap-3 backdrop-blur-sm">
                                        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-700/20 text-red-400">
                                            <ShieldAlert className="w-4.5 h-4.5" />
                                        </span>

                                        <div>
                                            <span className="block text-xl font-bold text-white tabular-nums">
                                                {data.visa.upcoming.expiringNext30Days}
                                            </span>
                                            <span className="text-[12px] text-white/55">
                                                Expiring in next 30 days
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status + Visa Type */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                                    <div className="rounded-xl border border-red-400/10 bg-red-500/[0.03] px-4 py-4">
                                        <p className="mb-3 text-[12px] font-medium text-red-200/80">
                                            By status
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {visaStatusData.length === 0 ? (
                                                <span className="text-[12px] text-white/40">
                                                    No visa records yet
                                                </span>
                                            ) : (
                                                visaStatusData.map((d, i) => (
                                                    <Badge
                                                        key={d.name}
                                                        label={`${titleCase(d.name)} · ${d.value}`}
                                                        color={STATUS_COLORS[d.raw] ?? SERIES[i % SERIES.length]}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-rose-400/10 bg-rose-500/[0.03] px-4 py-4">
                                        <p className="mb-3 text-[12px] font-medium text-rose-200/80">
                                            By visa type
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {visaTypeData.length === 0 ? (
                                                <span className="text-[12px] text-white/40">
                                                    No visa type data yet
                                                </span>
                                            ) : (
                                                visaTypeData.map((d, i) => (
                                                    <Badge
                                                        key={d.label}
                                                        label={`${d.label} · ${d.count}`}
                                                        color={SERIES[i % SERIES.length]}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── KPI Summary Cards ── */}
                    <section>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            <Kpi label="Total leads" value={fmtNum(data.summary.totalLeads)} icon={<Users className="w-4 h-4" />} hint={`+${data.summary.newLeadsThisMonth} this month`} />
                            <Kpi label="Total students" value={fmtNum(data.summary.totalStudents)} icon={<GraduationCap className="w-4 h-4" />} hint={`+${data.summary.newStudentsThisMonth} this month`} />
                            <Kpi label="Universities" value={fmtNum(data.summary.totalUniversities)} icon={<Building2 className="w-4 h-4" />} />
                            <Kpi label="Converted" value={fmtNum(data.summary.convertedLeads)} icon={<BadgeCheck className="w-4 h-4" />} tone="good" />
                            <Kpi label="Conversion rate" value={`${data.summary.conversionRate}%`} icon={<TrendingUp className="w-4 h-4" />} tone="good" />
                            <Kpi label="Visas approved" value={fmtNum(data.summary.visaApproved)} icon={<FileCheck2 className="w-4 h-4" />} tone="good" hint={`${data.summary.visaApprovalRate}% approval rate`} />
                            <Kpi label="Loan amount approved" value={fmt(data.summary.totalLoanAmountApproved)} icon={<CreditCard className="w-4 h-4" />} />
                            <Kpi label="Upcoming follow-ups" value={fmtNum(data.summary.upcomingFollowups)} icon={<CalendarClock className="w-4 h-4" />} hint="Next 7 days" tone="urgent" />
                            <Kpi
                                label="Active branches"
                                value={String(branchSummary.filter((b) => b.status).length)}
                                icon={<Building2 className="w-4 h-4" />}
                            />
                            <Kpi label="Visa records tracked" value={fmtNum(data.summary.totalVisaDetails)} icon={<Plane className="w-4 h-4" />} />
                        </div>
                    </section>

                    {/* ── Leads & Students Over Time (redesigned) ── */}
                    <section>
                        <SectionHeader
                            eyebrow="Growth"
                            title="Leads &amp; students over time"
                            subtitle="Monthly intake volume"
                        />

                        <Panel>
                            {trend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <ComposedChart
                                        data={trend}
                                        margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                                        barGap={4}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            stroke="currentColor"
                                            className="text-red-100/40 dark:text-red-500/10"
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
                                            cursor={{ fill: "rgba(239,68,68,.08)" }}
                                        />

                                        <Legend
                                            wrapperStyle={{
                                                fontSize: 12,
                                                paddingTop: 8,
                                            }}
                                            iconType="circle"
                                            iconSize={8}
                                        />

                                        {/* Leads */}
                                        <Bar
                                            dataKey="leads"
                                            name="Leads"
                                            fill="#ef4444"
                                            radius={[5, 5, 0, 0]}
                                            barSize={18}
                                        />

                                        {/* Students */}
                                        <Line
                                            type="monotone"
                                            dataKey="students"
                                            name="Students"
                                            stroke="#fb7185"
                                            strokeWidth={2.8}
                                            dot={{
                                                r: 3,
                                                fill: "#fb7185",
                                                strokeWidth: 0,
                                            }}
                                            activeDot={{
                                                r: 5,
                                                fill: "#fb7185",
                                            }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No timeline data for this range" />
                            )}
                        </Panel>
                    </section>

                    {/* ── Lead Analytics ── */}

                    <section>
                        <SectionHeader eyebrow="Pipeline" title="Lead analytics" />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Status */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">
                                    By status
                                </p>

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
                                                        <Cell
                                                            key={entry.name}
                                                            fill={RED_SERIES[index % RED_SERIES.length]}
                                                        />
                                                    ))}
                                                </Pie>

                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                    cursor={{ fill: "rgba(255,116,108,.08)" }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {leadStatusData.map((d, i) => (
                                                <Badge
                                                    key={d.name}
                                                    label={`${d.name}: ${d.value}`}
                                                    color={RED_SERIES[i % RED_SERIES.length]}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState label="No status data" />
                                )}
                            </Panel>

                            {/* Stage */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">
                                    By stage
                                </p>

                                <HBarList
                                    data={leadStageData.map((item, index) => ({
                                        ...item,
                                        color: RED_SERIES[index % RED_SERIES.length],
                                    }))}
                                />
                            </Panel>

                            {/* Source */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">
                                    By source
                                </p>

                                <HBarList
                                    data={sourceData.map((item, index) => ({
                                        ...item,
                                        color: RED_SERIES[index % RED_SERIES.length],
                                    }))}
                                />
                            </Panel>
                        </div>
                    </section>

                    {/* ── Qualification & Intake Season ── */}
                    <section>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            {/* Qualification */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">
                                    Leads by qualification
                                </p>

                                {qualData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <BarChart
                                            data={qualData}
                                            margin={{ left: -20, bottom: 0 }}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                stroke="currentColor"
                                                className="text-red-100/40 dark:text-red-500/10"
                                            />

                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 10, fill: "#94A3B8" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />

                                            <YAxis
                                                tick={{ fontSize: 11, fill: "#94A3B8" }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={28}
                                            />

                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ fill: "rgba(255,116,108,.08)" }}
                                            />

                                            <Bar
                                                dataKey="count"
                                                radius={[5, 5, 0, 0]}
                                                barSize={28}
                                            >
                                                {qualData.map((_, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState label="No qualification data" />
                                )}
                            </Panel>

                            {/* Intake */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">
                                    Leads by intake season
                                </p>

                                {data.leads.byIntakeSeason.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <PieChart>
                                            <Pie
                                                data={data.leads.byIntakeSeason.map((r) => ({
                                                    name: r.season ?? "Unknown",
                                                    value: r.count,
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={38}
                                                outerRadius={74}
                                                paddingAngle={4}
                                                cornerRadius={5}
                                                dataKey="value"
                                                stroke="#111827"
                                                strokeWidth={2}
                                                label={({ name, percent }) =>
                                                    `${name} ${(percent * 100).toFixed(0)}%`
                                                }
                                                labelLine={false}
                                            >
                                                {data.leads.byIntakeSeason.map((_, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>

                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState label="No intake data" />
                                )}
                            </Panel>

                        </div>
                    </section>

                    {/* ── Course applications & Loans ── */}
                    <section>
                        <SectionHeader
                            eyebrow="Conversion"
                            title="Course applications &amp; loans"
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                            {/* Course Applications */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">
                                    Course application status
                                </p>

                                <HBarList
                                    data={coursesData.map((item, index) => ({
                                        ...item,
                                        color: CONVERSION_COLORS[index % CONVERSION_COLORS.length],
                                    }))}
                                />
                            </Panel>

                            {/* Loan Status */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">
                                    Loan status
                                </p>

                                {loanData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <BarChart
                                            data={loanData}
                                            margin={{ left: -20 }}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                stroke="currentColor"
                                                className="text-red-100/40 dark:text-red-500/10"
                                            />

                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11, fill: "#94A3B8" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />

                                            <YAxis
                                                tick={{ fontSize: 11, fill: "#94A3B8" }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={28}
                                            />

                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ fill: "rgba(255,116,108,.08)" }}
                                            />

                                            <Bar
                                                dataKey="value"
                                                name="Count"
                                                radius={[6, 6, 0, 0]}
                                                barSize={28}
                                            >
                                                {loanData.map((entry, index) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={CONVERSION_COLORS[index % CONVERSION_COLORS.length]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState label="No loan data" />
                                )}
                            </Panel>

                        </div>
                    </section>

                    {/* ── Top Counselors ── */}
                    <section>
                        <SectionHeader
                            eyebrow="Performance"
                            title="Top counselors"
                            subtitle="By lead assignments"
                        />

                        <Panel className="border border-red-500/10 dark:border-red-500/10">
                            {counselorData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={230}>
                                    <BarChart
                                        data={counselorData}
                                        layout="vertical"
                                        margin={{ left: 8, right: 20, top: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            horizontal={false}
                                            stroke="currentColor"
                                            className="text-red-100/40 dark:text-red-500/10"
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
                                            width={120}
                                            tick={{ fontSize: 11, fill: "#94A3B8" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            content={<CustomTooltip />}
                                            cursor={{ fill: "rgba(255,116,108,.08)" }}
                                        />

                                        <Bar
                                            dataKey="leads"
                                            name="Assigned leads"
                                            radius={[0, 6, 6, 0]}
                                            barSize={16}
                                        >
                                            {counselorData.map((entry, index) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState label="No counselor data" />
                            )}
                        </Panel>
                    </section>

                    {/* ── Branch Table ── */}
                    <section>
                        <SectionHeader eyebrow="Locations" title="Branch overview" />

                        <Panel className="overflow-x-auto p-0 border border-red-500/10 dark:border-red-500/10">
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr className="border-b border-red-100 dark:border-red-500/10 bg-red-50/40 dark:bg-red-950/10">
                                        <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">
                                            Branch
                                        </th>

                                        <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">
                                            Location
                                        </th>

                                        <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">
                                            Leads
                                        </th>

                                        <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">
                                            Students
                                        </th>

                                        <th className="px-5 py-3 text-center font-medium text-red-700 dark:text-red-300">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {branchSummary.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-10 text-center text-slate-400"
                                            >
                                                No branch data
                                            </td>
                                        </tr>
                                    ) : (
                                        branchSummary.map((branch) => (
                                            <tr
                                                key={branch.id}
                                                className="border-b border-red-100/60 dark:border-red-500/5 transition-colors hover:bg-red-50/40 dark:hover:bg-red-950/10"
                                            >
                                                <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                                    {branch.name}
                                                </td>

                                                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                                                    {[branch.city, branch.state]
                                                        .filter(Boolean)
                                                        .join(", ") || "—"}
                                                </td>

                                                <td className="px-5 py-3 text-right font-bold tabular-nums text-red-500">
                                                    {branch._count.leads}
                                                </td>

                                                <td className="px-5 py-3 text-right font-bold tabular-nums text-rose-500">
                                                    {branch._count.students}
                                                </td>

                                                <td className="px-5 py-3 text-center">
                                                    <Badge
                                                        label={branch.status ? "Active" : "Inactive"}
                                                        color={branch.status ? "#FF746C" : "#94A3B8"}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Panel>
                    </section>

                    {/* ── Student Status ── */}
                    <section>
                        <SectionHeader
                            eyebrow="Enrolment"
                            title="Student status distribution"
                        />

                        <Panel className="border border-red-500/10 dark:border-red-500/10">
                            {data.students.byStatus.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                    {data.students.byStatus.map((s, i) => {
                                        const color =
                                            ENROLMENT_COLORS[i % ENROLMENT_COLORS.length];

                                        return (
                                            <div
                                                key={s.status}
                                                className="flex flex-col items-center justify-center rounded-xl border border-red-500/10 px-2 py-4 text-center transition-all duration-300 hover:border-red-400/20 hover:bg-red-500/[0.03]"
                                                style={{
                                                    background: `${color}14`,
                                                }}
                                            >
                                                <span
                                                    className="text-2xl font-bold tabular-nums"
                                                    style={{ color }}
                                                >
                                                    {s.count}
                                                </span>

                                                <span className="mt-1 text-[11.5px] font-medium text-slate-600 dark:text-slate-400">
                                                    {titleCase(s.status)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState label="No student status data" />
                            )}
                        </Panel>
                    </section>

                    {/* ── Footer ── */}
                    <div className="text-center text-[12px] text-slate-400 py-3">
                        Data from {new Date(filters.from).toLocaleDateString()} to {new Date(filters.to).toLocaleDateString()} ·{" "}
                        {filters.branchId ? "Branch filtered" : "All branches"}
                        {data.meta.note && <span className="block mt-0.5 text-slate-300 dark:text-slate-600">{data.meta.note}</span>}
                    </div>
                </div>
            )}
        </div>
    );
}