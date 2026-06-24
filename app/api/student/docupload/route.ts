import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";
import { uploadFile } from "@/lib/uploads";

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

    const formData = await req.formData();

    const file = formData.get("file") as File;

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "Document file is required.",
        },
        {
          status: 400,
        }
      );
    }

    const fileUrl = await uploadFile(
      file,
      "student-documents"
    );

    const document = await db.doc.create({
      data: {
        name: name || file.name,
        type: type || file.type,
        address: fileUrl,
        studentId,
      },
    });

    return NextResponse.json({
      success: true,
      data: document,
      message: "Document uploaded successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload document.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Document ID required",
      },
      { status: 400 }
    );
  }

  await db.doc.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}