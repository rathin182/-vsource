import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const studentId =
            req.nextUrl.searchParams.get("id");

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
                        docs:true,

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