import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust to your prisma client path
import {
  UniversityInput,
  CourseInput,
  ScholarshipInput,
  ApiResponse,
} from "@/slids/types/university.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Coerce a string|number|null|undefined to a number, returning undefined for empty/null */
function toNum(val: string | number | null | undefined): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

/** Coerce to Decimal-safe string (Prisma accepts string for Decimal fields) */
function toDecimal(
  val: string | number | null | undefined
): string | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n.toFixed(2);
}

function toDate(val: string | null | undefined): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function nullify<T>(val: T | undefined): T | null {
  return val === undefined ? null : val;
}

/** Build the Prisma data object for a single course */
function buildCourseData(c: CourseInput) {
  return {
    name: c.name,
    degree: c.degree,
    durationMonths: nullify(toNum(c.durationMonths)),
    annualTuitionFee: nullify(toDecimal(c.annualTuitionFee)),
    totalTuitionFee: nullify(toDecimal(c.totalTuitionFee)),
    currency: c.currency ?? null,
    intakeId: c.intakeId ?? null,
    minimumPercentage: nullify(toNum(c.minimumPercentage)),
    backlogLimit: nullify(toNum(c.backlogLimit)),
    englishRequirement: c.englishRequirement ?? null,
    ieltsOverall: nullify(toNum(c.ieltsOverall)),
    ieltsListening: nullify(toNum(c.ieltsListening)),
    ieltsReading: nullify(toNum(c.ieltsReading)),
    ieltsWriting: nullify(toNum(c.ieltsWriting)),
    ieltsSpeaking: nullify(toNum(c.ieltsSpeaking)),
    greRequired: c.greRequired ?? false,
    gmatRequired: c.gmatRequired ?? false,
    courseCode: c.courseCode ?? null,
    description: c.description ?? null,
    applicationDeadline: nullify(toDate(c.applicationDeadline)),
    status: c.status ?? true,
  };
}

/** Build the Prisma data object for a single scholarship */
function buildScholarshipData(
  s: ScholarshipInput,
  resolvedCourseId: string | null
) {
  return {
    name: s.name,
    amount: nullify(toDecimal(s.amount)),
    percentage: nullify(toNum(s.percentage)),
    description: s.description ?? null,
    status: s.status ?? "active",
    courseId: resolvedCourseId,
  };
}

// ─── GET /api/universities ────────────────────────────────────────────────────
// Query params: page, limit, search, countryId, city, status

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10))
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const countryId = searchParams.get("countryId") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { city: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(countryId ? { countryId } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
      ...(status ? { status: status as any } : {}),
    };

    const [total, universities] = await prisma.$transaction([
      prisma.university.count({ where }),
      prisma.university.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          country: { select: { id: true, name: true } },
          _count: { select: { courses: true, scholarships: true } },
        },
      }),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        universities,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/universities]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch universities." },
      { status: 500 }
    );
  }
}

// ─── POST /api/universities ───────────────────────────────────────────────────
// Body: UniversityInput (with nested courses[] and scholarships[])
//
// Why no prisma.$transaction(async tx => ...)?
// The interactive-transaction form holds an open DB connection across every
// await inside the callback. With multiple round-trips (create university →
// create courses → createMany scholarships → findUnique) Prisma hits its
// default 5-second timeout (P2028), especially on cold-start / serverless.
//
// Solution: run operations sequentially outside any transaction and do a
// manual compensating delete on the university if anything fails.  The
// cascade rule (onDelete: Cascade) on courses + scholarships means one
// prisma.university.delete() cleans everything up atomically at the DB level.

export async function POST(req: NextRequest) {
  let createdUniversityId: string | null = null;

  try {
    const body: UniversityInput = await req.json();

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!body.name?.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "University name is required." },
        { status: 400 }
      );
    }
    if (!body.countryId?.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Country is required." },
        { status: 400 }
      );
    }

    const courses: CourseInput[] = body.courses ?? [];
    const scholarships: ScholarshipInput[] = body.scholarships ?? [];

    if (courses.find((c) => !c.name?.trim())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "All courses must have a name." },
        { status: 400 }
      );
    }
    if (scholarships.find((s) => !s.name?.trim())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "All scholarships must have a name." },
        { status: 400 }
      );
    }

    // ── Step 1: create the university (no nested relations yet) ───────────────
    const university = await prisma.university.create({
      data: {
        name: body.name.trim(),
        countryId: body.countryId.trim(),
        logo: body.logo ?? null,
        website: body.website ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        postalCode: body.postalCode ?? null,
        ranking: nullify(toNum(body.ranking)),
        establishedYear: nullify(toNum(body.establishedYear)),
        applicationFee: nullify(toDecimal(body.applicationFee)),
        currency: body.currency ?? null,
        description: body.description ?? null,
        status: body.status ?? "active",
        contactPerson: body.contactPerson ?? null,
        contactEmail: body.contactEmail ?? null,
        contactPhone: body.contactPhone ?? null,
        tier: body.tier ?? null,
        intakeNotes: body.intakeNotes ?? null
      },

    });

    // Track the id so the catch block can roll back if later steps fail
    createdUniversityId = university.id;

    // ── Step 2: create courses one-by-one to preserve insertion order ─────────
    // createMany doesn't return created records in Prisma, so we need the ids
    // to resolve scholarship → course links. Creating individually is the
    // cleanest approach; course lists are small so N+1 is not a concern here.
    
    const localToRealCourseId = new Map<string, string>();

    for (const c of courses) {
      const created = await prisma.universityCourse.create({
        data: {
          universityId: university.id,
          ...buildCourseData(c),
        },
        select: { id: true },
      });
      // Map the frontend's local temp uuid → the real DB id
      if (c.id) localToRealCourseId.set(c.id, created.id);
    }

    // ── Step 3: create scholarships with resolved courseIds ───────────────────
    if (scholarships.length > 0) {
      await prisma.universityScholarship.createMany({
        data: scholarships.map((s) => {
          const resolvedCourseId = s.courseId
            ? (localToRealCourseId.get(s.courseId) ?? null)
            : null;
          return {
            universityId: university.id,
            ...buildScholarshipData(s, resolvedCourseId),
          };
        }),
      });
    }

    // ── Step 4: fetch and return the full record ───────────────────────────────
    const full = await prisma.university.findUniqueOrThrow({
      where: { id: university.id },
      include: {
        country: { select: { id: true, name: true } },
        courses: { orderBy: { createdAt: "asc" } },
        scholarships: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: full, message: "University created successfully." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/universities]", error);

    // ── Compensating rollback: delete the university if it was created ─────────
    // onDelete: Cascade means courses + scholarships are removed automatically.
    if (createdUniversityId) {
      try {
        await prisma.university.delete({ where: { id: createdUniversityId } });
      } catch (rollbackErr) {
        console.error("[POST /api/universities] rollback failed", rollbackErr);
      }
    }

    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "A university with this name already exists in that country.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create university." },
      { status: 500 }
    );
  }
}