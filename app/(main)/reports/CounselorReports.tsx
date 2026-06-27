"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, ComposedChart,
    Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import {
    Users, FileCheck2, GraduationCap, CreditCard, CalendarClock,
    TrendingUp, BadgeCheck, AlertCircle, RefreshCw, Fingerprint,
    CalendarDays, ShieldAlert, Plane, Trophy, Star, ArrowUpRight,
    ArrowDownRight, Minus, X, MessageSquare, Phone, FileText,
    Clock, Target, Activity, BookOpen, Stethoscope, Landmark,
    CheckCircle2, XCircle, ChevronRight, Mail, Award, Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CounselorProfile {
    id: string;
    name: string;
    email: string;
    monthlyTarget: number | null;
    role: { id: string; name: string };
    branches: { id: string; name: string; code: string; city?: string | null; state?: string | null }[];
    createdAt: string;
}

interface CounselorAnalytics {
    profile: CounselorProfile | null;
    summary: {
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
        assignedBreakdown: {
            total: number; primary: number; shared: number;
            byStatus: Record<string, number>;
        };
    };
    students: {
        byStatus: { status: string; count: number }[];
        overTime: { month: string; count: number }[];
    };
    followups: {
        upcoming7Days: number;
        overdue: number;
        recentActivity: {
            id: string; description: string; nextFollowup: string | null; createdAt: string;
            lead: { id: string; firstName: string; lastName: string | null; email: string; phone: string; status: string } | null;
        }[];
    };
    visa: {
        total: number; approved: number; rejected: number; approvalRate: number;
        byStatus: { status: string; count: number }[];
        byType: { visaType: string | null; count: number }[];
        upcoming: { biometricsNext7Days: number; interviewsNext7Days: number; expiringNext30Days: number };
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
        recentTimelines: any[];
    };
    mbbsLeads: { total: number; byStatus: { status: string; count: number }[] };
}

interface SingleCounselorData {
    meta: { generatedAt: string; mode: string; filters: any };
    counselor: CounselorAnalytics;
}

interface AllCounselorsData {
    meta: { generatedAt: string; mode: string; totalCounselors: number; filters: any };
    globalSummary: {
        totalLeads: number; totalStudents: number;
        convertedLeads: number; conversionRate: number;
        upcomingFollowups: number; overdueFollowups: number;
    };
    leaderboard: {
        rank: number; counselorId: string; counselorName: string; email: string;
        monthlyTarget: number | null; branches: { id: string; name: string; code: string }[];
        totalLeads: number; convertedLeads: number; conversionRate: number;
        newLeadsThisMonth: number; monthlyTargetAchievement: number;
        totalStudents: number; visaApproved: number; visaApprovalRate: number;
        upcomingFollowups: number; overdueFollowups: number;
        totalRemarks: number; totalMbbsLeads: number;
    }[];
    topThisMonth: {
        counselorId: string; counselorName: string;
        newLeadsThisMonth: number; monthlyTarget: number | null; monthlyTargetAchievement: number;
    }[];
    counselors: {
        counselorId: string; counselorName: string; email: string;
        monthlyTarget: number | null; role: any; branches: any[];
        analytics: CounselorAnalytics;
    }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same red brand palette as branches
// ─────────────────────────────────────────────────────────────────────────────

const RED_PALETTE = ["#ef4444", "#fb7185", "#f87171", "#dc2626", "#ea580c", "#b91c1c"];
const DATA_PALETTE = ["#4f6ef7", "#2dd4bf", "#f59e0b", "#a78bfa", "#34d399", "#fb7185", "#60a5fa"];

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────

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

const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
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

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl px-3.5 py-2.5 shadow-2xl text-[12px] border border-white/10 bg-[#0b0c14]">
            {label && <p className="font-medium mb-1.5 text-slate-400">{label}</p>}
            {payload.map((p: any, i: number) => (
                <p key={i} className="flex items-center gap-2 tabular-nums" style={{ color: p.color ?? p.fill }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color ?? p.fill }} />
                    {p.name}: <span className="font-semibold text-slate-100">{p.value?.toLocaleString()}</span>
                </p>
            ))}
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <AlertCircle className="w-6 h-6 mb-2 opacity-40" />
            <p className="text-[13px]">{label}</p>
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
                        <span className="w-28 shrink-0 truncate text-[12px] text-slate-500 dark:text-slate-400">{titleCase(item.label)}</span>
                        <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
                        </div>
                        <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-slate-900 dark:text-slate-100">{item.count}</span>
                    </div>
                );
            })}
        </div>
    );
}

function Kpi({
    label, value, icon, hint, delta, tone = "primary",
}: {
    label: string; value: string; icon: React.ReactNode; hint?: string; delta?: number;
    tone?: "primary" | "danger" | "rose" | "warning" | "success" | "default";
}) {
    const toneClasses = {
        primary: { icon: "bg-red-500/10 text-red-500", value: "text-red-500" },
        danger: { icon: "bg-red-600/10 text-red-600", value: "text-red-600" },
        rose: { icon: "bg-rose-500/10 text-rose-500", value: "text-rose-500" },
        warning: { icon: "bg-orange-500/10 text-orange-500", value: "text-orange-500" },
        success: { icon: "bg-emerald-500/10 text-emerald-500", value: "text-emerald-500" },
        default: { icon: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300", value: "text-slate-900 dark:text-white" },
    }[tone];

    return (
        <div className="group flex flex-col gap-2.5 rounded-2xl border border-red-500/10 bg-white px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/5 dark:bg-[#1a1b24]">
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${toneClasses.icon}`}>{icon}</span>
            </div>
            <span className={`text-2xl font-bold tracking-tight tabular-nums ${toneClasses.value}`}>{value}</span>
            {(hint || delta !== undefined) && (
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
    return <div className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.04] ${className}`} />;
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
// Target Progress Ring
// ─────────────────────────────────────────────────────────────────────────────

function TargetRing({ pct, label, sub }: { pct: number; label: string; sub: string }) {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const dash = Math.min(pct / 100, 1) * circ;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="8" />
                    <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="8"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[18px] font-bold text-red-500 tabular-nums">{Math.round(pct)}%</span>
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">of target</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Remark type icon
// ─────────────────────────────────────────────────────────────────────────────

function RemarkIcon({ type }: { type: string }) {
    const map: Record<string, { icon: React.ReactNode; color: string }> = {
        NOTE: { icon: <FileText className="w-3.5 h-3.5" />, color: "#4f6ef7" },
        FOLLOW_UP: { icon: <Clock className="w-3.5 h-3.5" />, color: "#f59e0b" },
        CALL: { icon: <Phone className="w-3.5 h-3.5" />, color: "#22c55e" },
        DOCUMENT: { icon: <FileCheck2 className="w-3.5 h-3.5" />, color: "#a78bfa" },
    };
    const m = map[type] ?? map.NOTE;
    return (
        <span className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: `${m.color}18`, color: m.color }}>
            {m.icon}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Counselor Detail View
// ─────────────────────────────────────────────────────────────────────────────

function CounselorDetail({ data, onBack }: { data: CounselorAnalytics; onBack: () => void }) {
    const { profile, summary, leads, students, followups, visa, loans, courses, activity, mbbsLeads } = data;

    const trend = useMemo(() => {
        const lm = Object.fromEntries(leads.overTime.map((r) => [r.month, r.count]));
        const sm = Object.fromEntries(students.overTime.map((r) => [r.month, r.count]));
        const months = [...new Set([...leads.overTime.map((r) => r.month), ...students.overTime.map((r) => r.month)])].sort();
        return months.map((m) => ({ month: m.slice(5), leads: lm[m] ?? 0, students: sm[m] ?? 0 }));
    }, [leads, students]);

    return (
        <div className="space-y-7">
            {/* Profile hero */}
            <div className="relative overflow-hidden rounded-2xl border border-red-500/10 bg-[#15161d] p-6">
                <div className="pointer-events-none absolute inset-0 opacity-20">
                    <div className="absolute left-[-10%] top-[-20%] h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
                    <div className="absolute bottom-[-20%] right-[-10%] h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
                </div>
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-300 text-xl font-bold shrink-0">
                            {profile?.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                            <h2 className="text-[20px] font-bold text-white">{profile?.name ?? "Counselor"}</h2>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1 text-[12px] text-slate-400">
                                    <Mail className="w-3 h-3" /> {profile?.email}
                                </span>
                                {profile?.role && (
                                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-400">
                                        {profile.role.name}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {profile?.branches?.map((b) => (
                                    <span key={b.id} className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300">
                                        {b.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Target ring */}
                    <div className="flex items-center gap-6">
                        <TargetRing
                            pct={summary.monthlyTargetAchievement}
                            label={`${summary.newLeadsThisMonth} / ${summary.monthlyTarget || "—"}`}
                            sub="Monthly target"
                        />
                        <button onClick={onBack}
                            className="flex items-center gap-1.5 self-start rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[12px] text-red-400 transition hover:bg-red-500/20">
                            <X className="w-3.5 h-3.5" /> Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Kpi label="Total Leads" value={fmtNum(summary.totalLeads)} icon={<Users className="h-4 w-4" />}
                    hint={`+${summary.newLeadsThisMonth} this month`} tone="primary" />
                <Kpi label="Converted" value={fmtNum(summary.convertedLeads)} icon={<BadgeCheck className="h-4 w-4" />}
                    hint={`${summary.conversionRate}% rate`} tone="success" />
                <Kpi label="Students" value={fmtNum(summary.totalStudents)} icon={<GraduationCap className="h-4 w-4" />}
                    hint={`+${summary.newStudentsThisMonth} this month`} tone="rose" />
                <Kpi label="Assigned Leads" value={fmtNum(summary.totalAssignedLeads)} icon={<Zap className="h-4 w-4" />}
                    hint={`${summary.primaryAssignedLeads} primary`} tone="warning" />
                <Kpi label="Visa Approved" value={fmtNum(summary.visaApproved)} icon={<FileCheck2 className="h-4 w-4" />}
                    hint={`${summary.visaApprovalRate}% rate`} tone="danger" />
                <Kpi label="Follow-ups (7d)" value={fmtNum(summary.upcomingFollowups)} icon={<CalendarClock className="h-4 w-4" />}
                    tone="warning" />
                <Kpi label="Overdue" value={fmtNum(summary.overdueFollowups)} icon={<AlertCircle className="h-4 w-4" />}
                    tone="danger" />
                <Kpi label="Loan Approved" value={fmtCurrency(summary.totalLoanAmountApproved)} icon={<Landmark className="h-4 w-4" />}
                    tone="rose" />
                <Kpi label="Total Remarks" value={fmtNum(summary.totalRemarks)} icon={<MessageSquare className="h-4 w-4" />}
                    tone="default" />
                <Kpi label="MBBS Leads" value={fmtNum(summary.totalMbbsLeads)} icon={<Stethoscope className="h-4 w-4" />}
                    tone="primary" />
            </div>

            {/* Assigned breakdown strip */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total Assigned", value: summary.totalAssignedLeads, color: "text-red-500" },
                    { label: "Primary Owner", value: summary.primaryAssignedLeads, color: "text-rose-400" },
                    { label: "Shared / Collab", value: summary.sharedAssignedLeads, color: "text-orange-400" },
                ].map((item) => (
                    <div key={item.label}
                        className="flex flex-col gap-1 rounded-2xl border border-red-500/10 bg-white px-4 py-3 dark:bg-[#1a1b24]">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className={`text-[22px] font-bold tabular-nums ${item.color}`}>{item.value}</span>
                    </div>
                ))}
            </div>

            {/* Visa urgency hero */}
            <div className="relative overflow-hidden rounded-2xl border border-red-500/10 bg-[#15161d] p-5">
                <div className="pointer-events-none absolute inset-0 opacity-20">
                    <div className="absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-red-500/20 blur-3xl" />
                </div>
                <div className="relative">
                    <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
                        <Plane className="h-3.5 w-3.5" /> Visa Pipeline
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                            { label: "Biometrics in 7 days", value: visa.upcoming.biometricsNext7Days, icon: <Fingerprint className="h-4 w-4" />, cls: "bg-red-500/10 text-red-400" },
                            { label: "Interviews in 7 days", value: visa.upcoming.interviewsNext7Days, icon: <CalendarDays className="h-4 w-4" />, cls: "bg-rose-500/10 text-rose-400" },
                            { label: "Expiring in 30 days", value: visa.upcoming.expiringNext30Days, icon: <ShieldAlert className="h-4 w-4" />, cls: "bg-orange-500/10 text-orange-400" },
                        ].map((item) => (
                            <div key={item.label}
                                className="flex items-center gap-3 rounded-xl border border-red-500/10 bg-white/[0.03] px-4 py-3 transition hover:border-red-500/20">
                                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.cls}`}>{item.icon}</span>
                                <div>
                                    <div className="text-xl font-bold tabular-nums text-white">{item.value}</div>
                                    <div className="mt-0.5 text-[11px] text-slate-400">{item.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Growth chart */}
            <Panel>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads & Students Over Time</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Monthly acquisition and conversion</p>
                    </div>
                    <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-1 text-[11px] font-medium text-red-400">Monthly Trend</span>
                </div>
                {trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <ComposedChart data={trend} margin={{ top: 8, right: 10, left: -18, bottom: 0 }} barGap={6}>
                            <CartesianGrid vertical={false} stroke="rgba(239,68,68,0.07)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                            <Bar dataKey="leads" name="Leads" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={18} />
                            <Line type="monotone" dataKey="students" name="Students" stroke="#fb7185" strokeWidth={3}
                                dot={{ r: 3, fill: "#fb7185", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#fb7185" }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : <EmptyState label="No timeline data available" />}
            </Panel>

            {/* Lead breakdowns */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* By status pie */}
                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Status</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Pipeline distribution</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Status</span>
                    </div>
                    {leads.byStatus.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={leads.byStatus.map((r) => ({ name: r.status, value: r.count }))}
                                        cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}
                                        dataKey="value" stroke="#1f2937" strokeWidth={2}>
                                        {leads.byStatus.map((_, i) => <Cell key={i} fill={RED_PALETTE[i % RED_PALETTE.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {leads.byStatus.map((r, i) => (
                                    <span key={r.status} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                                        style={{ background: `${RED_PALETTE[i % RED_PALETTE.length]}18`, color: RED_PALETTE[i % RED_PALETTE.length] }}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: RED_PALETTE[i % RED_PALETTE.length] }} />
                                        {r.status}: {r.count}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : <EmptyState label="No status data" />}
                </Panel>

                {/* By stage */}
                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Stage</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Funnel progression</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Stage</span>
                    </div>
                    <HBarList data={leads.byStage.map((r, i) => ({ label: r.stage, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
                </Panel>

                {/* By source */}
                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Leads by Source</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Acquisition channels</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Source</span>
                    </div>
                    <HBarList data={leads.bySource.map((r, i) => ({ label: r.source ?? "Unknown", count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
                </Panel>
            </div>

            {/* Students status + Visa status */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Students by Status</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Enrollment pipeline</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Students</span>
                    </div>
                    <HBarList data={students.byStatus.map((r, i) => ({ label: r.status, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
                </Panel>

                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Visa by Status</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Application status breakdown</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Visa</span>
                    </div>
                    <HBarList data={visa.byStatus.map((r, i) => ({ label: r.status, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
                </Panel>
            </div>

            {/* Courses + Universities */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Course Applications</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">By application status</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Courses</span>
                    </div>
                    <HBarList data={courses.byApplicationStatus.map((r, i) => ({ label: r.status, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
                </Panel>

                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Top Universities</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Applications by institution</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Universities</span>
                    </div>
                    <HBarList data={courses.topUniversities.map((u, i) => ({ label: u.universityName, count: u.applications, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
                </Panel>
            </div>

            {/* Activity + Loans */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Remarks breakdown */}
                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Activity Breakdown</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Remark types + timelines</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Activity</span>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 rounded-xl border border-red-500/10 bg-red-500/5 px-3 py-2.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Remarks</span>
                            <span className="text-[20px] font-bold text-red-500 tabular-nums">{summary.totalRemarks}</span>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl border border-rose-500/10 bg-rose-500/5 px-3 py-2.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Timelines Created</span>
                            <span className="text-[20px] font-bold text-rose-500 tabular-nums">{summary.totalTimelinesCreated}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {activity.remarksByType.map((r, i) => (
                            <div key={r.type} className="flex items-center gap-3">
                                <RemarkIcon type={r.type} />
                                <span className="flex-1 text-[12px] text-slate-600 dark:text-slate-300">{titleCase(r.type)}</span>
                                <span className="text-[12px] font-semibold tabular-nums text-slate-900 dark:text-white">{r.count}</span>
                            </div>
                        ))}
                        {!activity.remarksByType.length && <EmptyState label="No activity data" />}
                    </div>
                </Panel>

                {/* Loans */}
                <Panel>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Loan Pipeline</h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Education loan status breakdown</p>
                        </div>
                        <span className="rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-red-400">Loans</span>
                    </div>
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
                        <Landmark className="w-4 h-4 text-red-400" />
                        <div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Approved</p>
                            <p className="text-[18px] font-bold text-red-500 tabular-nums">{fmtCurrency(loans.totalApproved)}</p>
                        </div>
                    </div>
                    <HBarList data={loans.byStatus.map((r, i) => ({ label: r.status, count: r.count, color: RED_PALETTE[i % RED_PALETTE.length] }))} />
                </Panel>
            </div>

            {/* Recent follow-up activity */}
            <Panel>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">Recent Follow-up Activity</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Last 5 timeline entries</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-400">
                            <AlertCircle className="w-3 h-3" /> {summary.overdueFollowups} overdue
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-400">
                            <CalendarClock className="w-3 h-3" /> {summary.upcomingFollowups} upcoming
                        </span>
                    </div>
                </div>
                <div className="space-y-3">
                    {followups.recentActivity.length > 0 ? followups.recentActivity.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 rounded-xl border border-red-500/10 bg-red-500/[0.02] p-3 transition hover:border-red-500/20">
                            <div className="mt-0.5 h-2 w-2 rounded-full bg-red-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-[12px] text-slate-700 dark:text-slate-200 line-clamp-2">{item.description}</p>
                                {item.lead && (
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {item.lead.firstName} {item.lead.lastName} · {item.lead.phone}
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
                    )) : <EmptyState label="No recent activity" />}
                </div>
            </Panel>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// All Counselors View
// ─────────────────────────────────────────────────────────────────────────────

function AllCounselorsView({
    data, selectedId, onSelect,
}: {
    data: AllCounselorsData;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}) {
    const { globalSummary, leaderboard, topThisMonth, counselors } = data;

    const selectedCounselor = selectedId
        ? counselors.find((c) => c.counselorId === selectedId)
        : null;

    return (
        <div className="space-y-7">
            {/* Global summary */}
            <div className="relative overflow-hidden rounded-2xl border border-red-500/10 bg-[#15161d] p-6">
                <div className="pointer-events-none absolute inset-0 opacity-20">
                    <div className="absolute left-[-10%] top-[-20%] h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
                    <div className="absolute bottom-[-20%] right-[-10%] h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
                </div>
                <div className="relative">
                    <div className="mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-red-300" />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300">
                            Team overview — {data.meta.totalCounselors} counselors
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                        {[
                            { label: "Assigned Leads", value: fmtNum(globalSummary.totalLeads), color: "text-red-400" },
                            { label: "Total students", value: fmtNum(globalSummary.totalStudents), color: "text-rose-400" },
                            { label: "Converted", value: fmtNum(globalSummary.convertedLeads), color: "text-red-500" },
                            { label: "Conversion rate", value: `${globalSummary.conversionRate}%`, color: "text-orange-400" },
                            { label: "Upcoming follow-ups", value: fmtNum(globalSummary.upcomingFollowups), color: "text-amber-400" },
                            { label: "Overdue follow-ups", value: fmtNum(globalSummary.overdueFollowups), color: "text-rose-500" },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className={`text-[22px] font-bold tracking-tight tabular-nums ${item.color}`}>{item.value}</div>
                                <div className="mt-0.5 text-[12px] text-slate-400">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top this month */}
            <section>
                <SectionHeader eyebrow="This Month" title="Monthly leaders" subtitle="Top 5 counselors by new leads this month" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {topThisMonth.map((c, i) => (
                        <div key={c.counselorId}
                            className="group relative overflow-hidden rounded-2xl border border-red-500/10 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/5 dark:bg-[#1a1b24]">
                            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-red-500/5 blur-2xl transition group-hover:bg-red-500/10" />
                            <div className="relative">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? "border border-red-300 bg-red-500/10 text-red-500" : "border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"}`}>
                                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                    </span>
                                    <span className="text-[12px] font-bold tabular-nums text-red-500">+{c.newLeadsThisMonth}</span>
                                </div>
                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{c.counselorName}</p>
                                {c.monthlyTarget ? (
                                    <div className="mt-2">
                                        <div className="mb-1 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400">Target: {c.monthlyTarget}</span>
                                            <span className="text-[10px] font-medium text-red-400">{Math.round(c.monthlyTargetAchievement)}%</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                                            <div className="h-full rounded-full bg-red-500 transition-all duration-700"
                                                style={{ width: `${Math.min(c.monthlyTargetAchievement, 100)}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-1 text-[11px] text-slate-400">No target set</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Leaderboard table */}
            <section>
                <SectionHeader eyebrow="Rankings" title="Counselor leaderboard" subtitle="Ranked by conversion rate" />
                <Panel className="overflow-x-auto p-0">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-red-500/10">
                                {["Rank", "Counselor", "Branch", "Leads", "Converted", "Conversion", "Visa OK", "Students", "Follow-ups", "Overdue", "MBBS", ""].map((h) => (
                                    <th key={h} className={`px-4 py-3 text-left text-[12px] font-medium text-slate-500 dark:text-slate-400 ${["Leads", "Converted", "Conversion", "Visa OK", "Students", "Follow-ups", "Overdue", "MBBS"].includes(h) ? "text-right" : ""}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((c) => (
                                <tr key={c.counselorId}
                                    onClick={() => onSelect(selectedId === c.counselorId ? null : c.counselorId)}
                                    className={`cursor-pointer border-b border-red-500/5 transition-all hover:bg-red-500/5 ${selectedId === c.counselorId ? "ring-1 ring-inset ring-red-500/20" : ""}`}>
                                    <td className="px-4 py-3">
                                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${c.rank <= 3 ? "border border-red-300 bg-red-500/10 text-red-500" : "border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"}`}>
                                            {c.rank === 1 ? "🥇" : c.rank === 2 ? "🥈" : c.rank === 3 ? "🥉" : `#${c.rank}`}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[12px] font-bold text-red-500">
                                                {c.counselorName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{c.counselorName}</p>
                                                <p className="text-[11px] text-slate-400">{c.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400">
                                        {c.branches.map((b) => b.name).join(", ") || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums text-red-500">{c.totalLeads}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-rose-400">{c.convertedLeads}</td>
                                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${c.conversionRate >= 50 ? "text-emerald-500" : "text-slate-500 dark:text-slate-400"}`}>
                                        {c.conversionRate}%
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-red-400">{c.visaApproved}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.totalStudents}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-amber-500">{c.upcomingFollowups}</td>
                                    <td className={`px-4 py-3 text-right tabular-nums ${c.overdueFollowups > 0 ? "font-semibold text-red-500" : "text-slate-400"}`}>
                                        {c.overdueFollowups}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{c.totalMbbsLeads}</td>
                                    <td className="px-4 py-3">
                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Panel>
                {!selectedId && (
                    <p className="mt-3 text-center text-[12px] text-slate-500 dark:text-slate-400">
                        Click any row to drill into that counselor's full analytics
                    </p>
                )}
            </section>

            {/* Bar chart: leads by counselor */}
            {!selectedId && (
                <section>
                    <SectionHeader eyebrow="Analytics" title="Lead volume by counselor" />
                    <Panel>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart
                                data={leaderboard.slice(0, 12).map((c) => ({
                                    name: c.counselorName.split(" ")[0],
                                    leads: c.totalLeads,
                                    converted: c.convertedLeads,
                                }))}
                                margin={{ left: -8, right: 8, top: 4, bottom: 0 }} barGap={4}>
                                <CartesianGrid vertical={false} stroke="rgba(239,68,68,0.07)" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={32} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(239,68,68,.05)" }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
                                <Bar dataKey="leads" name="Leads" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="converted" name="Converted" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Panel>
                </section>
            )}

            {/* Drilldown */}
            {selectedCounselor && (
                <section>
                    <SectionHeader
                        eyebrow="Counselor detail"
                        title={selectedCounselor.counselorName}
                        subtitle={`Deep analytics · ${selectedCounselor.email}`}
                    />
                    <CounselorDetail data={selectedCounselor.analytics} onBack={() => onSelect(null)} />
                </section>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────

export default function CounselorReports() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    const [filters, setFilters] = useState({ from: startOfYear, to: todayStr, branchId: "" });

    // All counselors
    const [allData, setAllData] = useState<AllCounselorsData | null>(null);
    const [allLoading, setAllLoading] = useState(true);
    const [allError, setAllError] = useState<string | null>(null);
    const [selectedCounselor, setSelectedCounselor] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setAllLoading(true);
        setAllError(null);
        try {
            const params = new URLSearchParams({ from: filters.from, to: filters.to });
            if (filters.branchId) params.set("branchId", filters.branchId);
            const res = await fetch(`/api/report/dashboard/counselor?${params}`);
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

    useEffect(() => { fetchAll(); }, []);

    const handleRefresh = () => { fetchAll(); };

    return (
        <div className="min-h-screen bg-white p-5 font-sans text-slate-900 sm:p-7 dark:bg-[#0f1117] dark:text-slate-100">
            {/* Page header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">Counselor Reports</h1>
                    <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                        {allData
                            ? `${allData.meta.totalCounselors} counselors · updated ${new Date(allData.meta.generatedAt).toLocaleTimeString()}`
                            : "Counselor-level CRM analytics"}
                    </p>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-red-500/10 bg-white/70 p-2 backdrop-blur-sm dark:border-red-500/10 dark:bg-[#1a1b24]/80">
                    <input type="date" value={filters.from}
                        onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
                        className="rounded-xl border border-red-200/40 bg-white px-3.5 py-2 text-[13px] text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#232530] dark:text-slate-200" />
                    <span className="px-1 text-[12px] text-slate-400">to</span>
                    <input type="date" value={filters.to}
                        onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
                        className="rounded-xl border border-red-200/40 bg-white px-3.5 py-2 text-[13px] text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-red-500/10 dark:bg-[#232530] dark:text-slate-200" />
                    <button onClick={handleRefresh} disabled={allLoading}
                        className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-red-500/20 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70">
                        <RefreshCw className={`h-3.5 w-3.5 ${allLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error */}
            {allError && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-[13px] text-red-500">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{allError}</span>
                    <button onClick={fetchAll} className="text-[12px] font-medium underline underline-offset-2 transition hover:text-red-700 dark:hover:text-red-300">Retry</button>
                </div>
            )}

            {/* Content */}
            {allLoading && !allData
                ? <Skeleton />
                : allData
                    ? <AllCounselorsView data={allData} selectedId={selectedCounselor} onSelect={setSelectedCounselor} />
                    : null
            }

            {/* Footer */}
            <div className="mt-10 pb-3 text-center text-[12px] text-slate-400">
                Data from {new Date(filters.from).toLocaleDateString()} to {new Date(filters.to).toLocaleDateString()}
            </div>
        </div>
    );
}