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
    Legend,
} from "recharts";
import {
    Users,
    FileCheck2,
    Building2,
    GraduationCap,
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
    ArrowUpRight,
    XCircle,
    Filter,
    X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Types — exactly matching the backend response shape
// ─────────────────────────────────────────────────────────────────────────

interface FilterOptions {
    counselors: { id: string; name: string; email: string }[];
    countries: (string | { id: string; name: string })[];
    sources: string[];
    leadStatuses: string[];
    leadStages: string[];
    visaStages: string[];
    visaStatuses: string[];
    loanStatuses: string[];
    intakeSeasons: string[];
}

interface BranchSummary {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    status: boolean;
    totalLeadsAllTime: number;
    leadsInPeriod: number;
    visaDetailsInPeriod: number;
    visaApprovedInPeriod: number;
    visaApprovalRate: number;
}

interface DashboardData {
    meta: {
        generatedAt: string;
        filters: Record<string, any>;
        note?: string;
    };
    filterOptions: FilterOptions;
    summary: {
        totalLeads: number;
        totalUniversities: number;
        newLeadsThisMonth: number;
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
        byDepositStatus: { depositStatus: string | null; count: number }[];
        byIhsStatus: { ihsStatus: string | null; count: number }[];
        byFeeStatus: { visaFeeStatus: string | null; count: number }[];
        byCasStatus: { casStatus: string | null; count: number }[];
        upcoming: {
            depositDeadlinesNext7Days: number;
            casDeadlinesNext7Days: number;
            universityStartsNext30Days: number;
        };
    };
    coursesByStatus: { status: string; count: number }[];
    loans: {
        byStatus: { status: string; count: number; totalAmount: number | string }[];
        breakdown: {
            status: string;
            count: number;
            totalAmount: number | string;
            avgAmount: number | string;
        }[];
    };
    branches: {
        summary: BranchSummary[];
        leadsByBranch: {
            branchId: string;
            branch: { name: string; city: string } | null;
            count: number;
        }[];
    };
    counselors: {
        topByLeadAssignments: {
            counselorId: string;
            counselor: { name: string; email: string } | null;
            assignedLeads: number;
        }[];
        all: {
            counselorId: string;
            counselor: { name: string; email: string } | null;
            assignedLeads: number;
        }[];
    };
}

// ─────────────────────────────────────────────────────────────────────────
// Filters state — matches every backend query param
// ─────────────────────────────────────────────────────────────────────────

interface Filters {
    branchId: string;
    counselorId: string;
    leadStatus: string;
    leadStage: string;
    visaStage: string;
    visaStatus: string;
    country: string;
    intakeSeason: string;
    source: string;
    loanStatus: string;
    from: string;
    to: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────

const RED_SERIES = ["#FF746C", "#F05F56", "#D94B43", "#B83933", "#8F2824", "#FF9C97", "#FFC4C1"];
const BAR_COLORS = ["#FF746C", "#F05F56", "#D94B43", "#B83933", "#8F2824", "#FF9C97", "#FFC4C1"];
const PIE_COLORS = ["#FF746C", "#FB7185", "#F87171", "#EA580C", "#DC2626", "#BE123C", "#991B1B"];
const CONVERSION_COLORS = ["#FF746C", "#F05F56", "#FB7185", "#D94B43", "#EA580C", "#B83933", "#8F2824"];
const PERFORMANCE_COLORS = ["#FF746C", "#F05F56", "#D94B43", "#B83933", "#8F2824", "#FB7185", "#F87171"];

const STATUS_COLORS: Record<string, string> = {
    NEW: "#6d5ef0", CONTACTED: "#5b7fe8", QUALIFIED: "#34b37e", CONVERTED: "#1f8f63",
    LOST: "#e15a5a", ACTIVE: "#34b37e", INACTIVE: "#8b8d9b", APPROVED: "#34b37e",
    REJECTED: "#e15a5a", PENDING: "#e8a23d", PAID: "#34b37e", REFUNDED: "#8b8d9b",
    WAIVED: "#a89bff", NOT_REQUIRED: "#8b8d9b", DISBURSED: "#6d5ef0",
    NOT_STARTED: "#8b8d9b", APPLIED: "#6d5ef0", UNDER_REVIEW: "#e8a23d",
    RECEIVED: "#34b37e", DOCUMENTS_PENDING: "#e8a23d", DECISION_PENDING: "#e8a23d",
    WITHDRAWN: "#8b8d9b",
};

const STAGE_LABEL: Record<string, string> = {
    INQUIRY: "Inquiry", DOCUMENTS: "Documents", APPLIED: "Applied", OFFER: "Offer",
    VISA: "Visa", ENROLLED: "Enrolled", LEAD_CREATED: "Lead created",
    APPLICATION_SUBMITTED: "App submitted", OFFER_RECEIVED: "Offer received",
    DEPOSIT_PAID: "Deposit paid", INTERVIEW_COMPLETED: "Interview done",
    CAS_RECEIVED: "CAS received", VISA_APPLIED: "Visa applied", VISA_APPROVED: "Visa approved",
};

const titleCase = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

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
            {data.slice(0, 8).map((item, i) => {
                const pct = Math.round((item.count / maxVal) * 100);
                const color = item.color ?? (colorFn ? colorFn(item.label) : RED_SERIES[i % RED_SERIES.length]);
                return (
                    <div key={item.label} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-[12px] text-slate-600 dark:text-slate-400">{titleCase(item.label)}</span>
                        <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                            <div className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}35` }} />
                        </div>
                        <span className="w-7 text-right text-[12px] font-semibold tabular-nums text-slate-700 dark:text-slate-300">{item.count}</span>
                    </div>
                );
            })}
        </div>
    );
}

function Kpi({ label, value, icon, hint, tone = "default" }: { label: string; value: string; icon: React.ReactNode; hint?: string; tone?: "default" | "good" | "urgent" }) {
    const toneColor = tone === "good" ? "#f87171" : tone === "urgent" ? "#dc2626" : "#fb7185";
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

function VisaApprovalPill({ rate }: { rate: number }) {
    const color = rate >= 60 ? "#34b37e" : rate >= 30 ? "#e8a23d" : "#e15a5a";
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-semibold tabular-nums"
            style={{ background: `${color}18`, color }}>
            <ArrowUpRight className="w-3 h-3" />
            {rate.toFixed(1)}%
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Filter bar — all 10 filters from backend
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
                className="appearance-none bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-3.5 pr-8 py-2 text-[12px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40 min-w-[130px]"
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

function FilterBar({
    filters,
    filterOptions,
    branchList,
    onChange,
    onRefresh,
    loading,
}: {
    filters: Filters;
    filterOptions: FilterOptions | null;
    branchList: { id: string; name: string }[];
    onChange: (f: Partial<Filters>) => void;
    onRefresh: () => void;
    loading: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    const clearAll = () => onChange({
        branchId: "", counselorId: "", leadStatus: "", leadStage: "",
        visaStage: "", visaStatus: "", country: "", intakeSeason: "",
        source: "", loanStatus: "",
    });

    const activeCount = [
        filters.branchId, filters.counselorId, filters.leadStatus, filters.leadStage,
        filters.visaStage, filters.visaStatus, filters.country, filters.intakeSeason,
        filters.source, filters.loanStatus,
    ].filter(Boolean).length;

    const getLabel = (key: keyof Filters, value: string): string => {
        if (key === "counselorId") {
            const c = filterOptions?.counselors.find((c) => c.id === value);
            return c ? c.name : value;
        }
        if (key === "branchId") {
            const b = branchList.find((b) => b.id === value);
            return b ? b.name : value;
        }
        return titleCase(value);
    };

    const activeFilters: { key: keyof Filters; label: string }[] = (
        Object.entries(filters) as [keyof Filters, string][]
    )
        .filter(([k, v]) => v && k !== "from" && k !== "to")
        .map(([k, v]) => ({ key: k, label: `${titleCase(k.replace(/([A-Z])/g, " $1"))}: ${getLabel(k, v)}` }));

    return (
        <div className="mb-7 space-y-3">
            {/* Primary row */}
            <div className="flex flex-wrap items-center gap-2.5">
                {/* Date range */}
                <input type="date" value={filters.from} onChange={(e) => onChange({ from: e.target.value })}
                    className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40" />
                <span className="text-slate-400 text-[12px]">to</span>
                <input type="date" value={filters.to} onChange={(e) => onChange({ to: e.target.value })}
                    className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40" />

                {/* Branch */}
                <SelectFilter
                    label="All branches"
                    value={filters.branchId}
                    onChange={(v) => onChange({ branchId: v })}
                    options={branchList.map((b) => ({ value: b.id, label: b.name }))}
                />

                {/* Toggle more filters */}
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
                    {loading ? "Loading…" : "Refresh"}
                </button>
            </div>

            {/* Expanded filters */}
            {expanded && (
                <div className="bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Filter by</p>
                    <div className="flex flex-wrap gap-2.5">
                        {filterOptions && (
                            <>
                                <SelectFilter label="Counselor" value={filters.counselorId} onChange={(v) => onChange({ counselorId: v })}
                                    options={filterOptions.counselors.map((c) => ({ value: c.id, label: c.name }))} />
                                <SelectFilter label="Lead status" value={filters.leadStatus} onChange={(v) => onChange({ leadStatus: v })}
                                    options={filterOptions.leadStatuses.map((s) => ({ value: s, label: titleCase(s) }))} />
                                <SelectFilter label="Lead stage" value={filters.leadStage} onChange={(v) => onChange({ leadStage: v })}
                                    options={filterOptions.leadStages.map((s) => ({ value: s, label: STAGE_LABEL[s] ?? titleCase(s) }))} />
                                <SelectFilter label="Visa stage" value={filters.visaStage} onChange={(v) => onChange({ visaStage: v })}
                                    options={filterOptions.visaStages.map((s) => ({ value: s, label: STAGE_LABEL[s] ?? titleCase(s) }))} />
                                <SelectFilter label="Visa status" value={filters.visaStatus} onChange={(v) => onChange({ visaStatus: v })}
                                    options={filterOptions.visaStatuses.map((s) => ({ value: s, label: titleCase(s) }))} />
                                <SelectFilter label="Country" value={filters.country} onChange={(v) => onChange({ country: v })}
                                    options={filterOptions.countries.map((c) =>
                                        typeof c === "string"
                                            ? { value: c, label: c }
                                            : { value: c.name, label: c.name }
                                    )} />
                                <SelectFilter label="Intake season" value={filters.intakeSeason} onChange={(v) => onChange({ intakeSeason: v })}
                                    options={filterOptions.intakeSeasons.map((s) => ({ value: s, label: titleCase(s) }))} />
                                <SelectFilter label="Source" value={filters.source} onChange={(v) => onChange({ source: v })}
                                    options={filterOptions.sources.map((s) => ({ value: s, label: titleCase(s) }))} />
                                <SelectFilter label="Loan status" value={filters.loanStatus} onChange={(v) => onChange({ loanStatus: v })}
                                    options={filterOptions.loanStatuses.map((s) => ({ value: s, label: titleCase(s) }))} />
                            </>
                        )}
                        {!filterOptions && (
                            <p className="text-[12px] text-slate-400">Loading filter options…</p>
                        )}
                    </div>
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

function LoanBreakdownTable({ breakdown }: { breakdown: DashboardData["loans"]["breakdown"] }) {
    const fmt = (n: number | string) => {
        const num = Number(n ?? 0);
        if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
        if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
        if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
        return `₹${num.toFixed(0)}`;
    };
    if (!breakdown.length) return <EmptyState label="No loan data" />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
                <thead>
                    <tr className="border-b border-red-100 dark:border-red-500/10">
                        <th className="pb-2 text-left font-medium text-red-700 dark:text-red-300">Status</th>
                        <th className="pb-2 text-right font-medium text-red-700 dark:text-red-300">Count</th>
                        <th className="pb-2 text-right font-medium text-red-700 dark:text-red-300">Total</th>
                        <th className="pb-2 text-right font-medium text-red-700 dark:text-red-300">Avg</th>
                    </tr>
                </thead>
                <tbody>
                    {breakdown.map((r, i) => (
                        <tr key={r.status} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                            <td className="py-2">
                                <Badge label={titleCase(r.status)} color={STATUS_COLORS[r.status] ?? BAR_COLORS[i % BAR_COLORS.length]} />
                            </td>
                            <td className="py-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-200">{r.count}</td>
                            <td className="py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmt(r.totalAmount)}</td>
                            <td className="py-2 text-right tabular-nums text-slate-500 dark:text-slate-500">{fmt(r.avgAmount)}</td>
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

export default function OverallReports() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    const [filters, setFilters] = useState<Filters>({
        branchId: "", counselorId: "", leadStatus: "", leadStage: "",
        visaStage: "", visaStatus: "", country: "", intakeSeason: "",
        source: "", loanStatus: "", from: startOfYear, to: todayStr,
    });

    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [branchList, setBranchList] = useState<{ id: string; name: string }[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            // Only append non-empty filter values
            (Object.entries(filters) as [keyof Filters, string][]).forEach(([k, v]) => {
                if (v) params.set(k, v);
            });

            const res = await fetch(`/api/report/dashboard/overview?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? "Unknown error");
            console.log(json.data, "datta");

            setData(json.data);
            if (json.data?.branches?.summary?.length) {
                setBranchList(
                    json.data.branches.summary.map((b: BranchSummary) => ({ id: b.id, name: b.name }))
                );
            }
        } catch (err: any) {
            setError(err.message ?? "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Initial load only
    useEffect(() => { fetchData(); }, []); // eslint-disable-line

    const handleFilterChange = (partial: Partial<Filters>) =>
        setFilters((prev) => ({ ...prev, ...partial }));

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
    const leadsOverTime = useMemo(() => {
        if (!data) return [];
        return data.leads.overTime.map((r) => ({
            month: r.month.slice(5),
            leads: r.count,
        }));
    }, [data]);

    const leadStatusData = data?.leads.byStatus.map((r) => ({ name: r.status, value: r.count })) ?? [];
    const leadStageData = data?.leads.byStage.map((r) => ({ label: STAGE_LABEL[r.stage] ?? r.stage, count: r.count })) ?? [];
    const sourceData = data?.leads.bySource.map((r) => ({ label: r.source ?? "Unknown", count: r.count })) ?? [];
    const countryData = data?.leads.byCountry.filter((r) => r.country).map((r) => ({ label: r.country!, count: r.count })) ?? [];
    const visaStageData = data?.leads.byVisaStage.map((r) => ({ label: STAGE_LABEL[r.stage] ?? r.stage, count: r.count })) ?? [];
    const counselorData = data?.counselors.topByLeadAssignments.map((c) => ({ name: c.counselor?.name ?? "Unknown", leads: c.assignedLeads })) ?? [];
    const branchSummary = data?.branches.summary ?? [];
    const visaStatusData = data?.visa.byStatus.map((r) => ({ name: r.status.replace(/_/g, " "), raw: r.status, value: r.count })) ?? [];
    const depositStatusData = data?.visa.byDepositStatus.map((r) => ({ label: r.depositStatus ?? "Unspecified", count: r.count })) ?? [];
    const casStatusData = data?.visa.byCasStatus.map((r) => ({ label: r.casStatus ?? "Unspecified", count: r.count })) ?? [];
    const feeStatusData = data?.visa.byFeeStatus.map((r) => ({ label: r.visaFeeStatus ?? "Unspecified", count: r.count })) ?? [];
    const ihsStatusData = data?.visa.byIhsStatus.map((r) => ({ label: r.ihsStatus ?? "Unspecified", count: r.count })) ?? [];
    const loanData = data?.loans.byStatus.map((r) => ({ name: r.status, value: r.count, amount: Number(r.totalAmount ?? 0) })) ?? [];
    const coursesData = data?.coursesByStatus.map((r) => ({ label: r.status, count: r.count })) ?? [];

    const branchVisaChartData = [...branchSummary]
        .filter((b) => b.leadsInPeriod > 0)
        .sort((a, b) => b.visaApprovalRate - a.visaApprovalRate)
        .map((b) => ({
            name: b.name.length > 12 ? b.name.slice(0, 12) + "…" : b.name,
            fullName: b.name,
            rate: b.visaApprovalRate,
            visaTotal: b.visaDetailsInPeriod,
            visaApproved: b.visaApprovedInPeriod,
            leads: b.leadsInPeriod,
        }));

    // All counselors list (for full counselor section)
    const allCounselorData = data?.counselors.all.map((c) => ({
        name: c.counselor?.name ?? "Unknown",
        email: c.counselor?.email ?? "",
        leads: c.assignedLeads,
    })) ?? [];

    return (
        <div className="min-h-screen bg-[#f7f7fa] dark:bg-[#0d0e13] p-5 sm:p-7">
            {/* Page title */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">CRM Dashboard</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {data ? `Updated ${new Date(data.meta.generatedAt).toLocaleTimeString()}` : "Overview of leads & visas"}
                    </p>
                </div>
            </div>

            <FilterBar
                filters={filters}
                filterOptions={data?.filterOptions ?? null}
                branchList={branchList}
                onChange={handleFilterChange}
                onRefresh={fetchData}
                loading={loading}
            />

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
                            <Kpi label="Universities" value={fmtNum(data.summary.totalUniversities)}
                                icon={<GraduationCap className="w-4 h-4" />} />
                            <Kpi label="Visas approved" value={fmtNum(data.summary.visaApproved)}
                                icon={<BadgeCheck className="w-4 h-4" />} tone="good"
                                hint={`${data.summary.visaApprovalRate}% approval rate`} />
                            <Kpi label="Visas rejected" value={fmtNum(data.summary.visaRejected)}
                                icon={<XCircle className="w-4 h-4" />} tone="urgent" />
                            <Kpi label="Visa records tracked" value={fmtNum(data.summary.totalVisaDetails)}
                                icon={<FileCheck2 className="w-4 h-4" />} />
                            <Kpi label="Loan amount approved" value={fmt(data.summary.totalLoanAmountApproved)}
                                icon={<CreditCard className="w-4 h-4" />} />
                            <Kpi label="Upcoming follow-ups" value={fmtNum(data.summary.upcomingFollowups)}
                                icon={<CalendarClock className="w-4 h-4" />} hint="Next 7 days" tone="urgent" />
                            <Kpi label="Active branches" value={String(branchSummary.filter((b) => b.status).length)}
                                icon={<Building2 className="w-4 h-4" />} />
                        </div>
                    </section>

                    {/* ── Visa Pipeline Hero ── */}
                    <section>
                        <div className="rounded-2xl bg-[#15161d] p-6 sm:p-7 relative overflow-hidden border border-red-500/10">
                            <div className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{ backgroundImage: `radial-gradient(circle at 15% 20%, rgba(248,113,113,.55) 0%, transparent 42%), radial-gradient(circle at 85% 80%, rgba(185,28,28,.40) 0%, transparent 38%)` }} />
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-red-900/10 pointer-events-none" />
                            <div className="relative flex flex-col gap-6">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
                                            <Plane className="w-3.5 h-3.5" /> Visa pipeline
                                        </span>
                                        <h2 className="text-white text-[19px] font-semibold mt-1.5">Where every visa stands right now</h2>
                                        {data.meta.note && <p className="text-[11.5px] text-white/40 mt-1">{data.meta.note}</p>}
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

                                {/* Upcoming deadlines */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { icon: <Wallet className="w-4 h-4" />, value: data.visa.upcoming.depositDeadlinesNext7Days, label: "Deposit deadlines · next 7 days", color: "red" },
                                        { icon: <FileClock className="w-4 h-4" />, value: data.visa.upcoming.casDeadlinesNext7Days, label: "CAS deadlines · next 7 days", color: "rose" },
                                        { icon: <CalendarDays className="w-4 h-4" />, value: data.visa.upcoming.universityStartsNext30Days, label: "University starts · next 30 days", color: "red" },
                                    ].map((item, i) => (
                                        <div key={i} className={`rounded-xl border border-${item.color}-400/10 bg-${item.color}-500/5 px-4 py-3.5 flex items-center gap-3 backdrop-blur-sm`}>
                                            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-${item.color}-500/15 text-${item.color}-300`}>{item.icon}</span>
                                            <div>
                                                <span className="block text-xl font-bold text-white tabular-nums">{item.value}</span>
                                                <span className="text-[12px] text-white/55">{item.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Visa status badges */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                                    <div className="rounded-xl border border-red-400/10 bg-red-500/[0.03] px-4 py-4">
                                        <p className="mb-3 text-[12px] font-medium text-red-200/80">By visa status</p>
                                        <div className="flex flex-wrap gap-2">
                                            {visaStatusData.length === 0
                                                ? <span className="text-[12px] text-white/40">No visa records yet</span>
                                                : visaStatusData.map((d, i) => (
                                                    <Badge key={d.name} label={`${titleCase(d.name)} · ${d.value}`}
                                                        color={STATUS_COLORS[d.raw] ?? RED_SERIES[i % RED_SERIES.length]} />
                                                ))}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-rose-400/10 bg-rose-500/[0.03] px-4 py-4">
                                        <p className="mb-3 text-[12px] font-medium text-rose-200/80">By deposit status</p>
                                        <div className="flex flex-wrap gap-2">
                                            {depositStatusData.length === 0
                                                ? <span className="text-[12px] text-white/40">No deposit data yet</span>
                                                : depositStatusData.map((d, i) => (
                                                    <Badge key={d.label} label={`${titleCase(d.label)} · ${d.count}`}
                                                        color={STATUS_COLORS[d.label] ?? RED_SERIES[i % RED_SERIES.length]} />
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Leads Over Time ── */}
                    <section>
                        <SectionHeader eyebrow="Growth" title="Leads over time" subtitle="Monthly volume within selected date range" />
                        <Panel>
                            {leadsOverTime.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={leadsOverTime} margin={{ top: 8, right: 12, left: -16, bottom: 0 }} barGap={4}>
                                        <CartesianGrid vertical={false} stroke="currentColor" className="text-red-100/40 dark:text-red-500/10" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={32} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(239,68,68,.08)" }} />
                                        <Bar dataKey="leads" name="Leads" fill="#ef4444" radius={[5, 5, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <EmptyState label="No timeline data for this range" />}
                        </Panel>
                    </section>

                    {/* ── Lead Analytics ── */}
                    <section>
                        <SectionHeader eyebrow="Pipeline" title="Lead analytics" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">By status</p>
                                {leadStatusData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={190}>
                                            <PieChart>
                                                <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={54} outerRadius={78}
                                                    paddingAngle={3} dataKey="value" stroke="rgba(255,255,255,.06)" strokeWidth={1}>
                                                    {leadStatusData.map((entry, index) => (
                                                        <Cell key={entry.name} fill={RED_SERIES[index % RED_SERIES.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {leadStatusData.map((d, i) => (
                                                <Badge key={d.name} label={`${d.name}: ${d.value}`} color={RED_SERIES[i % RED_SERIES.length]} />
                                            ))}
                                        </div>
                                    </>
                                ) : <EmptyState label="No status data" />}
                            </Panel>

                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">By stage</p>
                                <HBarList data={leadStageData.map((item, i) => ({ ...item, color: RED_SERIES[i % RED_SERIES.length] }))} />
                            </Panel>

                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">By source</p>
                                <HBarList data={sourceData.map((item, i) => ({ ...item, color: RED_SERIES[i % RED_SERIES.length] }))} />
                            </Panel>
                        </div>
                    </section>

                    {/* ── Visa Stage + Country ── */}
                    <section>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Leads by visa stage</p>
                                <HBarList data={visaStageData.map((item, i) => ({ ...item, color: BAR_COLORS[i % BAR_COLORS.length] }))} />
                            </Panel>
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Leads by country</p>
                                <HBarList data={countryData.map((item, i) => ({ ...item, color: BAR_COLORS[i % BAR_COLORS.length] }))} />
                            </Panel>
                        </div>
                    </section>

                    {/* ── CAS Status & Intake Season ── */}
                    <section>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Visas by CAS status</p>
                                {casStatusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <BarChart data={casStatusData} margin={{ left: -20, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="currentColor" className="text-red-100/40 dark:text-red-500/10" />
                                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                                                tickFormatter={(v) => titleCase(v)} />
                                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,116,108,.08)" }} />
                                            <Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={28}>
                                                {casStatusData.map((_, index) => (
                                                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState label="No CAS status data" />}
                            </Panel>
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Leads by intake season</p>
                                {data.leads.byIntakeSeason.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <PieChart>
                                            <Pie
                                                data={data.leads.byIntakeSeason.map((r) => ({ name: r.season ?? "Unknown", value: r.count }))}
                                                cx="50%" cy="50%" innerRadius={38} outerRadius={74} paddingAngle={4} cornerRadius={5}
                                                dataKey="value" stroke="#111827" strokeWidth={2}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                                {data.leads.byIntakeSeason.map((_, index) => (
                                                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState label="No intake data" />}
                            </Panel>
                        </div>
                    </section>

                    {/* ── IHS & Visa Fee Status ── */}
                    <section>
                        <SectionHeader eyebrow="Visa" title="IHS & fee status" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">IHS status</p>
                                <HBarList data={ihsStatusData.map((item, i) => ({ ...item, color: BAR_COLORS[i % BAR_COLORS.length] }))} />
                            </Panel>
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Visa fee status</p>
                                <HBarList data={feeStatusData.map((item, i) => ({ ...item, color: BAR_COLORS[i % BAR_COLORS.length] }))} />
                            </Panel>
                        </div>
                    </section>

                    {/* ── Course Applications & Loans ── */}
                    <section>
                        <SectionHeader eyebrow="Conversion" title="Course applications & loans" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Course application status</p>
                                <HBarList data={coursesData.map((item, i) => ({ ...item, color: CONVERSION_COLORS[i % CONVERSION_COLORS.length] }))} />
                            </Panel>
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Loan status</p>
                                {loanData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={190}>
                                        <BarChart data={loanData} margin={{ left: -20 }}>
                                            <CartesianGrid vertical={false} stroke="currentColor" className="text-red-100/40 dark:text-red-500/10" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,116,108,.08)" }} />
                                            <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]} barSize={28}>
                                                {loanData.map((entry, index) => (
                                                    <Cell key={entry.name} fill={CONVERSION_COLORS[index % CONVERSION_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState label="No loan data" />}
                            </Panel>
                        </div>

                        {/* Loan breakdown table — new from backend loans.breakdown */}
                        {data.loans.breakdown.length > 0 && (
                            <div className="mt-5">
                                <Panel className="border border-red-500/10 dark:border-red-500/10">
                                    <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Loan breakdown (count · total · average)</p>
                                    <LoanBreakdownTable breakdown={data.loans.breakdown} />
                                </Panel>
                            </div>
                        )}
                    </section>

                    {/* ── Top Counselors ── */}
                    <section>
                        <SectionHeader eyebrow="Performance" title="Top counselors" subtitle="By lead assignments in filtered period" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Bar chart — top 10 */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Top 10 by assignments</p>
                                {counselorData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={Math.max(200, counselorData.length * 36)}>
                                        <BarChart data={counselorData} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                                            <CartesianGrid horizontal={false} stroke="currentColor" className="text-red-100/40 dark:text-red-500/10" />
                                            <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,116,108,.08)" }} />
                                            <Bar dataKey="leads" name="Assigned leads" radius={[0, 6, 6, 0]} barSize={16}>
                                                {counselorData.map((entry, index) => (
                                                    <Cell key={entry.name} fill={PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState label="No counselor data" />}
                            </Panel>

                            {/* Full counselor list */}
                            <Panel className="border border-red-500/10 dark:border-red-500/10">
                                <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">All counselors</p>
                                {allCounselorData.length === 0
                                    ? <EmptyState label="No counselors found" />
                                    : (
                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {allCounselorData.map((c, i) => (
                                                <div key={c.email + i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                                                    <div>
                                                        <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                                                        <p className="text-[11px] text-slate-400">{c.email}</p>
                                                    </div>
                                                    <Badge label={String(c.leads)} color={PERFORMANCE_COLORS[i % PERFORMANCE_COLORS.length]} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                            </Panel>
                        </div>
                    </section>

                    {/* ── Branch Overview ── */}
                    <section>
                        <SectionHeader
                            eyebrow="Locations" title="Branch overview"
                            subtitle="Visa approval rate = approved ÷ total visa records linked to branch leads in period" />

                        <div className="space-y-5">
                            {branchVisaChartData.length > 0 && (
                                <Panel className="border border-red-500/10 dark:border-red-500/10">
                                    <p className="mb-4 text-[13px] font-medium text-red-700 dark:text-red-300">Visa approval rate by branch (%)</p>
                                    <ResponsiveContainer width="100%" height={Math.max(180, branchVisaChartData.length * 40)}>
                                        <BarChart data={branchVisaChartData} layout="vertical" margin={{ left: 8, right: 48, top: 0, bottom: 0 }}>
                                            <CartesianGrid horizontal={false} stroke="currentColor" className="text-red-100/40 dark:text-red-500/10" />
                                            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`}
                                                tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" width={110}
                                                tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="bg-[#15161d] border border-white/10 rounded-xl px-3.5 py-2.5 shadow-xl text-[12px]">
                                                            <p className="font-medium text-slate-300 mb-1.5">{d.fullName}</p>
                                                            <p className="text-white/70">Leads in period: <span className="font-semibold text-white">{d.leads}</span></p>
                                                            <p className="text-white/70">Visa records: <span className="font-semibold text-white">{d.visaTotal}</span></p>
                                                            <p className="text-white/70">Approved: <span className="font-semibold text-white">{d.visaApproved}</span></p>
                                                            <p className="text-white/70">Approval rate: <span className="font-semibold text-green-400">{d.rate}%</span></p>
                                                        </div>
                                                    );
                                                }}
                                                cursor={{ fill: "rgba(255,116,108,.08)" }}
                                            />
                                            <Bar dataKey="rate" name="Approval %" radius={[0, 6, 6, 0]} barSize={18}>
                                                {branchVisaChartData.map((entry, index) => {
                                                    const color = entry.rate >= 60 ? "#34b37e" : entry.rate >= 30 ? "#e8a23d" : "#e15a5a";
                                                    return <Cell key={entry.name} fill={color} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                                        <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-[#34b37e] inline-block" /> ≥ 60% strong</span>
                                        <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-[#e8a23d] inline-block" /> 30–59% moderate</span>
                                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e15a5a] inline-block" /> &lt; 30% needs attention</span>
                                    </p>
                                </Panel>
                            )}

                            {/* Branch detail table */}
                            <Panel className="overflow-x-auto p-0 border border-red-500/10 dark:border-red-500/10">
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-red-100 dark:border-red-500/10 bg-red-50/40 dark:bg-red-950/10">
                                            <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">Branch</th>
                                            <th className="px-5 py-3 text-left font-medium text-red-700 dark:text-red-300">Location</th>
                                            <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">
                                                <span className="block">Leads</span>
                                                <span className="block text-[10px] font-normal text-red-400/70">in period / all-time</span>
                                            </th>
                                            <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">
                                                <span className="block">Visa records</span>
                                                <span className="block text-[10px] font-normal text-red-400/70">in period</span>
                                            </th>
                                            <th className="px-5 py-3 text-right font-medium text-red-700 dark:text-red-300">
                                                <span className="block">Visas approved</span>
                                                <span className="block text-[10px] font-normal text-red-400/70">in period</span>
                                            </th>
                                            <th className="px-5 py-3 text-center font-medium text-red-700 dark:text-red-300">Visa approval rate</th>
                                            <th className="px-5 py-3 text-center font-medium text-red-700 dark:text-red-300">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branchSummary.length === 0 ? (
                                            <tr><td colSpan={7} className="py-10 text-center text-slate-400">No branch data</td></tr>
                                        ) : (
                                            [...branchSummary]
                                                .sort((a, b) => b.visaApprovalRate - a.visaApprovalRate)
                                                .map((branch) => (
                                                    <tr key={branch.id} className="border-b border-red-100/60 dark:border-red-500/5 transition-colors hover:bg-red-50/40 dark:hover:bg-red-950/10">
                                                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">{branch.name}</td>
                                                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                                                            {[branch.city, branch.state].filter(Boolean).join(", ") || "—"}
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-bold tabular-nums text-red-500">
                                                            {branch.leadsInPeriod}
                                                            <span className="block text-[10px] font-normal text-slate-400">{branch.totalLeadsAllTime} total</span>
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-bold tabular-nums text-rose-500">{branch.visaDetailsInPeriod}</td>
                                                        <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-300">{branch.visaApprovedInPeriod}</td>
                                                        <td className="px-5 py-3 text-center">
                                                            {branch.visaDetailsInPeriod > 0
                                                                ? <VisaApprovalPill rate={branch.visaApprovalRate} />
                                                                : <span className="text-[11px] text-slate-400">—</span>}
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            <Badge label={branch.status ? "Active" : "Inactive"} color={branch.status ? "#FF746C" : "#94A3B8"} />
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </Panel>
                        </div>
                    </section>

                    {/* ── Footer ── */}
                    <div className="text-center text-[12px] text-slate-400 py-3">
                        Data from {new Date(filters.from).toLocaleDateString()} to {new Date(filters.to).toLocaleDateString()} ·{" "}
                        {filters.branchId ? "Branch filtered" : "All branches"}
                        {data.meta.note && (
                            <span className="block mt-0.5 text-slate-300 dark:text-slate-600">{data.meta.note}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}