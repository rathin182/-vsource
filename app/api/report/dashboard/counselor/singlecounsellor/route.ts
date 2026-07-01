// app/api/report/counselor/[counselorId]/route.ts
//
// GET /api/report/counselor/[counselorId]
//
// PURPOSE
// ───────
// Single "360° view" API for one specific Counsellor (User with
// role.name === "COUNSELLOR", though the route also works for any user id
// regardless of role — it just reports whatever is actually attached to
// that userId in the schema). Returns literally everything in the schema
// that is connected to that counselor:
//
//   - profile               (User + Role + Branches)
//   - summary               (headline counts/rates for cards)
//   - leadsPrimary           Lead[] where Lead.counselorId = this user
//   - leadsAssignedViaJoin   Lead[] reached through LeadCounselor join table
//                            (multi-counselor assignments), deduped against
//                            leadsPrimary so nothing is double counted
//   - students               Student[] where Student.counselorId = this user
//   - studentCourses         StudentCourses[] belonging to any lead above
//   - visaDetails            VisaDetail[] belonging to any lead above
//   - loanInquiries          LoanInquiry[] belonging to any lead above
//                            (both lead-linked AND student-linked, since
//                            LoanInquiry can point at either)
//   - docs                   Doc[] belonging to any lead above
//   - remarks                Remark[] authored by this counselor
//   - leadTimelines          LeadTimeline[] created OR updated by this
//                            counselor
//   - studentTimelines       StudentTimeline[] created by this counselor
//   - leadsCreatedByThem     Lead[] where createdById = this user
//                            (admin-style activity, kept separate from
//                            leadsPrimary since createdBy != assigned)
//   - leadsUpdatedByThem     Lead[] where updatedById = this user
//   - monthlyActivity        trailing 6-month lead/student volume trend
//   - statusBreakdown        lead status + student status + visa status +
//                            loan status + application status counts,
//                            scoped to this counselor's book of leads
//   - branchPerformance      per-branch breakdown of this counselor's
//                            leads/students (in case they work multiple
//                            branches)
//
// SCOPE / EXCLUSIONS (matching your prior confirmed instructions)
//   - `Application` model NOT used (legacy/unused per your instruction).
//   - MBBS models NOT used (MbbsLead, MbbsLeadCounselor, MbbsLeadTimeline
//     all excluded — separate vertical, out of scope for this CRM report).
//   - `nbfc` == LoanInquiry.bank, `fintechAssignee` == LoanInquiry.assignee.
//
// QUERY PARAMS (all optional — narrows the SAME counselor's data, doesn't
// change which counselor is being reported on)
//   datePreset   — same enum as the performance report
//                  (all|today|yesterday|last_7_days|last_30_days|
//                   this_month|last_month|this_quarter|last_quarter|
//                   this_year|custom)
//   startDate    — required if datePreset=custom (YYYY-MM-DD)
//   endDate      — required if datePreset=custom (YYYY-MM-DD)
//   branchId     — restricts everything to one branch this counselor
//                  operates in
//   page / pageSize — pagination for the combined leads+students table
//                     (default page=1, pageSize=20)
//
// ROUTE PARAM
//   counselorId  — the User.id of the counselor (path segment)

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

// ─── generic helpers ────────────────────────────────────────────────────

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

type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "custom";

const VALID_DATE_PRESETS: DatePreset[] = [
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

interface ResolvedDateRange {
  from: Date | null;
  to: Date | null;
}

function resolveDateRange(datePreset: DatePreset, startDate: string, endDate: string): ResolvedDateRange {
  const now = new Date();

  switch (datePreset) {
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
      const from = startDate ? startOfDay(new Date(startDate)) : null;
      const to = endDate ? endOfDay(new Date(endDate)) : null;
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
}

// ─── route handler ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const counselorId = sp.get("counselorId");
console.log(counselorId, "counselorId");

    if (!counselorId) {
      return NextResponse.json(
        { success: false, error: "counselorId is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const datePresetRaw = (searchParams.get("datePreset")?.trim() || "all") as DatePreset;
    const datePreset = VALID_DATE_PRESETS.includes(datePresetRaw) ? datePresetRaw : "all";
    const startDate = searchParams.get("startDate")?.trim() ?? "";
    const endDate = searchParams.get("endDate")?.trim() ?? "";
    const branchId = searchParams.get("branchId")?.trim() || "";

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 20);

    const dateRange = resolveDateRange(datePreset, startDate, endDate);
    const dateFilter = dateRange.from || dateRange.to
      ? clean({ gte: dateRange.from ?? undefined, lte: dateRange.to ?? undefined })
      : undefined;

    // ── Profile ────────────────────────────────────────────────────────
    const counselor = await db.user.findUnique({
      where: { id: counselorId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        monthlyTarget: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, name: true, description: true } },
        branches: { select: { id: true, name: true, code: true, city: true, state: true, country: true } },
      },
    });

    if (!counselor) {
      return NextResponse.json(
        { success: false, error: "Counselor not found" },
        { status: 404 }
      );
    }

    // ── Lead scoping ──────────────────────────────────────────────────
    // "Primary" leads: Lead.counselorId points directly at this user.
    // "Joined" leads: reached only via the LeadCounselor join table
    //   (multi-counselor assignment), NOT already captured as primary.
    // Both are combined into a single de-duplicated "all assigned leads"
    // set used for every downstream metric (courses, visa, loans, docs).

    const primaryLeadWhere: Prisma.LeadWhereInput = clean({
      counselorId,
      branchId: branchId || undefined,
      createdAt: dateFilter,
    });

    const joinedLeadWhere: Prisma.LeadWhereInput = clean({
      counselors: { some: { counselorId } },
      counselorId: { not: counselorId }, // avoid double-fetching primary ones
      branchId: branchId || undefined,
      createdAt: dateFilter,
    });

    const [primaryLeads, joinedLeads] = await Promise.all([
      db.lead.findMany({
        where: primaryLeadWhere,
        select: {
          id: true,
          studentName: true,
          email: true,
          phone: true,
          status: true,
          leadStage: true,
          source: true,
          country: true,
          preferredCountry: true,
          preferredCourse: true,
          preferredIntake: true,
          intakeSeason: true,
          budget: true,
          createdAt: true,
          updatedAt: true,
          branch: { select: { id: true, name: true } },
          student: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.lead.findMany({
        where: joinedLeadWhere,
        select: {
          id: true,
          studentName: true,
          email: true,
          phone: true,
          status: true,
          leadStage: true,
          source: true,
          country: true,
          preferredCountry: true,
          preferredCourse: true,
          preferredIntake: true,
          intakeSeason: true,
          budget: true,
          createdAt: true,
          updatedAt: true,
          branch: { select: { id: true, name: true } },
          student: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const allLeads = [
      ...primaryLeads.map((l) => ({ ...l, assignmentType: "primary" as const })),
      ...joinedLeads.map((l) => ({ ...l, assignmentType: "joined" as const })),
    ];
    const allLeadIds = allLeads.map((l) => l.id);

    // ── Students directly counseled by this user ────────────────────────
    const studentWhere: Prisma.StudentWhereInput = clean({
      counselorId,
      branchId: branchId || undefined,
      createdAt: dateFilter,
    });

    const students = await db.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        studentNumber: true,
        studentName: true,
        mobileNumber: true,
        emailId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        branch: { select: { id: true, name: true } },
        lead: {
          select: {
            id: true,
            source: true,
            country: true,
            leadStage: true,
            studentCourses: {
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                universityName: true,
                courseName: true,
                applicationStatus: true,
                applicationDate: true,
                createdAt: true,
              },
            },
            visaDetail: {
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                status: true,
                casStatus: true,
                depositStatus: true,
                ihsStatus: true,
                visaFeeStatus: true,
                casDeadline: true,
                depositDeadline: true,
                universityStartDate: true,
                createdAt: true,
              },
            },
            loanInquiries: {
              orderBy: { appliedAt: "desc" },
              select: {
                id: true,
                bank: true,
                assignee: true,
                amount: true,
                emi: true,
                status: true,
                appliedAt: true,
              },
            },
          },
        },
        loanInquiries: {
          orderBy: { appliedAt: "desc" },
          select: {
            id: true,
            bank: true,
            assignee: true,
            amount: true,
            emi: true,
            status: true,
            appliedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const studentIds = students.map((s) => s.id);

    // ── Downstream data attached to this counselor's leads ─────────────
    const [studentCourses, visaDetails, loanInquiriesByLead, docs, remarks] = await Promise.all([
      allLeadIds.length
        ? db.studentCourses.findMany({
            where: { leadId: { in: allLeadIds } },
            select: {
              id: true,
              universityName: true,
              courseName: true,
              immigrationPortal: true,
              applicationStatus: true,
              applicationDate: true,
              createdAt: true,
              leadId: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      allLeadIds.length
        ? db.visaDetail.findMany({
            where: { leadId: { in: allLeadIds } },
            select: {
              id: true,
              status: true,
              casStatus: true,
              depositStatus: true,
              ihsStatus: true,
              visaFeeStatus: true,
              casDeadline: true,
              depositDeadline: true,
              universityStartDate: true,
              createdAt: true,
              leadId: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      allLeadIds.length
        ? db.loanInquiry.findMany({
            where: { leadId: { in: allLeadIds } },
            select: {
              id: true,
              bank: true,
              assignee: true,
              amount: true,
              emi: true,
              status: true,
              appliedAt: true,
              leadId: true,
              studentId: true,
            },
            orderBy: { appliedAt: "desc" },
          })
        : Promise.resolve([]),
      allLeadIds.length
        ? db.doc.findMany({
            where: { leadId: { in: allLeadIds } },
            select: { id: true, name: true, address: true, type: true, createdAt: true, leadId: true },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      db.remark.findMany({
        where: { createdById: counselorId },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          createdAt: true,
          leadId: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Loan inquiries that are attached directly to this counselor's
    // students (not via a lead) — LoanInquiry.studentId is a separate,
    // independent link from LoanInquiry.leadId.
    const loanInquiriesByStudent = studentIds.length
      ? await db.loanInquiry.findMany({
          where: { studentId: { in: studentIds }, leadId: null },
          select: {
            id: true,
            bank: true,
            assignee: true,
            amount: true,
            emi: true,
            status: true,
            appliedAt: true,
            leadId: true,
            studentId: true,
          },
          orderBy: { appliedAt: "desc" },
        })
      : [];

    const allLoanInquiries = [...loanInquiriesByLead, ...loanInquiriesByStudent];

    // ── Timelines authored/updated by this counselor ────────────────────
    const [leadTimelinesCreated, leadTimelinesUpdated, studentTimelinesCreated] = await Promise.all([
      db.leadTimeline.findMany({
        where: { createdById: counselorId },
        select: {
          id: true,
          leadId: true,
          description: true,
          nextFollowup: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.leadTimeline.findMany({
        where: { updatedById: counselorId, NOT: { createdById: counselorId } },
        select: {
          id: true,
          leadId: true,
          description: true,
          nextFollowup: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.studentTimeline.findMany({
        where: { createdById: counselorId },
        select: {
          id: true,
          studentId: true,
          type: true,
          title: true,
          description: true,
          followupDate: true,
          oldValue: true,
          newValue: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // ── Admin-style activity: leads this user created/updated but may
    //    not be assigned to (e.g. front-desk intake handed off later) ───
    const [leadsCreatedByThem, leadsUpdatedByThem] = await Promise.all([
      db.lead.findMany({
        where: { createdById: counselorId, NOT: { counselorId } },
        select: {
          id: true,
          studentName: true,
          status: true,
          createdAt: true,
          branch: { select: { id: true, name: true } },
          counselor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.lead.findMany({
        where: { updatedById: counselorId, NOT: { counselorId } },
        select: {
          id: true,
          studentName: true,
          status: true,
          updatedAt: true,
          branch: { select: { id: true, name: true } },
          counselor: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // ── Summary counts ──────────────────────────────────────────────────
    const totalLeadsAssigned = allLeads.length;
    const convertedLeadsCount = allLeads.filter((l) => l.student !== null).length;
    const unconvertedLeadsCount = totalLeadsAssigned - convertedLeadsCount;
    const lostLeadsCount = allLeads.filter((l) => l.status === "LOST").length;
    const qualifiedLeadsCount = allLeads.filter((l) => l.status === "QUALIFIED").length;

    const totalStudents = students.length;
    const conversionRate = safeRate(totalStudents, totalLeadsAssigned);

    const totalApplications = studentCourses.length;
    const offerApplications = studentCourses.filter((c) =>
      (
        [
          "OFFER_RECEIVED",
          "PRIORITY_OFFER_RECEIVED",
          "CONDITIONAL_OFFER",
          "UNCONDITIONAL_OFFER",
        ] as string[]
      ).includes(c.applicationStatus)
    ).length;

    const visaApprovedCount = visaDetails.filter((v) => v.status === "APPROVED").length;
    const casReceivedCount = visaDetails.filter((v) => v.casStatus === "RECEIVED").length;

    const loanSanctioned = allLoanInquiries.filter((l) =>
      (["APPROVED", "DISBURSED"] as string[]).includes(l.status)
    );
    const totalSanctionedAmount = loanSanctioned.reduce((sum, l) => sum + safeSum(l.amount), 0);
    const totalDisbursedAmount = allLoanInquiries
      .filter((l) => l.status === "DISBURSED")
      .reduce((sum, l) => sum + safeSum(l.amount), 0);

    // ── Status breakdowns (scoped to this counselor) ────────────────────
    const countBy = <T extends string>(items: { key: T }[]): { status: T; count: number }[] => {
      const map = new Map<T, number>();
      for (const item of items) {
        map.set(item.key, (map.get(item.key) ?? 0) + 1);
      }
      return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
    };

    const leadStatusBreakdown = countBy(allLeads.map((l) => ({ key: l.status })));
    const studentStatusBreakdown = countBy(students.map((s) => ({ key: s.status })));
    const applicationStatusBreakdown = countBy(
      studentCourses.map((c) => ({ key: c.applicationStatus }))
    );
    const visaStatusBreakdown = countBy(visaDetails.map((v) => ({ key: v.status })));
    const casStatusBreakdown = countBy(
      visaDetails.filter((v) => v.casStatus !== null).map((v) => ({ key: v.casStatus as string }))
    );
    const loanStatusBreakdown = countBy(allLoanInquiries.map((l) => ({ key: l.status })));
    const leadSourceBreakdown = countBy(
      allLeads.filter((l) => l.source !== null).map((l) => ({ key: l.source as string }))
    );
    const countryBreakdown = countBy(
      allLeads.filter((l) => l.country !== null).map((l) => ({ key: l.country as string }))
    );

    // ── Monthly activity trend (trailing 6 months) ──────────────────────
    const monthsToShow = 6;
    const anchor = dateRange.to ?? new Date();
    const monthlyActivity: { key: string; label: string; leads: number; students: number; applications: number }[] = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const bucketDate = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      const { key, label } = monthLabel(bucketDate.getFullYear(), bucketDate.getMonth());
      monthlyActivity.push({ key, label, leads: 0, students: 0, applications: 0 });
    }
    const bucketIndex = new Map(monthlyActivity.map((m, idx) => [m.key, idx]));
    const bump = (
      list: { createdAt: Date }[],
      field: "leads" | "students" | "applications"
    ) => {
      for (const row of list) {
        const k = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, "0")}`;
        const idx = bucketIndex.get(k);
        if (idx !== undefined) monthlyActivity[idx][field] += 1;
      }
    };
    bump(allLeads, "leads");
    bump(students, "students");
    bump(studentCourses, "applications");

    // ── Branch-wise breakdown (in case counselor spans multiple branches) ─
    const branchMap = new Map<
      string,
      { branchId: string; branch: string; leads: number; students: number; applications: number }
    >();
    for (const l of allLeads) {
      const b = l.branch;
      if (!b) continue;
      const existing = branchMap.get(b.id) ?? { branchId: b.id, branch: b.name, leads: 0, students: 0, applications: 0 };
      existing.leads += 1;
      branchMap.set(b.id, existing);
    }
    for (const s of students) {
      const b = s.branch;
      if (!b) continue;
      const existing = branchMap.get(b.id) ?? { branchId: b.id, branch: b.name, leads: 0, students: 0, applications: 0 };
      existing.students += 1;
      branchMap.set(b.id, existing);
    }
    const leadBranchById = new Map(allLeads.map((l) => [l.id, l.branch]));
    for (const c of studentCourses) {
      const branch = c.leadId ? leadBranchById.get(c.leadId) : null;
      if (!branch) continue;
      const existing = branchMap.get(branch.id) ?? {
        branchId: branch.id,
        branch: branch.name,
        leads: 0,
        students: 0,
        applications: 0,
      };
      existing.applications += 1;
      branchMap.set(branch.id, existing);
    }
    const branchPerformance = Array.from(branchMap.values()).sort((a, b) => b.leads - a.leads);

    // ── Unified paginated table: leads (unconverted) + students ─────────
    const leadRows = allLeads
      .filter((l) => l.student === null)
      .map((l) => ({
        recordType: "lead" as const,
        recordId: l.id,
        assignmentType: l.assignmentType,
        studentName: l.studentName ?? "Unknown",
        email: l.email,
        phone: l.phone,
        branchName: l.branch?.name ?? "—",
        source: l.source ?? "—",
        country: l.country ?? "—",
        status: l.status,
        stage: l.leadStage,
        createdAt: l.createdAt.toISOString(),
      }));

    const studentRows = students.map((s) => {
      const latestCourse = s.lead?.studentCourses[0];
      const latestVisa = s.lead?.visaDetail[0];
      const latestLoan = s.lead?.loanInquiries[0] ?? s.loanInquiries[0];
      return {
        recordType: "student" as const,
        recordId: s.id,
        studentNumber: s.studentNumber,
        studentName: s.studentName,
        email: s.emailId,
        phone: s.mobileNumber,
        branchName: s.branch?.name ?? "—",
        source: s.lead?.source ?? "—",
        country: s.lead?.country ?? "—",
        status: s.status,
        stage: s.lead?.leadStage ?? null,
        latestUniversity: latestCourse?.universityName ?? null,
        latestApplicationStatus: latestCourse?.applicationStatus ?? null,
        applicationsCount: s.lead?.studentCourses.length ?? 0,
        visaStatus: latestVisa?.status ?? "NOT_STARTED",
        loanStatus: latestLoan?.status ?? null,
        createdAt: s.createdAt.toISOString(),
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

    // ── Response ─────────────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: {
          profile: {
            id: counselor.id,
            name: counselor.name,
            email: counselor.email,
            phone: counselor.phone,
            monthlyTarget: counselor.monthlyTarget,
            role: counselor.role,
            branches: counselor.branches,
            memberSince: counselor.createdAt.toISOString(),
            lastUpdated: counselor.updatedAt.toISOString(),
          },

          summary: {
            totalLeadsAssigned,
            primaryLeadsCount: primaryLeads.length,
            joinedLeadsCount: joinedLeads.length,
            convertedLeadsCount,
            unconvertedLeadsCount,
            lostLeadsCount,
            qualifiedLeadsCount,
            conversionRate,
            totalStudents,
            totalApplications,
            offerApplications,
            visaApprovedCount,
            casReceivedCount,
            totalLoanInquiries: allLoanInquiries.length,
            loanSanctionedCount: loanSanctioned.length,
            totalSanctionedAmount,
            totalDisbursedAmount,
            totalDocsUploaded: docs.length,
            totalRemarksAuthored: remarks.length,
            totalLeadTimelineEntriesCreated: leadTimelinesCreated.length,
            totalLeadTimelineEntriesUpdatedOnly: leadTimelinesUpdated.length,
            totalStudentTimelineEntriesCreated: studentTimelinesCreated.length,
            leadsCreatedNotAssigned: leadsCreatedByThem.length,
            leadsUpdatedNotAssigned: leadsUpdatedByThem.length,
          },

          monthlyActivity,
          branchPerformance,

          statusBreakdowns: {
            leadStatus: leadStatusBreakdown,
            studentStatus: studentStatusBreakdown,
            applicationStatus: applicationStatusBreakdown,
            visaStatus: visaStatusBreakdown,
            casStatus: casStatusBreakdown,
            loanStatus: loanStatusBreakdown,
            leadSource: leadSourceBreakdown,
            country: countryBreakdown,
          },

          // full raw datasets — everything tied to this counselor
          leads: {
            primary: primaryLeads,
            joinedViaTeam: joinedLeads,
          },
          students,
          studentCourses,
          visaDetails,
          loanInquiries: allLoanInquiries,
          docs,
          remarks,
          leadTimelines: {
            created: leadTimelinesCreated,
            updatedOnly: leadTimelinesUpdated,
          },
          studentTimelines: studentTimelinesCreated,
          adminActivity: {
            leadsCreated: leadsCreatedByThem,
            leadsUpdated: leadsUpdatedByThem,
          },

          // combined paginated lead+student table for a CRM-style list view
          rows,
          pagination: { page: safePage, pageSize, total, totalPages },

          appliedFilters: {
            datePreset,
            startDate: startDate || null,
            endDate: endDate || null,
            branchId: branchId || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[COUNSELOR_REPORT]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch counselor report" },
      { status: 500 }
    );
  }
}