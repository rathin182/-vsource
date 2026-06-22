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
import { LeadCreateSchema } from "@/lib/schemas";
import { LeadStatus, LeadType } from "@/generated/prisma/enums";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

export async function GET(req: NextRequest) {
  try {
    await getAuthorizedUser(req, MODULES.MASTER_LEADS, PERMISSIONS.READ);

    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const search = sp.get("search") ?? undefined;
    const branchId = sp.get("branchId") ?? undefined;
    const status = sp.get("status") as LeadStatus | null;
    const leadType = sp.get("leadType") as LeadType | null;
    const assignedCounselorId = sp.get("assignedCounselorId") ?? undefined;
    const isConverted =
      sp.get("isConverted") !== null
        ? sp.get("isConverted") === "true"
        : undefined;
    const source = sp.get("source") ?? undefined;
    const preferredCountry = sp.get("preferredCountry") ?? undefined;
    const from = sp.get("from") ? new Date(sp.get("from")!) : undefined;
    const to = sp.get("to") ? new Date(sp.get("to")!) : undefined;

    const where = {
      ...(branchId && { branchId }),
      ...(status && { status }),
      ...(leadType && { leadType }),
      ...(assignedCounselorId && { assignedCounselorId }),
      ...(isConverted !== undefined && { isConverted }),
      ...(source && { source }),
      ...(preferredCountry && { preferredCountry }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
      ...(search && {
        OR: [
          { studentName: { contains: search, mode: "insensitive" as const } },
          { mobileNumber: { contains: search, mode: "insensitive" as const } },
          { emailId: { contains: search, mode: "insensitive" as const } },
          { leadNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          counselors: {
            select: { counselor: { select: { name: true, id: true } } },
          },
          _count: { select: { timelines: true } },
        },
      }),
      db.lead.count({ where }),
    ]);

    return ok(leads, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.CREATE,
    );

    console.log("currentUser", currentUser);

    const body = LeadCreateSchema.parse(await req.json());
    const lastLead = await db.lead.findFirst({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        leadNumber: true,
      },
    });
    let nextNumber = 1;

    if (lastLead?.leadNumber) {
      const currentNumber = parseInt(lastLead.leadNumber.replace("LD", ""), 10);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    body.leadNumber = `LD${String(nextNumber).padStart(4, "0")}`;

    const lead = await db.lead.create({
      data: {
        ...body,

        leadNumber: body.leadNumber!,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
    });

    return created(lead, "Lead created successfully");
  } catch (err) {
    return handleError(err);
  }
}
