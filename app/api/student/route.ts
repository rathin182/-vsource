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
                                leadNumber: true,
                                source: true,
                            },
                        },

                        timeline: {
                            orderBy: {
                                createdAt: "desc",
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

        const students =
            await db.student.findMany({
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
                            leadNumber: true,
                            source: true,
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