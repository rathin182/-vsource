import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const search =
    req.nextUrl.searchParams.get("courseName");
    const courseName = new URLSearchParams(search ?? "").get("search");
console.log(courseName, search);

  if (courseName) {
    const details =
      await prisma.universityCourse.findMany({
        where: {
          name: courseName,
        },
        include: {
          university: {
            select: {
              id: true,
              name: true,
            },
          },
          intake: true,
        },
      });

    return NextResponse.json(
      details.map((course) => ({
        universityId: course.university.id,
        universityName: course.university.name,
        annualTuitionFee: Number(
          course.annualTuitionFee || 0
        ),
        totalTuitionFee: Number(
          course.totalTuitionFee || 0
        ),
        durationMonths: course.durationMonths,
        intake: course.intake?.name || null,
        minimumPercentage:
          course.minimumPercentage,
        backlogLimit: course.backlogLimit,
        ieltsOverall: course.ieltsOverall,
        greRequired: course.greRequired,
        gmatRequired: course.gmatRequired,
      }))
    );
  }

  const courses = await prisma.universityCourse.findMany({
      include: {
        university: {
          include: {
            country: true
          }
        },
        intake: true,
        scholarships: true
      }
    });

  return NextResponse.json({data: courses});
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const course =
    await prisma.universityCourse.create({
      data: body,
    });

  return NextResponse.json(course);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const { id, ...data } = body;

  const course =
    await prisma.universityCourse.update({
      where: { id },
      data,
    });

  return NextResponse.json(course);
}

export async function DELETE(req: NextRequest) {
  const id =
    req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID required" },
      { status: 400 }
    );
  }

  await prisma.universityCourse.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
  });
}