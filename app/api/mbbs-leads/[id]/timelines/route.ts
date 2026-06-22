/**
 * api/mbbs-leads/[id]/timelines/route.ts
 * GET  /api/mbbs-leads/:id/timelines
 * POST /api/mbbs-leads/:id/timelines
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  notFound,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { MbbsLeadTimelineCreateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: mbbsLeadId } = await params;
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const lead = await db.mbbsLead.findUnique({ where: { id: mbbsLeadId } });
    if (!lead) return notFound("MBBS Lead");

    const [timelines, total] = await Promise.all([
      db.mbbsLeadTimeline.findMany({
        where: { mbbsLeadId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
          updatedBy: { select: { id: true, name: true } },
        },
      }),
      db.mbbsLeadTimeline.count({ where: { mbbsLeadId } }),
    ]);

    return ok(timelines, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: mbbsLeadId } = await params;
    const body = MbbsLeadTimelineCreateSchema.parse(await req.json());

    const lead = await db.mbbsLead.findUnique({ where: { id: mbbsLeadId } });
    if (!lead) return notFound("MBBS Lead");

    if (body.nextFollowup) {
      await db.mbbsLead.update({
        where: { id: mbbsLeadId },
        data: { nextFollowup: body.nextFollowup },
      });
    }

    const timeline = await db.mbbsLeadTimeline.create({
      data: { mbbsLeadId, ...body },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return created(timeline, "Timeline entry added");
  } catch (err) {
    return handleError(err);
  }
}
