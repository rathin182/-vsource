import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) { 
  try {
    const { searchParams } = new URL(req.url);

    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip  = (page - 1) * limit;

    // Optional filters from query params
    const stage    = searchParams.get("stage")    ?? undefined;
    const branchId = searchParams.get("branchId") ?? undefined;
    const search   = searchParams.get("search")   ?? undefined;

    const where = {
      // ── Core filter: no counsellor assigned ──────────────────────────────
      counselorId: null,

      // ── Optional filters ─────────────────────────────────────────────────
      ...(stage    && { leadStage: stage as never }),
      ...(branchId && { branchId }),
      ...(search   && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName:  { contains: search, mode: "insensitive" as const } },
          { email:     { contains: search, mode: "insensitive" as const } },
          { phone:     { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/leads/unassigned]", error);
    return NextResponse.json(
      { error: "Failed to fetch unassigned leads." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, counselorId } = body;

    // ── Validate input ────────────────────────────────────────────────────
    if (!leadId || !counselorId) {
      return NextResponse.json(
        { error: "leadId and counselorId are required." },
        { status: 400 }
      );
    }

    // ── Check lead exists and is still unassigned ─────────────────────────
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, counselorId: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found." },
        { status: 404 }
      );
    }

    if (lead.counselorId) {
      return NextResponse.json(
        { error: "Lead already has a counsellor assigned." },
        { status: 409 }
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

    // ── Assign counsellor ─────────────────────────────────────────────────
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data:  { counselorId },
      select: {
        id:         true,
        firstName:  true,
        lastName:   true,
        email:      true,
        leadStage:  true,
        country: true,
        counselor: {
          select: { id: true, name: true },
        },
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { message: "Counsellor assigned successfully.", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/leads/unassigned]", error);
    return NextResponse.json(
      { error: "Failed to assign counsellor." },
      { status: 500 }
    );
  }
}