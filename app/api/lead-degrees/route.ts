/**
 * api/lead-degrees/route.ts
 * GET  /api/lead-degrees
 * POST /api/lead-degrees
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { LeadDegreeCreateSchema } from "@/lib/schemas";
import { buildMeta, created, handleError, ok, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);
    const status =
      sp.get("status") !== null ? sp.get("status") === "true" : undefined;

    const where = { ...(status !== undefined && { status }) };

    const [degrees, total] = await Promise.all([
      db.leadDegree.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
      }),
      db.leadDegree.count({ where }),
    ]);

    return ok(degrees, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = LeadDegreeCreateSchema.parse(await req.json());
    const degree = await db.leadDegree.create({ data: body });
    return created(degree, "Lead degree created successfully");
  } catch (err) {
    return handleError(err);
  }
}
