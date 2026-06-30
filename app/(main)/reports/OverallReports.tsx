"use client";

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
} from "recharts";
import {
    Users,
    GraduationCap,
    Building2,
    CreditCard,
    CalendarClock,
    BadgeCheck,
    AlertCircle,
    RefreshCw,
    ChevronDown,
    Wallet,
    CalendarDays,
    FileClock,
    Plane,
    XCircle,
    Filter,
    X,
    FileText,
    MessageSquare,
    Trophy,
    Search,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Types — exactly matching /api/report/dashboard/overview response shape
// ─────────────────────────────────────────────────────────────────────────

interface CountRow {
    status?: string | null;
    stage?: string | null;
    source?: string | null;
    country?: string | null;
    season?: string | null;
    gender?: string | null;
    type?: string | null;
    count: number;
}

interface TrendRow {
    bucket: string;
    count: number;
}

interface LoanStatusRow {
    status: string;
    count: number;
    totalAmount: number;
}

interface CourseStatusRow {
    status: string;
    count: number;
}

interface TopUniversityRow {
    universityName: string;
    applications: number;
}

interface BranchLeaderboardRow {
    rank: number;
    branchId: string;
    branchName: string;
    branchCode: string | null;
    city: string | null;
    state: string | null;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalStudents: number;
    visaApproved: number;
    visaApprovalRate: number;
}

interface CounselorLeaderboardRow {
    rank: number;
    counselorId: string;
    counselorName: string;
    email: string | null;
    branches: { id: string; name: string; code: string }[];
    monthlyTarget: number;
    totalLeads: number;
    newLeadsThisMonth: number;
    monthlyTargetAchievement: number;
    convertedLeads: number;
    conversionRate: number;
    totalStudents: number;
    visaApproved: number;
    visaApprovalRate: number;
    upcomingFollowups: number;
    overdueFollowups: number;
    totalRemarks: number;
}

interface RecentTimeline {
    id: string;
    description: string;
    nextFollowup: string | null;
    createdAt: string;
    createdBy: { id: string; name: string } | null;
    lead: {
        id: string;
        studentName: string | null;
        email: string;
        phone: string;
        status: string;
        branchId: string;
        country: string | null;
    } | null;
}

interface RecentRemark {
    id: string;
    title: string | null;
    message: string;
    type: string;
    createdAt: string;
    createdBy: { id: string; name: string } | null;
    lead: { id: string; studentName: string | null } | null;
}

interface OverviewData {
    meta: {
        generatedAt: string;
        filtersApplied: Record<string, unknown>;
    };
    summary: {
        totalLeads: number;
        newLeadsThisMonth: number;
        convertedLeads: number;
        conversionRate: number;
        totalStudents: number;
        newStudentsThisMonth: number;
        totalVisaApplications: number;
        visaApproved: number;
        visaRejected: number;
        visaApprovalRate: number;
        totalLoanAmountApproved: number;
        totalDocs: number;
        totalRemarks: number;
        totalFollowupsLogged: number;
        upcomingFollowups: number;
        overdueFollowups: number;
        branchesInScope: number;
        counselorsInScope: number;
    };
    leads: {
        byStatus: CountRow[];
        byStage: CountRow[];
        bySource: CountRow[];
        byCountry: CountRow[];
        byIntakeSeason: CountRow[];
        byVisaStage: CountRow[];
        byGender: CountRow[];
        trend: TrendRow[];
    };
    students: {
        byStatus: CountRow[];
    };
    visa: {
        total: number;
        approved: number;
        rejected: number;
        approvalRate: number;
        byStatus: CountRow[];
        byDepositStatus: CountRow[];
        byCasStatus: CountRow[];
        byIhsStatus: CountRow[];
        upcoming: {
            depositDeadlinesNext7Days: number;
            casDeadlinesNext7Days: number;
            universityStartsNext30Days: number;
        };
    };
    loans: {
        byStatus: LoanStatusRow[];
        totalApproved: number;
    };
    courses: {
        byApplicationStatus: CourseStatusRow[];
        topUniversities: TopUniversityRow[];
    };
    activity: {
        totalDocs: number;
        totalRemarks: number;
        remarksByType: CountRow[];
        totalFollowupsLogged: number;
        upcomingFollowups: number;
        overdueFollowups: number;
        recentTimelines?: RecentTimeline[];
        recentRemarks?: RecentRemark[];
    };
    leaderboards: {
        branches: BranchLeaderboardRow[];
        counselors: CounselorLeaderboardRow[];
    };
    rawCounts: {
        leadsByBranchRaw: { branchId: string | null; count: number }[];
        leadsByCounselorRaw: { counselorId: string | null; count: number }[];
    };
}

// ─────────────────────────────────────────────────────────────────────────
// Filters — exactly every backend query param
// ─────────────────────────────────────────────────────────────────────────

interface Filters {
    branchId: string;
    counselorId: string;
    country: string;
    leadStatus: string;
    leadStage: string;
    visaStage: string;
    source: string;
    intakeSeason: string;
    gender: string;

    visaStatus: string;
    depositStatus: string;
    casStatus: string;
    ihsStatus: string;
    visaFeeStatus: string;

    studentStatus: string;
    loanStatus: string;
    courseStatus: string;
    university: string;

    search: string;
    dateField: string;
    from: string;
    to: string;
    groupBy: string;
    includeRecent: boolean;
}

const EMPTY_FILTERS: Filters = {
    branchId: "",
    counselorId: "",
    country: "",
    leadStatus: "",
    leadStage: "",
    visaStage: "",
    source: "",
    intakeSeason: "",
    gender: "",
    visaStatus: "",
    depositStatus: "",
    casStatus: "",
    ihsStatus: "",
    visaFeeStatus: "",
    studentStatus: "",
    loanStatus: "",
    courseStatus: "",
    university: "",
    search: "",
    dateField: "createdAt",
    from: "",
    to: "",
    groupBy: "month",
    includeRecent: true,
};

// Enum option lists — mirrors the Prisma schema exactly (no filter-options
// endpoint on the backend, so these are sourced straight from schema.prisma)
const LEAD_STATUS = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
const LEAD_STAGE = ["INQUIRY", "DOCUMENTS", "APPLIED", "OFFER", "VISA", "ENROLLED"];
const VISA_STAGE = [
    "LEAD_CREATED", "APPLICATION_SUBMITTED", "OFFER_RECEIVED", "DEPOSIT_PAID",
    "INTERVIEW_COMPLETED", "CAS_RECEIVED", "VISA_APPLIED", "VISA_APPROVED",
];
const INTAKE_SEASON = ["SPRING", "SUMMER", "FALL", "WINTER"];
const GENDER = ["MALE", "FEMALE", "OTHER"];
const VISA_STATUS = [
    "NOT_STARTED", "DOCUMENTS_PENDING", "APPLIED", "DECISION_PENDING",
    "APPROVED", "REJECTED", "WITHDRAWN",
];
const DEPOSIT_STATUS = ["PENDING", "PAID", "REFUNDED", "WAIVED"];
const CAS_STATUS = ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_REVIEW", "RECEIVED", "REJECTED", "NOT_REQUIRED"];
const IHS_STATUS = ["PENDING", "PAID", "NOT_REQUIRED"];
const VISA_FEE_STATUS = ["PENDING", "PAID", "NOT_REQUIRED"];
const STUDENT_STATUS = ["active", "visa_process", "loan_process", "admitted", "enrolled", "completed", "dropped"];
const LOAN_STATUS = ["PENDING", "APPROVED", "REJECTED", "DISBURSED"];
const COURSE_STATUS = [
    "DRAFT", "APPLIED", "PENDING", "OFFER_RECEIVED", "PRIORITY_OFFER_RECEIVED",
    "CONDITIONAL_OFFER", "UNCONDITIONAL_OFFER", "REJECTED", "DEFERRED",
];
const DATE_FIELDS = ["createdAt", "applicationDate", "depositDeadline", "casDeadline", "universityStart"];
const GROUP_BY = ["day", "week", "month"];

// ─────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────

const RED_SERIES = ["#FF746C", "#F05F56", "#D94B43", "#B83933", "#8F2824", "#FF9C97", "#FFC4C1"];
const PIE_COLORS = ["#FF746C", "#FB7185", "#F87171", "#EA580C", "#DC2626", "#BE123C", "#991B1B"];

const STATUS_COLORS: Record<string, string> = {
    NEW: "#6d5ef0", CONTACTED: "#5b7fe8", QUALIFIED: "#34b37e", CONVERTED: "#1f8f63",
    LOST: "#e15a5a", ACTIVE: "#34b37e", active: "#34b37e", INACTIVE: "#8b8d9b",
    APPROVED: "#34b37e", REJECTED: "#e15a5a", PENDING: "#e8a23d", PAID: "#34b37e",
    REFUNDED: "#8b8d9b", WAIVED: "#a89bff", NOT_REQUIRED: "#8b8d9b", DISBURSED: "#6d5ef0",
    NOT_STARTED: "#8b8d9b", APPLIED: "#6d5ef0", UNDER_REVIEW: "#e8a23d",
    RECEIVED: "#34b37e", DOCUMENTS_PENDING: "#e8a23d", DECISION_PENDING: "#e8a23d",
    WITHDRAWN: "#8b8d9b", DRAFT: "#8b8d9b", OFFER_RECEIVED: "#5b7fe8",
    PRIORITY_OFFER_RECEIVED: "#6d5ef0", CONDITIONAL_OFFER: "#e8a23d",
    UNCONDITIONAL_OFFER: "#34b37e", DEFERRED: "#8b8d9b",
};

const STAGE_LABEL: Record<string, string> = {
    INQUIRY: "Inquiry", DOCUMENTS: "Documents", APPLIED: "Applied", OFFER: "Offer",
    VISA: "Visa", ENROLLED: "Enrolled", LEAD_CREATED: "Lead created",
    APPLICATION_SUBMITTED: "App submitted", OFFER_RECEIVED: "Offer received",
    DEPOSIT_PAID: "Deposit paid", INTERVIEW_COMPLETED: "Interview done",
    CAS_RECEIVED: "CAS received", VISA_APPLIED: "Visa applied", VISA_APPROVED: "Visa approved",
};

const titleCase = (s: string | null | undefined) =>
    (s ?? "Unknown").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────

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

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white dark:bg-[#1a1b24] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,15,25,0.04)] ${className}`}>
            {children}
        </div>
    );
}

function Badge({ label, color }: { label: string; color?: string }) {
    const c = color ?? "#FF746C";
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums"
            style={{ background: `${c}16`, color: c }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
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

function HBarList({ data, colorFn }: { data: { label: string; count: number; color?: string }[]; colorFn?: (label: string) => string }) {
    if (data.length === 0) return <EmptyState label="No data yet" />;
    const maxVal = Math.max(...data.map((d) => d.count), 1);
    return (
        <div className="space-y-3">
            {data.slice(0, 10).map((item, i) => {
                const pct = Math.round((item.count / maxVal) * 100);
                const color = item.color ?? (colorFn ? colorFn(item.label) : RED_SERIES[i % RED_SERIES.length]);
                return (
                    <div key={item.label + i} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 truncate text-[12px] text-slate-600 dark:text-slate-400">{titleCase(item.label)}</span>
                        <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                            <div className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}35` }} />
                        </div>
                        <span className="w-9 text-right text-[12px] font-semibold tabular-nums text-slate-700 dark:text-slate-300">{item.count}</span>
                    </div>
                );
            })}
        </div>
    );
}

function Kpi({ label, value, icon, hint, tone = "default" }: { label: string; value: string; icon: React.ReactNode; hint?: string; tone?: "default" | "good" | "urgent" }) {
    const toneColor = tone === "good" ? "#34b37e" : tone === "urgent" ? "#dc2626" : "#fb7185";
    return (
        <div className="group rounded-2xl border border-red-200/40 dark:border-red-500/10 bg-white dark:bg-[#1a1b24] px-4 py-4 flex flex-col gap-2.5 transition-all duration-300 hover:border-red-300/60 dark:hover:border-red-400/20">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-red-300/20 dark:ring-red-500/10"
                    style={{ background: `${toneColor}16`, color: toneColor }}>
                    {icon}
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">{value}</span>
            </div>
            {hint && <span className="text-[11.5px] text-slate-400 dark:text-slate-500">{hint}</span>}
        </div>
    );
}

function RatePill({ rate }: { rate: number }) {
    const color = rate >= 60 ? "#34b37e" : rate >= 30 ? "#e8a23d" : "#e15a5a";
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold tabular-nums"
            style={{ background: `${color}18`, color }}>
            {rate.toFixed(1)}%
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Filter bar
// ─────────────────────────────────────────────────────────────────────────

function SelectFilter({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-3.5 pr-8 py-2 text-[12px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40 min-w-[140px]"
            >
                <option value="">{label}</option>
                {options.map((o, i) => (
                    <option key={`${o.value}-${i}`} value={o.value}>{o.label}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
    );
}

function TextFilter({ label, value, onChange, icon }: { label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
    return (
        <div className="relative">
            {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={label}
                className={`bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl ${icon ? "pl-8" : "pl-3.5"} pr-3 py-2 text-[12px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40 min-w-[140px]`}
            />
        </div>
    );
}

function ActiveFilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            {label}
            <button onClick={onRemove} className="hover:text-red-800 dark:hover:text-red-200 transition-colors">
                <X className="w-3 h-3" />
            </button>
        </span>
    );
}

const MULTI_FILTER_KEYS: (keyof Filters)[] = [
    "branchId", "counselorId", "country", "leadStatus", "leadStage", "visaStage",
    "source", "intakeSeason", "gender", "visaStatus", "depositStatus", "casStatus",
    "ihsStatus", "visaFeeStatus", "studentStatus", "loanStatus", "courseStatus",
    "university", "search",
];

function FilterBar({
    filters,
    onChange,
    onRefresh,
    loading,
}: {
    filters: Filters;
    onChange: (f: Partial<Filters>) => void;
    onRefresh: () => void;
    loading: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    const clearAll = () => onChange(Object.fromEntries(MULTI_FILTER_KEYS.map((k) => [k, ""])) as Partial<Filters>);

    const activeCount = MULTI_FILTER_KEYS.filter((k) => filters[k]).length;

    const activeFilters = MULTI_FILTER_KEYS
        .filter((k) => filters[k])
        .map((k) => ({ key: k, label: `${titleCase(k.replace(/([A-Z])/g, " $1"))}: ${filters[k]}` }));

    return (
        <div className="mb-7 space-y-3">
            {/* Primary row */}
            <div className="flex flex-wrap items-center gap-2.5">
                <input type="date" value={filters.from} onChange={(e) => onChange({ from: e.target.value })}
                    className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
                <span className="text-slate-400 text-[12px]">to</span>
                <input type="date" value={filters.to} onChange={(e) => onChange({ to: e.target.value })}
                    className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40" />

                <SelectFilter label="Date field" value={filters.dateField} onChange={(v) => onChange({ dateField: v })}
                    options={DATE_FIELDS.map((d) => ({ value: d, label: titleCase(d) }))} />

                <SelectFilter label="Group by" value={filters.groupBy} onChange={(v) => onChange({ groupBy: v })}
                    options={GROUP_BY.map((d) => ({ value: d, label: titleCase(d) }))} />

                {/* <TextFilter label="Branch ID" value={filters.branchId} onChange={(v) => onChange({ branchId: v })} /> */}
                <TextFilter label="Search name/email/phone" value={filters.search} onChange={(v) => onChange({ search: v })} icon={<Search className="w-3.5 h-3.5" />} />

                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium border transition-colors ${expanded
                        ? "bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400"
                        : "bg-white dark:bg-[#1a1b24] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300"
                        }`}
                >
                    <Filter className="w-3.5 h-3.5" />
                    More filters
                    {activeCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {activeCount}
                        </span>
                    )}
                </button>

                <button onClick={onRefresh} disabled={loading}
                    className="flex items-center gap-2 bg-[#15161d] hover:bg-[#23242e] disabled:opacity-60 text-white rounded-xl px-4 py-2 text-[12px] font-medium transition-colors ml-auto">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Loading…" : "Apply / Refresh"}
                </button>
            </div>

            {/* Expanded filters — every remaining backend query param */}
            {expanded && (
                <div className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Lead filters</p>
                    <div className="flex flex-wrap gap-2.5 mb-4">
                        <TextFilter label="Counselor ID" value={filters.counselorId} onChange={(v) => onChange({ counselorId: v })} />
                        <TextFilter label="Country" value={filters.country} onChange={(v) => onChange({ country: v })} />
                        <TextFilter label="Source" value={filters.source} onChange={(v) => onChange({ source: v })} />
                        <SelectFilter label="Lead status" value={filters.leadStatus} onChange={(v) => onChange({ leadStatus: v })}
                            options={LEAD_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} />
                        <SelectFilter label="Lead stage" value={filters.leadStage} onChange={(v) => onChange({ leadStage: v })}
                            options={LEAD_STAGE.map((s) => ({ value: s, label: STAGE_LABEL[s] ?? titleCase(s) }))} />
                        <SelectFilter label="Visa stage" value={filters.visaStage} onChange={(v) => onChange({ visaStage: v })}
                            options={VISA_STAGE.map((s) => ({ value: s, label: STAGE_LABEL[s] ?? titleCase(s) }))} />
                        <SelectFilter label="Intake season" value={filters.intakeSeason} onChange={(v) => onChange({ intakeSeason: v })}
                            options={INTAKE_SEASON.map((s) => ({ value: s, label: titleCase(s) }))} />
                        <SelectFilter label="Gender" value={filters.gender} onChange={(v) => onChange({ gender: v })}
                            options={GENDER.map((s) => ({ value: s, label: titleCase(s) }))} />
                    </div>

                    {/* <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Visa filters</p>
                    <div className="flex flex-wrap gap-2.5 mb-4">
                        <SelectFilter label="Visa status" value={filters.visaStatus} onChange={(v) => onChange({ visaStatus: v })}
                            options={VISA_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} />
                        <SelectFilter label="Deposit status" value={filters.depositStatus} onChange={(v) => onChange({ depositStatus: v })}
                            options={DEPOSIT_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} />
                        <SelectFilter label="CAS status" value={filters.casStatus} onChange={(v) => onChange({ casStatus: v })}
                            options={CAS_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} />
                        <SelectFilter label="IHS status" value={filters.ihsStatus} onChange={(v) => onChange({ ihsStatus: v })}
                            options={IHS_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} />
                        <SelectFilter label="Visa fee status" value={filters.visaFeeStatus} onChange={(v) => onChange({ visaFeeStatus: v })}
                            options={VISA_FEE_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} />
                    </div> */}

                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Student / loan / course filters</p>
                    <div className="flex flex-wrap gap-2.5 mb-4">
                        <SelectFilter label="Student status" value={filters.studentStatus} onChange={(v) => onChange({ studentStatus: v })}
                            options={STUDENT_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} />
                        <SelectFilter label="Loan status" value={filters.loanStatus} onChange={(v) => onChange({ loanStatus: v })}
                            options={LOAN_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} />
                        {/* <SelectFilter label="Course status" value={filters.courseStatus} onChange={(v) => onChange({ courseStatus: v })}
                            options={COURSE_STATUS.map((s) => ({ value: s, label: titleCase(s) }))} /> */}
                        {/* <TextFilter label="University name" value={filters.university} onChange={(v) => onChange({ university: v })} /> */}
                    </div>

                    <label className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-300 cursor-pointer w-fit">
                        <input type="checkbox" checked={filters.includeRecent}
                            onChange={(e) => onChange({ includeRecent: e.target.checked })}
                            className="accent-red-500 w-3.5 h-3.5" />
                        Include recent activity feed
                    </label>
                </div>
            )}

            {/* Active filter pills */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Active:</span>
                    {activeFilters.map(({ key, label }) => (
                        <ActiveFilterPill key={key} label={label} onRemove={() => onChange({ [key]: "" } as Partial<Filters>)} />
                    ))}
                    <button onClick={clearAll} className="text-[11px] text-red-500 hover:text-red-700 font-medium ml-1 underline">
                        Clear all
                    </button>
                </div>
            )}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => <Skel key={i} className="h-24" />)}
            </div>
            <Skel className="h-52" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-60" />)}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Loan breakdown table
// ─────────────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | string | null | undefined) {
    const num = Number(n ?? 0);
    if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
    if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
    if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
    return `₹${num.toFixed(0)}`;
}

function fmtNum(n: number) {
    return n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n ?? 0);
}

function LoanBreakdownTable({ rows }: { rows: LoanStatusRow[] }) {
    if (!rows.length) return <EmptyState label="No loan data" />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
                <thead>
                    <tr className="border-b border-red-100 dark:border-red-500/10">
                        <th className="pb-2 text-left font-medium text-red-700 dark:text-red-300">Status</th>
                        <th className="pb-2 text-right font-medium text-red-700 dark:text-red-300">Count</th>
                        <th className="pb-2 text-right font-medium text-red-700 dark:text-red-300">Total amount</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={r.status} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                            <td className="py-2">
                                <Badge label={titleCase(r.status)} color={STATUS_COLORS[r.status] ?? RED_SERIES[i % RED_SERIES.length]} />
                            </td>
                            <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">{r.count}</td>
                            <td className="py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmtCurrency(r.totalAmount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

export default function OverviewDashboard() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, from: startOfYear, to: todayStr });
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            (Object.entries(filters) as [keyof Filters, string | boolean][]).forEach(([k, v]) => {
                if (k === "includeRecent") {
                    params.set("includeRecent", String(v));
                    return;
                }
                if (v) params.set(k, String(v));
            });

            const res = await fetch(`/api/report/dashboard/overview?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? "Unknown error");
            setData(json.data);
        } catch (err: any) {
            setError(err.message ?? "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchData(); }, []); // eslint-disable-line

    const handleFilterChange = (partial: Partial<Filters>) =>
        setFilters((prev) => ({ ...prev, ...partial }));

    // ── Derived chart data ──
    const trendData = useMemo(
        () => data?.leads.trend.map((r) => ({ bucket: r.bucket.slice(5), count: r.count })) ?? [],
        [data]
    );

    const leadStatusData = data?.leads.byStatus.map((r) => ({ name: r.status ?? "Unknown", value: r.count })) ?? [];
    const leadStageData = data?.leads.byStage.map((r) => ({ label: STAGE_LABEL[r.stage ?? ""] ?? (r.stage ?? "Unknown"), count: r.count })) ?? [];
    const sourceData = data?.leads.bySource.map((r) => ({ label: r.source ?? "Unknown", count: r.count })) ?? [];
    const countryData = data?.leads.byCountry.map((r) => ({ label: r.country ?? "Unknown", count: r.count })) ?? [];
    const intakeData = data?.leads.byIntakeSeason.map((r) => ({ name: r.season ?? "Unknown", value: r.count })) ?? [];
    const visaStageData = data?.leads.byVisaStage.map((r) => ({ label: STAGE_LABEL[r.stage ?? ""] ?? (r.stage ?? "Unknown"), count: r.count })) ?? [];
    const genderData = data?.leads.byGender.map((r) => ({ label: r.gender ?? "Unknown", count: r.count })) ?? [];

    const studentStatusData = data?.students.byStatus.map((r) => ({ label: r.status ?? "Unknown", count: r.count })) ?? [];

    const visaStatusData = data?.visa.byStatus.map((r) => ({ name: r.status ?? "Unknown", value: r.count })) ?? [];
    const depositStatusData = data?.visa.byDepositStatus.map((r) => ({ label: r.status ?? "Unspecified", count: r.count })) ?? [];
    const casStatusData = data?.visa.byCasStatus.map((r) => ({ label: r.status ?? "Unspecified", count: r.count })) ?? [];
    const ihsStatusData = data?.visa.byIhsStatus.map((r) => ({ label: r.status ?? "Unspecified", count: r.count })) ?? [];

    const courseStatusData = data?.courses.byApplicationStatus.map((r) => ({ label: r.status, count: r.count })) ?? [];
    const topUniversities = data?.courses.topUniversities ?? [];

    const remarksByType = data?.activity.remarksByType.map((r) => ({ label: r.type ?? "Unknown", count: r.count })) ?? [];

    const branchLeaderboard = data?.leaderboards.branches ?? [];
    const counselorLeaderboard = data?.leaderboards.counselors ?? [];

    return (
        <div className="min-h-screen bg-[#f7f7fa] dark:bg-[#0d0e13] p-5 sm:p-7">
            {/* Page title */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">CRM Overview</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {data ? `Updated ${new Date(data.meta.generatedAt).toLocaleTimeString()}` : "Complete overview of leads, visa, students & counselors"}
                    </p>
                </div>
            </div>

            <FilterBar filters={filters} onChange={handleFilterChange} onRefresh={fetchData} loading={loading} />

            {error && (
                <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-[13px]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchData} className="ml-auto underline text-[12px] font-medium">Retry</button>
                </div>
            )}

            {loading && !data && <DashboardSkeleton />}

            {data && (
                <div className="space-y-8">

                    {/* ── KPI Cards ── */}
                    <section>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            <Kpi label="Total leads" value={fmtNum(data.summary.totalLeads)}
                                icon={<Users className="w-4 h-4" />} hint={`+${data.summary.newLeadsThisMonth} this month`} />
                            <Kpi label="Converted leads" value={fmtNum(data.summary.convertedLeads)}
                                icon={<BadgeCheck className="w-4 h-4" />} tone="good" hint={`${data.summary.conversionRate}% conversion`} />
                            <Kpi label="Total students" value={fmtNum(data.summary.totalStudents)}
                                icon={<GraduationCap className="w-4 h-4" />} hint={`+${data.summary.newStudentsThisMonth} this month`} />
                            <Kpi label="Visas approved" value={fmtNum(data.summary.visaApproved)}
                                icon={<BadgeCheck className="w-4 h-4" />} tone="good" hint={`${data.summary.visaApprovalRate}% approval rate`} />
                            <Kpi label="Visas rejected" value={fmtNum(data.summary.visaRejected)}
                                icon={<XCircle className="w-4 h-4" />} tone="urgent" />
                            <Kpi label="Visa applications" value={fmtNum(data.summary.totalVisaApplications)}
                                icon={<Plane className="w-4 h-4" />} />
                            <Kpi label="Loan amount approved" value={fmtCurrency(data.summary.totalLoanAmountApproved)}
                                icon={<CreditCard className="w-4 h-4" />} />
                            {/* <Kpi label="Upcoming follow-ups" value={fmtNum(data.summary.upcomingFollowups)}
                                icon={<CalendarClock className="w-4 h-4" />} hint="Next 7 days" tone="urgent" /> */}
                            <Kpi label="Overdue follow-ups" value={fmtNum(data.summary.overdueFollowups)}
                                icon={<FileClock className="w-4 h-4" />} tone="urgent" />
                            <Kpi label="Total documents" value={fmtNum(data.summary.totalDocs)}
                                icon={<FileText className="w-4 h-4" />} />
                            <Kpi label="Total remarks" value={fmtNum(data.summary.totalRemarks)}
                                icon={<MessageSquare className="w-4 h-4" />} />
                            <Kpi label="Branches / counselors in scope" value={`${data.summary.branchesInScope} / ${data.summary.counselorsInScope}`}
                                icon={<Building2 className="w-4 h-4" />} />
                        </div>
                    </section>

                    {/* ── Visa Pipeline Hero ── */}
                    <section>
                        <div className="rounded-2xl bg-[#15161d] p-6 sm:p-7 relative overflow-hidden border border-red-500/10">
                            <div className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{ backgroundImage: `radial-gradient(circle at 15% 20%, rgba(248,113,113,.55) 0%, transparent 42%), radial-gradient(circle at 85% 80%, rgba(185,28,28,.40) 0%, transparent 38%)` }} />
                            <div className="relative flex flex-col gap-6">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
                                            <Plane className="w-3.5 h-3.5" /> Visa pipeline
                                        </span>
                                        <h2 className="text-white text-[19px] font-semibold mt-1.5">Where every visa stands right now</h2>
                                    </div>
                                    <div className="flex items-baseline gap-5">
                                        <div>
                                            <span className="block text-3xl font-bold text-white tabular-nums tracking-tight">{fmtNum(data.visa.total)}</span>
                                            <span className="text-[11.5px] text-white/50">tracked total</span>
                                        </div>
                                        <div>
                                            <span className="block text-3xl font-bold text-red-400 tabular-nums tracking-tight">{data.visa.approvalRate}%</span>
                                            <span className="text-[11.5px] text-white/50">approval rate</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { icon: <Wallet className="w-4 h-4" />, value: data.visa.upcoming.depositDeadlinesNext7Days, label: "Deposit deadlines · next 7 days" },
                                        { icon: <FileClock className="w-4 h-4" />, value: data.visa.upcoming.casDeadlinesNext7Days, label: "CAS deadlines · next 7 days" },
                                        { icon: <CalendarDays className="w-4 h-4" />, value: data.visa.upcoming.universityStartsNext30Days, label: "University starts · next 30 days" },
                                    ].map((item, i) => (
                                        <div key={i} className="rounded-xl border border-red-400/10 bg-red-500/5 px-4 py-3.5 flex items-center gap-3 backdrop-blur-sm">
                                            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-500/15 text-red-300">{item.icon}</span>
                                            <div>
                                                <span className="block text-xl font-bold text-white tabular-nums">{item.value}</span>
                                                <span className="text-[12px] text-white/55">{item.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 pt-1">
                                    {[
                                        { title: "By visa status", rows: visaStatusData.map((d) => ({ label: d.name, count: d.value })) },
                                        { title: "By deposit status", rows: depositStatusData },
                                        { title: "By CAS status", rows: casStatusData },
                                        { title: "By IHS status", rows: ihsStatusData },
                                    ].map((block) => (
                                        <div key={block.title} className="rounded-xl border border-red-400/10 bg-red-500/[0.03] px-4 py-4">
                                            <p className="mb-3 text-[12px] font-medium text-red-200/80">{block.title}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {block.rows.length === 0
                                                    ? <span className="text-[12px] text-white/40">No data yet</span>
                                                    : block.rows.map((d, i) => (
                                                        <Badge key={d.label} label={`${titleCase(d.label)} · ${d.count}`}
                                                            color={STATUS_COLORS[d.label] ?? RED_SERIES[i % RED_SERIES.length]} />
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Leads Over Time ── */}
                    <section>
                        <SectionHeader eyebrow="Growth" title="Leads over time"
                            subtitle={`${titleCase(filters.groupBy)}ly volume within selected date range, grouped by ${titleCase(filters.dateField)}`} />
                        <Panel>
                            {trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={trendData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                                        <CartesianGrid vertical={false} stroke="currentColor" className="text-red-100/40 dark:text-red-500/10" />
                                        <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={32} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="count" name="Leads" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: "#ef4444" }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : <EmptyState label="No timeline data for this range" />}
                        </Panel>
                    </section>

                    {/* ── Lead Analytics ── */}
                    <section>
                        <SectionHeader eyebrow="Pipeline" title="Lead analytics" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <Panel>
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

                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            <div className="mt-2 flex flex-wrap gap-2">
                {leadStatusData.map((d, index) => (
                    <Badge
                        key={d.name}
                        label={`${titleCase(d.name)}: ${d.value}`}
                        color={RED_SERIES[index % RED_SERIES.length]}
                    />
                ))}
            </div>
        </>
    ) : (
        <EmptyState label="No status data" />
    )}
</Panel>

                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">By stage</p>
                                <HBarList data={leadStageData} />
                            </Panel>

                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">By source</p>
                                <HBarList data={sourceData} />
                            </Panel>

                            {/* <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">By country</p>
                                <HBarList data={countryData} />
                            </Panel> */}

                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">By visa stage</p>
                                <HBarList data={visaStageData} />
                            </Panel>

                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">By gender</p>
                                <HBarList data={genderData} />
                            </Panel>
                        </div>
                    </section>

                    {/* ── Intake season + Students ── */}
                    <section>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Leads by intake season</p>
                                {intakeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <PieChart>
                                            <Pie data={intakeData} cx="50%" cy="50%" innerRadius={38} outerRadius={74} paddingAngle={4} cornerRadius={5}
                                                dataKey="value" stroke="#111827" strokeWidth={2}
                                                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                                {intakeData.map((_, index) => (
                                                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState label="No intake data" />}
                            </Panel>
                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Students by status</p>
                                <HBarList data={studentStatusData} />
                            </Panel>
                        </div>
                    </section>

                    {/* ── Courses & Loans ── */}
                    <section>
                        <SectionHeader eyebrow="Conversion" title="Course applications & loans" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Course application status</p>
                                <HBarList data={courseStatusData} />
                            </Panel>
                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Top universities applied to</p>
                                <HBarList data={topUniversities.map((u) => ({ label: u.universityName, count: u.applications }))} />
                            </Panel>
                        </div>

                        <div className="mt-5">
                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">
                                    Loan breakdown — total approved/disbursed: <span className="text-slate-700 dark:text-slate-200">{fmtCurrency(data.loans.totalApproved)}</span>
                                </p>
                                <LoanBreakdownTable rows={data.loans.byStatus} />
                            </Panel>
                        </div>
                    </section>

                    {/* ── Activity ── */}
                    <section>
                        <SectionHeader eyebrow="Engagement" title="Activity" subtitle="Remarks, documents and follow-ups within scope" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Remarks by type</p>
                                <HBarList data={remarksByType} />
                            </Panel>

                            {/* <Panel>
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Follow-ups</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] px-3 py-3 text-center">
                                        <span className="block text-xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">{data.activity.totalFollowupsLogged}</span>
                                        <span className="text-[11px] text-slate-400">Logged</span>
                                    </div>
                                    <div className="rounded-xl border border-amber-200 dark:border-amber-500/15 bg-amber-50/50 dark:bg-amber-500/[0.04] px-3 py-3 text-center">
                                        <span className="block text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{data.activity.upcomingFollowups}</span>
                                        <span className="text-[11px] text-slate-400">Upcoming (7d)</span>
                                    </div>
                                    <div className="rounded-xl border border-red-200 dark:border-red-500/15 bg-red-50/50 dark:bg-red-500/[0.04] px-3 py-3 text-center">
                                        <span className="block text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">{data.activity.overdueFollowups}</span>
                                        <span className="text-[11px] text-slate-400">Overdue</span>
                                    </div>
                                </div>
                            </Panel> */}
                        </div>

                        {filters.includeRecent && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                                <Panel>
                                    <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Recent timeline activity</p>
                                    {!data.activity.recentTimelines?.length ? <EmptyState label="No recent timeline entries" /> : (
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {data.activity.recentTimelines.map((t) => (
                                                <div key={t.id} className="border-b border-slate-100 dark:border-white/[0.04] pb-3 last:border-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                                                            {t.lead?.studentName ?? "Unknown lead"}
                                                        </span>
                                                        <span className="text-[10.5px] text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        {t.createdBy && <span className="text-[10.5px] text-slate-400">by {t.createdBy.name}</span>}
                                                        {t.nextFollowup && (
                                                            <Badge label={`Next: ${new Date(t.nextFollowup).toLocaleDateString()}`} color="#e8a23d" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Panel>

                                <Panel>
                                    <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Recent remarks</p>
                                    {!data.activity.recentRemarks?.length ? <EmptyState label="No recent remarks" /> : (
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                            {data.activity.recentRemarks.map((r) => (
                                                <div key={r.id} className="border-b border-slate-100 dark:border-white/[0.04] pb-3 last:border-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                                                            {r.title || r.lead?.studentName || "Remark"}
                                                        </span>
                                                        <Badge label={titleCase(r.type)} color={STATUS_COLORS[r.type] ?? "#FF746C"} />
                                                    </div>
                                                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{r.message}</p>
                                                    {r.createdBy && <span className="text-[10.5px] text-slate-400 mt-1 block">by {r.createdBy.name} · {new Date(r.createdAt).toLocaleDateString()}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Panel>
                            </div>
                        )}
                    </section>

                    {/* ── Branch Leaderboard ── */}
                    <section>
                        <SectionHeader eyebrow="Locations" title="Branch leaderboard"
                            subtitle="Ranked by total leads in the filtered scope" />
                        <Panel className="overflow-x-auto p-0">
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr className="border-b border-red-100 dark:border-red-500/10 bg-red-50/40 dark:bg-red-950/10">
                                        <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">#</th>
                                        <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">Branch</th>
                                        <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">Location</th>
                                        <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Total leads</th>
                                        <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Converted</th>
                                        <th className="px-5 py-3 text-center font-medium text-red-700 dark:text-red-300">Conversion rate</th>
                                        <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Students</th>
                                        <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">Visa approved</th>
                                        <th className="px-5 py-3 text-center font-medium text-red-700 dark:text-red-300">Visa rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branchLeaderboard.length === 0 ? (
                                        <tr><td colSpan={9} className="py-10 text-center text-slate-400">No branch data in scope</td></tr>
                                    ) : branchLeaderboard.map((b) => (
                                        <tr key={b.branchId} className="border-b border-red-100/60 dark:border-red-500/5 transition-colors hover:bg-red-50/40 dark:hover:bg-red-950/10">
                                            <td className="px-5 py-3 text-slate-400 font-medium">{b.rank}</td>
                                            <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">{b.branchName}</td>
                                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{[b.city, b.state].filter(Boolean).join(", ") || "—"}</td>
                                            <td className="px-5 py-3 text-right font-bold tabular-nums text-red-500">{b.totalLeads}</td>
                                            <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{b.convertedLeads}</td>
                                            <td className="px-5 py-3 text-center"><RatePill rate={b.conversionRate} /></td>
                                            <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{b.totalStudents}</td>
                                            <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{b.visaApproved}</td>
                                            <td className="px-5 py-3 text-center"><RatePill rate={b.visaApprovalRate} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Panel>
                    </section>

                    {/* ── Counselor Leaderboard ── */}
                    <section>
                        <SectionHeader eyebrow="Performance" title="Counselor leaderboard"
                            subtitle="Ranked by conversion rate, then total leads" />

                        {counselorLeaderboard.length > 0 && (
                            <Panel className="mb-5">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300 flex items-center gap-1.5">
                                    <Trophy className="w-3.5 h-3.5" /> Total leads by counselor
                                </p>
                                <ResponsiveContainer width="100%" height={Math.max(200, counselorLeaderboard.length * 36)}>
                                    <BarChart data={counselorLeaderboard.map((c) => ({ name: c.counselorName, leads: c.totalLeads }))}
                                        layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                                        <CartesianGrid horizontal={false} stroke="currentColor" className="text-red-100/40 dark:text-red-500/10" />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,116,108,.08)" }} />
                                        <Bar dataKey="leads" name="Total leads" radius={[0, 6, 6, 0]} barSize={16}>
                                            {counselorLeaderboard.map((entry, index) => (
                                                <Cell key={entry.counselorId} fill={RED_SERIES[index % RED_SERIES.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Panel>
                        )}

                        <Panel className="overflow-x-auto p-0">
                            <table className="w-full text-[12.5px]">
                                <thead>
                                    <tr className="border-b border-red-100 dark:border-red-500/10 bg-red-50/40 dark:bg-red-950/10">
                                        <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">#</th>
                                        <th className="px-4 py-3 text-left font-medium text-red-700 dark:text-red-300">Counselor</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Target</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">New (mo.)</th>
                                        <th className="px-4 py-3 text-center font-medium text-red-700 dark:text-red-300">Target %</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Total leads</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Converted</th>
                                        <th className="px-4 py-3 text-center font-medium text-red-700 dark:text-red-300">Conv. rate</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Students</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Visa OK</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Upcoming</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Overdue</th>
                                        <th className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-300">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {counselorLeaderboard.length === 0 ? (
                                        <tr><td colSpan={13} className="py-10 text-center text-slate-400">No counselor data in scope</td></tr>
                                    ) : counselorLeaderboard.map((c) => (
                                        <tr key={c.counselorId} className="border-b border-red-100/60 dark:border-red-500/5 transition-colors hover:bg-red-50/40 dark:hover:bg-red-950/10">
                                            <td className="px-4 py-2.5 text-slate-400 font-medium">{c.rank}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="block font-semibold text-slate-900 dark:text-slate-100">{c.counselorName}</span>
                                                <span className="block text-[10.5px] text-slate-400">{c.email}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">{c.monthlyTarget}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.newLeadsThisMonth}</td>
                                            <td className="px-4 py-2.5 text-center"><RatePill rate={c.monthlyTargetAchievement} /></td>
                                            <td className="px-4 py-2.5 text-right font-bold tabular-nums text-red-500">{c.totalLeads}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.convertedLeads}</td>
                                            <td className="px-4 py-2.5 text-center"><RatePill rate={c.conversionRate} /></td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.totalStudents}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.visaApproved}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-amber-600 dark:text-amber-400">{c.upcomingFollowups}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-red-600 dark:text-red-400">{c.overdueFollowups}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">{c.totalRemarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Panel>
                    </section>

                    {/* ── Footer ── */}
                    <div className="text-center text-[12px] text-slate-400 py-3">
                        Data from {filters.from ? new Date(filters.from).toLocaleDateString() : "start of year"} to {filters.to ? new Date(filters.to).toLocaleDateString() : "today"} ·{" "}
                        Date field: {titleCase(filters.dateField)} · Generated {new Date(data.meta.generatedAt).toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}