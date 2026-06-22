/**
 * api/leads/[id]/convert/route.ts
 * POST /api/leads/:id/convert
 *
 * Converts a Lead → Student in a single transaction.
 * Expects: { studentNumber: string }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import db from "@/lib/prisma";
import { ok, notFound, badRequest, handleError } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const ConvertSchema = z.object({
  studentNumber: z.string().min(1),
  counselorId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: leadId } = await params;
    const { studentNumber, counselorId } = ConvertSchema.parse(
      await req.json()
    );

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return notFound("Lead");
    if (lead.isConverted) return badRequest("Lead is already converted");

    const result = await db.$transaction(async (tx) => {
      // Mark lead as converted
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          status: "converted",
        },
      });

      // Create student record
      const student = await tx.student.create({
        data: {
          studentNumber,
          leadId,
          branchId: lead.branchId,
          counselorId: counselorId ?? lead.assignedCounselorId ?? undefined,
          studentName: lead.studentName ?? "",
          mobileNumber: lead.mobileNumber ?? undefined,
          emailId: lead.emailId ?? undefined,
          preferredCountry: lead.preferredCountry ?? undefined,
          preferredCourse: lead.preferredCourse ?? undefined,
        },
      });

      return { lead: updatedLead, student };
    });

    return ok(result, "Lead converted to student successfully");
  } catch (err) {
    return handleError(err);
  }
}
