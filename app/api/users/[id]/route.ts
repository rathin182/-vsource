/**
 * api/users/[id]/route.ts
 * GET    /api/users/:id
 * PUT  /api/users/:id
 * DELETE /api/users/:id
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/prisma";
// import { getAuthorizedUser } from "@/lib/rbac";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { UserUpdateSchema } from "@/lib/schemas";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

type Ctx = { params: Promise<{ id: string }> };

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true, description: true } },
  branches: { select: { id: true, name: true, code: true } },
} as const;

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    // await getAuthorizedUser(_req, MODULES.USERS, PERMISSIONS.READ);

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) return notFound("User");
    return ok(user);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { branchIds, password, ...data } = body;

    const updateData: Record<string, unknown> = {
      ...data, // includes monthlyTarget, name, email, roleId
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    if (branchIds !== undefined) {
      updateData.branches = {
        set: branchIds.map((branchId: string) => ({
          id: branchId,
        })),
      };
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    return ok(user, "User updated successfully");
  } catch (err) {
    console.log(err);
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }:  Ctx,
) {
  try {
    const { id } = await params;
    const token: string | undefined = (await cookies()).get(
      "access_token",
    )?.value;
    if (!token) throw new Error("Unauthorized");
    const payload = verifyToken(token) as any;
    const userId = payload.userId;
    
    
    const user = await db.user.findUnique({
      where: { id },
    });
    
    if (id === userId) {
      return NextResponse.json({
        success: false,
        message: "You cannot delete your own account.",
      }, { status: 400
      })
    }
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    return handleError(err);
  }
}
