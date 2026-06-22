/**
 * api/universities/[id]/scholarships/route.ts
 * GET  /api/universities/:id/scholarships  — list scholarships
 * POST /api/universities/:id/scholarships  — add a scholarship
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  notFound,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { UniversityScholarshipCreateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: universityId } = await params;
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const university = await db.university.findUnique({
      where: { id: universityId },
    });
    if (!university) return notFound("University");

    const [scholarships, total] = await Promise.all([
      db.universityScholarship.findMany({
        where: { universityId },
        skip,
        take,
        orderBy: { name: "asc" },
        include: {
          course: { select: { id: true, name: true, degree: true } },
        },
      }),
      db.universityScholarship.count({ where: { universityId } }),
    ]);

    return ok(scholarships, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: universityId } = await params;
    const university = await db.university.findUnique({
      where: { id: universityId },
    });
    if (!university) return notFound("University");

    const body = UniversityScholarshipCreateSchema.parse(await req.json());
    const scholarship = await db.universityScholarship.create({
      data: { ...body, universityId },
      include: {
        course: { select: { id: true, name: true } },
      },
    });
    return created(scholarship, "Scholarship created successfully");
  } catch (err) {
    return handleError(err);
  }
}
