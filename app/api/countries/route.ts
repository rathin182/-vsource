/**
 * api/countries/route.ts
 * GET  /api/countries
 * POST /api/countries
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
import { CountryCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);
    const search = sp.get("search") ?? undefined;
    const status =
      sp.get("status") !== null ? sp.get("status") === "true" : undefined;

    const where = {
      ...(status !== undefined && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { code: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [countries, total] = await Promise.all([
      db.country.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: { _count: { select: { universities: true } } },
      }),
      db.country.count({ where }),
    ]);

    return ok(countries, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const country = await db.country.create({ data: body });
    return created(country, "Country created successfully");
  } catch (err) {
    return handleError(err);
  }
}
