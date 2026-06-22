/**
 * api/roles/[id]/route.ts
 * GET    /api/roles/:id  — includes full module permissions
 * PUT  /api/roles/:id
 * DELETE /api/roles/:id
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  notFound,
  noContent,
  badRequest,
  handleError,
} from "@/lib/api-helpers";
import { RoleUpdateSchema } from "@/lib/schemas";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await getAuthorizedUser(_req, MODULES.ROLES, PERMISSIONS.READ);

    const { id } = await params;
    const role = await db.role.findUnique({
      where: { id },
      include: {
        modulePermissions: {
          include: { module: true },
          orderBy: { module: { sortOrder: "asc" } },
        },
        _count: { select: { users: true } },
      },
    });
    if (!role) return notFound("Role");
    return ok(role);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    // await getAuthorizedUser(req, MODULES.ROLES, PERMISSIONS.UPDATE);

    const { id } = await params;
    const body = RoleUpdateSchema.parse(await req.json());

    // Prevent editing system roles' name
    const existing = await db.role.findUnique({ where: { id } });
    if (!existing) return notFound("Role");
    if (existing.isSystem && body.name && body.name !== existing.name) {
      return badRequest("Cannot rename a system role");
    }

    const role = await db.role.update({ where: { id }, data: body });
    return ok(role, "Role updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await getAuthorizedUser(_req, MODULES.ROLES, PERMISSIONS.DELETE);

    const { id } = await params;
    const role = await db.role.findUnique({ where: { id } });
    if (!role) return notFound("Role");
    if (role.isSystem) return badRequest("System roles cannot be deleted");
    await db.role.delete({ where: { id } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
