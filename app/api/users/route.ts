/**
 * api/users/route.ts
 * GET  /api/users  — list users (paginated, filterable by role/branch/search)
 * POST /api/users  — create a user
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/rbac";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { UserCreateSchema } from "@/lib/schemas";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
  branches: { select: { id: true, name: true, code: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    // await getAuthorizedUser(req, MODULES.USERS, PERMISSIONS.READ);

    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const search = sp.get("search") ?? undefined;
    const roleId = sp.get("roleId") ?? undefined;
    const branchId = sp.get("branchId") ?? undefined;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(roleId && { roleId }),
      ...(branchId && { branches: { some: { id: branchId } } }),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: USER_SELECT,
      }),
      db.user.count({ where }),
    ]);

    return ok(users, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, roleId, branches } = await req.json();
 
    // ── Validate required fields ──────────────────────────────────────────
    if (!name || !email || !password || !roleId) {
      return NextResponse.json(
        { error: "name, email, password, and roleId are required." },
        { status: 400 }
      );
    }
 
    // ── Check email isn't already taken ───────────────────────────────────
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
 
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }
 
    // ── Check role exists ──────────────────────────────────────────────────
    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
 
    if (!role) {
      return NextResponse.json(
        { error: "Selected role not found." },
        { status: 404 }
      );
    }
 
    // ── Validate branches if provided ─────────────────────────────────────
    // branches is expected as an array of branch ids: string[]
    const branchIds: string[] = Array.isArray(branches) ? branches : [];
 
    if (branchIds.length > 0) {
      const foundBranches = await db.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true },
      });
 
      if (foundBranches.length !== branchIds.length) {
        return NextResponse.json(
          { error: "One or more selected branches were not found." },
          { status: 404 }
        );
      }
    }
 
    // ── Hash password and create user ─────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        roleId,
        branches:
          branchIds.length > 0
            ? { connect: branchIds.map((id) => ({ id })) }
            : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: { select: { id: true, name: true } },
        branches: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
 
    return NextResponse.json(
      { message: "User created successfully.", data: user },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/users]", err);
    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
     const sp = req.nextUrl.searchParams;
    const id = sp.get("id") as string;

    const user = await db.user.findUnique({
      where: { id },
    });

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