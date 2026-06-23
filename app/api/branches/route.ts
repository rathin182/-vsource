/**
 * api/branches/route.ts
 * GET  /api/branches  — list all branches (paginated, filterable)
 * POST /api/branches  — create a new branch
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError, parsePagination, buildMeta, created } from "@/lib/api-helpers";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const { skip, take, page, limit } =
      parsePagination(sp);

    const search = sp.get("search");

    const where = {
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            city: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    const [branches, total] = await Promise.all([
      db.branch.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              users: true,
              leads: true,
              students: true,
            },
          },
        },
      }),

      db.branch.count({
        where,
      }),
    ]);

    const formattedBranches =
      branches.map((branch) => ({
        ...branch,

        usersCount:
          branch._count.users,

        leadsCount:
          branch._count.leads,

        studentsCount:
          branch._count.students,

        _count: undefined,
      }));

    return ok(
      formattedBranches,
      undefined,
      buildMeta(
        total,
        page,
        limit
      )
    );
  } catch (err) {
    return handleError(err);
  }
}

export const BranchCreateSchema = z.object({
  name: z.string().min(1, "Branch name is required"),

  city: z.string().min(1, "City is required"),

  managerId: z.string().uuid().optional(),

  staffCount: z.number().min(0).default(0),

  studentsCount: z.number().min(0).default(0),

  revenue: z.coerce.number().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = BranchCreateSchema.parse(
      await req.json()
    );

    // Optional: verify manager exists
    if (body.managerId) {
      const manager =
        await db.user.findUnique({
          where: {
            id: body.managerId,
          },
        });

      if (!manager) {
        throw new Error(
          "Manager not found"
        );
      }
    }

    const branch = await db.branch.create({
      data: {
        name: body.name,
        city: body.city,

        managerId: body.managerId,

        staffCount:
          body.staffCount,

        studentsCount:
          body.studentsCount,

        revenue: body.revenue,
      },

      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return created(
      branch,
      "Branch created successfully"
    );
  } catch (err) {
    return handleError(err);
  }
}