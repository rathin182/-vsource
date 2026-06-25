// app/api/users/counselors/route.ts

import prisma from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";


export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const few = searchParams.get("few")

    if (few) {
          const counselors = await prisma.user.findMany({
      where: {
        role: {
          name: "Counsellor", // must match DB value exactly
        },
      },
      select: {
        name: true,
        id: true,
        email: true
      },
      orderBy: {
        name: "asc",
      },
    });

    return ok(counselors);
    }
    const counselors = await prisma.user.findMany({
      where: {
        role: {
          name: "Counsellor", // must match DB value exactly
        },
      },
      include: {
        role: true,
        branches: true,
        _count: {
          select: {
            leadCounselorsAssigned: true
          }
        }
      },
      orderBy: {
        name: "asc",
      },
    });

    return ok(counselors);
  } catch (error) {
    return handleError(error);
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      password,
      monthlyTarget = 0,
      branchIds = [],
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email and password are required",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 409 }
      );
    }

    const counsellorRole = await prisma.role.findFirst({
      where: {
        name: "Counsellor",
      },
    });

    if (!counsellorRole) {
      return NextResponse.json(
        {
          success: false,
          message: "Counsellor role not found",
        },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        monthlyTarget,
        roleId: counsellorRole.id,

        branches:
          branchIds.length > 0
            ? {
                connect: branchIds.map((id: string) => ({
                  id,
                })),
              }
            : undefined,
      },

      include: {
        role: true,
        branches: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Counsellor created successfully",
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}