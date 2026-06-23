/**
 * GET  /api/branches
 * POST /api/branches
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { z } from "zod";

/* ===========================
   GET BRANCHES
=========================== */

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
            code: {
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
          {
            state: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    const [branches, total] =
      await Promise.all([
        db.branch.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: "desc",
          },

          include: {
            _count: {
              select: {
                users: true,
                leads: true,
                students: true,
                mbbsLeads: true,
              },
            },
          },
        }),

        db.branch.count({
          where,
        }),
      ]);

    const data = branches.map(
      (branch) => ({
        ...branch,

        usersCount:
          branch._count.users,

        leadsCount:
          branch._count.leads,

        studentsCount:
          branch._count.students,

        mbbsLeadsCount:
          branch._count.mbbsLeads,

        _count: undefined,
      })
    );

    return ok(
      data,
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

/* ===========================
   VALIDATION
=========================== */

export const BranchCreateSchema =
  z.object({
    name: z
      .string()
      .min(1, "Name is required"),

    code: z
      .string()
      .min(1, "Code is required"),

    email: z
      .string()
      .email()
      .optional()
      .or(z.literal("")),

    phone: z.string().optional(),

    city: z.string().optional(),

    state: z.string().optional(),

    country: z.string().optional(),

    pincode: z.string().optional(),

    address: z.string().optional(),

    status: z.boolean().optional(),
  });

/* ===========================
   CREATE BRANCH
=========================== */

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      BranchCreateSchema.parse(
        await req.json()
      );

    const existingBranch =
      await db.branch.findFirst({
        where: {
          OR: [
            {
              name: body.name,
            },
            {
              code: body.code,
            },
          ],
        },
      });

    if (existingBranch) {
      throw new Error(
        "Branch name or code already exists"
      );
    }

    const branch =
      await db.branch.create({
        data: {
          name: body.name,
          code: body.code,

          email: body.email,

          phone: body.phone,

          city: body.city,

          state: body.state,

          country: body.country,

          pincode: body.pincode,

          address: body.address,

          status:
            body.status ?? true,
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