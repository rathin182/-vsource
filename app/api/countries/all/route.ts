import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import {
  handleError,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all");
    if (Boolean(all)) {
      const data = await db.country.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          code: true,
          currency: true,
        },
      });
      return NextResponse.json({ data }, { status: 200 });
    }
    const data = await db.country.findMany({
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
        code: true,
        currency: true,
      },
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}