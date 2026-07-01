import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const leadId = req.nextUrl.searchParams.get("studentId");

    if (!leadId) {
      return NextResponse.json(
        {
          success: false,
          message: "Student ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const visaDetail = await db.visaDetail.upsert({
      where: {
        leadId,
      },
      update: {
        depositDeadline: body.depositDeadline
          ? new Date(body.depositDeadline)
          : null,
        depositStatus: body.depositStatus || null,
        ihsStatus: body.ihsStatus || null,
        visaFeeStatus: body.visaFeeStatus || null,
        casDeadline: body.casDeadline
          ? new Date(body.casDeadline)
          : null,
        casStatus: body.casStatus || null,
        status: body.status,
        universityStartDate: body.universityStartDate
          ? new Date(body.universityStartDate)
          : null,
      },
      create: {
        leadId,
        depositDeadline: body.depositDeadline
          ? new Date(body.depositDeadline)
          : null,
        depositStatus: body.depositStatus || null,
        ihsStatus: body.ihsStatus || null,
        visaFeeStatus: body.visaFeeStatus || null,
        casDeadline: body.casDeadline
          ? new Date(body.casDeadline)
          : null,
        casStatus: body.casStatus || null,
        status: body.status,
        universityStartDate: body.universityStartDate
          ? new Date(body.universityStartDate)
          : null,
      },
    });;

    const lead = await db.lead.findUnique({
      where: {
        id: leadId,
      },
      select: {
        leadStage: true,
      },
    });

    // Update stage only if it's currently INQUIRY
    if (lead?.leadStage === "INQUIRY" || lead?.leadStage === "DOCUMENTS" || lead?.leadStage === "APPLIED") {
      await db.lead.update({
        where: {
          id: leadId,
        },
        data: {
          leadStage: "VISA",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Visa details saved successfully.",
      data: visaDetail,
    });
  } catch (error) {
    console.error("Visa detail error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save visa details.",
      },
      {
        status: 500,
      }
    );
  }
}