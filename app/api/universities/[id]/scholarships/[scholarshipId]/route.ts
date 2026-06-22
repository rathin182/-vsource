/**
 * api/universities/[id]/scholarships/[scholarshipId]/route.ts
 * GET    /api/universities/:id/scholarships/:scholarshipId
 * PUT  /api/universities/:id/scholarships/:scholarshipId
 * DELETE /api/universities/:id/scholarships/:scholarshipId
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { UniversityScholarshipUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string; scholarshipId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { scholarshipId } = await params;
    const scholarship = await db.universityScholarship.findUnique({
      where: { id: scholarshipId },
      include: {
        university: { select: { id: true, name: true } },
        course: { select: { id: true, name: true, degree: true } },
      },
    });
    if (!scholarship) return notFound("Scholarship");
    return ok(scholarship);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { scholarshipId } = await params;
    const body = UniversityScholarshipUpdateSchema.parse(await req.json());
    const scholarship = await db.universityScholarship.update({
      where: { id: scholarshipId },
      data: body,
    });
    return ok(scholarship, "Scholarship updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { scholarshipId } = await params;
    await db.universityScholarship.delete({ where: { id: scholarshipId } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
