import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import {
  StudentStatus,
  Studentstage,
  StudentVisaStage,
  EnglishWaiverType,
  Application,
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
        { success: false, message: "Student ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();

    // ── Helper: parse a date string or return null (never throw) ──────────────
    const toDate = (val: unknown): Date | null => {
      if (!val || val === "undefined" || val === "null") return null;
      const d = new Date(val as string);
      return isNaN(d.getTime()) ? null : d;
    };

    // ── Helper: validate enum value or return undefined (skip the field) ──────
    function validEnum<T extends string>(
      value: unknown,
      allowed: readonly T[]
    ): T | undefined {
      return allowed.includes(value as T) ? (value as T) : undefined;
    }

    const STATUS_VALUES = [
      "active",
      "visa_process",
      "loan_process",
      "admitted",
      "enrolled",
      "completed",
      "dropped",
    ] as const;

    const VISA_STAGE_VALUES = [
      "LEAD_CREATED",
      "APPLICATION_SUBMITTED",
      "OFFER_RECEIVED",
      "DEPOSIT_PAID",
      "INTERVIEW_COMPLETED",
      "CAS_RECEIVED",
      "VISA_APPLIED",
      "VISA_APPROVED",
    ] as const;

    const ENGLISH_WAIVER_VALUES = [
      "NONE",
      "CLASS_12_ENGLISH",
      "MOI",
    ] as const;

    const APPLICATION_TYPE_VALUES = [
      "BACHELOR",
      "MASTER",
      "PHD",
    ] as const;

    const CURRENT_STAGE_VALUES = ["GRADUATE", "PURSUING"] as const;

    // ── Build update payload — only include fields present in body ────────────
    // Using `any` typed partial so Prisma doesn't complain about missing required
    // fields (studentName is the only required String — we guard it below).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};

    // studentName — required in schema but optional in PATCH
    if (typeof body.studentName === "string" && body.studentName.trim()) {
      data.studentName = body.studentName.trim();
    }

    // counselor relation
    if (typeof body.counselorId === "string" && body.counselorId.trim()) {
      data.counselor = { connect: { id: body.counselorId.trim() } };
    } else if (body.counselorId === null || body.counselorId === "") {
      data.counselor = { disconnect: true };
    }
    // if counselorId is undefined → omit entirely (no change)

    // Nullable strings — include only when key exists in body
    const nullableStrings = [
      "preferredCountry",
      "preferredCourse",
      "intake",
      "mobileNumber",
      "emailId",
      "passport",
      "immigrationPortalPassword",
    ] as const;

    for (const key of nullableStrings) {
      if (key in body) {
        const val = body[key];
        data[key] =
          val === undefined || val === null || val === "" || val === "undefined"
            ? null
            : String(val).trim();
      }
    }

    // DateTime fields
    const dateFields = [
      "dob",
      "admissionDate",
      "depositDeadline",
      "casDeadline",
      "universityStart",
    ] as const;

    for (const key of dateFields) {
      if (key in body) {
        data[key] = toDate(body[key]);
      }
    }

    // Enum fields — skip if value is missing/invalid so Prisma doesn't throw
    const statusVal = validEnum(body.status, STATUS_VALUES);
    if (statusVal !== undefined) data.status = statusVal as StudentStatus;

    const visaStageVal = validEnum(body.visaStage, VISA_STAGE_VALUES);
    if (visaStageVal !== undefined) data.visaStage = visaStageVal as StudentVisaStage;

    const englishWaiverVal = validEnum(body.englishWaiverType, ENGLISH_WAIVER_VALUES);
    if (englishWaiverVal !== undefined) data.englishWaiverType = englishWaiverVal as EnglishWaiverType;

    const applicationTypeVal = validEnum(body.applicationType, APPLICATION_TYPE_VALUES);
    if (applicationTypeVal !== undefined) data.applicationType = applicationTypeVal;

    const currentStageVal = validEnum(body.currentStage, CURRENT_STAGE_VALUES);
    if (currentStageVal !== undefined) data.currentStage = currentStageVal as Studentstage;

    // ── Nothing to update? ────────────────────────────────────────────────────
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided to update." },
        { status: 400 }
      );
    }

    // ── Perform update ────────────────────────────────────────────────────────
    const student = await db.student.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Student updated successfully.",
      data: student,
    });
  } catch (error: unknown) {
    console.error("Student update error:", error);

    // Prisma P2025 = record not found
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update student." },
      { status: 500 }
    );
  }
}