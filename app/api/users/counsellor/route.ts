// app/api/users/counselors/route.ts

import prisma from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const counselors = await prisma.user.findMany({
      where: {
        role: {
          name: "Counsellor", // must match DB value exactly
        },
      },
      include: {
        role: true,
        branches: true,
        
      },
      orderBy: {
        name: "asc",
      },
    });

    return ok(counselors);
  } catch (error) {
    return handleError(error);
  }
}