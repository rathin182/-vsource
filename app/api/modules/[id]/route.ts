/**
 * api/modules/[id]/route.ts
 * GET    /api/modules/:id
 * PUT  /api/modules/:id
 * DELETE /api/modules/:id
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { ModuleUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const mod = await db.module.findUnique({ where: { id } });
    if (!mod) return notFound("Module");
    return ok(mod);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = ModuleUpdateSchema.parse(await req.json());
    const mod = await db.module.update({ where: { id }, data: body });
    return ok(mod, "Module updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await db.module.delete({ where: { id } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
