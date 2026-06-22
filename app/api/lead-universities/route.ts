/**
 * api/lead-universities/route.ts
 * GET  /api/lead-universities
 * POST /api/lead-universities
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { LeadUniversityCreateSchema } from "@/lib/schemas";
import { buildMeta, created, handleError, ok, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);
    const status =
      sp.get("status") !== null ? sp.get("status") === "true" : undefined;

    const where = { ...(status !== undefined && { status }) };

    const [universities, total] = await Promise.all([
      db.leadUniversity.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
      }),
      db.leadUniversity.count({ where }),
    ]);

    return ok(universities, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = LeadUniversityCreateSchema.parse(await req.json());
    const university = await db.leadUniversity.create({ data: body });
    return created(university, "Lead university created successfully");
  } catch (err) {
    return handleError(err);
  }
}
