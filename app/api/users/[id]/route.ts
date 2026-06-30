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

    console.log(body);
    
    const {
      branchIds,
      password,
      ...data
    } = body;

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

export async function DELETE(req: NextRequest,
  { params }: { params: { id: string } }) {
  try {
     const sp = req.nextUrl.searchParams;
    const id = sp.get("id") as string;

    console.log("Deleting user:", id);

    const user = await db.user.findUnique({
      where: { id },
    });

    console.log(user);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
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