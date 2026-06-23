
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

import { ROLES, STATUS } from "@/lib/generated/prisma/enums";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const users = await db.user.findMany({
      where: {
        ...(role && {
          role: role as ROLES,
        }),
        ...(status && {
          status: status as STATUS,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        branches: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}