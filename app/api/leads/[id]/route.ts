/**
 * api/leads/[id]/route.ts
 * GET    /api/leads/:id  — full lead detail with timelines
 * PUT  /api/leads/:id
 * DELETE /api/leads/:id
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { LeadUpdateSchema } from "@/lib/schemas";
import { LeadStage, LeadStatus } from "@/lib/generated/prisma/enums";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        branch: true,
        counselors: {
          select: { counselor: { select: { name: true, id: true } } },
        },
        timelines: {
          include: {
            createdBy: { select: { id: true, name: true } },
            updatedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        student: true,
      },
    });
    if (!lead) return notFound("Lead");
    return ok(lead);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await db.lead.delete({ where: { id } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}


type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verify the record exists before touching it
    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return notFound("Lead not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await req.json();

    
    const lead = await db.lead.update({
      where: { id },
      data: {
        // ── Personal ──────────────────────────────────────────────────────────
        studentName: body.studentName,
        fatherName: body.fatherName,
        email: body.email,
        phone: String(body.phone),
        passport: body.passport,
        passportExpireDate: body.passportExpireDate,
        applicationDate: body.counsellingDate,
        source: body.source,

        // ── Academic — Schooling ──────────────────────────────────────────────
        tenthPassingYear: body.tenthYearOfPassing,
        tenthPassingPercentage: body.tenthPercentage,
        twelfthYearOfPassing: body.twelfthYearOfPassing,
        twelfthPercentage: body.twelfthPercentage,

        // ── Academic — Bachelor's ─────────────────────────────────────────────
        bachelorsUniversityName: body.bachelorsUniversityName,
        bachelorsCourse: body.bachelorsCourse,
        bachelorsPercentage: body.bachelorsPercentage,
        bachelorsYearOfPassing: body.bachelorsYearOfPassing,
        backlogs: body.backlogs,
        gapsIfAny: body.gapsIfAny,
        workExperience: body.workExperience,
        nextFollowup: body.nextFollowup ? new Date(body.nextFollowup) : null,
        // ── English Test ──────────────────────────────────────────────────────
        englishTestType: body.englishTestType,
        listeningScore: body.listeningScore,
        readingScore: body.readingScore,
        writingScore: body.writingScore,
        speakingScore: body.speakingScore,
        toeflScore:
          body.englishTestType === "TOEFL" ? body.toeflScore : undefined,
        pteScore: body.englishTestType === "PTE" ? body.pteScore : undefined,
        duolingoScore:
          body.englishTestType === "DUOLINGO" ? body.duolingoScore : undefined,

        // Optional if you still support IELTS separately
        ieltsScore:
          body.englishTestType === "IELTS" ? body.ieltsScore : undefined,

        // ── GRE / GMAT ────────────────────────────────────────────────────────
        greGmatScore: body.greGmatScore,
        quantitativeScore: body.quantitativeScore,
        verbalScore: body.verbalScore,
        analyticalWritingScore: body.analyticalWritingScore,

        // ── Preferences ───────────────────────────────────────────────────────
        preferredCountry: body.preferredCountry,
        preferredCourse: body.preferredCourse,
        preferredIntake: body.preferredIntake,
        preferredTiers: body.preferredTiers,

        // ── Lead meta ─────────────────────────────────────────────────────────
        status: body.status,
        counselorId: body.counselorId,

        // Keep these if they still exist in your schema
        branchId: body.branchId,
        notes: body.notes,
      },
      include: {
        branch: true,
        counselor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ lead }, { status: 200 });
  } catch (err: unknown) {
    return handleError(err);
  }
}
