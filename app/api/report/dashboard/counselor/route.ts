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

  // Student filter used for COUNTS. Matches the same definition as
  // `convertedLeads` below: a student counts for this counselor if EITHER
  //   (a) Student.counselorId is set directly to this counselor and
  //       Student.createdAt falls in range, OR
  //   (b) the student's parent Lead belongs to this counselor
  //       (Lead.counselorId) and that Lead.createdAt falls in range.
  // This keeps "Total Students" and "Converted" reporting the same number
  // under normal flow, instead of silently diverging when Student.counselorId
  // is left null on conversion.
  const studentFilter = {
    OR: [
      { counselorId, createdAt: dateFilter },
      { lead: { counselorId, createdAt: dateFilter } },
    ],
    ...(branchId ? { branchId } : {}),
  };

  // Student filter used for the LIST view. This is intentionally looser:
  //   - Student.counselorId is frequently left null when a Student row is
  //     created automatically off a Lead conversion (only Lead.counselorId
  //     gets set in that flow), so we OR against the linked Lead's counselorId.
  //   - We don't hard-filter the list by Student.createdAt, because a Student
  //     can be created well after its parent Lead (e.g. lead created in
  //     range, converted to a student months later). Instead we match on
  //     "this counselor owns it" and let the caller deal with display window
  //     via the lead's createdAt where useful.
  const studentListFilter = {
    OR: [
      { counselorId },
      { lead: { counselorId } },
    ],
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
    convertedLeads, // leads with a linked Student (lead → student conversion)

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
    studentList, // actual student records, not just counts

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
    db.lead.groupBy({
      by: ["country"],
      where: { ...leadFilter, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
    }),

    // ── 9. Leads by intake season ─────────────────────────────────────────────
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

    // ── 14. Total students (strict — Student.counselorId + Student.createdAt) ─
    db.student.count({ where: studentFilter }),

    // ── 15. New students this month ───────────────────────────────────────────
    db.student.count({
      where: {
        OR: [
          { counselorId, createdAt: { gte: startOfMonth } },
          { lead: { counselorId, createdAt: { gte: startOfMonth } } },
        ],
        ...(branchId ? { branchId } : {}),
      },
    }),

    // ── 16. Students by status ────────────────────────────────────────────────
    db.student.groupBy({
      by: ["status"],
      where: studentFilter,
      _count: { _all: true },
    }),

    // ── 17. Students over time (monthly) ──────────────────────────────────────
    db.$queryRawUnsafe<RawMonthRow[]>(
      `SELECT TO_CHAR(s."createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM "Student" s
       LEFT JOIN "leads" l ON l."id" = s."leadId"
       WHERE (
         (s."counselorId" = $1 AND s."createdAt" >= $2 AND s."createdAt" <= $3)
         OR
         (l."counselorId" = $1 AND l."createdAt" >= $2 AND l."createdAt" <= $3)
       )
         ${branchId ? `AND s."branchId" = '${branchId}'` : ""}
       GROUP BY month ORDER BY month ASC`,
      counselorId,
      from,
      to
    ),

    // ── 17b. Full student list (actual records, for table/grid display) ───────
    // Uses studentListFilter (OR on Student.counselorId / lead.counselorId,
    // no createdAt restriction) so converted students actually show up.
    db.student.findMany({
      where: studentListFilter,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentName: true,
        emailId: true,
        mobileNumber: true,
        status: true,
        createdAt: true,
        leadId: true,
        counselorId: true,
        lead: {
          select: {
            id: true,
            source: true,
            status: true,
            country: true,
            intakeSeason: true,
            passport: true,
            visaStage: true,
            counselorId: true,
          },
        },
      },
    }),

    // ── 18. Visa total ────────────────────────────────────────────────────────
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
    db.lead.count({
      where: {
        ...leadFilter,
        depositDeadline: { gte: now, lte: in7Days },
      },
    }),

    // ── 23. Upcoming CAS deadlines (next 7 days) ──────────────────────────────
    db.lead.count({
      where: {
        ...leadFilter,
        casDeadline: { gte: now, lte: in7Days },
      },
    }),

    // ── 24. University starts (next 30 days) ──────────────────────────────────
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
            studentName: true,
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
  // NOTE: totalStudents and convertedLeads are now built on the same
  // definition (a lead belonging to this counselor, created in range, that
  // has become a Student) — see studentFilter / leadFilter above — so they
  // should match 1:1 under normal data. conversionRate stays driven off
  // convertedLeads/totalLeads since that's the lead-centric source of truth.
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
      convertedLeads, // leads that became a Student (lead → student conversion)
      conversionRate, // % of leads converted to students

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

    // ── Students block — includes the actual converted student records ───────
    students: {
      total: totalStudents,
      newThisMonth: newStudentsThisMonth,
      convertedFromLeads: convertedLeads, // same lead→student conversion count
      conversionRate, // duplicated here for convenience on student-facing UI
      byStatus: studentsByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      overTime: serializeOverTime(studentsOverTime),
      list: studentList.map((s) => ({
        id: s.id,
        name: s.studentName,
        email: s.emailId,
        phone: s.mobileNumber,
        status: s.status,
        country: s.lead?.country ?? null,
        intakeSeason: s.lead?.intakeSeason ?? null,
        passport: s.lead?.passport ?? null,
        visaStage: s.lead?.visaStage ?? null,
        createdAt: s.createdAt,
        leadId: s.leadId,
        leadSource: s.lead?.source ?? null,
        leadStatus: s.lead?.status ?? null,
      })),
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

    // Combined student list across all counselors (flattened, source-tagged,
    // de-duplicated by id in case a shared/secondary counselor assignment
    // causes the same student to surface for more than one counselor).
    const seenStudentIds = new Set<string>();
    const globalStudentList = counselorAnalytics.flatMap((c) =>
      c.analytics.students.list
        .filter((s) => {
          if (seenStudentIds.has(s.id)) return false;
          seenStudentIds.add(s.id);
          return true;
        })
        .map((s) => ({
          ...s,
          counselorId: c.counselorId,
          counselorName: c.counselorName,
        }))
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
          students: globalStudentList, // flat list of all converted students across counselors
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