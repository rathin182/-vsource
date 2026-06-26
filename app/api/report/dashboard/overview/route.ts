// app/api/dashboard/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma"; // adjust to your db client path

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Optional filters
    const branchId = searchParams.get("branchId") || undefined;
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(new Date().getFullYear(), 0, 1); // default: start of year
    const to = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : new Date();

    const dateFilter = { gte: from, lte: to };
    const branchFilter = branchId ? { branchId } : {};

    // ─── Run all queries in parallel ────────────────────────────────────────

    const [
      // 1. Lead counts by status
      leadsByStatus,

      // 2. Lead counts by stage
      leadsByStage,

      // 3. Leads created over time (monthly)
      leadsOverTime,

      // 4. Lead source distribution
      leadsBySource,

      // 5. Lead country distribution
      leadsByCountry,

      // 6. Lead qualification distribution
      leadsByQualification,

      // 7. Lead intake season
      leadsByIntakeSeason,

      // 8. Total leads
      totalLeads,

      // 9. Student counts by status
      studentsByStatus,

      // 10. Total students
      totalStudents,

      // 11. Students created over time (monthly)
      studentsOverTime,

      // 12. Visa status distribution (VisaDetail.status) — global, unfiltered
      visaByStatus,

      // 13. Visa type distribution (VisaDetail.visaType) — global, unfiltered
      visaByType,

      // 14. Total visa applications tracked
      totalVisaDetails,

      // 15. Visas approved / rejected counts (quick KPI)
      visaApproved,
      visaRejected,

      // 16. Visas with upcoming biometrics (next 7 days)
      upcomingBiometrics,

      // 17. Visas with upcoming interviews (next 7 days)
      upcomingInterviews,

      // 18. Visas expiring soon (next 30 days)
      visasExpiringSoon,

      // 19. Loan status distribution
      loansByStatus,

      // 20. Total loan amount approved/disbursed
      totalLoanAmount,

      // 21. Leads per branch
      leadsByBranch,

      // 22. Students per branch
      studentsByBranch,

      // 23. Top counselors by lead count
      topCounselors,

      // 24. StudentCourses application status
      studentCoursesByStatus,

      // 25. Conversion rate: leads → students
      convertedLeads,

      // 26. Visa stage distribution (Lead.visaStage — pipeline stage, distinct from VisaDetail.status)
      leadsByVisaStage,

      // 27. Branches summary
      branches,

      // 28. University count
      totalUniversities,

      // 29. New leads this month
      newLeadsThisMonth,

      // 30. New students this month
      newStudentsThisMonth,

      // 31. Leads with upcoming follow-ups (next 7 days)
      upcomingFollowups,
    ] = await Promise.all([
      // 1. Leads by status
      db.lead.groupBy({
        by: ["status"],
        where: { ...branchFilter, createdAt: dateFilter },
        _count: { _all: true },
      }),

      // 2. Leads by stage
      db.lead.groupBy({
        by: ["leadStage"],
        where: { ...branchFilter, createdAt: dateFilter },
        _count: { _all: true },
      }),

      // 3. Leads over time — raw monthly buckets via groupBy on createdAt year+month
      db.$queryRawUnsafe<{ month: string; count: bigint }[]>(`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          COUNT(*) AS count
        FROM leads
        WHERE "createdAt" >= $1
          AND "createdAt" <= $2
          ${branchId ? `AND "branchId" = '${branchId}'` : ""}
        GROUP BY month
        ORDER BY month ASC
      `, from, to),

      // 4. Leads by source
      db.lead.groupBy({
        by: ["source"],
        where: { ...branchFilter, createdAt: dateFilter },
        _count: { _all: true },
        orderBy: { _count: { source: "desc" } },
      }),

      // 5. Leads by country
      db.lead.groupBy({
        by: ["country"],
        where: {
          ...branchFilter,
          createdAt: dateFilter,
          country: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
      }),

      // 6. Leads by qualification
      db.lead.groupBy({
        by: ["qualification"],
        where: {
          ...branchFilter,
          createdAt: dateFilter,
          qualification: { not: null },
        },
        _count: { _all: true },
      }),

      // 7. Leads by intake season
      db.lead.groupBy({
        by: ["intakeSeason"],
        where: {
          ...branchFilter,
          createdAt: dateFilter,
          intakeSeason: { not: null },
        },
        _count: { _all: true },
      }),

      // 8. Total leads
      db.lead.count({
        where: { ...branchFilter, createdAt: dateFilter },
      }),

      // 9. Students by status
      db.student.groupBy({
        by: ["status"],
        where: { ...branchFilter, createdAt: dateFilter },
        _count: { _all: true },
      }),

      // 10. Total students
      db.student.count({
        where: { ...branchFilter, createdAt: dateFilter },
      }),

      // 11. Students over time
      db.$queryRawUnsafe<{ month: string; count: bigint }[]>(`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          COUNT(*) AS count
        FROM "Student"
        WHERE "createdAt" >= $1
          AND "createdAt" <= $2
          ${branchId ? `AND "branchId" = '${branchId}'` : ""}
        GROUP BY month
        ORDER BY month ASC
      `, from, to),

      // 12. Visa status distribution — global, unfiltered (VisaDetail has no direct branch/date scoping requirement here)
      db.visaDetail.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),

      // 13. Visa type distribution
      db.visaDetail.groupBy({
        by: ["visaType"],
        where: { visaType: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { visaType: "desc" } },
      }),

      // 14. Total visa records tracked
      db.visaDetail.count(),

      // 15a. Approved visas
      db.visaDetail.count({ where: { status: "APPROVED" } }),

      // 15b. Rejected visas
      db.visaDetail.count({ where: { status: "REJECTED" } }),

      // 16. Upcoming biometrics appointments (next 7 days)
      db.visaDetail.count({
        where: {
          biometricsDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 17. Upcoming visa interviews (next 7 days)
      db.visaDetail.count({
        where: {
          interviewDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 18. Visas expiring soon (next 30 days)
      db.visaDetail.count({
        where: {
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 19. Loans by status
      db.loanInquiry.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { amount: true },
      }),

      // 20. Total loan amount approved/disbursed
      db.loanInquiry.aggregate({
        _sum: { amount: true },
        where: { status: { in: ["APPROVED", "DISBURSED"] } },
      }),

      // 21. Leads per branch
      db.lead.groupBy({
        by: ["branchId"],
        where: { createdAt: dateFilter },
        _count: { _all: true },
        orderBy: { _count: { branchId: "desc" } },
      }),

      // 22. Students per branch
      db.student.groupBy({
        by: ["branchId"],
        where: { createdAt: dateFilter },
        _count: { _all: true },
      }),

      // 23. Top counselors by assigned leads
      db.leadCounselor.groupBy({
        by: ["counselorId"],
        _count: { _all: true },
        orderBy: { _count: { counselorId: "desc" } },
        take: 10,
      }),

      // 24. StudentCourses by application status
      db.studentCourses.groupBy({
        by: ["applicationStatus"],
        _count: { _all: true },
      }),

      // 25. Converted leads (have a student linked)
      db.lead.count({
        where: {
          ...branchFilter,
          createdAt: dateFilter,
          student: { isNot: null },
        },
      }),

      // 26. Leads by visa stage (pipeline stage on Lead, not VisaDetail.status)
      db.lead.groupBy({
        by: ["visaStage"],
        where: { ...branchFilter, createdAt: dateFilter },
        _count: { _all: true },
      }),

      // 27. All branches with counts
      db.branch.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          status: true,
          _count: {
            select: { leads: true, students: true },
          },
        },
      }),

      // 28. Total universities
      db.university.count({ where: { status: "active" } }),

      // 29. New leads this month
      db.lead.count({
        where: {
          ...branchFilter,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // 30. New students this month
      db.student.count({
        where: {
          ...branchFilter,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // 31. Upcoming follow-ups (next 7 days)
      db.leadTimeline.count({
        where: {
          nextFollowup: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // ─── Enrich counselor data with names ────────────────────────────────────
    const counselorIds = topCounselors.map((c) => c.counselorId);
    const counselorDetails = await db.user.findMany({
      where: { id: { in: counselorIds } },
      select: { id: true, name: true, email: true },
    });
    const counselorMap = Object.fromEntries(
      counselorDetails.map((u) => [u.id, u])
    );

    // Enrich branch data for leads/students groupBy
    const branchIds = [
      ...new Set([
        ...leadsByBranch.map((b) => b.branchId),
        ...studentsByBranch.map((b) => b.branchId),
      ]),
    ];
    const branchDetails = await db.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true, city: true },
    });
    const branchMap = Object.fromEntries(branchDetails.map((b) => [b.id, b]));

    // ─── Compute derived metrics ──────────────────────────────────────────────
    const conversionRate =
      totalLeads > 0
        ? Number(((convertedLeads / totalLeads) * 100).toFixed(2))
        : 0;

    const visaApprovalRate =
      totalVisaDetails > 0
        ? Number(((visaApproved / totalVisaDetails) * 100).toFixed(2))
        : 0;

    // ─── Serialize BigInt from raw queries ───────────────────────────────────
    const serializeOverTime = (
      rows: { month: string; count: bigint }[]
    ) => rows.map((r) => ({ month: r.month, count: Number(r.count) }));

    // ─── Shape the response ───────────────────────────────────────────────────
    const data = {
      meta: {
        generatedAt: new Date().toISOString(),
        filters: { branchId: branchId ?? "all", from, to },
        note: "Visa analytics below are global and not affected by branchId/date filters.",
      },

      // ── KPI summary cards ──
      summary: {
        totalLeads,
        totalStudents,
        totalUniversities,
        convertedLeads,
        conversionRate, // percentage
        newLeadsThisMonth,
        newStudentsThisMonth,
        upcomingFollowups,
        totalLoanAmountApproved: totalLoanAmount._sum.amount ?? 0,
        totalVisaDetails,
        visaApproved,
        visaRejected,
        visaApprovalRate, // percentage
      },

      // ── Leads analytics ──
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

      // ── Students analytics ──
      students: {
        byStatus: studentsByStatus.map((r) => ({
          status: r.status,
          count: r._count._all,
        })),
        overTime: serializeOverTime(studentsOverTime),
      },

      // ── Visa (main focus area) ──
      // Note: VisaDetail is linked to Lead (not Student), and is reported globally —
      // it is intentionally NOT scoped by branchId/date filters.
      visa: {
        total: totalVisaDetails,
        approved: visaApproved,
        rejected: visaRejected,
        approvalRate: visaApprovalRate,
        byStatus: visaByStatus.map((r) => ({
          status: r.status,
          count: r._count._all,
        })),
        byType: visaByType.map((r) => ({
          visaType: r.visaType,
          count: r._count._all,
        })),
        upcoming: {
          biometricsNext7Days: upcomingBiometrics,
          interviewsNext7Days: upcomingInterviews,
          expiringNext30Days: visasExpiringSoon,
        },
      },

      // ── Other application/course tracking ──
      coursesByStatus: studentCoursesByStatus.map((r) => ({
        status: r.applicationStatus,
        count: r._count._all,
      })),

      // ── Loans ──
      loans: {
        byStatus: loansByStatus.map((r) => ({
          status: r.status,
          count: r._count._all,
          totalAmount: r._sum.amount ?? 0,
        })),
      },

      // ── Branch breakdown ──
      branches: {
        summary: branches,
        leadsByBranch: leadsByBranch.map((r) => ({
          branchId: r.branchId,
          branch: branchMap[r.branchId] ?? null,
          count: r._count._all,
        })),
        studentsByBranch: studentsByBranch.map((r) => ({
          branchId: r.branchId,
          branch: branchMap[r.branchId] ?? null,
          count: r._count._all,
        })),
      },

      // ── Counselors leaderboard ──
      counselors: {
        topByleadAssignments: topCounselors.map((r) => ({
          counselorId: r.counselorId,
          counselor: counselorMap[r.counselorId] ?? null,
          assignedLeads: r._count._all,
        })),
      },
    };

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("[DASHBOARD_OVERVIEW]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard overview" },
      { status: 500 }
    );
  }
}