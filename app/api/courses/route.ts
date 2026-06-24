import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const courseName =
    req.nextUrl.searchParams.get("courseName");

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

  const courses =
    await prisma.universityCourse.findMany({
      select: {
        name: true,
        annualTuitionFee: true,
        universityId: true,
      },
    });

  const grouped = Object.values(
    courses.reduce((acc: any, item) => {
      if (!acc[item.name]) {
        acc[item.name] = {
          courseName: item.name,
          universities: new Set(),
          fees: [],
        };
      }

      acc[item.name].universities.add(
        item.universityId
      );

      if (item.annualTuitionFee) {
        acc[item.name].fees.push(
          Number(item.annualTuitionFee)
        );
      }

      return acc;
    }, {})
  );

  const result = grouped.map((course: any) => {
    const fees = course.fees;

    return {
      courseName: course.courseName,
      universitiesCount:
        course.universities.size,
      averageFee:
        fees.length > 0
          ? Math.round(
              fees.reduce(
                (a: number, b: number) => a + b,
                0
              ) / fees.length
            )
          : 0,
      minimumFee:
        fees.length > 0
          ? Math.min(...fees)
          : 0,
      maximumFee:
        fees.length > 0
          ? Math.max(...fees)
          : 0,
    };
  });

  return NextResponse.json(result);
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