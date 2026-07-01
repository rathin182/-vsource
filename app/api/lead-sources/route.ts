/**
 * api/lead-sources/route.ts
 * GET  /api/lead-sources
 * POST /api/lead-sources
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { created, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all");
    if (Boolean(all)) {
      const data = await db.leadSource.findMany({
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
    const data = await db.leadSource.findMany({
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
    const body = await req.json();
    const source = await db.leadSource.create({ data: body });
    return created(source, "Lead source created successfully");
  } catch (err) {
    return handleError(err);
  }
}
