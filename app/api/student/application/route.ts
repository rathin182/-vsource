import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { StudentcoursesStatus } from "@/lib/generated/prisma/client";

export async function POST(req: NextRequest) {
    try {
        const leadId = req.nextUrl.searchParams.get("id");

        if (!leadId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Student ID is required.",
                },
                { status: 400 }
            );
        }

        const body = await req.json();

        const {
            portal,
            applicationDate,
            university,
            course,
            status,
        } = body;

        const application = await db.studentCourses.create({
            data: {
                immigrationPortal: portal,
                universityName: university,
                courseName: course,

                applicationDate: new Date(applicationDate),

                applicationStatus: status.toUpperCase().replaceAll(" ", "_") as StudentcoursesStatus,

                leadId,
            },
        });

        const lead = await db.lead.findUnique({
            where: {
                id: leadId,
            },
            select: {
                leadStage: true,
            },
        });

        // Update stage only if it's currently INQUIRY
        if (lead?.leadStage === "INQUIRY" || lead?.leadStage === "DOCUMENTS") {
            await db.lead.update({
                where: {
                    id: leadId,
                },
                data: {
                    leadStage: "APPLIED",
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: application,
            message: "Application created successfully.",
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to create application.",
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

        const body = await req.json();

        const {
            portal,
            applicationDate,
            university,
            course,
            status,
        } = body;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Application ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const application = await db.studentCourses.update({
            where: {
                id,
            },

            data: {
                immigrationPortal: portal,
                universityName: university,
                courseName: course,

                applicationDate: new Date(applicationDate),

                applicationStatus:
                    status
                        .toUpperCase()
                        .replaceAll(" ", "_") as StudentcoursesStatus,
            },
        });

        return NextResponse.json({
            success: true,
            data: application,
            message: "Application updated successfully.",
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to update application.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Application ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const application = await db.studentCourses.findUnique({
            where: {
                id,
            },
        });

        if (!application) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Application not found.",
                },
                {
                    status: 404,
                }
            );
        }

        await db.studentCourses.delete({
            where: {
                id,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "University application deleted successfully.",
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error("DELETE APPLICATION ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete university application.",
            },
            {
                status: 500,
            }
        );
    }
}