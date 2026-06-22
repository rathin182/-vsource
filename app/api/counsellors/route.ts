
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const counsellors = await db.role.findMany({
            where: { name: "Counsellor" },
            include: {
                users: true
            }
        });
        return NextResponse.json(counsellors);
    } catch (error: any) {
        return NextResponse.json( { success: false, message: "Something went wrong", }, { status: 500, }
        );
    }
}