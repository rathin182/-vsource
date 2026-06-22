/**
 * api/intakes/route.ts
 * GET  /api/intakes
 * POST /api/intakes
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
// import {
//   ok,
//   created,
//   handleError,
//   parsePagination,
//   buildMeta,
// } from "@/lib/api-helpers";
import { IntakeCreateSchema } from "@/lib/schemas";
import { buildMeta, created, handleError, ok, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);
    const status =
      sp.get("status") !== null ? sp.get("status") === "true" : undefined;

    const where = { ...(status !== undefined && { status }) };

    const [intakes, total] = await Promise.all([
      db.intake.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: { _count: { select: { courses: true } } },
      }),
      db.intake.count({ where }),
    ]);

    return ok(intakes, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = IntakeCreateSchema.parse(await req.json());
    const intake = await db.intake.create({ data: body });
    return created(intake, "Intake created successfully");
  } catch (err) {
    return handleError(err);
  }
}
