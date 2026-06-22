/**
 * api/countries/[id]/route.ts
 * GET    /api/countries/:id
 * PUT  /api/countries/:id
 * DELETE /api/countries/:id
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { CountryUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const country = await db.country.findUnique({
      where: { id },
      include: {
        universities: {
          select: { id: true, name: true, status: true, ranking: true },
          orderBy: { ranking: "asc" },
        },
      },
    });
    if (!country) return notFound("Country");
    return ok(country);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = CountryUpdateSchema.parse(await req.json());
    const country = await db.country.update({ where: { id }, data: body });
    return ok(country, "Country updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await db.country.delete({ where: { id } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
