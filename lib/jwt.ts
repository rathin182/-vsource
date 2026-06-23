import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface TokenPayload {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: "1d",
    });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(
            token,
            JWT_SECRET
        ) as TokenPayload;
    } catch {
        return null;
    }
}