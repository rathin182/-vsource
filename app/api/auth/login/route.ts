// app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import { validateUser } from "@/lib/auth";
import { generateToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        const user = await validateUser(email, password);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Invalid credentials", }, { status: 401 }
            );
        }

        // Update last login
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                lastLogin: new Date(),
            },
        });

        const token = generateToken({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });

        response.cookies.set(
            "access_token",
            token,
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24, // 1 day
            }
        );

        return response;
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { success: false, message: "Login failed", }, { status: 500, }
        );
    }
}

export async function GET() {
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
        return NextResponse.json(
            { authenticated: false },
            { status: 401 }
        );
    }

    return NextResponse.json({
        authenticated: true,
    });
}