/**
 * api/branches/[id]/route.ts
 * GET    /api/branches/:id  — get one branch
 * PUT  /api/branches/:id  — update a branch
 * DELETE /api/branches/:id  — delete a branch
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  notFound,
  noContent,
  handleError,
} from "@/lib/api-helpers";
import { BranchUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const branch = await db.branch.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: { select: { leads: true, mbbsLeads: true, students: true } },
      },
    });
    if (!branch) return notFound("Branch");
    return ok(branch);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = BranchUpdateSchema.parse(await req.json());
    const branch = await db.branch.update({ where: { id }, data: body });
    return ok(branch, "Branch updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const data = await db.branch.delete({ where: { id } });
    return NextResponse.json({data}, {status: 200})
    
  } catch (err) {
    return handleError(err);
  }
}
