import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const lead = await db.lead.findMany({
            where: {
                counselorId: {
                    not: null,
                },
            },
            include: {
                branch: true,
                counselor: true,
                student: true,
            },
        })
        return NextResponse.json({ success: true, data: lead }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch leads." }, { status: 500 });
    }
}