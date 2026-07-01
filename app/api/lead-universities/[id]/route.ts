import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };


export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();
    const country = await db.leadUniversity.update({ where: { id }, data: body });
    return ok(country, "Lead source updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await db.leadUniversity.delete({ where: { id } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
