import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import {
  handleError,
} from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const withC = params.get("course")

    if (withC) {
          const data = await db.university.findMany({
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            courses: true
          }
        })

    return NextResponse.json({data}, {status: 200})
    }
    const data = await db.university.findMany({
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
          }
        })

    return NextResponse.json({data}, {status: 200})
  } catch (err) {
    return handleError(err);
  }
}