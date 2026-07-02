import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StudentStatus } from "@/lib/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Required validations
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: "Lead ID is required." },
        { status: 400 }
      );
    }

    if (!body.studentName) {
      return NextResponse.json(
        { success: false, message: "Student name is required." },
        { status: 400 }
      );
    }

    if (!body.branchId) {
      return NextResponse.json(
        { success: false, message: "Branch is required." },
        { status: 400 }
      );
    }

    // Check whether already converted
    const existingStudent = await prisma.student.findUnique({
      where: {
        leadId: body.id,
      },
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "This lead has already been converted to a student.",
        },
        { status: 409 }
      );
    }

    // Generate Student Number
    const totalStudents = await prisma.student.count();

    const studentNumber = `STU${String(totalStudents + 1).padStart(5, "0")}`;

    // Create Student
    const student = await prisma.student.create({
      data: {
        studentNumber,
        leadId: body.id,

        branchId: body.branchId,
        counselorId: body.counselorId ?? null,

        studentName: body.studentName,
        mobileNumber: body.phone ?? null,
        emailId: body.email ?? null,
        dob: body.dob ? new Date(body.dob) : null,

        status: StudentStatus.active,
      },
    });

    // Update Lead (optional)
    // await prisma.lead.update({
    //   where: {
    //     id: body.id,
    //   },
    //   data: {
    //     status: "CONVERTED",
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: "Student created successfully.",
      student,
    });
  } catch (error) {
    console.error("CONVERT STUDENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}