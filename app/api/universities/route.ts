/**
 * api/universities/route.ts
 * GET  /api/universities  — list universities (paginated, filterable)
 * POST /api/universities  — create a university
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { UniversityCreateSchema } from "@/lib/schemas";
import type { UniversityStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const search = sp.get("search") ?? undefined;
    const countryId = sp.get("countryId") ?? undefined;
    const status = sp.get("status") as UniversityStatus | null;
    const city = sp.get("city") ?? undefined;
    const ranking = sp.get("ranking") ? parseInt(sp.get("ranking")!) : undefined;

    const where = {
      ...(countryId && { countryId }),
      ...(status && { status }),
      ...(city && { city: { contains: city, mode: "insensitive" as const } }),
      ...(ranking && { ranking: { lte: ranking } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [universities, total] = await Promise.all([
      db.university.findMany({
        where,
        skip,
        take,
        orderBy: [{ ranking: "asc" }, { name: "asc" }],
        include: {
          country: { select: { id: true, name: true, code: true } },
          _count: { select: { courses: true, scholarships: true } },
        },
      }),
      db.university.count({ where }),
    ]);

    return ok(universities, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = UniversityCreateSchema.parse(await req.json());
    const university = await db.university.create({
      data: body,
      include: {
        country: { select: { id: true, name: true, code: true } },
      },
    });
    return created(university, "University created successfully");
  } catch (err) {
    return handleError(err);
  }
}
