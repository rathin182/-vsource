
import { NextRequest } from "next/server";
import db from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const roles = await db.role.findMany();
    return new Response(JSON.stringify(roles));
}