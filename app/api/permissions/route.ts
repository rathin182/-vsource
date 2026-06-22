/**
 * api/permissions/route.ts
 * GET  /api/permissions?roleId=...  — get all permissions for a role
 * POST /api/permissions             — bulk upsert permissions
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  badRequest,
  handleError,
} from "@/lib/api-helpers";
import {
  BulkPermissionUpsertSchema,
  PermissionUpsertSchema,
} from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    const roleId = req.nextUrl.searchParams.get("roleId");
    if (!roleId) return badRequest("roleId query param is required");

    const permissions = await db.roleModulePermission.findMany({
      where: { roleId },
      include: {
        module: {
          select: { id: true, name: true, code: true, icon: true, sortOrder: true },
        },
      },
      orderBy: { module: { sortOrder: "asc" } },
    });

    return ok(permissions);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { permissions } = BulkPermissionUpsertSchema.parse(await req.json());

    const upserted = await db.$transaction(
      permissions.map(({ roleId, moduleId, ...perms }) =>
        db.roleModulePermission.upsert({
          where: { roleId_moduleId: { roleId, moduleId } },
          create: { roleId, moduleId, ...perms },
          update: perms,
        })
      )
    );

    return ok(upserted, `${upserted.length} permission(s) saved`);
  } catch (err) {
    return handleError(err);
  }
}
