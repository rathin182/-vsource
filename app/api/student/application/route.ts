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