/**
 * HELPER
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared typed response helpers, error handler, and pagination utility used
 * by every route in this API layer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { ApiError } from "./rbac";

// ---------------------------------------------------------------------------
// Generic response envelope
// ---------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------
export function ok<T>(
  data: T,
  message?: string,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, message, meta }, { status });
}

export function created<T>(
  data: T,
  message = "Created successfully",
): NextResponse<ApiResponse<T>> {
  return ok(data, message, undefined, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(
  message = "Bad request",
  errors?: string[],
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, message, errors },
    { status: 400 },
  );
}

export function notFound(resource = "Resource"): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, message: `${resource} not found` },
    { status: 404 },
  );
}

export function conflict(message = "Conflict"): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, message }, { status: 409 });
}

export function serverError(
  message = "Internal server error",
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, message }, { status: 500 });
}

// ---------------------------------------------------------------------------
// Centralised error handler — call this from every catch block
// ---------------------------------------------------------------------------
export function handleError(error: unknown): NextResponse<ApiResponse> {
  console.error("[API Error]", error);

  if (error instanceof ZodError) {
    return badRequest(
      "Validation failed",
      error.issues.map(
        (issue: any) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      const fields = (error.meta?.target as string[])?.join(", ") ?? "field";
      return conflict(`A record with this ${fields} already exists`);
    }
    // Record not found
    if (error.code === "P2025") {
      return notFound();
    }
    // Foreign key constraint
    if (error.code === "P2003") {
      return badRequest("Related record not found (foreign key constraint)");
    }
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: error.statusCode,
      },
    );
  }

  if (error instanceof Error) {
    return serverError(error.message);
  }

  return serverError();
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------
export function parsePagination(searchParams: URLSearchParams): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
  );
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

export function buildMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
