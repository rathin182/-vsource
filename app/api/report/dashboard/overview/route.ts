// app/api/report/dashboard/counselor/route.ts
//
// GET /api/report/dashboard/counselor
//   → Returns full CRM analytics for ALL counselors (or a single counselor via ?counselorId=)
//
// Query params:
//   counselorId  (optional) — filter to one counselor
//   branchId     (optional) — scope to a specific branch
//   from         (optional) — ISO date string, default = start of current year
//   to           (optional) — ISO date string, default = now

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawMonthRow {
  month: string;
  count: bigint;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const serializeOverTime = (rows: RawMonthRow[]) =>
  rows.map((r) => ({ month: r.month, count: Number(r.count) }));

const safeRate = (numerator: number, denominator: number): number =>
  denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;

// ─── Core analytics builder ───────────────────────────────────────────────────

async function buildCounselorAnalytics(
  counselorId: string,
  from: Date,
  to: Date,
  branchId: string | null
) {
  const dateFilter = { gte: from, lte: to };

  // Lead filter — scoped by counselorId, date range, and optionally branchId
  const leadFilter = {
    counselorId,
    createdAt: dateFilter,
    ...(branchId ? { branchId } : {}),
  };

  const now = new Date();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    // ── Counselor profile ─────────────────────────────────────────────────────
    counselorProfile,

    // ── Lead metrics ──────────────────────────────────────────────────────────
    totalLeads,
    newLeadsThisMonth,
    convertedLeads,

    leadsByStatus,
    leadsByStage,
    leadsBySource,
    leadsByCountry,
    leadsByIntakeSeason,
    leadsByVisaStage,
    leadsOverTime,

    // ── Follow-up metrics ─────────────────────────────────────────────────────
    upcomingFollowups,
    overdueFollowups,

    // ── Student metrics ───────────────────────────────────────────────────────
    totalStudents,
    newStudentsThisMonth,
    studentsByStatus,
    studentsOverTime,

    // ── Visa metrics ──────────────────────────────────────────────────────────
    visaTotal,
    visaByStatus,
    visaApproved,
    visaRejected,

    // Upcoming deadlines derived from Lead fields (depositDeadline, casDeadline, universityStart)
    upcomingDeposits,
    upcomingCasDeadlines,
    upcomingUniversityStarts,

    // ── Loan metrics ──────────────────────────────────────────────────────────
    loansByStatus,
    totalLoanApproved,

    // ── Course / Application metrics ──────────────────────────────────────────
    coursesByStatus,
    topUniversities,

    // ── Document metrics ──────────────────────────────────────────────────────
    totalDocs,

    // ── Remark metrics ────────────────────────────────────────────────────────
    remarksByType,
    totalRemarks,

    // ── Timeline metrics ──────────────────────────────────────────────────────
    totalTimelinesCreated,
    recentTimelines,

    // ── MBBS leads ────────────────────────────────────────────────────────────
    totalMbbsLeads,
    mbbsLeadsByStatus,

    // ── LeadCounselor assignments (includes secondary/shared assignments) ──────
    totalAssignedLeads,
    assignedLeadsByStatus,

    // ── Monthly target ────────────────────────────────────────────────────────
    monthlyTargetData,
  ] = await Promise.all([

    // ── 1. Counselor profile ──────────────────────────────────────────────────
    db.user.findUnique({
      where: { id: counselorId },
      select: {
        id: true,
        name: true,
        email: true,
        monthlyTarget: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        branches: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            state: true,
          },
        },
        createdAt: true,
      },
    }),

    // ── 2. Total leads (directly assigned via Lead.counselorId) ───────────────
    db.lead.count({ where: leadFilter }),

    // ── 3. New leads this month ───────────────────────────────────────────────
    db.lead.count({
      where: {
        ...leadFilter,
        createdAt: { gte: startOfMonth },
      },
    }),

    // ── 4. Converted leads (have a linked Student) ────────────────────────────
    db.lead.count({
      where: { ...leadFilter, student: { isNot: null } },
    }),

    // ── 5. Leads by status ────────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["status"],
      where: leadFilter,
      _count: { _all: true },
    }),

    // ── 6. Leads by stage ─────────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["leadStage"],
      where: leadFilter,
      _count: { _all: true },
    }),

    // ── 7. Leads by source ────────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["source"],
      where: leadFilter,
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
    }),

    // ── 8. Leads by country ───────────────────────────────────────────────────
    // NOTE: Uses `country` (String?) field on Lead — not a relation
    db.lead.groupBy({
      by: ["country"],
      where: { ...leadFilter, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
    }),

    // ── 9. Leads by intake season ─────────────────────────────────────────────
    // NOTE: `qualification` does NOT exist on Lead. Using `intakeSeason` instead.
    db.lead.groupBy({
      by: ["intakeSeason"],
      where: { ...leadFilter, intakeSeason: { not: null } },
      _count: { _all: true },
    }),

    // ── 10. Leads by visa stage ───────────────────────────────────────────────
    db.lead.groupBy({
      by: ["visaStage"],
      where: leadFilter,
      _count: { _all: true },
    }),

    // ── 11. Leads over time (monthly) ─────────────────────────────────────────
    // NOTE: table is mapped as "leads" in schema (@@map("leads"))
    db.$queryRawUnsafe<RawMonthRow[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM "leads"
       WHERE "counselorId" = $1
         AND "createdAt" >= $2
         AND "createdAt" <= $3
         ${branchId ? `AND "branchId" = '${branchId}'` : ""}
       GROUP BY month ORDER BY month ASC`,
      counselorId,
      from,
      to
    ),

    // ── 12. Upcoming follow-ups (next 7 days) ─────────────────────────────────
    db.leadTimeline.count({
      where: {
        lead: leadFilter,
        nextFollowup: { gte: now, lte: in7Days },
      },
    }),

    // ── 13. Overdue follow-ups (past, not yet acted on) ───────────────────────
    db.leadTimeline.count({
      where: {
        lead: leadFilter,
        nextFollowup: { lt: now },
      },
    }),

    // ── 14. Total students ────────────────────────────────────────────────────
    db.student.count({
      where: {
        counselorId,
        createdAt: dateFilter,
        ...(branchId ? { branchId } : {}),
      },
    }),

    // ── 15. New students this month ───────────────────────────────────────────
    db.student.count({
      where: {
        counselorId,
        createdAt: { gte: startOfMonth },
        ...(branchId ? { branchId } : {}),
      },
    }),

    // ── 16. Students by status ────────────────────────────────────────────────
    db.student.groupBy({
      by: ["status"],
      where: {
        counselorId,
        createdAt: dateFilter,
        ...(branchId ? { branchId } : {}),
      },
      _count: { _all: true },
    }),

    // ── 17. Students over time (monthly) ──────────────────────────────────────
    // NOTE: Student model has no @@map so Prisma uses "Student" as table name
    db.$queryRawUnsafe<RawMonthRow[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM "Student"
       WHERE "counselorId" = $1
         AND "createdAt" >= $2
         AND "createdAt" <= $3
         ${branchId ? `AND "branchId" = '${branchId}'` : ""}
       GROUP BY month ORDER BY month ASC`,
      counselorId,
      from,
      to
    ),

    // ── 18. Visa total ────────────────────────────────────────────────────────
    // VisaDetail is linked via lead → lead.counselorId
    db.visaDetail.count({ where: { lead: leadFilter } }),

    // ── 19. Visa by status ────────────────────────────────────────────────────
    db.visaDetail.groupBy({
      by: ["status"],
      where: { lead: leadFilter },
      _count: { _all: true },
    }),

    // ── 20. Visa approved ─────────────────────────────────────────────────────
    db.visaDetail.count({ where: { lead: leadFilter, status: "APPROVED" } }),

    // ── 21. Visa rejected ─────────────────────────────────────────────────────
    db.visaDetail.count({ where: { lead: leadFilter, status: "REJECTED" } }),

    // ── 22. Upcoming deposit deadlines (next 7 days) ──────────────────────────
    // NOTE: depositDeadline is on Lead, not VisaDetail — using Lead model
    db.lead.count({
      where: {
        ...leadFilter,
        depositDeadline: { gte: now, lte: in7Days },
      },
    }),

    // ── 23. Upcoming CAS deadlines (next 7 days) ──────────────────────────────
    // NOTE: casDeadline is on Lead
    db.lead.count({
      where: {
        ...leadFilter,
        casDeadline: { gte: now, lte: in7Days },
      },
    }),

    // ── 24. University starts (next 30 days) ──────────────────────────────────
    // NOTE: universityStart is on Lead
    db.lead.count({
      where: {
        ...leadFilter,
        universityStart: { gte: now, lte: in30Days },
      },
    }),

    // ── 25. Loans by status ───────────────────────────────────────────────────
    db.loanInquiry.groupBy({
      by: ["status"],
      where: { lead: leadFilter },
      _count: { _all: true },
      _sum: { amount: true },
    }),

    // ── 26. Total loan amount approved/disbursed ──────────────────────────────
    db.loanInquiry.aggregate({
      _sum: { amount: true },
      where: { lead: leadFilter, status: { in: ["APPROVED", "DISBURSED"] } },
    }),

    // ── 27. Courses by application status ─────────────────────────────────────
    db.studentCourses.groupBy({
      by: ["applicationStatus"],
      where: { lead: leadFilter },
      _count: { _all: true },
    }),

    // ── 28. Top universities applied to ───────────────────────────────────────
    db.studentCourses.groupBy({
      by: ["universityName"],
      where: { lead: leadFilter },
      _count: { _all: true },
      orderBy: { _count: { universityName: "desc" } },
      take: 10,
    }),

    // ── 29. Total documents ───────────────────────────────────────────────────
    db.doc.count({ where: { lead: leadFilter } }),

    // ── 30. Remarks by type ───────────────────────────────────────────────────
    db.remark.groupBy({
      by: ["type"],
      where: { createdById: counselorId },
      _count: { _all: true },
    }),

    // ── 31. Total remarks created ─────────────────────────────────────────────
    db.remark.count({ where: { createdById: counselorId } }),

    // ── 32. Total lead timelines created by this counselor ────────────────────
    db.leadTimeline.count({
      where: {
        createdById: counselorId,
        createdAt: dateFilter,
      },
    }),

    // ── 33. Recent 5 timelines by this counselor ──────────────────────────────
    // NOTE: Lead fields are studentName, phone, email, status (no firstName/lastName)
    db.leadTimeline.findMany({
      where: { createdById: counselorId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        description: true,
        nextFollowup: true,
        createdAt: true,
        lead: {
          select: {
            id: true,
            studentName: true, // ← correct field (no firstName/lastName on Lead)
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    }),

    // ── 34. MBBS leads assigned to this counselor ─────────────────────────────
    db.mbbsLeadCounselor.count({
      where: { counselorId },
    }),

    // ── 35. MBBS leads by status ──────────────────────────────────────────────
    db.mbbsLeadCounselor.findMany({
      where: { counselorId },
      select: {
        mbbsLead: { select: { status: true } },
      },
    }),

    // ── 36. Total assigned leads via LeadCounselor (primary + shared) ─────────
    db.leadCounselor.count({
      where: {
        counselorId,
        lead: {
          createdAt: dateFilter,
          ...(branchId ? { branchId } : {}),
        },
      },
    }),

    // ── 37. Assigned leads breakdown by lead status ───────────────────────────
    db.leadCounselor.findMany({
      where: {
        counselorId,
        lead: {
          createdAt: dateFilter,
          ...(branchId ? { branchId } : {}),
        },
      },
      select: {
        isPrimary: true,
        lead: {
          select: {
            status: true,
            student: { select: { id: true } },
          },
        },
      },
    }),

    // ── 38. Monthly target data ────────────────────────────────────────────────
    db.user.findUnique({
      where: { id: counselorId },
      select: { monthlyTarget: true },
    }),
  ]);

  // ── Process MBBS by status ────────────────────────────────────────────────
  const mbbsStatusMap: Record<string, number> = {};
  for (const row of mbbsLeadsByStatus) {
    const s = row.mbbsLead.status as string;
    mbbsStatusMap[s] = (mbbsStatusMap[s] ?? 0) + 1;
  }

  // ── Process assigned leads (primary vs shared, status breakdown) ───────────
  let primaryAssigned = 0;
  let sharedAssigned = 0;
  let assignedConverted = 0;
  const assignedStatusMap: Record<string, number> = {};

  for (const row of assignedLeadsByStatus) {
    if (row.isPrimary) primaryAssigned++;
    else sharedAssigned++;
    if (row.lead.student) assignedConverted++;
    const s = row.lead.status as string;
    assignedStatusMap[s] = (assignedStatusMap[s] ?? 0) + 1;
  }

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const conversionRate = safeRate(convertedLeads, totalLeads);
  const visaApprovalRate = safeRate(visaApproved, visaTotal);
  const monthlyTarget = monthlyTargetData?.monthlyTarget ?? 0;
  const monthlyTargetAchievement = safeRate(newLeadsThisMonth, monthlyTarget);

  return {
    profile: counselorProfile,

    summary: {
      // Lead KPIs
      totalLeads,
      newLeadsThisMonth,
      convertedLeads,
      conversionRate,

      // Target tracking
      monthlyTarget,
      monthlyTargetAchievement,

      // Assigned (via LeadCounselor — includes shared leads)
      totalAssignedLeads,
      primaryAssignedLeads: primaryAssigned,
      sharedAssignedLeads: sharedAssigned,
      assignedConvertedLeads: assignedConverted,
      assignedConversionRate: safeRate(assignedConverted, totalAssignedLeads),

      // Student KPIs
      totalStudents,
      newStudentsThisMonth,

      // Follow-up KPIs
      upcomingFollowups,
      overdueFollowups,

      // Visa KPIs
      totalVisaApplications: visaTotal,
      visaApproved,
      visaRejected,
      visaApprovalRate,

      // Loan KPIs
      totalLoanAmountApproved: totalLoanApproved._sum.amount ?? 0,

      // Activity KPIs
      totalRemarks,
      totalTimelinesCreated,
      totalDocs,

      // MBBS
      totalMbbsLeads,
    },

    leads: {
      byStatus: leadsByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      byStage: leadsByStage.map((r) => ({
        stage: r.leadStage,
        count: r._count._all,
      })),
      bySource: leadsBySource.map((r) => ({
        source: r.source,
        count: r._count._all,
      })),
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
      overTime: serializeOverTime(leadsOverTime),
      assignedBreakdown: {
        total: totalAssignedLeads,
        primary: primaryAssigned,
        shared: sharedAssigned,
        byStatus: assignedStatusMap,
      },
    },

    students: {
      byStatus: studentsByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      overTime: serializeOverTime(studentsOverTime),
    },

    followups: {
      upcoming7Days: upcomingFollowups,
      overdue: overdueFollowups,
      recentActivity: recentTimelines,
    },

    visa: {
      total: visaTotal,
      approved: visaApproved,
      rejected: visaRejected,
      approvalRate: visaApprovalRate,
      byStatus: visaByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      // NOTE: visaType, biometricsDate, interviewDate, expiryDate do NOT exist
      // on VisaDetail in the schema — removed those queries entirely.
      // Deadline data is sourced from Lead fields instead:
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
        totalAmount: r._sum.amount ?? 0,
      })),
      totalApproved: totalLoanApproved._sum.amount ?? 0,
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
      totalRemarks,
      remarksByType: remarksByType.map((r) => ({
        type: r.type,
        count: r._count._all,
      })),
      totalTimelinesCreated,
      recentTimelines,
    },

    mbbsLeads: {
      total: totalMbbsLeads,
      byStatus: Object.entries(mbbsStatusMap).map(([status, count]) => ({
        status,
        count,
      })),
    },
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const counselorId = searchParams.get("counselorId") || null;
    const branchId = searchParams.get("branchId") || null;
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(new Date().getFullYear(), 0, 1);
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : new Date();

    // ── Single counselor mode ─────────────────────────────────────────────────
    if (counselorId) {
      const exists = await db.user.findUnique({ where: { id: counselorId } });
      if (!exists) {
        return NextResponse.json(
          { success: false, error: "Counselor not found" },
          { status: 404 }
        );
      }

      const analytics = await buildCounselorAnalytics(
        counselorId,
        from,
        to,
        branchId
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            meta: {
              generatedAt: new Date().toISOString(),
              mode: "single",
              filters: { counselorId, branchId, from, to },
            },
            counselor: analytics,
          },
        },
        { status: 200 }
      );
    }

    // ── All counselors mode ───────────────────────────────────────────────────

    const allCounselors = await db.user.findMany({
      where: branchId
        ? { branches: { some: { id: branchId } } }
        : {},
      select: {
        id: true,
        name: true,
        email: true,
        monthlyTarget: true,
        role: { select: { id: true, name: true } },
        branches: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Build analytics for every counselor in parallel
    const counselorAnalytics = await Promise.all(
      allCounselors.map(async (c) => ({
        counselorId: c.id,
        counselorName: c.name,
        email: c.email,
        monthlyTarget: c.monthlyTarget,
        role: c.role,
        branches: c.branches,
        analytics: await buildCounselorAnalytics(c.id, from, to, branchId),
      }))
    );

    // ── Global aggregates across all counselors ───────────────────────────────
    const globalTotalLeads = counselorAnalytics.reduce(
      (acc, c) => acc + c.analytics.summary.totalLeads,
      0
    );
    const globalConverted = counselorAnalytics.reduce(
      (acc, c) => acc + c.analytics.summary.convertedLeads,
      0
    );
    const globalTotalStudents = counselorAnalytics.reduce(
      (acc, c) => acc + c.analytics.summary.totalStudents,
      0
    );
    const globalConversionRate =
      globalTotalLeads > 0
        ? Number(((globalConverted / globalTotalLeads) * 100).toFixed(2))
        : 0;
    const globalUpcomingFollowups = counselorAnalytics.reduce(
      (acc, c) => acc + c.analytics.summary.upcomingFollowups,
      0
    );
    const globalOverdueFollowups = counselorAnalytics.reduce(
      (acc, c) => acc + c.analytics.summary.overdueFollowups,
      0
    );

    // ── Leaderboard: ranked by conversion rate ────────────────────────────────
    const leaderboard = [...counselorAnalytics]
      .sort((a, b) => {
        if (b.analytics.summary.conversionRate !== a.analytics.summary.conversionRate) {
          return b.analytics.summary.conversionRate - a.analytics.summary.conversionRate;
        }
        return b.analytics.summary.totalLeads - a.analytics.summary.totalLeads;
      })
      .map((c, idx) => ({
        rank: idx + 1,
        counselorId: c.counselorId,
        counselorName: c.counselorName,
        email: c.email,
        monthlyTarget: c.monthlyTarget,
        branches: c.branches,
        totalLeads: c.analytics.summary.totalLeads,
        convertedLeads: c.analytics.summary.convertedLeads,
        conversionRate: c.analytics.summary.conversionRate,
        newLeadsThisMonth: c.analytics.summary.newLeadsThisMonth,
        monthlyTargetAchievement: c.analytics.summary.monthlyTargetAchievement,
        totalStudents: c.analytics.summary.totalStudents,
        visaApproved: c.analytics.summary.visaApproved,
        visaApprovalRate: c.analytics.summary.visaApprovalRate,
        upcomingFollowups: c.analytics.summary.upcomingFollowups,
        overdueFollowups: c.analytics.summary.overdueFollowups,
        totalRemarks: c.analytics.summary.totalRemarks,
        totalMbbsLeads: c.analytics.summary.totalMbbsLeads,
      }));

    // ── Top counselors by leads this month ────────────────────────────────────
    const topThisMonth = [...counselorAnalytics]
      .sort(
        (a, b) =>
          b.analytics.summary.newLeadsThisMonth -
          a.analytics.summary.newLeadsThisMonth
      )
      .slice(0, 5)
      .map((c) => ({
        counselorId: c.counselorId,
        counselorName: c.counselorName,
        newLeadsThisMonth: c.analytics.summary.newLeadsThisMonth,
        monthlyTarget: c.monthlyTarget,
        monthlyTargetAchievement: c.analytics.summary.monthlyTargetAchievement,
      }));

    return NextResponse.json(
      {
        success: true,
        data: {
          meta: {
            generatedAt: new Date().toISOString(),
            mode: "all",
            filters: { branchId, from, to },
            totalCounselors: allCounselors.length,
          },
          globalSummary: {
            totalLeads: globalTotalLeads,
            totalStudents: globalTotalStudents,
            convertedLeads: globalConverted,
            conversionRate: globalConversionRate,
            upcomingFollowups: globalUpcomingFollowups,
            overdueFollowups: globalOverdueFollowups,
          },
          leaderboard,
          topThisMonth,
          counselors: counselorAnalytics,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[COUNSELLOR_DASHBOARD]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch counselor dashboard" },
      { status: 500 }
    );
  }
}