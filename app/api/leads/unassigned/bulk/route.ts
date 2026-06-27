import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";// adjust import path to match your actual prisma client location

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadIds, counselorId } = body;

    // ── Validate input ────────────────────────────────────────────────────
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "leadIds must be a non-empty array." },
        { status: 400 }
      );
    }

    if (!counselorId) {
      return NextResponse.json(
        { error: "counselorId is required." },
        { status: 400 }
      );
    }

    // Dedupe in case the client sends duplicates
    const uniqueLeadIds: string[] = Array.from(new Set(leadIds));

    if (uniqueLeadIds.some((id) => typeof id !== "string" || !id)) {
      return NextResponse.json(
        { error: "leadIds must contain only valid string ids." },
        { status: 400 }
      );
    }

    // ── Check counsellor exists ───────────────────────────────────────────
    const counselor = await prisma.user.findUnique({
      where: { id: counselorId },
      select: { id: true, name: true },
    });

    if (!counselor) {
      return NextResponse.json(
        { error: "Counsellor not found." },
        { status: 404 }
      );
    }

    // ── Fetch all requested leads in one go ───────────────────────────────
    const leads = await prisma.lead.findMany({
      where: { id: { in: uniqueLeadIds } },
      select: { id: true, counselorId: true, firstName: true },
    });

    const foundIds = new Set(leads.map((l) => l.id));

    // Leads that don't exist at all
    const notFoundIds = uniqueLeadIds.filter((id) => !foundIds.has(id));

    // Leads that exist but already have a counsellor — skip these, don't fail the whole batch
    const alreadyAssigned = leads.filter((l) => l.counselorId);
    const assignableLeads = leads.filter((l) => !l.counselorId);

    if (assignableLeads.length === 0) {
      return NextResponse.json(
        {
          error: "No leads were eligible for assignment.",
          notFound: notFoundIds,
          alreadyAssigned: alreadyAssigned.map((l) => l.id),
        },
        { status: 409 }
      );
    }

    const assignableIds = assignableLeads.map((l) => l.id);

    // ── Assign counsellor to all eligible leads in a single transaction ───
    const updated = await prisma.$transaction(async (tx) => {
      await tx.lead.updateMany({
        where: { id: { in: assignableIds } },
        data: { counselorId },
      });

      // updateMany doesn't return the updated rows, so fetch them back
      return tx.lead.findMany({
        where: { id: { in: assignableIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          leadStage: true,
          country: true,
          counselor: {
            select: { id: true, name: true },
          },
          updatedAt: true,
        },
      });
    });

    return NextResponse.json(
      {
        message: `Counsellor assigned to ${updated.length} lead${
          updated.length > 1 ? "s" : ""
        } successfully.`,
        data: updated,
        skipped: {
          notFound: notFoundIds,
          alreadyAssigned: alreadyAssigned.map((l) => ({
            id: l.id,
            firstName: l.firstName,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/leads/unassigned/bulk]", error);
    return NextResponse.json(
      { error: "Failed to assign counsellor to leads." },
      { status: 500 }
    );
  }
}