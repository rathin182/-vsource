import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const allLeads = await db.lead.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                branch: true,
                counselor: true,
                student: true,
            },
        });

        return NextResponse.json({ success: true, data: allLeads }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch leads." }, { status: 500 });
    }
}