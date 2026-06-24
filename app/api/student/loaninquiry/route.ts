import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { LoanStatus } from "@/lib/generated/prisma/client";

export async function POST(req: NextRequest) {
    try {
        const studentId = req.nextUrl.searchParams.get("id");

        if (!studentId) {
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
                studentId,
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