import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { DegreeType } from "@/lib/generated/prisma/client";

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
  try {
    const body = await req.json();

    const {
      name,
      durationMonths,
      annualTuitionFee,
      totalTuitionFee,
      currency,
      intakeId,
      minimumPercentage,
      backlogLimit,
      englishRequirement,
      ieltsOverall,
      ieltsListening,
      ieltsReading,
      ieltsWriting,
      ieltsSpeaking,
      greRequired,
      gmatRequired,
      courseCode,
      description,
      applicationDeadline,
      status,
      universityId,
    } = body;
const degree = body.degree?.toLowerCase();
    console.log({
  name,
  degree,
  universityId,
  validDegrees: Object.values(DegreeType),
});

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Course name is required." },
        { status: 400 }
      );
    }

    if (!degree) {
      return NextResponse.json(
        { success: false, message: "Degree is required." },
        { status: 400 }
      );
    }

    if (!Object.values(DegreeType).includes(degree)) {
      return NextResponse.json(
        { success: false, message: "Invalid degree." },
        { status: 400 }
      );
    }

    if (!universityId) {
      return NextResponse.json(
        { success: false, message: "University is required." },
        { status: 400 }
      );
    }

    const course = await prisma.universityCourse.create({
      data: {
        name: name.trim(),
        degree,

        durationMonths:
          durationMonths !== null && durationMonths !== undefined
            ? Number(durationMonths)
            : null,

        annualTuitionFee:
          annualTuitionFee !== null && annualTuitionFee !== undefined
            ? annualTuitionFee.toString()
            : null,

        totalTuitionFee:
          totalTuitionFee !== null && totalTuitionFee !== undefined
            ? totalTuitionFee.toString()
            : null,

        currency: currency || null,
        intakeId: intakeId || null,

        minimumPercentage:
          minimumPercentage !== null && minimumPercentage !== undefined
            ? Number(minimumPercentage)
            : null,

        backlogLimit:
          backlogLimit !== null && backlogLimit !== undefined
            ? Number(backlogLimit)
            : null,

        englishRequirement: englishRequirement || null,

        ieltsOverall:
          ieltsOverall !== null && ieltsOverall !== undefined
            ? Number(ieltsOverall)
            : null,

        ieltsListening:
          ieltsListening !== null && ieltsListening !== undefined
            ? Number(ieltsListening)
            : null,

        ieltsReading:
          ieltsReading !== null && ieltsReading !== undefined
            ? Number(ieltsReading)
            : null,

        ieltsWriting:
          ieltsWriting !== null && ieltsWriting !== undefined
            ? Number(ieltsWriting)
            : null,

        ieltsSpeaking:
          ieltsSpeaking !== null && ieltsSpeaking !== undefined
            ? Number(ieltsSpeaking)
            : null,

        greRequired: Boolean(greRequired),
        gmatRequired: Boolean(gmatRequired),

        courseCode: courseCode || null,
        description: description || null,

        applicationDeadline: applicationDeadline
          ? new Date(`${applicationDeadline}T00:00:00.000Z`)
          : null,

        status: Boolean(status),

        universityId,
      },
    });

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create course.",
      },
      { status: 500 }
    );
  }
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