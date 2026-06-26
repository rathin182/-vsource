// app/api/dashboard/branches/compare/route.ts
//
// GET /api/dashboard/branches/compare
//   → Compare 2–3 branches side-by-side across all CRM dimensions
//
// Query params (all required unless noted):
//   branchIds  — comma-separated list of 2–3 branch IDs  e.g. ?branchIds=id1,id2,id3
//   from       (optional) — ISO date string, default = start of current year
//   to         (optional) — ISO date string, default = now

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

// ─── helpers ────────────────────────────────────────────────────────────────

const serializeOverTime = (rows: { month: string; count: bigint }[]) =>
  rows.map((r) => ({ month: r.month, count: Number(r.count) }));

/** Fetch every metric for a single branch used in the comparison. */
async function fetchBranchMetrics(branchId: string, from: Date, to: Date) {
  const dateFilter = { gte: from, lte: to };
  const bf = { branchId };

  const [
    totalLeads,
    newLeadsThisMonth,
    convertedLeads,
    leadsByStatus,
    leadsByStage,
    leadsBySource,
    leadsByCountry,
    leadsByQualification,
    leadsByIntakeSeason,
    leadsByVisaStage,
    leadsOverTime,
    upcomingFollowups,

    totalStudents,
    newStudentsThisMonth,
    studentsByStatus,
    studentsOverTime,

    // top counselors within this branch
    topCounselors,

    visaTotal,
    visaApproved,
    visaRejected,
    visaByStatus,
    visaByType,
    upcomingBiometrics,
    upcomingInterviews,
    visasExpiringSoon,

    loansByStatus,
    totalLoanApproved,

    coursesByStatus,
    topUniversities,

    totalDocs,

    totalMbbsLeads,
    mbbsLeadsByStatus,

    branchProfile,
  ] = await Promise.all([
    db.lead.count({ where: { ...bf, createdAt: dateFilter } }),

    db.lead.count({
      where: {
        ...bf,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),

    db.lead.count({
      where: { ...bf, createdAt: dateFilter, student: { isNot: null } },
    }),

    db.lead.groupBy({
      by: ["status"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    db.lead.groupBy({
      by: ["leadStage"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    db.lead.groupBy({
      by: ["source"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
    }),

    db.lead.groupBy({
      by: ["country"],
      where: { ...bf, createdAt: dateFilter, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
    }),

    db.lead.groupBy({
      by: ["qualification"],
      where: { ...bf, createdAt: dateFilter, qualification: { not: null } },
      _count: { _all: true },
    }),

    db.lead.groupBy({
      by: ["intakeSeason"],
      where: { ...bf, createdAt: dateFilter, intakeSeason: { not: null } },
      _count: { _all: true },
    }),

    db.lead.groupBy({
      by: ["visaStage"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    db.$queryRawUnsafe<{ month: string; count: bigint }[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM leads
       WHERE "createdAt" >= $1 AND "createdAt" <= $2 AND "branchId" = '${branchId}'
       GROUP BY month ORDER BY month ASC`,
      from,
      to
    ),

    db.leadTimeline.count({
      where: {
        lead: { ...bf },
        nextFollowup: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    db.student.count({ where: { ...bf, createdAt: dateFilter } }),

    db.student.count({
      where: {
        ...bf,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),

    db.student.groupBy({
      by: ["status"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    db.$queryRawUnsafe<{ month: string; count: bigint }[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM "Student"
       WHERE "createdAt" >= $1 AND "createdAt" <= $2 AND "branchId" = '${branchId}'
       GROUP BY month ORDER BY month ASC`,
      from,
      to
    ),

    db.leadCounselor.groupBy({
      by: ["counselorId"],
      where: { lead: { ...bf, createdAt: dateFilter } },
      _count: { _all: true },
      orderBy: { _count: { counselorId: "desc" } },
      take: 5,
    }),

    db.visaDetail.count({ where: { lead: { ...bf } } }),
    db.visaDetail.count({ where: { lead: { ...bf }, status: "APPROVED" } }),
    db.visaDetail.count({ where: { lead: { ...bf }, status: "REJECTED" } }),

    db.visaDetail.groupBy({
      by: ["status"],
      where: { lead: { ...bf } },
      _count: { _all: true },
    }),

    db.visaDetail.groupBy({
      by: ["visaType"],
      where: { lead: { ...bf }, visaType: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { visaType: "desc" } },
    }),

    db.visaDetail.count({
      where: {
        lead: { ...bf },
        biometricsDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    db.visaDetail.count({
      where: {
        lead: { ...bf },
        interviewDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    db.visaDetail.count({
      where: {
        lead: { ...bf },
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    db.loanInquiry.groupBy({
      by: ["status"],
      where: { lead: { ...bf } },
      _count: { _all: true },
      _sum: { amount: true },
    }),

    db.loanInquiry.aggregate({
      _sum: { amount: true },
      where: { lead: { ...bf }, status: { in: ["APPROVED", "DISBURSED"] } },
    }),

    db.studentCourses.groupBy({
      by: ["applicationStatus"],
      where: { lead: { ...bf } },
      _count: { _all: true },
    }),

    db.studentCourses.groupBy({
      by: ["universityName"],
      where: { lead: { ...bf } },
      _count: { _all: true },
      orderBy: { _count: { universityName: "desc" } },
      take: 5,
    }),

    db.doc.count({ where: { lead: { ...bf } } }),

    db.mbbsLead.count({ where: { branchId } }),

    db.mbbsLead.groupBy({
      by: ["status"],
      where: { branchId },
      _count: { _all: true },
    }),

    db.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // Enrich top counselors
  const counselorIds = topCounselors.map((c) => c.counselorId);
  const counselorDetails = await db.user.findMany({
    where: { id: { in: counselorIds } },
    select: { id: true, name: true, email: true },
  });
  const counselorMap = Object.fromEntries(
    counselorDetails.map((u) => [u.id, u])
  );

  const conversionRate =
    totalLeads > 0
      ? Number(((convertedLeads / totalLeads) * 100).toFixed(2))
      : 0;
  const visaApprovalRate =
    visaTotal > 0
      ? Number(((visaApproved / visaTotal) * 100).toFixed(2))
      : 0;

  return {
    profile: branchProfile,

    summary: {
      totalLeads,
      newLeadsThisMonth,
      totalStudents,
      newStudentsThisMonth,
      convertedLeads,
      conversionRate,
      upcomingFollowups,
      totalDocs,
      totalMbbsLeads,
      totalLoanAmountApproved: totalLoanApproved._sum.amount ?? 0,
      totalVisaApplications: visaTotal,
      visaApproved,
      visaRejected,
      visaApprovalRate,
    },

    leads: {
      byStatus: leadsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byStage: leadsByStage.map((r) => ({ stage: r.leadStage, count: r._count._all })),
      bySource: leadsBySource.map((r) => ({ source: r.source, count: r._count._all })),
      byCountry: leadsByCountry.map((r) => ({ country: r.country, count: r._count._all })),
      byQualification: leadsByQualification.map((r) => ({
        qualification: r.qualification,
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
      overTime: serializeOverTime(leadsOverTime),
    },

    students: {
      byStatus: studentsByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      overTime: serializeOverTime(studentsOverTime),
    },

    visa: {
      total: visaTotal,
      approved: visaApproved,
      rejected: visaRejected,
      approvalRate: visaApprovalRate,
      byStatus: visaByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byType: visaByType.map((r) => ({ visaType: r.visaType, count: r._count._all })),
      upcoming: {
        biometricsNext7Days: upcomingBiometrics,
        interviewsNext7Days: upcomingInterviews,
        expiringNext30Days: visasExpiringSoon,
      },
    },

    loans: {
      byStatus: loansByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
        totalAmount: r._sum.amount ?? 0,
      })),
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

    mbbsLeads: {
      total: totalMbbsLeads,
      byStatus: mbbsLeadsByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
    },

    counselors: {
      top5: topCounselors.map((r) => ({
        counselorId: r.counselorId,
        counselor: counselorMap[r.counselorId] ?? null,
        assignedLeads: r._count._all,
      })),
    },
  };
}

// ─── Comparison matrix builder ────────────────────────────────────────────────
//
// Takes the array of per-branch results and builds a side-by-side comparison
// object for every metric so the frontend can drive charts directly.

type BranchResult = Awaited<ReturnType<typeof fetchBranchMetrics>>;

function buildComparisonMatrix(
  results: { branchId: string; data: BranchResult }[]
) {
  const labels = results.map((r) => r.data.profile?.name ?? r.branchId);
  const ids    = results.map((r) => r.branchId);

  /** Helper: extract a numeric summary field across all branches. */
  const kpi = (field: keyof BranchResult["summary"]) =>
    results.map((r) => r.data.summary[field] as number);

  /** Helper: align grouped data (e.g. byStatus) across branches by key. */
  const alignGrouped = <T extends { [k: string]: unknown }>(
    field: keyof BranchResult["leads"] | keyof BranchResult["students"] | keyof BranchResult["visa"] | keyof BranchResult["loans"] | keyof BranchResult["courses"] | keyof BranchResult["mbbsLeads"],
    section: "leads" | "students" | "visa" | "loans" | "courses" | "mbbsLeads",
    keyProp: string,
    valueProp: string
  ) => {
    const allKeys = new Set<string>();
    for (const r of results) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arr = (r.data[section] as any)[field] as T[];
      arr.forEach((item: T) => allKeys.add(item[keyProp] as string));
    }
    const keys = Array.from(allKeys).sort();
    return {
      keys,
      series: results.map((r) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr = (r.data[section] as any)[field] as T[];
        const map = Object.fromEntries(
          arr.map((item: T) => [item[keyProp] as string, item[valueProp] as number])
        );
        return keys.map((k) => map[k] ?? 0);
      }),
    };
  };

  /** Helper: build monthly time-series aligned to same month range. */
  const alignTimeSeries = (field: "overTime", section: "leads" | "students") => {
    const allMonths = new Set<string>();
    for (const r of results) {
      r.data[section][field].forEach((row) => allMonths.add(row.month));
    }
    const months = Array.from(allMonths).sort();
    return {
      months,
      series: results.map((r) => {
        const map = Object.fromEntries(
          r.data[section][field].map((row) => [row.month, row.count])
        );
        return months.map((m) => map[m] ?? 0);
      }),
    };
  };

  return {
    branchLabels: labels,
    branchIds: ids,

    // ── KPI summary comparison ──
    kpis: {
      totalLeads:              { labels, values: kpi("totalLeads") },
      newLeadsThisMonth:       { labels, values: kpi("newLeadsThisMonth") },
      totalStudents:           { labels, values: kpi("totalStudents") },
      newStudentsThisMonth:    { labels, values: kpi("newStudentsThisMonth") },
      convertedLeads:          { labels, values: kpi("convertedLeads") },
      conversionRate:          { labels, values: kpi("conversionRate") },
      upcomingFollowups:       { labels, values: kpi("upcomingFollowups") },
      totalDocs:               { labels, values: kpi("totalDocs") },
      totalMbbsLeads:          { labels, values: kpi("totalMbbsLeads") },
      totalLoanAmountApproved: { labels, values: kpi("totalLoanAmountApproved") },
      totalVisaApplications:   { labels, values: kpi("totalVisaApplications") },
      visaApproved:            { labels, values: kpi("visaApproved") },
      visaRejected:            { labels, values: kpi("visaRejected") },
      visaApprovalRate:        { labels, values: kpi("visaApprovalRate") },
    },

    // ── Leads breakdown comparison ──
    leads: {
      byStatus:        alignGrouped("byStatus",       "leads", "status",        "count"),
      byStage:         alignGrouped("byStage",        "leads", "stage",         "count"),
      bySource:        alignGrouped("bySource",       "leads", "source",        "count"),
      byCountry:       alignGrouped("byCountry",      "leads", "country",       "count"),
      byQualification: alignGrouped("byQualification","leads", "qualification", "count"),
      byIntakeSeason:  alignGrouped("byIntakeSeason", "leads", "season",        "count"),
      byVisaStage:     alignGrouped("byVisaStage",    "leads", "stage",         "count"),
      overTime:        alignTimeSeries("overTime", "leads"),
    },

    // ── Students breakdown comparison ──
    students: {
      byStatus: alignGrouped("byStatus", "students", "status", "count"),
      overTime: alignTimeSeries("overTime", "students"),
    },

    // ── Visa comparison ──
    visa: {
      byStatus: alignGrouped("byStatus", "visa", "status", "count"),
      byType:   alignGrouped("byType",   "visa", "visaType", "count"),
      upcoming: {
        biometricsNext7Days: {
          labels,
          values: results.map((r) => r.data.visa.upcoming.biometricsNext7Days),
        },
        interviewsNext7Days: {
          labels,
          values: results.map((r) => r.data.visa.upcoming.interviewsNext7Days),
        },
        expiringNext30Days: {
          labels,
          values: results.map((r) => r.data.visa.upcoming.expiringNext30Days),
        },
      },
    },

    // ── Loans comparison ──
    loans: {
      byStatus: {
        keys: (() => {
          const s = new Set<string>();
          results.forEach((r) => r.data.loans.byStatus.forEach((x) => s.add(x.status as string)));
          return Array.from(s).sort();
        })(),
        countSeries: results.map((r) => {
          const keys = new Set<string>();
          results.forEach((b) => b.data.loans.byStatus.forEach((x) => keys.add(x.status as string)));
          const sorted = Array.from(keys).sort();
          const map = Object.fromEntries(r.data.loans.byStatus.map((x) => [x.status, x.count]));
          return sorted.map((k) => map[k] ?? 0);
        }),
        amountSeries: results.map((r) => {
          const keys = new Set<string>();
          results.forEach((b) => b.data.loans.byStatus.forEach((x) => keys.add(x.status as string)));
          const sorted = Array.from(keys).sort();
          const map = Object.fromEntries(r.data.loans.byStatus.map((x) => [x.status, Number(x.totalAmount)]));
          return sorted.map((k) => map[k] ?? 0);
        }),
      },
    },

    // ── Courses comparison ──
    courses: {
      byApplicationStatus: alignGrouped(
        "byApplicationStatus",
        "courses",
        "status",
        "count"
      ),
    },

    // ── MBBS leads comparison ──
    mbbsLeads: {
      byStatus: alignGrouped("byStatus", "mbbsLeads", "status", "count"),
    },
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const branchIdsParam = searchParams.get("branchIds");
    if (!branchIdsParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required query param: branchIds (comma-separated, 2–3 IDs)",
        },
        { status: 400 }
      );
    }

    const branchIds = branchIdsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (branchIds.length < 2 || branchIds.length > 3) {
      return NextResponse.json(
        {
          success: false,
          error: "branchIds must contain 2 or 3 branch IDs",
        },
        { status: 400 }
      );
    }

    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(new Date().getFullYear(), 0, 1);
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : new Date();

    // Validate all branches exist
    const branchRecords = await db.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    });
    if (branchRecords.length !== branchIds.length) {
      const foundIds = branchRecords.map((b) => b.id);
      const missing = branchIds.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        { success: false, error: `Branch(es) not found: ${missing.join(", ")}` },
        { status: 404 }
      );
    }

    // Fetch all branch metrics in parallel
    const results = await Promise.all(
      branchIds.map(async (id) => ({
        branchId: id,
        data: await fetchBranchMetrics(id, from, to),
      }))
    );

    // Build side-by-side comparison matrix
    const comparison = buildComparisonMatrix(results);

    // Determine winner per KPI (highest value wins)
    const winners: Record<string, { branchId: string; branchName: string; value: number }> = {};
    for (const [kpiKey, kpiData] of Object.entries(comparison.kpis)) {
      const maxVal = Math.max(...kpiData.values);
      const winnerIdx = kpiData.values.indexOf(maxVal);
      winners[kpiKey] = {
        branchId: comparison.branchIds[winnerIdx],
        branchName: comparison.branchLabels[winnerIdx],
        value: maxVal,
      };
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          meta: {
            generatedAt: new Date().toISOString(),
            filters: { branchIds, from, to },
            branches: branchRecords,
          },

          // Full per-branch data
          branches: results.map((r) => ({
            branchId: r.branchId,
            ...r.data,
          })),

          // Side-by-side aligned comparison (ready to feed into bar/line charts)
          comparison,

          // Quick-win summary: which branch leads on each KPI
          winners,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[BRANCH_COMPARE]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch branch comparison" },
      { status: 500 }
    );
  }
}