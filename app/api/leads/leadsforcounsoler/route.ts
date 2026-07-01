import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const role = sp.get("role");

    const counselorId =
      sp.get("counselorId");

    if (counselorId && role== "COUNSELLOR") {
      const leads = await db.lead.findMany({
        where: {
          counselorId: counselorId ?? undefined,
        },
        include: {
          docs:true,
          visaDetail: true,
          branch: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          counselor: {
            select: {
              id: true,
              name: true,
            },
          },
          student: {
            select: {
              id: true,
              studentName: true,
              emailId: true,
              mobileNumber: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return NextResponse.json({
        success: true,
        data: leads,
      });
    }

    const leads = await db.lead.findMany({
         orderBy: {
                createdAt: "desc",
            },
            include: {
                branch: true,
                counselor: true,
                student: true,
                docs:true,
            },
      });

    return NextResponse.json({
      success: true,
      data: leads,
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const id = sp.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead ID is required",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body.leadStage) {
      return NextResponse.json(
        {
          success: false,
          message: "leadStage is required",
        },
        { status: 400 }
      );
    }

    const lead = await db.lead.update({
      where: {
        id,
      },
      data: {
        leadStage: body.leadStage.toUpperCase(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead stage updated successfully",
      data: lead,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}