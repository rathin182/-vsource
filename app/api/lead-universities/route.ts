/**
 * api/lead-universities/route.ts
 * GET  /api/lead-universities
 * POST /api/lead-universities
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { LeadUniversityCreateSchema } from "@/lib/schemas";
import {
  buildMeta,
  created,
  handleError,
  ok,
  parsePagination,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all");
    if (Boolean(all)) {
      const data = await db.leadUniversity.findMany({
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
    const data = await db.leadUniversity.findMany({
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
    const body = LeadUniversityCreateSchema.parse(await req.json());
    const university = await db.leadUniversity.create({ data: body });
    return created(university, "Lead university created successfully");
  } catch (err) {
    return handleError(err);
  }
}
