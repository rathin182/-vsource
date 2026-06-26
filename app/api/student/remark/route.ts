import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { RemarkType } from "@/lib/generated/prisma/client";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const leadId= req.nextUrl.searchParams.get("id") as string;
    const token: string | undefined = (await cookies()).get("access_token")?.value;
    if (!token) throw new Error("Unauthorized");
    const payload = verifyToken(token) as any;
    const userId = payload.id;

    if (!leadId && !userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Student ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const {
      title,
      message,
      type,
      createdById,
    } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Remark message is required.",
        },
        {
          status: 400,
        }
      );
    }

    const remark = await db.remark.create({
      data: {
        leadId,

        title: title || null,

        message,

        type: (
          type || "NOTE"
        ).toUpperCase() as RemarkType,

        createdById: createdById || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: remark,
      message: "Remark added successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add remark.",
      },
      {
        status: 500,
      }
    );
  }
}