import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust to your prisma client path
import {
  UniversityInput,
  CourseInput,
  ScholarshipInput,
  ApiResponse,
} from "@/slids/types/university.types";

// ─── Helpers (same as in route.ts — extract to a shared lib if preferred) ─────

function toNum(val: string | number | null | undefined): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

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

// ─── GET /api/universities/[id] ───────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        courses: {
          orderBy: {
            createdAt: "asc",
          },
        },
        scholarships: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!university) {
      return NextResponse.json(
        {
          success: false,
          error: "University not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: university,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch university.",
      },
      { status: 500 }
    );
  }
}

// ─── PUT /api/universities/[id] ───────────────────────────────────────────────
// Full replace strategy for nested relations:
//   • Courses/scholarships that carry a real DB id  → upserted (update or create)
//   • Courses/scholarships without an id             → created fresh
//   • Courses/scholarships that were in the DB but
//     are missing from the payload                   → deleted
// This makes the route work identically for both ADD (first save) and EDIT.

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(id);
  
  if (!id) {
    return NextResponse.json({error: "Id is not avaiable"})
  }
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

    const incomingCourses: CourseInput[] = body.courses ?? [];
    const incomingScholarships: ScholarshipInput[] = body.scholarships ?? [];

    const invalidCourse = incomingCourses.find((c) => !c.name?.trim());
    if (invalidCourse) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "All courses must have a name." },
        { status: 400 }
      );
    }

    const invalidScholarship = incomingScholarships.find(
      (s) => !s.name?.trim()
    );
    if (invalidScholarship) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "All scholarships must have a name." },
        { status: 400 }
      );
    }

    // ── Check university exists ───────────────────────────────────────────────
    const existingIn = await prisma.university.findMany({
      where: { id: id },
      include: {
        courses: { select: { id: true } },
        scholarships: { select: { id: true } },
      },
    });

    const existing = existingIn[0]

    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "University not found." },
        { status: 404 }
      );
    }

    // ── IDs that exist in DB ──────────────────────────────────────────────────
    const existingCourseIds = new Set(existing.courses.map((c) => c.id));
    const existingScholarshipIds = new Set(
      existing.scholarships.map((s) => s.id)
    );

    // ── IDs coming from frontend payload (only real DB ids, not local temp ids)
    const incomingCourseDbIds = new Set(
      incomingCourses
        .filter((c) => c.id && existingCourseIds.has(c.id))
        .map((c) => c.id as string)
    );
    const incomingScholarshipDbIds = new Set(
      incomingScholarships
        .filter((s) => s.id && existingScholarshipIds.has(s.id))
        .map((s) => s.id as string)
    );

    // ── IDs to delete (in DB but not in payload) ──────────────────────────────
    const courseIdsToDelete = [...existingCourseIds].filter(
      (id) => !incomingCourseDbIds.has(id)
    );
    const scholarshipIdsToDelete = [...existingScholarshipIds].filter(
      (id) => !incomingScholarshipDbIds.has(id)
    );

    // ── Sequential ops (no interactive transaction — avoids P2028 timeout) ─────
    // Order matters: delete scholarships before courses (FK constraint),
    // then upsert courses to get real ids, then upsert scholarships.

    // 1. Update university scalar fields
    await prisma.university.update({
      where: { id: id },
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

    // 2. Delete removed scholarships first (they reference courses via FK)
    if (scholarshipIdsToDelete.length > 0) {
      await prisma.universityScholarship.deleteMany({
        where: { id: { in: scholarshipIdsToDelete } },
      });
    }

    // 3. Delete removed courses
    if (courseIdsToDelete.length > 0) {
      await prisma.universityCourse.deleteMany({
        where: { id: { in: courseIdsToDelete } },
      });
    }

    // 4. Upsert courses; build local-id → real DB id map for scholarship resolution
    const localToRealCourseId = new Map<string, string>();

    for (const c of incomingCourses) {
      const isExistingDbRecord = !!(c.id && existingCourseIds.has(c.id));

      if (isExistingDbRecord) {
        await prisma.universityCourse.update({
          where: { id: c.id },
          data: buildCourseData(c),
        });
        localToRealCourseId.set(c.id!, c.id!);
      } else {
        const created = await prisma.universityCourse.create({
          data: { universityId: id, ...buildCourseData(c) },
          select: { id: true },
        });
        if (c.id) localToRealCourseId.set(c.id, created.id);
        localToRealCourseId.set(created.id, created.id);
      }
    }

    // 5. Upsert scholarships
    for (const s of incomingScholarships) {
      const resolvedCourseId = s.courseId
        ? (localToRealCourseId.get(s.courseId) ?? null)
        : null;
      const isExistingDbRecord = !!(s.id && existingScholarshipIds.has(s.id));

      if (isExistingDbRecord) {
        await prisma.universityScholarship.update({
          where: { id: s.id },
          data: buildScholarshipData(s, resolvedCourseId),
        });
      } else {
        await prisma.universityScholarship.create({
          data: {
            universityId: id,
            ...buildScholarshipData(s, resolvedCourseId),
          },
        });
      }
    }

    // 6. Fetch and return the full updated record
    const university = await prisma.university.findUniqueOrThrow({
      where: { id: id },
      include: {
        country: { select: { id: true, name: true } },
        courses: { orderBy: { createdAt: "asc" } },
        scholarships: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: university,
      message: "University updated successfully.",
    });
  } catch (error: any) {
    console.error("[PUT /api/universities/:id]", error);

    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error:
            "A university with this name already exists in that country.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update university." },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/universities/[id] ────────────────────────────────────────────
// Courses and scholarships are cascade-deleted by the DB (onDelete: Cascade).

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = await params.id
  try {
    const existingDl = await prisma.university.findMany({
      where: { id: id },
      select: { id: true, name: true },
    });

    const existing = existingDl[0]
    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "University not found." },
        { status: 404 }
      );
    }

    await prisma.university.delete({ where: { id: id } });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { id: id, name: existing.name },
      message: `"${existing.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error("[DELETE /api/universities/:id]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to delete university." },
      { status: 500 }
    );
  }
}