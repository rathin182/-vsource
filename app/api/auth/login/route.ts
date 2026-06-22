// app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import { validateUser } from "@/lib/auth";
import { generateToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        const user = await validateUser(
            email,
            password
        );

        if (!user) {
            return NextResponse.json(
                {
                    message:
                        "Invalid credentials",
                },
                {
                    status: 401,
                }
            );
        }

        const token =
            await generateToken({
                id: user.id,
                email: user.email,
                roleId: user.roleId,
            });

        const response =
            NextResponse.json({
                success: true,
                user,
            });

        response.cookies.set(
            "access_token",
            token,
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV ===
                    "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24,
            }
        );

        return response;
    } catch {
        return NextResponse.json(
            {
                message: "Login failed",
            },
            {
                status: 500,
            }
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