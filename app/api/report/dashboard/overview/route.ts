// app/api/report/dashboard/overview/route.ts
//
// GET /api/report/dashboard/overview
//
// A single, high-end analytics endpoint that gives a complete overview of the
// CRM: leads, counselors, branches, countries, visa, loans, courses, docs,
// remarks and follow-ups — with every filter combinable with every other
// filter (AND logic across filter groups, OR logic within a multi-value
// filter).
//
// NOTE (per product requirement):
//   - The `Application` model is NOT used anywhere in this report.
//   - The MBBS module (MbbsLead, MbbsLeadCounselor, MbbsLeadTimeline) is
//     NOT used anywhere in this report.
//
// ─────────────────────────────────────────────────────────────────────────
// QUERY PARAMETERS (all optional, all combinable, all support comma
// separated multi-values for an "IN" filter — e.g. branchId=b1,b2):
//
//   branchId          comma separated Branch.id
//   counselorId       comma separated User.id (counselor)
//   country           comma separated Lead.country values
//   leadStatus        comma separated LeadStatus enum values
//   leadStage         comma separated LeadStage enum values
//   visaStage         comma separated StudentVisaStage enum values (on Lead)
//   source            comma separated Lead.source values
//   intakeSeason      comma separated IntakeSeason enum values
//   gender            comma separated Gender enum values
//
//   visaStatus        comma separated VisaStatus enum values (VisaDetail)
//   depositStatus     comma separated DepositStatus enum values
//   casStatus         comma separated CasStatus enum values
//   ihsStatus         comma separated IhsStatus enum values
//   visaFeeStatus     comma separated VisaFeeStatus enum values
//
//   studentStatus     comma separated StudentStatus enum values
//   loanStatus        comma separated LoanStatus enum values
//   courseStatus      comma separated StudentcoursesStatus enum values
//   university        comma separated StudentCourses.universityName values
//
//   search            free text — matches studentName / email / phone on Lead
//
//   dateField         which Lead date field the from/to range applies to.
//                      one of: createdAt (default) | applicationDate |
//                      depositDeadline | casDeadline | universityStart
//   from              ISO date string, default = start of current year
//   to                ISO date string, default = now
//
//   groupBy           primary breakdown dimension returned in
//                      `data.trend`. one of: month (default) | week | day
//
//   includeRecent     "true" | "false" (default true) — include recent
//                      activity feed (timelines + remarks)
//
// EXAMPLE (combined filter):
//   /api/report/dashboard/overview?branchId=b1,b2&counselorId=c1&country=India,Nepal
//   &leadStatus=QUALIFIED,CONVERTED&visaStatus=APPROVED&from=2026-01-01&to=2026-06-30
// ─────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

// ─── Generic helpers ──────────────────────────────────────────────────────

/** Splits a comma separated query param into a trimmed, non-empty string[] */
function parseList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

/** Builds a Prisma `{ in: [...] }` filter, or undefined if no values given */
function inFilter<T extends string>(values?: T[]) {
  return values && values.length ? { in: values } : undefined;
}

function safeRate(numerator: number, denominator: number): number {
  return denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(2))
    : 0;
}

function safeSum(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

interface RawTrendRow {
  bucket: string;
  count: bigint;
}

const serializeTrend = (rows: RawTrendRow[]) =>
  rows.map((r) => ({ bucket: r.bucket, count: Number(r.count) }));

/** Removes `undefined` keys so Prisma doesn't choke on them */
function clean<T extends Record<string, unknown>>(obj: T): T {
  Object.keys(obj).forEach((k) => {
    if (obj[k] === undefined) delete obj[k];
  });
  return obj;
}

// ─── Filter parsing ───────────────────────────────────────────────────────

const DATE_FIELDS = [
  "createdAt",
  "applicationDate",
  "depositDeadline",
  "casDeadline",
  "universityStart",
] as const;
type DateField = (typeof DATE_FIELDS)[number];

interface ParsedFilters {
  branchIds?: string[];
  counselorIds?: string[];
  countries?: string[];
  leadStatuses?: string[];
  leadStages?: string[];
  visaStages?: string[];
  sources?: string[];
  intakeSeasons?: string[];
  genders?: string[];

  visaStatuses?: string[];
  depositStatuses?: string[];
  casStatuses?: string[];
  ihsStatuses?: string[];
  visaFeeStatuses?: string[];

  studentStatuses?: string[];
  loanStatuses?: string[];
  courseStatuses?: string[];
  universities?: string[];

  search?: string;
  dateField: DateField;
  from: Date;
  to: Date;
  groupBy: "month" | "week" | "day";
  includeRecent: boolean;
}

function parseFilters(searchParams: URLSearchParams): ParsedFilters {
  const dateFieldParam = searchParams.get("dateField") as DateField | null;
  const dateField: DateField =
    dateFieldParam && DATE_FIELDS.includes(dateFieldParam)
      ? dateFieldParam
      : "createdAt";

  const from = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : new Date(new Date().getFullYear(), 0, 1);
  const to = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : new Date();

  const groupByParam = searchParams.get("groupBy");
  const groupBy: ParsedFilters["groupBy"] =
    groupByParam === "week" || groupByParam === "day" ? groupByParam : "month";

  return {
    branchIds: parseList(searchParams.get("branchId")),
    counselorIds: parseList(searchParams.get("counselorId")),
    countries: parseList(searchParams.get("country")),
    leadStatuses: parseList(searchParams.get("leadStatus")),
    leadStages: parseList(searchParams.get("leadStage")),
    visaStages: parseList(searchParams.get("visaStage")),
    sources: parseList(searchParams.get("source")),
    intakeSeasons: parseList(searchParams.get("intakeSeason")),
    genders: parseList(searchParams.get("gender")),

    visaStatuses: parseList(searchParams.get("visaStatus")),
    depositStatuses: parseList(searchParams.get("depositStatus")),
    casStatuses: parseList(searchParams.get("casStatus")),
    ihsStatuses: parseList(searchParams.get("ihsStatus")),
    visaFeeStatuses: parseList(searchParams.get("visaFeeStatus")),

    studentStatuses: parseList(searchParams.get("studentStatus")),
    loanStatuses: parseList(searchParams.get("loanStatus")),
    courseStatuses: parseList(searchParams.get("courseStatus")),
    universities: parseList(searchParams.get("university")),

    search: searchParams.get("search")?.trim() || undefined,
    dateField,
    from,
    to,
    groupBy,
    includeRecent: searchParams.get("includeRecent") !== "false",
  };
}

// ─── Where-clause builders ────────────────────────────────────────────────

/**
 * Builds the base Lead `where` clause from every lead-level filter.
 * This is the backbone — visa / loan / course / doc / remark / timeline
 * queries all nest this under their `lead: { ... }` relation filter so that
 * EVERY filter (branch, counselor, country, status, etc.) cascades through
 * the entire report, not just the leads section.
 */
function buildLeadWhere(f: ParsedFilters): Prisma.LeadWhereInput {
  const dateRange = { gte: f.from, lte: f.to };

  // NOTE: enum filter values are plain string[]'s coming from query params
  // (e.g. ?leadStatus=NEW,CONTACTED). Prisma's generated per-enum filter
  // type names (EnumXFilter / NullableEnumXFilter) vary between generator
  // versions, so rather than hardcode them we build the object with plain
  // values and cast the whole thing once — Prisma validates the actual
  // enum values at runtime regardless of the TS type used to construct it.
  const where = clean({
    branchId: inFilter(f.branchIds),
    counselorId: inFilter(f.counselorIds),
    country: inFilter(f.countries),
    status: inFilter(f.leadStatuses),
    leadStage: inFilter(f.leadStages),
    visaStage: inFilter(f.visaStages),
    source: inFilter(f.sources),
    intakeSeason: inFilter(f.intakeSeasons),
    gender: inFilter(f.genders),
    [f.dateField]: dateRange,
  }) as unknown as Prisma.LeadWhereInput;

  // Secondary-assignment aware counselor filter: a lead "belongs" to a
  // counselor either via Lead.counselorId (primary owner) OR via the
  // LeadCounselor join table (shared/secondary assignment). When a
  // counselor filter is supplied, match either.
  if (f.counselorIds && f.counselorIds.length) {
    delete (where as Record<string, unknown>).counselorId;
    where.OR = [
      { counselorId: { in: f.counselorIds } },
      { counselors: { some: { counselorId: { in: f.counselorIds } } } },
    ];
  }

  if (f.search) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { studentName: { contains: f.search, mode: "insensitive" } },
          { email: { contains: f.search, mode: "insensitive" } },
          { phone: { contains: f.search, mode: "insensitive" } },
        ],
      },
    ];
  }

  return where;
}

function buildVisaWhere(
  leadWhere: Prisma.LeadWhereInput,
  f: ParsedFilters
): Prisma.VisaDetailWhereInput {
  return clean({
    lead: leadWhere,
    status: inFilter(f.visaStatuses),
    depositStatus: inFilter(f.depositStatuses),
    casStatus: inFilter(f.casStatuses),
    ihsStatus: inFilter(f.ihsStatuses),
    visaFeeStatus: inFilter(f.visaFeeStatuses),
  }) as unknown as Prisma.VisaDetailWhereInput;
}

function buildLoanWhere(
  leadWhere: Prisma.LeadWhereInput,
  f: ParsedFilters
): Prisma.LoanInquiryWhereInput {
  return clean({
    lead: leadWhere,
    status: inFilter(f.loanStatuses),
  }) as unknown as Prisma.LoanInquiryWhereInput;
}

function buildCourseWhere(
  leadWhere: Prisma.LeadWhereInput,
  f: ParsedFilters
): Prisma.StudentCoursesWhereInput {
  return clean({
    lead: leadWhere,
    applicationStatus: inFilter(f.courseStatuses),
    universityName: inFilter(f.universities),
  }) as unknown as Prisma.StudentCoursesWhereInput;
}

function buildStudentWhere(
  leadWhere: Prisma.LeadWhereInput,
  f: ParsedFilters
): Prisma.StudentWhereInput {
  // Students are scoped through their parent Lead so that every lead-level
  // filter (branch, counselor, country, status, etc.) cascades correctly,
  // plus their own direct status filter and date range (on Student.createdAt
  // when dateField === "createdAt"; otherwise the lead-level range already
  // narrows the parent lead set).
  const where = clean({
    lead: leadWhere,
    status: inFilter(f.studentStatuses),
  }) as unknown as Prisma.StudentWhereInput;
  if (f.dateField === "createdAt") {
    where.createdAt = { gte: f.from, lte: f.to };
  }
  return where;
}

// ─── Trend (time-series) query ────────────────────────────────────────────

function truncFormat(groupBy: ParsedFilters["groupBy"]) {
  if (groupBy === "day") return "YYYY-MM-DD";
  if (groupBy === "week") return "IYYY-IW";
  return "YYYY-MM";
}

async function leadsTrend(
  f: ParsedFilters,
  branchIds?: string[],
  counselorIds?: string[]
) {
  const fmt = truncFormat(f.groupBy);
  const conditions: string[] = [`l."${f.dateField}" >= $1`, `l."${f.dateField}" <= $2`];
  const params: unknown[] = [f.from, f.to];

  if (branchIds?.length) {
    params.push(branchIds);
    conditions.push(`l."branchId" = ANY($${params.length})`);
  }
  if (counselorIds?.length) {
    params.push(counselorIds);
    conditions.push(
      `(l."counselorId" = ANY($${params.length}) OR EXISTS (
         SELECT 1 FROM "LeadCounselor" lc
         WHERE lc."leadId" = l.id AND lc."counselorId" = ANY($${params.length})
       ))`
    );
  }
  if (f.countries?.length) {
    params.push(f.countries);
    conditions.push(`l.country = ANY($${params.length})`);
  }
  if (f.leadStatuses?.length) {
    params.push(f.leadStatuses);
    conditions.push(`l.status::text = ANY($${params.length})`);
  }
  if (f.leadStages?.length) {
    params.push(f.leadStages);
    conditions.push(`l."leadStage"::text = ANY($${params.length})`);
  }
  if (f.sources?.length) {
    params.push(f.sources);
    conditions.push(`l.source = ANY($${params.length})`);
  }

  const sql = `
    SELECT TO_CHAR(l."${f.dateField}", '${fmt}') AS bucket, COUNT(*) AS count
    FROM "leads" l
    WHERE ${conditions.join(" AND ")}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  return db.$queryRawUnsafe<RawTrendRow[]>(sql, ...params);
}

// ─── Main analytics builder ───────────────────────────────────────────────

async function buildOverview(f: ParsedFilters) {
  const leadWhere = buildLeadWhere(f);
  const visaWhere = buildVisaWhere(leadWhere, f);
  const loanWhere = buildLoanWhere(leadWhere, f);
  const courseWhere = buildCourseWhere(leadWhere, f);
  const studentWhere = buildStudentWhere(leadWhere, f);
  const docWhere: Prisma.DocWhereInput = { lead: leadWhere };
  const remarkWhere: Prisma.RemarkWhereInput = { lead: leadWhere };
  const timelineWhere: Prisma.LeadTimelineWhereInput = { lead: leadWhere };

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    // ── Core counts ──────────────────────────────────────────────────────
    totalLeads,
    newLeadsThisMonth,
    convertedLeads,
    totalStudents,
    newStudentsThisMonth,

    // ── Breakdowns ───────────────────────────────────────────────────────
    leadsByStatus,
    leadsByStage,
    leadsBySource,
    leadsByCountry,
    leadsByIntakeSeason,
    leadsByVisaStage,
    leadsByGender,
    leadsByBranch,
    leadsByCounselorDirect,

    studentsByStatus,

    // ── Visa ─────────────────────────────────────────────────────────────
    visaTotal,
    visaByStatus,
    visaByDepositStatus,
    visaByCasStatus,
    visaByIhsStatus,
    visaApproved,
    visaRejected,

    upcomingDeposits,
    upcomingCasDeadlines,
    upcomingUniversityStarts,

    // ── Loans ────────────────────────────────────────────────────────────
    loansByStatus,
    totalLoanApproved,

    // ── Courses ──────────────────────────────────────────────────────────
    coursesByStatus,
    topUniversities,

    // ── Docs / remarks / timelines ──────────────────────────────────────
    totalDocs,
    remarksByType,
    totalRemarks,
    totalFollowupsLogged,
    upcomingFollowups,
    overdueFollowups,

    // ── Branch + counselor master lists (for leaderboards) ──────────────
    branches,
    counselors,
  ] = await Promise.all([
    db.lead.count({ where: leadWhere }),
    db.lead.count({
      where: { ...leadWhere, createdAt: { gte: startOfMonth } },
    }),
    db.lead.count({ where: { ...leadWhere, student: { isNot: null } } }),
    db.student.count({ where: studentWhere }),
    db.student.count({
      where: { ...studentWhere, createdAt: { gte: startOfMonth } },
    }),

    db.lead.groupBy({ by: ["status"], where: leadWhere, _count: { _all: true } }),
    db.lead.groupBy({ by: ["leadStage"], where: leadWhere, _count: { _all: true } }),
    db.lead.groupBy({
      by: ["source"],
      where: leadWhere,
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
    }),
    db.lead.groupBy({
      by: ["country"],
      where: { ...leadWhere, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
    }),
    db.lead.groupBy({
      by: ["intakeSeason"],
      where: { ...leadWhere, intakeSeason: { not: null } },
      _count: { _all: true },
    }),
    db.lead.groupBy({ by: ["visaStage"], where: leadWhere, _count: { _all: true } }),
    db.lead.groupBy({
      by: ["gender"],
      where: { ...leadWhere, gender: { not: null } },
      _count: { _all: true },
    }),
    db.lead.groupBy({ by: ["branchId"], where: leadWhere, _count: { _all: true } }),
    db.lead.groupBy({
      by: ["counselorId"],
      where: { ...leadWhere, counselorId: { not: null } },
      _count: { _all: true },
    }),

    db.student.groupBy({
      by: ["status"],
      where: studentWhere,
      _count: { _all: true },
    }),

    db.visaDetail.count({ where: visaWhere }),
    db.visaDetail.groupBy({ by: ["status"], where: visaWhere, _count: { _all: true } }),
    db.visaDetail.groupBy({
      by: ["depositStatus"],
      where: { ...visaWhere, depositStatus: { not: null } },
      _count: { _all: true },
    }),
    db.visaDetail.groupBy({
      by: ["casStatus"],
      where: { ...visaWhere, casStatus: { not: null } },
      _count: { _all: true },
    }),
    db.visaDetail.groupBy({
      by: ["ihsStatus"],
      where: { ...visaWhere, ihsStatus: { not: null } },
      _count: { _all: true },
    }),
    db.visaDetail.count({ where: { ...visaWhere, status: "APPROVED" } }),
    db.visaDetail.count({ where: { ...visaWhere, status: "REJECTED" } }),

    db.lead.count({
      where: { ...leadWhere, depositDeadline: { gte: now, lte: in7Days } },
    }),
    db.lead.count({
      where: { ...leadWhere, casDeadline: { gte: now, lte: in7Days } },
    }),
    db.lead.count({
      where: { ...leadWhere, universityStart: { gte: now, lte: in30Days } },
    }),

    db.loanInquiry.groupBy({
      by: ["status"],
      where: loanWhere,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    db.loanInquiry.aggregate({
      _sum: { amount: true },
      where: { ...loanWhere, status: { in: ["APPROVED", "DISBURSED"] } },
    }),

    db.studentCourses.groupBy({
      by: ["applicationStatus"],
      where: courseWhere,
      _count: { _all: true },
    }),
    db.studentCourses.groupBy({
      by: ["universityName"],
      where: courseWhere,
      _count: { _all: true },
      orderBy: { _count: { universityName: "desc" } },
      take: 10,
    }),

    db.doc.count({ where: docWhere }),
    db.remark.groupBy({ by: ["type"], where: remarkWhere, _count: { _all: true } }),
    db.remark.count({ where: remarkWhere }),
    db.leadTimeline.count({ where: timelineWhere }),
    db.leadTimeline.count({
      where: { ...timelineWhere, nextFollowup: { gte: now, lte: in7Days } },
    }),
    db.leadTimeline.count({
      where: { ...timelineWhere, nextFollowup: { lt: now } },
    }),

    db.branch.findMany({
      where: f.branchIds?.length ? { id: { in: f.branchIds } } : {},
      select: { id: true, name: true, code: true, city: true, state: true },
    }),
    db.user.findMany({
      where: f.counselorIds?.length ? { id: { in: f.counselorIds } } : {},
      select: { id: true, name: true, email: true, monthlyTarget: true },
    }),
  ]);

  // ── Recent activity (optional) ────────────────────────────────────────
  let recentTimelines: unknown[] = [];
  let recentRemarks: unknown[] = [];
  if (f.includeRecent) {
    [recentTimelines, recentRemarks] = await Promise.all([
      db.leadTimeline.findMany({
        where: timelineWhere,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          description: true,
          nextFollowup: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true } },
          lead: {
            select: {
              id: true,
              studentName: true,
              email: true,
              phone: true,
              status: true,
              branchId: true,
              country: true,
            },
          },
        },
      }),
      db.remark.findMany({
        where: remarkWhere,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true } },
          lead: { select: { id: true, studentName: true } },
        },
      }),
    ]);
  }

  // ── Trend (time-series), branch & counselor leaderboards ──────────────
  const [trendRows, branchLeaderboard, counselorLeaderboard] = await Promise.all(
    [
      leadsTrend(f),
      buildBranchLeaderboard(leadWhere, f, leadsByBranch),
      buildCounselorLeaderboard(leadWhere, f),
    ]
  );

  // ── Derived KPIs ─────────────────────────────────────────────────────
  const conversionRate = safeRate(convertedLeads, totalLeads);
  const visaApprovalRate = safeRate(visaApproved, visaTotal);

  return {
    summary: {
      totalLeads,
      newLeadsThisMonth,
      convertedLeads,
      conversionRate,

      totalStudents,
      newStudentsThisMonth,

      totalVisaApplications: visaTotal,
      visaApproved,
      visaRejected,
      visaApprovalRate,

      totalLoanAmountApproved: safeSum(totalLoanApproved._sum.amount),

      totalDocs,
      totalRemarks,
      totalFollowupsLogged,
      upcomingFollowups,
      overdueFollowups,

      branchesInScope: branches.length,
      counselorsInScope: counselors.length,
    },

    leads: {
      byStatus: leadsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byStage: leadsByStage.map((r) => ({ stage: r.leadStage, count: r._count._all })),
      bySource: leadsBySource.map((r) => ({ source: r.source, count: r._count._all })),
      byCountry: leadsByCountry.map((r) => ({
        country: r.country,
        count: r._count._all,
      })),
      byIntakeSeason: leadsByIntakeSeason.map((r) => ({
        season: r.intakeSeason,
        count: r._count._all,
      })),
      byVisaStage: leadsByVisaStage.map((r) => ({
        stage: r.visaStage,
        count: r._count._all,
      })),
      byGender: leadsByGender.map((r) => ({ gender: r.gender, count: r._count._all })),
      trend: serializeTrend(trendRows as unknown as RawTrendRow[]),
    },

    students: {
      byStatus: studentsByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
    },

    visa: {
      total: visaTotal,
      approved: visaApproved,
      rejected: visaRejected,
      approvalRate: visaApprovalRate,
      byStatus: visaByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byDepositStatus: visaByDepositStatus.map((r) => ({
        status: r.depositStatus,
        count: r._count._all,
      })),
      byCasStatus: visaByCasStatus.map((r) => ({
        status: r.casStatus,
        count: r._count._all,
      })),
      byIhsStatus: visaByIhsStatus.map((r) => ({
        status: r.ihsStatus,
        count: r._count._all,
      })),
      upcoming: {
        depositDeadlinesNext7Days: upcomingDeposits,
        casDeadlinesNext7Days: upcomingCasDeadlines,
        universityStartsNext30Days: upcomingUniversityStarts,
      },
    },

    loans: {
      byStatus: loansByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
        totalAmount: safeSum(r._sum.amount),
      })),
      totalApproved: safeSum(totalLoanApproved._sum.amount),
    },

    courses: {
      byApplicationStatus: coursesByStatus.map((r) => ({
        status: r.applicationStatus,
        count: r._count._all,
      })),
      topUniversities: topUniversities.map((r) => ({
        universityName: r.universityName,
        applications: r._count._all,
      })),
    },

    activity: {
      totalDocs,
      totalRemarks,
      remarksByType: remarksByType.map((r) => ({ type: r.type, count: r._count._all })),
      totalFollowupsLogged,
      upcomingFollowups,
      overdueFollowups,
      ...(f.includeRecent ? { recentTimelines, recentRemarks } : {}),
    },

    leaderboards: {
      branches: branchLeaderboard,
      counselors: counselorLeaderboard,
    },

    rawCounts: {
      leadsByBranchRaw: leadsByBranch.map((r) => ({
        branchId: r.branchId,
        count: r._count._all,
      })),
      leadsByCounselorRaw: leadsByCounselorDirect.map((r) => ({
        counselorId: r.counselorId,
        count: r._count._all,
      })),
    },
  };
}

// ─── Leaderboards ──────────────────────────────────────────────────────────

async function buildBranchLeaderboard(
  leadWhere: Prisma.LeadWhereInput,
  f: ParsedFilters,
  leadsByBranch: { branchId: string; _count: { _all: number } }[]
) {
  const branchIds = leadsByBranch.map((r) => r.branchId);
  if (!branchIds.length) return [];

  const branches = await db.branch.findMany({
    where: { id: { in: branchIds } },
    select: { id: true, name: true, code: true, city: true, state: true },
  });

  const rows = await Promise.all(
    branchIds.map(async (branchId) => {
      const scopedLeadWhere: Prisma.LeadWhereInput = { ...leadWhere, branchId };
      const [totalLeads, convertedLeads, totalStudents, visaApproved, visaTotal] =
        await Promise.all([
          db.lead.count({ where: scopedLeadWhere }),
          db.lead.count({
            where: { ...scopedLeadWhere, student: { isNot: null } },
          }),
          db.student.count({ where: { lead: scopedLeadWhere } }),
          db.visaDetail.count({
            where: { lead: scopedLeadWhere, status: "APPROVED" },
          }),
          db.visaDetail.count({ where: { lead: scopedLeadWhere } }),
        ]);
      const branch = branches.find((b) => b.id === branchId);
      return {
        branchId,
        branchName: branch?.name ?? "Unknown",
        branchCode: branch?.code ?? null,
        city: branch?.city ?? null,
        state: branch?.state ?? null,
        totalLeads,
        convertedLeads,
        conversionRate: safeRate(convertedLeads, totalLeads),
        totalStudents,
        visaApproved,
        visaApprovalRate: safeRate(visaApproved, visaTotal),
      };
    })
  );

  return rows
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .map((r, idx) => ({ rank: idx + 1, ...r }));
}

async function buildCounselorLeaderboard(
  leadWhere: Prisma.LeadWhereInput,
  f: ParsedFilters
) {
  // Determine the candidate counselor set: explicit filter, else everyone
  // who owns or is assigned to at least one lead in scope.
  let counselorIds = f.counselorIds;
  if (!counselorIds?.length) {
    const [direct, assigned] = await Promise.all([
      db.lead.findMany({
        where: { ...leadWhere, counselorId: { not: null } },
        select: { counselorId: true },
        distinct: ["counselorId"],
      }),
      db.leadCounselor.findMany({
        where: { lead: leadWhere },
        select: { counselorId: true },
        distinct: ["counselorId"],
      }),
    ]);
    const set = new Set<string>();
    direct.forEach((d) => d.counselorId && set.add(d.counselorId));
    assigned.forEach((a) => set.add(a.counselorId));
    counselorIds = Array.from(set);
  }
  if (!counselorIds.length) return [];

  const counselorUsers = await db.user.findMany({
    where: { id: { in: counselorIds } },
    select: {
      id: true,
      name: true,
      email: true,
      monthlyTarget: true,
      branches: { select: { id: true, name: true, code: true } },
    },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await Promise.all(
    counselorIds.map(async (counselorId) => {
      // Wrap the already-built leadWhere (which may itself contain a top
      // level OR for counselor filtering) inside an AND, then add this
      // specific counselor's ownership/assignment condition as another
      // AND branch — avoids clobbering any existing OR on leadWhere.
      const scopedLeadWhere: Prisma.LeadWhereInput = {
        AND: [
          leadWhere,
          {
            OR: [{ counselorId }, { counselors: { some: { counselorId } } }],
          },
        ],
      };

      const [
        totalLeads,
        newLeadsThisMonth,
        convertedLeads,
        totalStudents,
        visaApproved,
        visaTotal,
        upcomingFollowups,
        overdueFollowups,
        totalRemarks,
      ] = await Promise.all([
        db.lead.count({ where: scopedLeadWhere }),
        db.lead.count({
          where: { ...scopedLeadWhere, createdAt: { gte: startOfMonth } },
        }),
        db.lead.count({
          where: { ...scopedLeadWhere, student: { isNot: null } },
        }),
        db.student.count({ where: { lead: scopedLeadWhere } }),
        db.visaDetail.count({
          where: { lead: scopedLeadWhere, status: "APPROVED" },
        }),
        db.visaDetail.count({ where: { lead: scopedLeadWhere } }),
        db.leadTimeline.count({
          where: {
            lead: scopedLeadWhere,
            nextFollowup: {
              gte: now,
              lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        db.leadTimeline.count({
          where: { lead: scopedLeadWhere, nextFollowup: { lt: now } },
        }),
        db.remark.count({ where: { createdById: counselorId } }),
      ]);

      const user = counselorUsers.find((u) => u.id === counselorId);
      const monthlyTarget = user?.monthlyTarget ?? 0;

      return {
        counselorId,
        counselorName: user?.name ?? "Unknown",
        email: user?.email ?? null,
        branches: user?.branches ?? [],
        monthlyTarget,
        totalLeads,
        newLeadsThisMonth,
        monthlyTargetAchievement: safeRate(newLeadsThisMonth, monthlyTarget),
        convertedLeads,
        conversionRate: safeRate(convertedLeads, totalLeads),
        totalStudents,
        visaApproved,
        visaApprovalRate: safeRate(visaApproved, visaTotal),
        upcomingFollowups,
        overdueFollowups,
        totalRemarks,
      };
    })
  );

  return rows
    .sort((a, b) => {
      if (b.conversionRate !== a.conversionRate)
        return b.conversionRate - a.conversionRate;
      return b.totalLeads - a.totalLeads;
    })
    .map((r, idx) => ({ rank: idx + 1, ...r }));
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);

    const data = await buildOverview(filters);

    return NextResponse.json(
      {
        success: true,
        data: {
          meta: {
            generatedAt: new Date().toISOString(),
            filtersApplied: {
              branchId: filters.branchIds ?? null,
              counselorId: filters.counselorIds ?? null,
              country: filters.countries ?? null,
              leadStatus: filters.leadStatuses ?? null,
              leadStage: filters.leadStages ?? null,
              visaStage: filters.visaStages ?? null,
              source: filters.sources ?? null,
              intakeSeason: filters.intakeSeasons ?? null,
              gender: filters.genders ?? null,
              visaStatus: filters.visaStatuses ?? null,
              depositStatus: filters.depositStatuses ?? null,
              casStatus: filters.casStatuses ?? null,
              ihsStatus: filters.ihsStatuses ?? null,
              visaFeeStatus: filters.visaFeeStatuses ?? null,
              studentStatus: filters.studentStatuses ?? null,
              loanStatus: filters.loanStatuses ?? null,
              courseStatus: filters.courseStatuses ?? null,
              university: filters.universities ?? null,
              search: filters.search ?? null,
              dateField: filters.dateField,
              from: filters.from,
              to: filters.to,
              groupBy: filters.groupBy,
            },
          },
          ...data,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DASHBOARD_OVERVIEW]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard overview" },
      { status: 500 }
    );
  }
}