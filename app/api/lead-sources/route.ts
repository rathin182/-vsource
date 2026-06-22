/**
 * api/lead-sources/route.ts
 * GET  /api/lead-sources
 * POST /api/lead-sources
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { LeadSourceCreateSchema } from "@/lib/schemas";
import { buildMeta, created, handleError, ok, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);
    const status =
      sp.get("status") !== null ? sp.get("status") === "true" : undefined;

    const where = { ...(status !== undefined && { status }) };

    const [sources, total] = await Promise.all([
      db.leadSource.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
      }),
      db.leadSource.count({ where }),
    ]);

    return ok(sources, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = LeadSourceCreateSchema.parse(await req.json());
    const source = await db.leadSource.create({ data: body });
    return created(source, "Lead source created successfully");
  } catch (err) {
    return handleError(err);
  }
}
