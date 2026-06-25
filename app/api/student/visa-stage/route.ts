import { NextRequest, NextResponse } from "next/server";
import { StudentVisaStage } from "@/lib/generated/prisma/client";
import db from "@/lib/prisma";


export async function PATCH(req: NextRequest) {
  try {
    const { studentId, stage } = await req.json();

    if (!studentId || !stage) {
      return NextResponse.json(
        { message: "Student ID and stage are required." },
        { status: 400 }
      );
    }

    const visaStage = stage as StudentVisaStage;

    if (!visaStage) {
      return NextResponse.json(
        { message: "Invalid visa stage." },
        { status: 400 }
      );
    }

    const student = await db.student.update({
      where: {
        id: studentId,
      },
      data: {
        visaStage,
      },
    });

    return NextResponse.json({
      message: "Visa stage updated successfully.",
      student,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}