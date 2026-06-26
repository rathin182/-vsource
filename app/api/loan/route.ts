import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { LoanStatus } from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/browser";

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createLoanInquirySchema = z.object({
  studentId: z.string().uuid(),
  assignee: z.string().optional(),
  bank: z.string().min(1),
  amount: z.number().positive(),
  emi: z.number().positive(),
  status: z.nativeEnum(LoanStatus).optional(),
});

const updateStatusSchema = z.object({
  type: z.literal("status"),
  status: z.nativeEnum(LoanStatus),
});

const updateDetailsSchema = z.object({
  type: z.literal("details"),
  assignee: z.string().optional().nullable(),
  bank: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  emi: z.number().positive().optional(),
});

const updateLoanInquirySchema = z.discriminatedUnion("type", [
  updateStatusSchema,
  updateDetailsSchema,
]);

// ─── GET /api/loan-inquiries ───────────────────────────────────────────────────
// Query params:
//   studentId  – filter by student
//   status     – filter by LoanStatus enum value
//   assignee   – filter by assignee
//   page       – page number (default: 1)
//   pageSize   – results per page (default: 20, max: 100)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const studentId = searchParams.get("studentId") ?? undefined;
    const statusParam = searchParams.get("status");
    const assignee = searchParams.get("assignee") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

    // Validate status if provided
    if (statusParam && !Object.values(LoanStatus).includes(statusParam as LoanStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${Object.values(LoanStatus).join(", ")}` },
        { status: 400 }
      );
    }

    const where: Prisma.LoanInquiryWhereInput = {
      ...(studentId && { studentId }),
      ...(statusParam && { status: statusParam as LoanStatus }),
      ...(assignee && { assignee }),
    };

    const [total, loanInquiries] = await Promise.all([
      prisma.loanInquiry.count({ where }),
      prisma.loanInquiry.findMany({
        where,
        include: { student: true },
        orderBy: { appliedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      data: loanInquiries,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[GET /loan-inquiries]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/loan-inquiries ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createLoanInquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { studentId, assignee, bank, amount, emi, status } = parsed.data;

    // Confirm the student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const loanInquiry = await prisma.loanInquiry.create({
      data: {
        studentId,
        assignee,
        bank,
        amount: new Prisma.Decimal(amount),
        emi: new Prisma.Decimal(emi),
        ...(status && { status }),
      },
      include: { student: true },
    });

    return NextResponse.json({ data: loanInquiry }, { status: 201 });
  } catch (error) {
    console.error("[POST /loan-inquiries]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT /api/loan-inquiries?id=<id> ──────────────────────────────────────────
// Two update modes controlled by the `type` field in the request body:
//
//   { "type": "status", "status": "APPROVED" }
//     → updates only the status field
//
//   { "type": "details", "bank": "HDFC", "amount": 500000, "emi": 9500, "assignee": "John" }
//     → updates editable detail fields (all optional, only provided fields change)

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateLoanInquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 422 }
      );
    }

    // Confirm the record exists
    const existing = await prisma.loanInquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Loan inquiry not found" }, { status: 404 });
    }

    let updateData: Prisma.LoanInquiryUpdateInput;

    if (parsed.data.type === "status") {
      updateData = { status: parsed.data.status };
    } else {
      const { assignee, bank, amount, emi } = parsed.data;
      updateData = {
        ...(assignee !== undefined && { assignee }),
        ...(bank && { bank }),
        ...(amount !== undefined && { amount: new Prisma.Decimal(amount) }),
        ...(emi !== undefined && { emi: new Prisma.Decimal(emi) }),
      };
    }

    const updated = await prisma.loanInquiry.update({
      where: { id },
      data: updateData,
      include: { student: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PUT /loan-inquiries]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/loan-inquiries?id=<id> ───────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    // Confirm the record exists before attempting deletion
    const existing = await prisma.loanInquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Loan inquiry not found" }, { status: 404 });
    }

    await prisma.loanInquiry.delete({ where: { id } });

    return NextResponse.json({ message: "Loan inquiry deleted successfully" });
  } catch (error) {
    console.error("[DELETE /loan-inquiries]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}