import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const {
      id,
      studentName,
      emailId,
      mobileNumber,
      dob,
      status,
    } = await req.json();

    const student = await db.student.update({
      where: { id },
      data: {
        studentName,
        emailId,
        mobileNumber,
        dob: dob ? new Date(dob) : null,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update student.",
      },
      { status: 500 }
    );
  }
}