import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const role = params.get("role");
    const id = params.get("me");

    if (role?.toUpperCase() === "COUNSELLOR" && id) {
      const data = await db.branch.findMany({
        where: {
          users: {
            some: {
              id: id
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return NextResponse.json({ data }, { status: 200 });
    }
    const data = await db.branch.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}
