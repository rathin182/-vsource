/**
 * api/mbbs-leads/[id]/route.ts
 * GET    /api/mbbs-leads/:id
 * PUT  /api/mbbs-leads/:id
 * DELETE /api/mbbs-leads/:id
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { MbbsLeadUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const lead = await db.mbbsLead.findUnique({
      where: { id },
      include: {
        branch: true,
        counselors: {
          select: { counselor: { select: { name: true, id: true } } },
        },
        timelines: {
          include: {
            createdBy: { select: { id: true, name: true } },
            updatedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!lead) return notFound("MBBS Lead");
    return ok(lead);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const body = MbbsLeadUpdateSchema.parse(await req.json());

    const { counselorIds, ...mbbsLeadData } = body;

    const lead = await db.$transaction(async (tx) => {
      await tx.mbbsLead.update({
        where: { id },
        data: mbbsLeadData,
      });

      if (counselorIds) {
        await tx.mbbsLeadCounselor.deleteMany({
          where: {
            mbbsLeadId: id,
          },
        });

        await tx.mbbsLeadCounselor.createMany({
          data: counselorIds.map((counselorId, index) => ({
            mbbsLeadId: id,
            counselorId,
            isPrimary: index === 0,
          })),
        });
      }

      return tx.mbbsLead.findUnique({
        where: { id },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          counselors: {
            include: {
              counselor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    return ok(lead, "MBBS Lead updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await db.mbbsLead.delete({ where: { id } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
