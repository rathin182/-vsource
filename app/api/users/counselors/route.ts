// app/api/users/counselors/route.ts

import { handleError } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { ok } from "assert";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const counselors = await prisma.user.findMany({
      where: {
        role: {
          name: "Counsellor",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: counselors,
    });
  } catch (error) {
    return handleError(error);
  }
}
