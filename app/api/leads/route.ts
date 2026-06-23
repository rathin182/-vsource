/**
 * api/leads/route.ts
 * GET  /api/leads  — list leads with rich filters
 * POST /api/leads  — create a lead
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
import { LeadStatus, Gender, IntakeSeason, Qualification, LeadStage } from "@/lib/generated/prisma/enums";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { z } from "zod";

const LeadCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),

  email: z.string().email(),
  phone: z.string(),

  alternatePhone: z.string().optional(),

  dob: z.coerce.date().optional(),
  gender: z.nativeEnum(Gender).optional(),

  qualification: z.nativeEnum(Qualification).optional(),

  percentage: z.number().optional(),
  passingYear: z.number().optional(),

  ieltsScore: z.number().optional(),
  pteScore: z.number().optional(),
  toeflScore: z.number().optional(),
  duolingoScore: z.number().optional(),

  preferredCountry: z.string().optional(),
  preferredCourse: z.string().optional(),

  intakeSeason: z.nativeEnum(IntakeSeason).optional(),
  intakeYear: z.number().optional(),

  budget: z.coerce.number().optional(),

  source: z.string(),

  referralSource: z.string().optional(),

  status: z.nativeEnum(LeadStatus).optional(),

  country: z.string().optional(),

  branchId: z.string(),

  counselorId: z.string(),

  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const { skip, take, page, limit } =
      parsePagination(sp);

    const search =
      sp.get("search") ?? undefined;

    const branchId =
      sp.get("branchId") ?? undefined;

    const counselorId =
      sp.get("counselorId") ?? undefined;

    const status =
      sp.get("status") as LeadStatus | null;

    const source =
      sp.get("source") ?? undefined;

    const preferredCountry =
      sp.get("preferredCountry") ??
      undefined;

    const leadStage =
      sp.get("leadStage") as LeadStage | null;

    const from = sp.get("from")
      ? new Date(sp.get("from")!)
      : undefined;

    const to = sp.get("to")
      ? new Date(sp.get("to")!)
      : undefined;

    const where = {
      ...(branchId && {
        branchId,
      }),

      ...(counselorId && {
        counselorId,
      }),

      ...(status && {
        status,
      }),

      ...(leadStage && {
        leadStage,
      }),

      ...(source && {
        source,
      }),

      ...(preferredCountry && {
        preferredCountry,
      }),

      ...((from || to) && {
        createdAt: {
          ...(from && {
            gte: from,
          }),

          ...(to && {
            lte: to,
          }),
        },
      }),

      ...(search && {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    const [leads, total] =
      await Promise.all([
        db.lead.findMany({
          where,

          skip,
          take,

          orderBy: {
            createdAt: "desc",
          },

          include: {
            branch: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },

            counselor: {
              select: {
                id: true,
                name: true,
                description: true,
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },

            student: {
              select: {
                id: true,
                studentName: true,
                emailId: true,
                mobileNumber: true,
                status: true,
              },
            },

            timelines: true,

            counselors: true,
          },
        }),

        db.lead.count({
          where,
        }),
      ]);

    return ok(
      leads,
      undefined,
      buildMeta(
        total,
        page,
        limit
      )
    );
  } catch (err: any) {
    console.log(err.message);

    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const body = LeadCreateSchema.parse({
      firstName: payload.firstName,
      lastName: payload.lastName,

      email: payload.email,

      phone: payload.mobileNumber,
      alternatePhone:
        payload.alternateMobile || undefined,

      dob: payload.dob,

      gender:
        payload.gender?.toUpperCase(),

      qualification:
        payload.highestQualification?.toUpperCase(),

      percentage: payload.percentage,
      passingYear: payload.passingYear,

      ieltsScore:
        payload.ieltsScore
          ? Number(payload.ieltsScore)
          : undefined,

      pteScore:
        payload.pteScore
          ? Number(payload.pteScore)
          : undefined,

      toeflScore:
        payload.toeflScore
          ? Number(payload.toeflScore)
          : undefined,

      duolingoScore:
        payload.duolingoScore
          ? Number(payload.duolingoScore)
          : undefined,

      preferredCountry:
        payload.preferredCountry,

      preferredCourse:
        payload.preferredCourse,

      intakeSeason:
        payload.preferredIntake?.toUpperCase(),

      intakeYear:
        payload.preferredIntakeYear
          ? Number(payload.preferredIntakeYear)
          : undefined,

      budget:
        payload.budget
          ? Number(payload.budget)
          : undefined,

      source:
        payload.leadSource,

      referralSource:
        payload.referralSource || undefined,

      status:
        payload.leadStatus,

      branchId:
        payload.branch,

      counselorId:
        payload.assignedCounselor,

      notes:
        payload.notes,
    });

    const lead = await db.lead.create({
      data: {
        firstName:
          body.firstName,

        lastName:
          body.lastName,

        email:
          body.email,

        phone:
          body.phone,

        alternatePhone:
          body.alternatePhone,

        dob:
          body.dob,

        gender:
          body.gender,

        qualification:
          body.qualification,

        percentage:
          body.percentage,

        passingYear:
          body.passingYear,

        ieltsScore:
          body.ieltsScore,

        pteScore:
          body.pteScore,

        toeflScore:
          body.toeflScore,

        duolingoScore:
          body.duolingoScore,

        preferredCountry:
          body.preferredCountry,

        preferredCourse:
          body.preferredCourse,

        intakeSeason:
          body.intakeSeason,

        intakeYear:
          body.intakeYear,

        budget:
          body.budget,

        source:
          body.source,

        referralSource:
          body.referralSource,

        status:
          body.status,

        country:
          body.country,

        branchId:
          body.branchId,

        counselorId:
          body.counselorId,

        notes:
          body.notes,
      },

      include: {
        branch: true,

        counselor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return created(
      lead,
      "Lead created successfully"
    );
  } catch (err: any) {
    console.log(err.message);

    return handleError(err);

  }
}
