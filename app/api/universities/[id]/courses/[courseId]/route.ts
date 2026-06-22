/**
 * api/universities/[id]/courses/[courseId]/route.ts
 * GET    /api/universities/:id/courses/:courseId
 * PUT  /api/universities/:id/courses/:courseId
 * DELETE /api/universities/:id/courses/:courseId
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { UniversityCourseUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string; courseId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { courseId } = await params;
    const course = await db.universityCourse.findUnique({
      where: { id: courseId },
      include: {
        university: { select: { id: true, name: true } },
        intake: true,
        scholarships: true,
      },
    });
    if (!course) return notFound("Course");
    return ok(course);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { courseId } = await params;
    const body = UniversityCourseUpdateSchema.parse(await req.json());
    const course = await db.universityCourse.update({
      where: { id: courseId },
      data: body,
      include: { intake: true },
    });
    return ok(course, "Course updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { courseId } = await params;
    await db.universityCourse.delete({ where: { id: courseId } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
