import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { LoanStatus } from "@/lib/generated/prisma/client";

export async function POST(req: NextRequest) {
    try {
        const leadId = req.nextUrl.searchParams.get("id");

        if (!leadId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Student ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const body = await req.json();

        const {
            bank,
            amount,
            emi,
            status,
            assignee
        } = body;

        if (!bank || !amount || !emi) {
            return NextResponse.json(
                {
                    success: false,
                    message: "All fields are required.",
                },
                {
                    status: 400,
                }
            );
        }

        const loan = await db.loanInquiry.create({
            data: {
                leadId,
                bank,
                amount,
                assignee,
                emi,
                status: (
                    status || "PENDING"
                ).toUpperCase() as LoanStatus,
            },
        });

        return NextResponse.json({
            success: true,
            data: loan,
            message: "Loan inquiry created successfully.",
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to create loan inquiry.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function PATCH(req: NextRequest) {
  try {
    const loanId = req.nextUrl.searchParams.get("id");

    if (!loanId) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const {
      bank,
      amount,
      emi,
      status,
      assignee,
    } = body;

    if (!bank || !amount || !emi) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        {
          status: 400,
        }
      );
    }

    const existingLoan = await db.loanInquiry.findUnique({
      where: {
        id: loanId,
      },
    });

    if (!existingLoan) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan inquiry not found.",
        },
        {
          status: 404,
        }
      );
    }

    const updatedLoan = await db.loanInquiry.update({
      where: {
        id: loanId,
      },
      data: {
        bank,
        amount,
        emi,
        assignee,
        status: (status || "PENDING").toUpperCase() as LoanStatus,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLoan,
      message: "Loan inquiry updated successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update loan inquiry.",
      },
      {
        status: 500,
      }
    );
  }
}