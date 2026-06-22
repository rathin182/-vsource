/**
 * api/permissions/[roleId]/[moduleId]/route.ts
 * GET    /api/permissions/:roleId/:moduleId  — get one permission entry
 * PUT  /api/permissions/:roleId/:moduleId  — update individual permission
 * DELETE /api/permissions/:roleId/:moduleId  — remove permission entry
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { PermissionUpsertSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ roleId: string; moduleId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { roleId, moduleId } = await params;
    const perm = await db.roleModulePermission.findUnique({
      where: { roleId_moduleId: { roleId, moduleId } },
      include: { module: true, role: true },
    });
    if (!perm) return notFound("Permission");
    return ok(perm);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { roleId, moduleId } = await params;
    const body = PermissionUpsertSchema.partial().parse(await req.json());
    const perm = await db.roleModulePermission.update({
      where: { roleId_moduleId: { roleId, moduleId } },
      data: body,
    });
    return ok(perm, "Permission updated");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { roleId, moduleId } = await params;
    await db.roleModulePermission.delete({
      where: { roleId_moduleId: { roleId, moduleId } },
    });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
