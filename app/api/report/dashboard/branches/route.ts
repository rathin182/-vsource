// app/api/dashboard/branches/route.ts
//
// GET /api/dashboard/branches
//   → Returns full CRM analytics for ALL branches (or a single branch via ?branchId=)
//
// Query params:
//   branchId  (optional) — filter to one branch. When provided, the response
//                            also includes `topPerformingCounselors` (top 3).
//   from      (optional) — ISO date string, default = start of current year
//   to        (optional) — ISO date string, default = now
//
// ─── Top-3 performing counselor ranking rule ────────────────────────────────
// "Best performing" = visa applications completed, weighed against monthlyTarget:
//   Tier 1: counselors who MET or EXCEEDED their monthlyTarget
//           (visaCount >= monthlyTarget, and monthlyTarget > 0)
//           → sorted by visaCount desc (most visas wins within this tier)
//   Tier 2: everyone else (target not met, or no target set)
//           → sorted by a blended score (desc):
//               targetCompletionRatio = monthlyTarget > 0 ? visaCount / monthlyTarget : 0
//               relativeVisaVolume    = maxVisaCount > 0 ? visaCount / maxVisaCount : 0
//               score = (targetCompletionRatio + relativeVisaVolume) / 2
//   Final ranking = Tier 1 (in order) followed by Tier 2 (in order), take top 3.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

// ─── helpers ────────────────────────────────────────────────────────────────

const serializeOverTime = (rows: { month: string; count: bigint }[]) =>
  rows.map((r) => ({ month: r.month, count: Number(r.count) }));

type CounselorVisaRow = {
  counselorId: string;
  name: string;
  email: string;
  monthlyTarget: number;
  visaCount: number;
};

/** Apply the Tier 1 / Tier 2 ranking rule described above and return top N. */
function rankCounselorsByPerformance(rows: CounselorVisaRow[], topN = 3) {
  const maxVisaCount = rows.reduce((max, r) => Math.max(max, r.visaCount), 0);

  const tier1 = rows
    .filter((r) => r.monthlyTarget > 0 && r.visaCount >= r.monthlyTarget)
    .sort((a, b) => b.visaCount - a.visaCount);

  const tier2 = rows
    .filter((r) => !(r.monthlyTarget > 0 && r.visaCount >= r.monthlyTarget))
    .map((r) => {
      const targetCompletionRatio =
        r.monthlyTarget > 0 ? Math.min(r.visaCount / r.monthlyTarget, 1) : 0;
      const relativeVisaVolume = maxVisaCount > 0 ? r.visaCount / maxVisaCount : 0;
      const score = (targetCompletionRatio + relativeVisaVolume) / 2;
      return { ...r, _score: score, targetCompletionRatio, relativeVisaVolume };
    })
    .sort((a, b) => b._score - a._score);

  const ranked = [
    ...tier1.map((r) => ({
      ...r,
      tier: "target_met" as const,
      targetCompletionRatio: r.monthlyTarget > 0 ? r.visaCount / r.monthlyTarget : null,
    })),
    ...tier2.map((r) => ({
      counselorId: r.counselorId,
      name: r.name,
      email: r.email,
      monthlyTarget: r.monthlyTarget,
      visaCount: r.visaCount,
      tier: "target_not_met" as const,
      targetCompletionRatio: r.targetCompletionRatio,
      performanceScore: Number(r._score.toFixed(4)),
    })),
  ];

  return ranked.slice(0, topN).map((r, idx) => ({ rank: idx + 1, ...r }));
}

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
    leadsByIntakeSeason,
    leadsByVisaStage,
    leadsOverTime,
    convertedLeads,
    upcomingFollowups,

    // ── Counselor metrics ─────────────────────────────────────────────────────
    totalCounselors,
    topCounselors,
    counselorLeadSummary, // per counselor: leads, converted, followups
    counselorVisaRows, // per counselor: visa applications done + monthlyTarget

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

    // ── 7. Leads by intake season ─────────────────────────────────────────────
    db.lead.groupBy({
      by: ["intakeSeason"],
      where: { ...bf, createdAt: dateFilter, intakeSeason: { not: null } },
      _count: { _all: true },
    }),

    // ── 8. Leads by visa stage ────────────────────────────────────────────────
    db.lead.groupBy({
      by: ["visaStage"],
      where: { ...bf, createdAt: dateFilter },
      _count: { _all: true },
    }),

    // ── 9. Leads over time (monthly) ──────────────────────────────────────────
    db.$queryRawUnsafe<{ month: string; count: bigint }[]>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*) AS count
       FROM "leads"
       WHERE "createdAt" >= $1 AND "createdAt" <= $2
         ${branchId ? `AND "branchId" = '${branchId}'` : ""}
       GROUP BY month ORDER BY month ASC`,
      from,
      to
    ),

    // ── 10. Converted leads (have a linked student) ───────────────────────────
    db.lead.count({
      where: { ...bf, createdAt: dateFilter, student: { isNot: null } },
    }),

    // ── 11. Upcoming follow-ups (next 7 days) ─────────────────────────────────
    db.leadTimeline.count({
      where: {
        lead: { ...bf },
        nextFollowup: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // ── 12. Total counselors assigned to this branch ──────────────────────────
    //       (User <-> Branch is many-to-many via the implicit `branches` relation.
    //        If a branch has no explicit COUNSELLOR-role filter requirement,
    //        this counts every user attached to the branch. Narrow with
    //        `role: { name: "COUNSELLOR" }` if you only want counsellor-role users.)
    db.user.count({
      where: branchId ? { branches: { some: { id: branchId } } } : {},
    }),

    // ── 13. Top counselors by lead assignment (this branch) ───────────────────
    db.leadCounselor.groupBy({
      by: ["counselorId"],
      where: { lead: { ...bf, createdAt: dateFilter } },
      _count: { _all: true },
      orderBy: { _count: { counselorId: "desc" } },
      take: 10,
    }),

    // ── 14. Per-counselor lead summary (assigned, converted, followups) ──────
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

    // ── 15. Per-counselor visa applications done (for performance ranking) ────
    //       Counted via Lead.counselorId (direct relation) -> VisaDetail,
    //       scoped to this branch's leads. monthlyTarget pulled from User.
    db.lead.groupBy({
      by: ["counselorId"],
      where: {
        ...bf,
        counselorId: { not: null },
        visaDetail: { some: {} },
      },
      _count: { _all: true },
    }),

    // ── 16. Visa total (leads in this branch) ─────────────────────────────────
    db.visaDetail.count({ where: { lead: { ...bf } } }),

    // ── 17. Visa by status ────────────────────────────────────────────────────
    db.visaDetail.groupBy({
      by: ["status"],
      where: { lead: { ...bf } },
      _count: { _all: true },
    }),

    // ── 18. Visa by type ──────────────────────────────────────────────────────
    //      (NOTE: your VisaDetail model has no "visaType" field — stubbed.
    //       If you want this, add a `visaType String?` column.)
    Promise.resolve([] as { status: string; _count: { _all: number } }[]),

    // ── 19. Visa approved count ───────────────────────────────────────────────
    db.visaDetail.count({ where: { lead: { ...bf }, status: "APPROVED" } }),

    // ── 20. Visa rejected count ───────────────────────────────────────────────
    db.visaDetail.count({ where: { lead: { ...bf }, status: "REJECTED" } }),

    // ── 21. Upcoming biometrics (next 7 days) ─────────────────────────────────
    //      (NOTE: VisaDetail has no "biometricsDate" field — stubbed to 0.
    //       Add `biometricsDate DateTime?` if you need this metric.)
    Promise.resolve(0),

    // ── 22. Upcoming interviews (next 7 days) ─────────────────────────────────
    //      (NOTE: VisaDetail has no "interviewDate" field — stubbed to 0.
    //       Add `interviewDate DateTime?` if you need this metric.)
    Promise.resolve(0),

    // ── 23. Visas expiring soon (next 30 days) ────────────────────────────────
    //      (NOTE: VisaDetail has no "expiryDate" field — wired to casDeadline
    //       as the closest equivalent. Change if that's not what you mean.)
    db.visaDetail.count({
      where: {
        lead: { ...bf },
        casDeadline: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // ── 24. Loans by status ───────────────────────────────────────────────────
    db.loanInquiry.groupBy({
      by: ["status"],
      where: { lead: { ...bf } },
      _count: { _all: true },
      _sum: { amount: true },
    }),

    // ── 25. Total loan amount approved/disbursed ──────────────────────────────
    db.loanInquiry.aggregate({
      _sum: { amount: true },
      where: { lead: { ...bf }, status: { in: ["APPROVED", "DISBURSED"] } },
    }),

    // ── 26. Student courses by application status ─────────────────────────────
    db.studentCourses.groupBy({
      by: ["applicationStatus"],
      where: { lead: { ...bf } },
      _count: { _all: true },
    }),

    // ── 27. Top 10 universities applied to (from StudentCourses) ──────────────
    db.studentCourses.groupBy({
      by: ["universityName"],
      where: { lead: { ...bf } },
      _count: { _all: true },
      orderBy: { _count: { universityName: "desc" } },
      take: 10,
    }),

    // ── 28. Total documents uploaded ──────────────────────────────────────────
    db.doc.count({ where: { lead: { ...bf } } }),

    // ── 29. Branch profile(s) ─────────────────────────────────────────────────
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

  // ── Build top-3 performing counselors (only meaningful for single-branch mode,
  //    but computed here so it's available wherever buildBranchAnalytics is called) ──
  let topPerformingCounselors: ReturnType<typeof rankCounselorsByPerformance> = [];
  if (counselorVisaRows.length > 0) {
    const visaCounselorIds = counselorVisaRows
      .map((r) => r.counselorId)
      .filter((id): id is string => !!id);

    const visaCounselorDetails = await db.user.findMany({
      where: { id: { in: visaCounselorIds } },
      select: { id: true, name: true, email: true, monthlyTarget: true },
    });
    const visaCounselorMap = Object.fromEntries(
      visaCounselorDetails.map((u) => [u.id, u])
    );

    const rows: CounselorVisaRow[] = counselorVisaRows
      .filter((r) => r.counselorId && visaCounselorMap[r.counselorId])
      .map((r) => {
        const u = visaCounselorMap[r.counselorId as string];
        return {
          counselorId: u.id,
          name: u.name,
          email: u.email,
          monthlyTarget: u.monthlyTarget ?? 0,
          visaCount: r._count._all,
        };
      });

    topPerformingCounselors = rankCounselorsByPerformance(rows, 3);
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
      totalCounselors,
      convertedLeads,
      conversionRate,
      upcomingFollowups,
      totalDocs,
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

    visa: {
      total: visaTotal,
      approved: visaApproved,
      rejected: visaRejected,
      approvalRate: visaApprovalRate,
      byStatus: visaByStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byType: visaByType, // currently always [] — see NOTE on query #18
      upcoming: {
        biometricsNext7Days: upcomingBiometrics, // currently always 0 — see NOTE on query #21
        interviewsNext7Days: upcomingInterviews, // currently always 0 — see NOTE on query #22
        expiringNext30Days: visasExpiringSoon, // wired to casDeadline — see NOTE on query #23
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

    counselors: {
      total: totalCounselors,
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
      // Top 3 best performing counselors by visa applications done vs monthlyTarget.
      // See ranking rule documented at the top of this file.
      topPerformingCounselors,
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
      const globalTotalCounselors = branchAnalytics.reduce(
        (acc, b) => acc + b.analytics.summary.totalCounselors,
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
          totalCounselors: b.analytics.summary.totalCounselors,
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
              totalCounselors: globalTotalCounselors,
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