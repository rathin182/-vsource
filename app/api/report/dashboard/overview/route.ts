// app/api/report/dashboard/performance/route.ts
//
// GET /api/report/dashboard/performance
//
// SINGLE API — powers both PerformanceReportsPage.tsx and
// ReportFilterSheet.tsx. One route returns:
//   - summary cards
//   - all 6 charts (monthlyVolume, countryDemand, leadSourceBreakdown,
//     leadStatusBreakdown, applicationStatusBreakdown, visaStatusBreakdown)
//   - branchPerformance table
//   - unified paginated lead+student rows table
//   - filterOptions (branches, counselors, countries, universities,
//     intakes, leadStatuses, leadSources, applicationStatuses, casStatuses,
//     visaStatuses, loanStatuses, nbfcs, fintechAssignees) so
//     ReportFilterSheet never needs a second endpoint.
//
// Per your instructions:
//   - `Application` model NOT used anywhere. "Applications" = `StudentCourses`.
//   - MBBS models NOT used anywhere.
//   - Export is NOT handled by this route.
//   - `nbfc` == LoanInquiry.bank, `fintechAssigneeId` == LoanInquiry.assignee
//     (schema has no dedicated nbfc/fintechAssignee columns; these are the
//     mapped equivalents, per your explicit confirmation).
//
// Converted leads (Lead.student is not null) appear ONLY as student rows —
// never duplicated — matching: "Converted leads appear only as students,
// preventing duplicate pipeline records."
//
// ── QUERY PARAMS (exact 1:1 match with PerformanceReportFilters) ──
//   recordScope, datePreset, startDate, endDate, search, branchId,
//   counselorId, leadStatus, leadSource, countryId, intakeId, universityId,
//   applicationStatus, casStatus, visaStatus, loanStatus, nbfc,
//   fintechAssigneeId, page, pageSize
//
// ── FIX LOG (this revision) ─────────────────────────────────────────────
//   1. CRITICAL: buildVisaWhere / buildLoanWhere previously double-wrapped
//      the lead filter — the route called
//        buildVisaWhere({ lead: baseLeadWhere }, filters)
//      while the helper ALSO did `{ lead: leadWhere, ... }` internally,
//      producing `{ lead: { lead: {...} } }`. VisaDetail.lead and
//      LoanInquiry.lead are direct Lead? relations — there is no nested
//      `lead.lead` field, so Prisma threw a validation error on every
//      request that touched summary counts, visa/loan charts, or branch
//      performance. Fixed by passing baseLeadWhere directly (helpers now
//      wrap it themselves, single level).
//   2. studentsByCountryRaw groupBy cast `studentWhereScoped.lead as
//      Prisma.LeadWhereInput` inherited the same double-wrap risk when
//      hasStudentOnlyFilter was true — verified now consistent since (1).
//   3. leadStatus/recordScope semantics: the frontend's
//      ReportFilterSheet never sends the literal string "converted" as
//      leadStatus (LeadStatus enum has no CONVERTED-as-filter-that-means-
//      unconverted-exclusion issue — CONVERTED is a real enum value).
//      When leadStatus=CONVERTED is selected, recordScope is forced to
//      "students" by the sheet, and includeLeads becomes false, so the
//      unconverted-lead-only queries are skipped entirely — no behavior
//      change needed, just confirmed consistent.
//   4. leadNumber: schema's Lead model has no leadNumber field (only
//      MbbsLead does, and MBBS models are explicitly excluded). Rows now
//      explicitly return leadNumber: null with a comment, matching schema
//      reality — frontend already renders "—" for null, so no UI change
//      needed, just documented so it isn't mistaken for a bug later.

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type {
  BranchPerformancePoint,
  CountryDemandPoint,
  LeadSourcePoint,
  MonthlyVolumePoint,
  PerformanceReportFilterOptions,
  PerformanceReportFilters,
  PerformanceReportRow,
  ReportDatePreset,
  ReportRecordScope,
  StatusCountPoint,
} from "@/types/performance-report";

// ─── helpers ──────────────────────────────────────────────────────────────

function safeRate(numerator: number, denominator: number): number {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}

function safeSum(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  Object.keys(obj).forEach((k) => {
    if (obj[k] === undefined) delete obj[k];
  });
  return obj;
}

function monthLabel(year: number, month0: number): { key: string; label: string } {
  const date = new Date(year, month0, 1);
  const key = `${year}-${String(month0 + 1).padStart(2, "0")}`;
  const label = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  return { key, label };
}

// ─── filter parsing (matches PerformanceReportFilters exactly) ───────────

const VALID_RECORD_SCOPES: ReportRecordScope[] = ["all", "leads", "students"];
const VALID_DATE_PRESETS: ReportDatePreset[] = [
  "all",
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "this_quarter",
  "last_quarter",
  "this_year",
  "custom",
];

function str(searchParams: URLSearchParams, key: string): string {
  return searchParams.get(key)?.trim() ?? "";
}

function parseFilters(searchParams: URLSearchParams): PerformanceReportFilters {
  const recordScopeRaw = str(searchParams, "recordScope") as ReportRecordScope;
  const datePresetRaw = str(searchParams, "datePreset") as ReportDatePreset;

  return {
    recordScope: VALID_RECORD_SCOPES.includes(recordScopeRaw) ? recordScopeRaw : "all",
    datePreset: VALID_DATE_PRESETS.includes(datePresetRaw) ? datePresetRaw : "all",
    startDate: str(searchParams, "startDate"),
    endDate: str(searchParams, "endDate"),
    search: str(searchParams, "search"),
    branchId: str(searchParams, "branchId"),
    counselorId: str(searchParams, "counselorId"),
    leadStatus: str(searchParams, "leadStatus"),
    leadSource: str(searchParams, "leadSource"),
    countryId: str(searchParams, "countryId"),
    intakeId: str(searchParams, "intakeId"),
    universityId: str(searchParams, "universityId"),
    applicationStatus: str(searchParams, "applicationStatus"),
    casStatus: str(searchParams, "casStatus"),
    visaStatus: str(searchParams, "visaStatus"),
    loanStatus: str(searchParams, "loanStatus"),
    nbfc: str(searchParams, "nbfc"),
    fintechAssigneeId: str(searchParams, "fintechAssigneeId"),
  };
}

// ─── date preset resolution ───────────────────────────────────────────────

interface ResolvedDateRange {
  from: Date | null;
  to: Date | null;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function resolveDateRange(filters: PerformanceReportFilters): ResolvedDateRange {
  const now = new Date();

  switch (filters.datePreset) {
    case "all":
      return { from: null, to: null };
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "last_7_days": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { from: startOfDay(s), to: endOfDay(now) };
    }
    case "last_30_days": {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { from: startOfDay(s), to: endOfDay(now) };
    }
    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: startOfDay(s), to: endOfDay(e) };
    }
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(s), to: endOfDay(e) };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const s = new Date(now.getFullYear(), q * 3, 1);
      const e = new Date(now.getFullYear(), q * 3 + 3, 0);
      return { from: startOfDay(s), to: endOfDay(e) };
    }
    case "last_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const lq = q === 0 ? 3 : q - 1;
      const yr = q === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const s = new Date(yr, lq * 3, 1);
      const e = new Date(yr, lq * 3 + 3, 0);
      return { from: startOfDay(s), to: endOfDay(e) };
    }
    case "this_year": {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31);
      return { from: startOfDay(s), to: endOfDay(e) };
    }
    case "custom": {
      const from = filters.startDate ? startOfDay(new Date(filters.startDate)) : null;
      const to = filters.endDate ? endOfDay(new Date(filters.endDate)) : null;
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
}

// ─── where-clause builders ─────────────────────────────────────────────────
//
// IMPORTANT: every builder below takes the RAW Lead filter object
// (Prisma.LeadWhereInput) and wraps it into `{ lead: ... }` itself,
// exactly once. Callers must NEVER pre-wrap it — passing an already
// wrapped `{ lead: X }` into these functions produces `{ lead: { lead: X } }`,
// which Prisma rejects at query time (that was the critical bug in the
// previous revision). Call these with `baseLeadWhere` directly.

function buildLeadWhere(
  filters: PerformanceReportFilters,
  dateRange: ResolvedDateRange,
  intakeName: string | null
): Prisma.LeadWhereInput {
  const where = clean({
    branchId: filters.branchId || undefined,
    status: (filters.leadStatus || undefined) as Prisma.EnumLeadStatusFilter | undefined,
    source: filters.leadSource || undefined,
    country: filters.countryId || undefined,
    preferredIntake: intakeName || undefined,
  }) as Prisma.LeadWhereInput;

  if (filters.counselorId) {
    where.OR = [
      { counselorId: filters.counselorId },
      { counselors: { some: { counselorId: filters.counselorId } } },
    ];
  }

  if (filters.search) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { studentName: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
          {
            studentCourses: {
              some: {
                OR: [
                  { universityName: { contains: filters.search, mode: "insensitive" } },
                  { courseName: { contains: filters.search, mode: "insensitive" } },
                ],
              },
            },
          },
        ],
      },
    ];
  }

  if (dateRange.from || dateRange.to) {
    where.createdAt = clean({
      gte: dateRange.from ?? undefined,
      lte: dateRange.to ?? undefined,
    });
  }

  return where;
}

function buildStudentWhere(
  leadWhereWithoutDate: Prisma.LeadWhereInput,
  dateRange: ResolvedDateRange
): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = { lead: leadWhereWithoutDate };
  if (dateRange.from || dateRange.to) {
    where.createdAt = clean({
      gte: dateRange.from ?? undefined,
      lte: dateRange.to ?? undefined,
    });
  }
  return where;
}

// Takes the RAW lead where (not pre-wrapped). Wraps once, here.
function buildVisaWhere(
  rawLeadWhere: Prisma.LeadWhereInput,
  filters: PerformanceReportFilters
): Prisma.VisaDetailWhereInput {
  return clean({
    lead: rawLeadWhere,
    status: (filters.visaStatus || undefined) as Prisma.EnumVisaStatusFilter | undefined,
    casStatus: (filters.casStatus || undefined) as Prisma.EnumCasStatusFilter | undefined,
  }) as Prisma.VisaDetailWhereInput;
}

// Takes the RAW lead where (not pre-wrapped). Wraps once, here.
// nbfc -> LoanInquiry.bank, fintechAssigneeId -> LoanInquiry.assignee (confirmed mapping)
function buildLoanWhere(
  rawLeadWhere: Prisma.LeadWhereInput,
  filters: PerformanceReportFilters
): Prisma.LoanInquiryWhereInput {
  return clean({
    lead: rawLeadWhere,
    status: (filters.loanStatus || undefined) as Prisma.EnumLoanStatusFilter | undefined,
    bank: filters.nbfc || undefined,
    assignee: filters.fintechAssigneeId || undefined,
  }) as Prisma.LoanInquiryWhereInput;
}

// Takes the RAW lead where (not pre-wrapped). Wraps once, here.
function buildStudentCoursesWhere(
  rawLeadWhere: Prisma.LeadWhereInput,
  filters: PerformanceReportFilters,
  universityName: string | null
): Prisma.StudentCoursesWhereInput {
  return clean({
    lead: rawLeadWhere,
    applicationStatus: (filters.applicationStatus || undefined) as
      | Prisma.EnumStudentcoursesStatusFilter
      | undefined,
    universityName: universityName || undefined,
  }) as Prisma.StudentCoursesWhereInput;
}

// ─── filter options (feeds ReportFilterSheet dropdowns) ──────────────────

async function buildFilterOptions(): Promise<PerformanceReportFilterOptions> {
  const toOptions = (values: string[]): string[] =>
    Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const [
    branches,
    counselors,
    countries,
    universities,
    intakes,
    leadSourcesRaw,
    nbfcsRaw,
    fintechAssigneesRaw,
  ] = await Promise.all([
    db.branch.findMany({
      where: { status: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      select: { id: true, name: true, branches: { select: { id: true } }, role: { select: { name: true } } },
      where: { role: { name: { in: ["COUNSELLOR", "BRANCH_MANAGER"] } } },
      orderBy: { name: "asc" },
    }),
    db.country.findMany({
      where: { status: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.university.findMany({
      where: { status: "active" },
      select: { id: true, name: true, countryId: true },
      orderBy: { name: "asc" },
    }),
    db.intake.findMany({
      where: { status: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.lead.findMany({ where: { source: { not: null } }, select: { source: true }, distinct: ["source"] }),
    // nbfc == LoanInquiry.bank (bank is a required String, not nullable — safe to select directly)
    db.loanInquiry.findMany({ select: { bank: true }, distinct: ["bank"] }),
    // fintechAssignee == LoanInquiry.assignee (assignee is nullable String?)
    db.loanInquiry.findMany({
      where: { assignee: { not: null } },
      select: { assignee: true },
      distinct: ["assignee"],
    }),
  ]);

  return {
    branches: branches.map((b) => ({ value: b.id, label: b.name })),
    counselors: counselors.map((c) => ({
      value: c.id,
      label: c.name,
      branchIds: c.branches.map((b) => b.id),
    })),
    countries: countries.map((c) => ({ value: c.id, label: c.name })),
    universities: universities.map((u) => ({ value: u.id, label: u.name, countryId: u.countryId })),
    intakes: intakes.map((i) => ({ value: i.id, label: i.name })),
    // matches enum LeadStatus exactly
    leadStatuses: ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"],
    leadSources: toOptions(leadSourcesRaw.map((r) => r.source ?? "")),
    // matches enum StudentcoursesStatus exactly
    applicationStatuses: [
      "DRAFT",
      "APPLIED",
      "PENDING",
      "OFFER_RECEIVED",
      "PRIORITY_OFFER_RECEIVED",
      "CONDITIONAL_OFFER",
      "UNCONDITIONAL_OFFER",
      "REJECTED",
      "DEFERRED",
    ],
    // matches enum CasStatus exactly
    casStatuses: [
      "NOT_STARTED",
      "DOCUMENTS_PENDING",
      "UNDER_REVIEW",
      "RECEIVED",
      "REJECTED",
      "NOT_REQUIRED",
    ],
    // matches enum VisaStatus exactly
    visaStatuses: [
      "NOT_STARTED",
      "DOCUMENTS_PENDING",
      "APPLIED",
      "DECISION_PENDING",
      "APPROVED",
      "REJECTED",
      "WITHDRAWN",
    ],
    // matches enum LoanStatus exactly
    loanStatuses: ["PENDING", "APPROVED", "REJECTED", "DISBURSED"],
    // nbfc == LoanInquiry.bank
    nbfcs: toOptions(nbfcsRaw.map((r) => r.bank ?? "")),
    // fintechAssignee == LoanInquiry.assignee
    fintechAssignees: toOptions(fintechAssigneesRaw.map((r) => r.assignee ?? "")).map((value) => ({
      value,
      label: value,
    })),
  };
}

// ─── route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);
    const dateRange = resolveDateRange(filters);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 20);

    const [intakeRecord, universityRecord, filterOptions] = await Promise.all([
      filters.intakeId
        ? db.intake.findUnique({ where: { id: filters.intakeId }, select: { name: true } })
        : Promise.resolve(null),
      filters.universityId
        ? db.university.findUnique({ where: { id: filters.universityId }, select: { name: true } })
        : Promise.resolve(null),
      buildFilterOptions(),
    ]);

    const baseLeadWhere = buildLeadWhere(filters, dateRange, intakeRecord?.name ?? null);

    const unconvertedLeadWhere: Prisma.LeadWhereInput = {
      ...baseLeadWhere,
      student: { is: null },
    };

    const studentWhere = buildStudentWhere(baseLeadWhere, dateRange);

    // FIX: pass baseLeadWhere directly — buildVisaWhere/buildLoanWhere/
    // buildStudentCoursesWhere wrap it into `{ lead: ... }` themselves.
    // Previously this call site passed `{ lead: baseLeadWhere }`, which
    // combined with the wrap inside the helper produced the invalid
    // `{ lead: { lead: {...} } }` shape and crashed every request that
    // touched visa/loan/application data (summary cards, all charts,
    // branch performance, and the students-only table filter).
    const visaWhere = buildVisaWhere(baseLeadWhere, filters);
    const loanWhere = buildLoanWhere(baseLeadWhere, filters);
    const courseWhere = buildStudentCoursesWhere(baseLeadWhere, filters, universityRecord?.name ?? null);

    const hasStudentOnlyFilter = Boolean(
      filters.universityId ||
        filters.applicationStatus ||
        filters.casStatus ||
        filters.visaStatus ||
        filters.loanStatus ||
        filters.nbfc ||
        filters.fintechAssigneeId
    );

    const courseFieldsOnly = {
      applicationStatus: (filters.applicationStatus || undefined) as
        | Prisma.EnumStudentcoursesStatusFilter
        | undefined,
      universityName: universityRecord?.name || undefined,
    };
    const visaFieldsOnly = {
      status: (filters.visaStatus || undefined) as Prisma.EnumVisaStatusFilter | undefined,
      casStatus: (filters.casStatus || undefined) as Prisma.EnumCasStatusFilter | undefined,
    };
    const loanFieldsOnly = {
      status: (filters.loanStatus || undefined) as Prisma.EnumLoanStatusFilter | undefined,
      bank: filters.nbfc || undefined,
      assignee: filters.fintechAssigneeId || undefined,
    };

    const studentWhereScoped: Prisma.StudentWhereInput = hasStudentOnlyFilter
      ? {
          ...studentWhere,
          lead: {
            ...baseLeadWhere,
            ...(filters.universityId || filters.applicationStatus
              ? { studentCourses: { some: courseFieldsOnly } }
              : {}),
            ...(filters.casStatus || filters.visaStatus
              ? { visaDetail: { some: visaFieldsOnly } }
              : {}),
            ...(filters.loanStatus || filters.nbfc || filters.fintechAssigneeId
              ? { loanInquiries: { some: loanFieldsOnly } }
              : {}),
          },
        }
      : studentWhere;

    const includeLeads = filters.recordScope !== "students";
    const includeStudents = filters.recordScope !== "leads";
    const effectiveUnconvertedLeadWhere: Prisma.LeadWhereInput | null =
      includeLeads && !hasStudentOnlyFilter ? unconvertedLeadWhere : null;

    // ── Summary ──────────────────────────────────────────────────────────
    const [
      totalLeadsAll,
      qualifiedLeads,
      lostLeads,
      unconvertedLeadsCount,
      totalStudents,
      offerApplications,
      totalApplicationsCount,
      visaApprovedStudents,
      casReceivedStudents,
      loanSanctionedAgg,
      loanSanctionedCount,
    ] = await Promise.all([
      db.lead.count({ where: baseLeadWhere }),
      db.lead.count({ where: { ...baseLeadWhere, status: "QUALIFIED" } }),
      db.lead.count({ where: { ...baseLeadWhere, status: "LOST" } }),
      effectiveUnconvertedLeadWhere
        ? db.lead.count({ where: effectiveUnconvertedLeadWhere })
        : Promise.resolve(0),
      db.student.count({ where: studentWhereScoped }),
      db.studentCourses.count({
        where: {
          ...courseWhere,
          applicationStatus: {
            in: [
              "OFFER_RECEIVED",
              "PRIORITY_OFFER_RECEIVED",
              "CONDITIONAL_OFFER",
              "UNCONDITIONAL_OFFER",
            ],
          },
        },
      }),
      db.studentCourses.count({ where: courseWhere }),
      db.visaDetail.count({ where: { ...visaWhere, status: "APPROVED" } }),
      db.visaDetail.count({ where: { ...visaWhere, casStatus: "RECEIVED" } }),
      db.loanInquiry.aggregate({
        _sum: { amount: true },
        where: { ...loanWhere, status: { in: ["APPROVED", "DISBURSED"] } },
      }),
      db.loanInquiry.count({ where: { ...loanWhere, status: { in: ["APPROVED", "DISBURSED"] } } }),
    ]);

    const totalPipelineRecords = unconvertedLeadsCount + totalStudents;
    const conversionRate = safeRate(totalStudents, totalLeadsAll);

    // ── Charts ───────────────────────────────────────────────────────────
    const [
      leadsByCountryRaw,
      studentsByCountryRaw,
      leadsBySourceRaw,
      leadStatusRaw,
      applicationStatusRaw,
      visaStatusRaw,
      branchesRaw,
    ] = await Promise.all([
      includeLeads && effectiveUnconvertedLeadWhere
        ? db.lead.groupBy({
            by: ["country"],
            where: { ...effectiveUnconvertedLeadWhere, country: { not: null } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      includeStudents
        ? db.lead.groupBy({
            by: ["country"],
            where: {
              ...(studentWhereScoped.lead as Prisma.LeadWhereInput),
              country: { not: null },
              student: { isNot: null },
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      includeLeads && effectiveUnconvertedLeadWhere
        ? db.lead.groupBy({
            by: ["source"],
            where: { ...effectiveUnconvertedLeadWhere, source: { not: null } },
            _count: { _all: true },
            orderBy: { _count: { source: "desc" } },
          })
        : Promise.resolve([]),
      includeLeads && effectiveUnconvertedLeadWhere
        ? db.lead.groupBy({ by: ["status"], where: effectiveUnconvertedLeadWhere, _count: { _all: true } })
        : Promise.resolve([]),
      db.studentCourses.groupBy({ by: ["applicationStatus"], where: courseWhere, _count: { _all: true } }),
      db.visaDetail.groupBy({ by: ["status"], where: visaWhere, _count: { _all: true } }),
      db.branch.findMany({
        where: filters.branchId ? { id: filters.branchId } : {},
        select: { id: true, name: true },
      }),
    ]);

    const courseCountsByLead = await db.studentCourses.findMany({
      where: courseWhere,
      select: { lead: { select: { country: true } } },
    });
    const applicationsByCountryMap = new Map<string, number>();
    for (const row of courseCountsByLead) {
      const country = row.lead?.country;
      if (!country) continue;
      applicationsByCountryMap.set(country, (applicationsByCountryMap.get(country) ?? 0) + 1);
    }

    const countryMap = new Map<string, CountryDemandPoint>();
    for (const r of leadsByCountryRaw as { country: string | null; _count: { _all: number } }[]) {
      if (!r.country) continue;
      const existing = countryMap.get(r.country) ?? { country: r.country, leads: 0, students: 0, applications: 0 };
      existing.leads += r._count._all;
      countryMap.set(r.country, existing);
    }
    for (const r of studentsByCountryRaw as { country: string | null; _count: { _all: number } }[]) {
      if (!r.country) continue;
      const existing = countryMap.get(r.country) ?? { country: r.country, leads: 0, students: 0, applications: 0 };
      existing.students += r._count._all;
      countryMap.set(r.country, existing);
    }
    for (const [country, count] of applicationsByCountryMap.entries()) {
      const existing = countryMap.get(country) ?? { country, leads: 0, students: 0, applications: 0 };
      existing.applications += count;
      countryMap.set(country, existing);
    }
    const countryDemand = Array.from(countryMap.values()).sort(
      (a, b) => b.leads + b.students - (a.leads + a.students)
    );

    const leadSourceBreakdown: LeadSourcePoint[] = (
      leadsBySourceRaw as { source: string | null; _count: { _all: number } }[]
    )
      .filter((r) => r.source)
      .map((r) => ({ source: r.source as string, total: r._count._all }));

    const leadStatusBreakdown: StatusCountPoint[] = (
      leadStatusRaw as { status: string; _count: { _all: number } }[]
    ).map((r) => ({ status: r.status, count: r._count._all }));

    const applicationStatusBreakdown: StatusCountPoint[] = (
      applicationStatusRaw as { applicationStatus: string; _count: { _all: number } }[]
    ).map((r) => ({ status: r.applicationStatus, count: r._count._all }));

    const visaStatusBreakdown: StatusCountPoint[] = (
      visaStatusRaw as { status: string; _count: { _all: number } }[]
    ).map((r) => ({ status: r.status, count: r._count._all }));

    // ── Monthly volume (trailing 6 months) ──────────────────────────────
    const monthsToShow = 6;
    const anchor = dateRange.to ?? new Date();
    const monthlyVolume: MonthlyVolumePoint[] = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const bucketDate = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      const { key, label } = monthLabel(bucketDate.getFullYear(), bucketDate.getMonth());
      monthlyVolume.push({ key, label, leads: 0, students: 0, applications: 0 });
    }

    const [leadsMonthlyRaw, studentsMonthlyRaw, appsMonthlyRaw] = await Promise.all([
      includeLeads ? db.lead.findMany({ where: baseLeadWhere, select: { createdAt: true } }) : Promise.resolve([]),
      includeStudents
        ? db.student.findMany({ where: studentWhereScoped, select: { createdAt: true } })
        : Promise.resolve([]),
      db.studentCourses.findMany({ where: courseWhere, select: { createdAt: true } }),
    ]);

    const bucketIndex = new Map(monthlyVolume.map((m, idx) => [m.key, idx]));
    const bump = (list: { createdAt: Date }[], field: "leads" | "students" | "applications") => {
      for (const row of list) {
        const k = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, "0")}`;
        const idx = bucketIndex.get(k);
        if (idx !== undefined) monthlyVolume[idx][field] += 1;
      }
    };
    bump(leadsMonthlyRaw, "leads");
    bump(studentsMonthlyRaw, "students");
    bump(appsMonthlyRaw, "applications");

    // ── Branch-wise performance ─────────────────────────────────────────
    const branchPerformance: BranchPerformancePoint[] = await Promise.all(
      branchesRaw.map(async (branch) => {
        const scopedLeadWhere: Prisma.LeadWhereInput = { ...baseLeadWhere, branchId: branch.id };
        const scopedStudentWhere: Prisma.StudentWhereInput = {
          ...studentWhereScoped,
          lead: { ...(studentWhereScoped.lead as Prisma.LeadWhereInput), branchId: branch.id },
        };
        const scopedCourseWhere: Prisma.StudentCoursesWhereInput = {
          ...courseWhere,
          lead: { ...(courseWhere.lead as Prisma.LeadWhereInput), branchId: branch.id },
        };
        const scopedVisaWhere: Prisma.VisaDetailWhereInput = {
          ...visaWhere,
          lead: { ...(visaWhere.lead as Prisma.LeadWhereInput), branchId: branch.id },
        };
        const scopedLoanWhere: Prisma.LoanInquiryWhereInput = {
          ...loanWhere,
          lead: { ...(loanWhere.lead as Prisma.LeadWhereInput), branchId: branch.id },
        };

        const [leads, students, applications, visaApproved, sanctionedAgg, disbursedAgg] = await Promise.all([
          db.lead.count({ where: scopedLeadWhere }),
          db.student.count({ where: scopedStudentWhere }),
          db.studentCourses.count({ where: scopedCourseWhere }),
          db.visaDetail.count({ where: { ...scopedVisaWhere, status: "APPROVED" } }),
          db.loanInquiry.aggregate({ _sum: { amount: true }, where: scopedLoanWhere }),
          db.loanInquiry.aggregate({ _sum: { amount: true }, where: { ...scopedLoanWhere, status: "DISBURSED" } }),
        ]);

        return {
          branchId: branch.id,
          branch: branch.name,
          leads,
          students,
          applications,
          conversionRate: safeRate(students, leads),
          visaApproved,
          sanctionedAmount: safeSum(sanctionedAgg._sum.amount),
          disbursedAmount: safeSum(disbursedAgg._sum.amount),
        };
      })
    );
    branchPerformance.sort((a, b) => b.leads - a.leads);

    // ── Unified paginated table ─────────────────────────────────────────
    const [pageLeads, pageStudents] = await Promise.all([
      includeLeads && effectiveUnconvertedLeadWhere
        ? db.lead.findMany({
            where: effectiveUnconvertedLeadWhere,
            select: {
              id: true,
              studentName: true,
              email: true,
              phone: true,
              status: true,
              leadStage: true,
              source: true,
              country: true,
              createdAt: true,
              branch: { select: { name: true } },
              counselor: { select: { name: true } },
              timelines: { orderBy: { createdAt: "desc" }, take: 1, select: { nextFollowup: true } },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      includeStudents
        ? db.student.findMany({
            where: studentWhereScoped,
            select: {
              id: true,
              studentName: true,
              emailId: true,
              mobileNumber: true,
              status: true,
              createdAt: true,
              branch: { select: { name: true } },
              counselor: { select: { name: true } },
              lead: {
                select: {
                  leadStage: true,
                  source: true,
                  country: true,
                  studentCourses: {
                    orderBy: { createdAt: "desc" },
                    select: { universityName: true, courseName: true, applicationStatus: true },
                  },
                  visaDetail: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
                  loanInquiries: { orderBy: { appliedAt: "desc" }, take: 1, select: { status: true } },
                  timelines: { orderBy: { createdAt: "desc" }, take: 1, select: { nextFollowup: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    // NOTE: Lead model has no `leadNumber` field in schema (only MbbsLead
    // does, and MBBS models are explicitly excluded from this report).
    // leadNumber is always null here by design, not a bug — the frontend
    // already renders "—" for null in this column.
    const leadRows: PerformanceReportRow[] = pageLeads.map((lead) => ({
      recordType: "lead",
      recordId: lead.id,
      leadNumber: null,
      studentName: lead.studentName ?? "Unknown",
      courseName: "",
      mobileNumber: lead.phone ?? null,
      emailId: lead.email ?? null,
      branchName: lead.branch?.name ?? "—",
      counselorName: lead.counselor?.name ?? "Unassigned",
      source: lead.source ?? "—",
      countryName: lead.country ?? "—",
      lifecycleStatus: lead.status,
      currentStage: lead.leadStage,
      latestUniversityName: "",
      applicationsCount: 0,
      latestApplicationStatus: null,
      visaStatus: "—",
      loanStatus: "—",
      createdAt: lead.createdAt.toISOString(),
      nextFollowup: lead.timelines[0]?.nextFollowup?.toISOString() ?? null,
    }));

    const studentRows: PerformanceReportRow[] = pageStudents.map((student) => {
      const latestCourse = student.lead?.studentCourses[0];
      return {
        recordType: "student",
        recordId: student.id,
        leadNumber: null,
        studentName: student.studentName,
        courseName: latestCourse?.courseName ?? "",
        mobileNumber: student.mobileNumber ?? null,
        emailId: student.emailId ?? null,
        branchName: student.branch?.name ?? "—",
        counselorName: student.counselor?.name ?? "Unassigned",
        source: student.lead?.source ?? "—",
        countryName: student.lead?.country ?? "—",
        lifecycleStatus: student.status,
        currentStage: student.lead?.leadStage ?? null,
        latestUniversityName: latestCourse?.universityName ?? "",
        applicationsCount: student.lead?.studentCourses.length ?? 0,
        latestApplicationStatus: latestCourse?.applicationStatus ?? null,
        visaStatus: student.lead?.visaDetail[0]?.status ?? "NOT_STARTED",
        loanStatus: student.lead?.loanInquiries[0]?.status ?? "—",
        createdAt: student.createdAt.toISOString(),
        nextFollowup: student.lead?.timelines[0]?.nextFollowup?.toISOString() ?? null,
      };
    });

    const allRows = [...leadRows, ...studentRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = allRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const rows = allRows.slice(startIdx, startIdx + pageSize);

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            totalLeads: totalPipelineRecords,
            qualifiedLeads,
            totalStudents,
            conversionRate,
            totalApplications: totalApplicationsCount,
            offerApplications,
            totalPipelineRecords,
            lostLeads,
            visaApprovedStudents,
            casReceivedStudents,
            totalSanctionedAmount: safeSum(loanSanctionedAgg._sum.amount),
            loanSanctionedStudents: loanSanctionedCount,
          },
          monthlyVolume,
          countryDemand,
          branchPerformance,
          leadSourceBreakdown,
          leadStatusBreakdown,
          applicationStatusBreakdown,
          visaStatusBreakdown,
          rows,
          pagination: { page: safePage, pageSize, total, totalPages },
          filterOptions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PERFORMANCE_REPORT]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch performance report" },
      { status: 500 }
    );
  }
}