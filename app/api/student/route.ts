import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import {
  StudentStatus,
  Studentstage,
  StudentVisaStage,
  EnglishWaiverType,
  Application,
  IntakeSeason,
  LeadStatus,
} from "@/lib/generated/prisma/client";


export async function GET(req: NextRequest) {
  try {
    const studentId =
      req.nextUrl.searchParams.get("id");

    const few = req.nextUrl.searchParams.get("few")
    if (few) {
      const students = await db.student.findMany({
        select: {
          id: true,
          studentName: true,
          studentNumber: true,
          emailId: true,
        }
      })
      return NextResponse.json({
        success: true,
        data: students,
      });
    }
    if (studentId) {
      const student =
        await db.student.findUnique({
          where: {
            id: studentId,
          },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },

            counselor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                preferredCountry: true,
                preferredCourse: true,
                status: true,
                source: true,
              },
            },
            remarks: {
              include: {
                createdBy: true
              }
            },
            docs: true,
            loanInquiries: true,

            studentCourses: {
              select: {
                id: true,
                universityName: true,
                courseName: true,
                immigrationPortal: true,
                applicationDate: true,
                applicationStatus: true,
                studentId: true,
                createdAt: true,
                updatedAt: true,
              },
            },

            _count: {
              select: {
                timeline: true,
              },
            },
          },
        });

      if (!student) {
        return NextResponse.json(
          {
            success: false,
            message: "Student not found",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        data: student,
      });
    }

    const students = await db.student.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },

        counselor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            preferredCountry: true,
            preferredCourse: true,
            status: true,
            source: true,
          },
        },

        studentCourses: {
          select: {
            id: true,
            universityName: true,
            courseName: true,
            immigrationPortal: true,
            applicationDate: true,
            applicationStatus: true,
            studentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        _count: {
          select: {
            timeline: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const student = await db.student.create({
      data: {
        // Relation to Lead
        leadId: body.id,

        // Branch & Counselor
        branchId: body.branchId,
        counselorId: body.counselorId,

        // Student Information
        studentName: `${body.studentName}`,
        mobileNumber: body.phone,
        emailId: body.email,

        dob: body.dob ? new Date(body.dob) : null,

        // Student Status
        status: "active",
      },

      include: {
        branch: true,
        counselor: true,
        lead: true,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create student",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const toDate = (value: unknown): Date | null => {
      if (!value) return null;

      const date = new Date(value as string);

      return isNaN(date.getTime()) ? null : date;
    };

    // Find Lead + Student first
    const existingLead = await db.lead.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found.",
        },
        {
          status: 404,
        }
      );
    }

    const leadData: any = {};
    const studentData: any = {};

    /* ------------------------
       Lead + Student
    -------------------------*/

    if ("studentName" in body) {
      leadData.studentName = body.studentName || null;
      studentData.studentName = body.studentName || "";
    }

    if ("phone" in body) {
      leadData.phone = body.phone || null;
      studentData.mobileNumber = body.phone || null;
    }

    if ("email" in body) {
      leadData.email = body.email || null;
      studentData.emailId = body.email || null;
    }

    if ("passport" in body)
      leadData.passport = body.passport || null;

    if ("preferredCountry" in body)
      leadData.preferredCountry = body.preferredCountry || null;

    if ("preferredCourse" in body)
      leadData.preferredCourse = body.preferredCourse || null;

    if ("intake" in body) {
      leadData.intakeSeason = body.intake
        ? (body.intake as IntakeSeason)
        : null;
    }

    if ("dob" in body) {
      const date = toDate(body.dob);

      leadData.dob = date;
      studentData.dob = date;
    }

    if ("admissionDate" in body)
      leadData.admissionDate = toDate(body.admissionDate);

    if ("depositDeadline" in body)
      leadData.depositDeadline = toDate(body.depositDeadline);

    if ("casDeadline" in body)
      leadData.casDeadline = toDate(body.casDeadline);

    if ("universityStart" in body)
      leadData.universityStart = toDate(body.universityStart);

    if ("status" in body && body.status)
      leadData.status = body.status as LeadStatus;

    if ("visaStage" in body && body.visaStage)
      leadData.visaStage = body.visaStage as StudentVisaStage;

    if ("applicationType" in body && body.applicationType)
      leadData.applicationType =
        body.applicationType as Application;

    if ("englishWaiverType" in body && body.englishWaiverType)
      leadData.englishWaiverType =
        body.englishWaiverType as EnglishWaiverType;

    if ("currentStage" in body && body.currentStage)
      leadData.currentStage =
        body.currentStage as Studentstage;

    if ("immigrationPortalPassword" in body)
      leadData.immigrationPortalPassword =
        body.immigrationPortalPassword || null;

    /* ------------------------
       Counselor
    -------------------------*/

    if ("counselorId" in body) {
      if (body.counselorId) {
        leadData.counselor = {
          connect: {
            id: body.counselorId,
          },
        };

        studentData.counselor = {
          connect: {
            id: body.counselorId,
          },
        };
      } else {
        leadData.counselor = {
          disconnect: true,
        };

        studentData.counselor = {
          disconnect: true,
        };
      }
    }

    /* ------------------------
       Update Lead
    -------------------------*/

    await db.lead.update({
      where: {
        id,
      },
      data: leadData,
    });

    /* ------------------------
       Update Student
       ONLY if Student exists
    -------------------------*/

    if (existingLead.student) {
      await db.student.update({
        where: {
          id: existingLead.student.id,
        },
        data: studentData,
      });
    }

    /* ------------------------
       Return updated data
    -------------------------*/

    const updatedLead = await db.lead.findUnique({
      where: {
        id,
      },
      include: {
        branch: true,
        counselor: true,
        student: {
          include: {
            branch: true,
            counselor: true,
          },
        },
      },
    });
    

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully.",
      data: updatedLead,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update lead.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get("id");

  if (!id) {
    return NextResponse.json({ success: false, message: "Lead ID is required", }, { status: 400 })
  }

  const existingStudent = await db.student.findUnique({
    where: { id },
  });

  if (!existingStudent) {
    return NextResponse.json(
      {
        success: false,
        message: "Lead not found.",
      },
      { status: 404 }
    );
  }

  const lead = await db.student.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Lead deleted successfully.",
    data: lead,
  });
}