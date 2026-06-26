// app/api/dashboard/branches/route.ts
//
// GET /api/dashboard/branches
//   → Returns full CRM analytics for ALL branches (or a single branch via ?branchId=)
//
// Query params:
//   branchId  (optional) — filter to one branch
//   from      (optional) — ISO date string, default = start of current year
//   to        (optional) — ISO date string, default = now

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

// ─── helpers ────────────────────────────────────────────────────────────────

const serializeOverTime = (rows: { month: string; count: bigint }[]) =>
  rows.map((r) => ({ month: r.month, count: Number(r.count) }));

/** Build a full analytics block for one branchId (or all if null). */
async function buildBranchAnalytics(branchId: string | null, from: Date, to: Date) {
  const dateFilter = { gte: from, lte: to };
  const bf = branchId ? { branchId } : {}; // branch filter shorthand

  const [
    // ── Lead metrics ──────────────────────────────────────────────────────────
    totalLeads,
    newLeadsThisMonth,
    leadsByStatus,
    leadsByStage,
    leadsBySource,
    leadsByCountry,
    leadsByQualification,
    leadsByIntakeSeason,
    leadsByVisaStage,
    leadsOverTime,
    convertedLeads,
    upcomingFollowups,

    // ── Student metrics ───────────────────────────────────────────────────────
    totalStudents,
    newStudentsThisMonth,
    studentsByStatus,
    studentsOverTime,

    // ── Counselor metrics ─────────────────────────────────────────────────────
    topCounselors,
    counselorLeadSummary, // per counselor: leads, converted, followups

    // ── Visa metrics (scoped to this branch's leads) ──────────────────────────
    visaTotal,
    visaByStatus,
    visaByType,
    visaApproved,
    visaRejected,
    upcomingBiometrics,
    upcomingInterviews,
    visasExpiringSoon,

    // ── Loan metrics (scoped to this branch's leads) ──────────────────────────
    loansByStatus,
    totalLoanApproved,

    // ── Course / application metrics ──────────────────────────────────────────
    coursesByStatus,
    topUniversities,

    // ── Doc counts ────────────────────────────────────────────────────────────
    totalDocs,

    // ── MBBS leads (if applicable) ────────────────────────────────────────────
    totalMbbsLeads,
    mbbsLeadsByStatus,

    // ── Branch profile itself ─────────────────────────────────────────────────
    branchProfile,
  ] = await Promise.all([

    // ── 1. Total leads ────────────────────────────────────────────────────────
    db.lead.count({ where: { ...bf, createdAt: dateFilter } }),

    // ── 2. New leads this month ───────────────────────────────────────────────
    db.lead.count({
      where: {
        ...bf,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),

    // ── 3. Leads by status ────────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["status"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    // ── 4. Leads by stage ─────────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["leadStage"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    // ── 5. Leads by source ────────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["source"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
    }),

    // ── 6. Leads by country ───────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["country"],
      where: { ...bf, createdAt: dateFilter, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
    }),

    // ── 7. Leads by qualification ─────────────────────────────────────────────
    db.lead.groupBy({
      by: ["qualification"],
      where: { ...bf, createdAt: dateFilter, qualification: { not: null } },
      _count: { _all: true },
    }),

    // ── 8. Leads by intake season ─────────────────────────────────────────────
    db.lead.groupBy({
      by: ["intakeSeason"],
      where: { ...bf, createdAt: dateFilter, intakeSeason: { not: null } },
      _count: { _all: true },
    }),

    // ── 9. Leads by visa stage ────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["visaStage"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    // ── 10. Leads over time (monthly) ─────────────────────────────────────────
    db.$queryRawUnsafe<{ month: string; count: bigint }[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM leads
       WHERE "createdAt" >= $1 AND "createdAt" <= $2
         ${branchId ? `AND "branchId" = '${branchId}'` : ""}
       GROUP BY month ORDER BY month ASC`,
      from,
      to
    ),

    // ── 11. Converted leads (have a linked student) ───────────────────────────
    db.lead.count({
      where: { ...bf, createdAt: dateFilter, student: { isNot: null } },
    }),

    // ── 12. Upcoming follow-ups (next 7 days) ─────────────────────────────────
    db.leadTimeline.count({
      where: {
        lead: { ...bf },
        nextFollowup: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // ── 13. Total students ────────────────────────────────────────────────────
    db.student.count({ where: { ...bf, createdAt: dateFilter } }),

    // ── 14. New students this month ───────────────────────────────────────────
    db.student.count({
      where: {
        ...bf,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),

    // ── 15. Students by status ────────────────────────────────────────────────
    db.student.groupBy({
      by: ["status"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    // ── 16. Students over time (monthly) ──────────────────────────────────────
    db.$queryRawUnsafe<{ month: string; count: bigint }[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM "Student"
       WHERE "createdAt" >= $1 AND "createdAt" <= $2
         ${branchId ? `AND "branchId" = '${branchId}'` : ""}
       GROUP BY month ORDER BY month ASC`,
      from,
      to
    ),

    // ── 17. Top counselors by lead assignment (this branch) ───────────────────
    db.leadCounselor.groupBy({
      by: ["counselorId"],
      where: { lead: { ...bf, createdAt: dateFilter } },
      _count: { _all: true },
      orderBy: { _count: { counselorId: "desc" } },
      take: 10,
    }),

    // ── 18. Per-counselor lead summary (assigned, converted, followups) ────────
    db.leadCounselor.findMany({
      where: { lead: { ...bf, createdAt: dateFilter } },
      select: {
        counselorId: true,
        counselor: { select: { id: true, name: true, email: true } },
        lead: {
          select: {
            id: true,
            status: true,
            student: { select: { id: true } },
          },
        },
      },
    }),

    // ── 19. Visa total (leads in this branch) ─────────────────────────────────
    db.visaDetail.count({ where: { lead: { ...bf } } }),

    // ── 20. Visa by status ────────────────────────────────────────────────────
    db.visaDetail.groupBy({
      by: ["status"],
      where: { lead: { ...bf } },
      _count: { _all: true },
    }),

    // ── 21. Visa by type ──────────────────────────────────────────────────────
    db.visaDetail.groupBy({
      by: ["visaType"],
      where: { lead: { ...bf }, visaType: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { visaType: "desc" } },
    }),

    // ── 22. Visa approved count ───────────────────────────────────────────────
    db.visaDetail.count({ where: { lead: { ...bf }, status: "APPROVED" } }),

    // ── 23. Visa rejected count ───────────────────────────────────────────────
    db.visaDetail.count({ where: { lead: { ...bf }, status: "REJECTED" } }),

    // ── 24. Upcoming biometrics (next 7 days) ─────────────────────────────────
    db.visaDetail.count({
      where: {
        lead: { ...bf },
        biometricsDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // ── 25. Upcoming interviews (next 7 days) ─────────────────────────────────
    db.visaDetail.count({
      where: {
        lead: { ...bf },
        interviewDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // ── 26. Visas expiring soon (next 30 days) ────────────────────────────────
    db.visaDetail.count({
      where: {
        lead: { ...bf },
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // ── 27. Loans by status ───────────────────────────────────────────────────
    db.loanInquiry.groupBy({
      by: ["status"],
      where: { lead: { ...bf } },
      _count: { _all: true },
      _sum: { amount: true },
    }),

    // ── 28. Total loan amount approved/disbursed ──────────────────────────────
    db.loanInquiry.aggregate({
      _sum: { amount: true },
      where: { lead: { ...bf }, status: { in: ["APPROVED", "DISBURSED"] } },
    }),

    // ── 29. Student courses by application status ─────────────────────────────
    db.studentCourses.groupBy({
      by: ["applicationStatus"],
      where: { lead: { ...bf } },
      _count: { _all: true },
    }),

    // ── 30. Top 10 universities applied to (from StudentCourses) ──────────────
    db.studentCourses.groupBy({
      by: ["universityName"],
      where: { lead: { ...bf } },
      _count: { _all: true },
      orderBy: { _count: { universityName: "desc" } },
      take: 10,
    }),

    // ── 31. Total documents uploaded ──────────────────────────────────────────
    db.doc.count({ where: { lead: { ...bf } } }),

    // ── 32. Total MBBS leads ──────────────────────────────────────────────────
    db.mbbsLead.count({
      where: branchId ? { branchId } : {},
    }),

    // ── 33. MBBS leads by status ──────────────────────────────────────────────
    db.mbbsLead.groupBy({
      by: ["status"],
      where: branchId ? { branchId } : {},
      _count: { _all: true },
    }),

    // ── 34. Branch profile(s) ─────────────────────────────────────────────────
    db.branch.findMany({
      where: branchId ? { id: branchId } : {},
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        address: true,
        status: true,
        createdAt: true,
        _count: { select: { leads: true, students: true } },
      },
    }),
  ]);

  // ── Enrich counselor data ────────────────────────────────────────────────
  const counselorIds = topCounselors.map((c) => c.counselorId);
  const counselorDetails = await db.user.findMany({
    where: { id: { in: counselorIds } },
    select: { id: true, name: true, email: true, monthlyTarget: true },
  });
  const counselorMap = Object.fromEntries(
    counselorDetails.map((u) => [u.id, u])
  );

  // Build per-counselor summary from raw join data
  const counselorSummaryMap: Record<
    string,
    { assigned: number; converted: number; statuses: Record<string, number> }
  > = {};
  for (const row of counselorLeadSummary) {
    const cid = row.counselorId;
    if (!counselorSummaryMap[cid]) {
      counselorSummaryMap[cid] = { assigned: 0, converted: 0, statuses: {} };
    }
    counselorSummaryMap[cid].assigned += 1;
    if (row.lead.student) counselorSummaryMap[cid].converted += 1;
    const s = row.lead.status as string;
    counselorSummaryMap[cid].statuses[s] =
      (counselorSummaryMap[cid].statuses[s] ?? 0) + 1;
  }

  // ── Derived KPIs ──────────────────────────────────────────────────────────
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
      topByLeadAssignments: topCounselors.map((r) => ({
        counselorId: r.counselorId,
        counselor: counselorMap[r.counselorId] ?? null,
        assignedLeads: r._count._all,
        ...(counselorSummaryMap[r.counselorId] && {
          convertedLeads: counselorSummaryMap[r.counselorId].converted,
          conversionRate:
            r._count._all > 0
              ? Number(
                  (
                    (counselorSummaryMap[r.counselorId].converted /
                      r._count._all) *
                    100
                  ).toFixed(2)
                )
              : 0,
          leadStatusBreakdown: counselorSummaryMap[r.counselorId].statuses,
        }),
      })),
    },
  };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const branchId = searchParams.get("branchId") || null;
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(new Date().getFullYear(), 0, 1);
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

    if (branchId) {
      // ── Single branch mode ───────────────────────────────────────────────
      const exists = await db.branch.findUnique({ where: { id: branchId } });
      if (!exists) {
        return NextResponse.json(
          { success: false, error: "Branch not found" },
          { status: 404 }
        );
      }

      const analytics = await buildBranchAnalytics(branchId, from, to);

      return NextResponse.json(
        {
          success: true,
          data: {
            meta: {
              generatedAt: new Date().toISOString(),
              mode: "single",
              filters: { branchId, from, to },
            },
            branch: analytics,
          },
        },
        { status: 200 }
      );
    } else {
      // ── All branches mode ─────────────────────────────────────────────────
      const allBranches = await db.branch.findMany({
        select: { id: true, name: true, code: true, city: true, state: true, status: true },
      });

      // Build analytics for every branch in parallel
      const branchAnalytics = await Promise.all(
        allBranches.map(async (b) => ({
          branchId: b.id,
          branchName: b.name,
          branchCode: b.code,
          city: b.city,
          state: b.state,
          status: b.status,
          analytics: await buildBranchAnalytics(b.id, from, to),
        }))
      );

      // ── Global aggregates across all branches ─────────────────────────────
      const globalTotalLeads = branchAnalytics.reduce(
        (acc, b) => acc + b.analytics.summary.totalLeads,
        0
      );
      const globalTotalStudents = branchAnalytics.reduce(
        (acc, b) => acc + b.analytics.summary.totalStudents,
        0
      );
      const globalConverted = branchAnalytics.reduce(
        (acc, b) => acc + b.analytics.summary.convertedLeads,
        0
      );
      const globalConversionRate =
        globalTotalLeads > 0
          ? Number(((globalConverted / globalTotalLeads) * 100).toFixed(2))
          : 0;

      // Ranked branch list by leads
      const rankedByLeads = [...branchAnalytics]
        .sort((a, b) => b.analytics.summary.totalLeads - a.analytics.summary.totalLeads)
        .map((b, idx) => ({
          rank: idx + 1,
          branchId: b.branchId,
          branchName: b.branchName,
          totalLeads: b.analytics.summary.totalLeads,
          totalStudents: b.analytics.summary.totalStudents,
          conversionRate: b.analytics.summary.conversionRate,
          visaApproved: b.analytics.summary.visaApproved,
          visaApprovalRate: b.analytics.summary.visaApprovalRate,
          newLeadsThisMonth: b.analytics.summary.newLeadsThisMonth,
        }));

      return NextResponse.json(
        {
          success: true,
          data: {
            meta: {
              generatedAt: new Date().toISOString(),
              mode: "all",
              filters: { from, to },
              totalBranches: allBranches.length,
            },
            globalSummary: {
              totalLeads: globalTotalLeads,
              totalStudents: globalTotalStudents,
              convertedLeads: globalConverted,
              conversionRate: globalConversionRate,
            },
            rankedByLeads,
            branches: branchAnalytics,
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[BRANCH_DASHBOARD]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch branch dashboard" },
      { status: 500 }
    );
  }
}