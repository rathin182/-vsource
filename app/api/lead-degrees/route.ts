/**
 * api/lead-degrees/route.ts
 * GET  /api/lead-degrees
 * POST /api/lead-degrees
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { LeadDegreeCreateSchema } from "@/lib/schemas";
import { buildMeta, created, handleError, ok, parsePagination } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all");
    if (Boolean(all)) {
      const data = await db.leadDegree.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ data }, { status: 200 });
    }
    const data = await db.leadDegree.findMany({
      where: {
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data }, { status: 200 });
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
