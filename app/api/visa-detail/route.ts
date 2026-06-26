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
        visaType: body.visaType || null,

        status: body.status,

        applicationDate: body.applicationDate
          ? new Date(body.applicationDate)
          : null,

        biometricsDate: body.biometricsDate
          ? new Date(body.biometricsDate)
          : null,

        interviewDate: body.interviewDate
          ? new Date(body.interviewDate)
          : null,

        approvalDate: body.approvalDate
          ? new Date(body.approvalDate)
          : null,

        rejectionReason: body.rejectionReason || null,

        visaNumber: body.visaNumber || null,

        expiryDate: body.expiryDate
          ? new Date(body.expiryDate)
          : null,
      },
      create: {
        leadId,

        visaType: body.visaType || null,

        status: body.status,

        applicationDate: body.applicationDate
          ? new Date(body.applicationDate)
          : null,

        biometricsDate: body.biometricsDate
          ? new Date(body.biometricsDate)
          : null,

        interviewDate: body.interviewDate
          ? new Date(body.interviewDate)
          : null,

        approvalDate: body.approvalDate
          ? new Date(body.approvalDate)
          : null,

        rejectionReason: body.rejectionReason || null,

        visaNumber: body.visaNumber || null,

        expiryDate: body.expiryDate
          ? new Date(body.expiryDate)
          : null,
      },
    });

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