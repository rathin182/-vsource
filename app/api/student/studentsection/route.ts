import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || ""; // must match StudentStatus enum values, e.g. "active"
    const branchId = searchParams.get("branchId") || "";
    const counselorId = searchParams.get("counselorId") || "";

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    // Plain object — no Prisma namespace import needed.
    // TypeScript infers the shape from what db.student.findMany expects.
    const where: Record<string, any> = {
      ...(status ? { status } : {}),
      ...(branchId ? { branchId } : {}),
      ...(counselorId ? { counselorId } : {}),
      ...(search
        ? {
          OR: [
            { studentName: { contains: search, mode: "insensitive" } },
            { emailId: { contains: search, mode: "insensitive" } },
            { mobileNumber: { contains: search, mode: "insensitive" } },
            { studentNumber: { contains: search, mode: "insensitive" } },
          ],
        }
        : {}),
    };

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          branch: true,
          counselor: true,
          lead: true,
          applications: true,
        },
        skip,
        take: limit,
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("GET /api/student error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch students." },
      { status: 500 }
    );
  }
}