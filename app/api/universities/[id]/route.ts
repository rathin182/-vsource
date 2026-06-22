/**
 * api/universities/[id]/route.ts
 * GET    /api/universities/:id  — full university detail with courses & scholarships
 * PUT  /api/universities/:id
 * DELETE /api/universities/:id
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { UniversityUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const university = await db.university.findUnique({
      where: { id },
      include: {
        country: true,
        courses: {
          include: { intake: true },
          orderBy: { name: "asc" },
        },
        scholarships: { orderBy: { name: "asc" } },
      },
    });
    if (!university) return notFound("University");
    return ok(university);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = UniversityUpdateSchema.parse(await req.json());
    const university = await db.university.update({
      where: { id },
      data: body,
      include: {
        country: { select: { id: true, name: true, code: true } },
      },
    });
    return ok(university, "University updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await db.university.delete({ where: { id } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
