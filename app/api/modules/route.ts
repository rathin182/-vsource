/**
 * api/modules/route.ts
 * GET  /api/modules  — list all modules
 * POST /api/modules  — create a module
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { ModuleCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);
    const isActive =
      sp.get("isActive") !== null ? sp.get("isActive") === "true" : undefined;

    const where = {
      ...(isActive !== undefined && { isActive }),
    };

    const [modules, total] = await Promise.all([
      db.module.findMany({
        where,
        skip,
        take,
        orderBy: { sortOrder: "asc" },
      }),
      db.module.count({ where }),
    ]);

    return ok(modules, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = ModuleCreateSchema.parse(await req.json());
    const module = await db.module.create({ data: body });
    return created(module, "Module created successfully");
  } catch (err) {
    return handleError(err);
  }
}
