import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
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