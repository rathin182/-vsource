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
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

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
                        remarks: true,
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
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const toDate = (value: unknown): Date | null => {
      if (!value) return null;

      const date = new Date(value as string);

      return isNaN(date.getTime()) ? null : date;
    };

    const data: Record<string, any> = {};

    // Personal
    if ("firstName" in body) data.firstName = body.firstName?.trim();
    if ("lastName" in body) data.lastName = body.lastName || null;
    if ("studentName" in body) data.studentName = body.studentName || null;

    if ("phone" in body) data.phone = body.phone || null;
    if ("email" in body) data.email = body.email || null;

    if ("passport" in body) data.passport = body.passport || null;

    // Relations
    if ("counselorId" in body) {
      if (body.counselorId) {
        data.counselor = {
          connect: {
            id: body.counselorId,
          },
        };
      } else {
        data.counselor = {
          disconnect: true,
        };
      }
    }

    // Study Preferences
    if ("preferredCountry" in body)
      data.preferredCountry = body.preferredCountry || null;

    if ("preferredCourse" in body)
      data.preferredCourse = body.preferredCourse || null;

    if ("intake" in body) {
      data.intakeSeason = body.intake
        ? body.intake.toUpperCase() as IntakeSeason
        : null;
    }

    // Dates
    if ("dob" in body) data.dob = toDate(body.dob);

    if ("admissionDate" in body)
      data.admissionDate = toDate(body.admissionDate);

    if ("depositDeadline" in body)
      data.depositDeadline = toDate(body.depositDeadline);

    if ("casDeadline" in body)
      data.casDeadline = toDate(body.casDeadline);

    if ("universityStart" in body)
      data.universityStart = toDate(body.universityStart);

    // Enums
    if ("status" in body && body.status) {
      data.status = body.status as LeadStatus;
    }

    if ("visaStage" in body && body.visaStage) {
      data.visaStage = body.visaStage as StudentVisaStage;
    }

    if ("applicationType" in body && body.applicationType) {
      data.applicationType =
        body.applicationType as Application;
    }

    if ("englishWaiverType" in body && body.englishWaiverType) {
      data.englishWaiverType =
        body.englishWaiverType as EnglishWaiverType;
    }

    if ("currentStage" in body && body.currentStage) {
      data.currentStage =
        body.currentStage as Studentstage;
    }

    if ("immigrationPortalPassword" in body) {
      data.immigrationPortalPassword =
        body.immigrationPortalPassword || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No fields provided to update.",
        },
        {
          status: 400,
        }
      );
    }

    const lead = await db.lead.update({
      where: {
        id,
      },
      data,
      include: {
        branch: true,
        counselor: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully.",
      data: lead,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2025") {
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

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update lead.",
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