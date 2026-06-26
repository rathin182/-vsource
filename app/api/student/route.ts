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
        const token = (await cookies()).get("access_token")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const role = payload.role.toUpperCase();
        const leadId = req.nextUrl.searchParams.get("id");

        // ======================================================
        // 1. IF ID IS PROVIDED -> RETURN THAT LEAD ONLY
        // ======================================================

        if (leadId) {
            const lead = await db.lead.findUnique({
                where: {
                    id: leadId,
                },
                include: {
                    branch: true,
                    counselor: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },

                    createdBy: true,
                    updatedBy: true,
                    student: true,
                    timelines: true,
                    remarks: true,
                    docs: true,
                    loanInquiries: true,
                    visaDetail: true,
                    studentCourses:true,
                },
            });

            if (!lead) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Lead not found",
                    },
                    {
                        status: 404,
                    }
                );
            }

            return NextResponse.json({
                success: true,
                data: lead,
            });
        }

        // ======================================================
        // 2. COUNSELOR -> ONLY HIS LEADS
        // ======================================================

        if (role === "COUNSELLOR") {
            const leads = await db.lead.findMany({
                where: {
                    counselorId: payload.id,
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    branch: true,
                    counselor: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
            });

            return NextResponse.json({
                success: true,
                data: leads,
            });
        }

        // ======================================================
        // 3. ADMIN/SUPERADMIN -> ALL LEADS
        // ======================================================

        const leads = await db.lead.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                branch: true,
                counselor: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
            },
        });

        console.log(leads, "leadss");


        return NextResponse.json({
            success: true,
            data: leads,
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
                studentName: body.name,
                mobileNumber: body.phone,
                emailId: body.email,

                dob: body.dob
                    ? new Date(body.dob)
                    : null,

                preferredCountry: body.country,
                preferredCourse: body.program,
                intake: body.intake,

                status: body.status.toLowerCase(),

                branchId: body.branchId,
            },

            include: {
                branch: true,
            },
        });

        return NextResponse.json(student, {
            status: 201,
        });
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