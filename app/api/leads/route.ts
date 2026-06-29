/**
 * api/leads/route.ts
 * GET  /api/leads  — list leads with rich filters
 * POST /api/leads  — create a lead
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { LeadStatus, Gender, IntakeSeason, Qualification, LeadStage } from "@/lib/generated/prisma/enums";
import { z } from "zod";



export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const { skip, take, page, limit } =
      parsePagination(sp);

    const search =
      sp.get("search") ?? undefined;

    const branchId =
      sp.get("branchId") ?? undefined;

    const counselorId =
      sp.get("counselorId") ?? undefined;

    const status =
      sp.get("status") as LeadStatus | null;

    const source =
      sp.get("source") ?? undefined;

    const preferredCountry =
      sp.get("preferredCountry") ??
      undefined;

    const leadStage =
      sp.get("leadStage") as LeadStage | null;

    const from = sp.get("from")
      ? new Date(sp.get("from")!)
      : undefined;

    const to = sp.get("to")
      ? new Date(sp.get("to")!)
      : undefined;

    const where = {
      ...(branchId && {
        branchId,
      }),

      ...(counselorId && {
        counselorId,
      }),

      ...(status && {
        status,
      }),

      ...(leadStage && {
        leadStage,
      }),

      ...(source && {
        source,
      }),

      ...(preferredCountry && {
        preferredCountry,
      }),

      ...((from || to) && {
        createdAt: {
          ...(from && {
            gte: from,
          }),

          ...(to && {
            lte: to,
          }),
        },
      }),

      ...(search && {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    const [leads, total] =
      await Promise.all([
        db.lead.findMany({
          where,

          skip,
          take,

          orderBy: {
            createdAt: "desc",
          },

          include: {
            branch: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },

            counselor: {
              select: {
                id: true,
                name: true,
              },
            },

            student: {
              select: {
                id: true,
                studentName: true,
                emailId: true,
                mobileNumber: true,
                status: true,
              },
            },

            timelines: true,

            counselors: true,
          },
        }),

        db.lead.count({
          where,
        }),
      ]);

    return ok(
      leads,
      undefined,
      buildMeta(
        total,
        page,
        limit
      )
    );
  } catch (err: any) {

    return handleError(err);
  }
}

// export async function POST(req: NextRequest) {
//   try {
//     const payload = await req.json();

//     const body = LeadCreateSchema.parse({
//       firstName: payload.firstName,
//       lastName: payload.lastName,

//       email: payload.email,

//       phone: payload.mobileNumber,
//       alternatePhone:
//         payload.alternateMobile || undefined,

//       dob: payload.dob,

//       gender:
//         payload.gender?.toUpperCase(),

//       qualification:
//         payload.highestQualification?.toUpperCase(),

//       percentage: payload.percentage,
//       passingYear: payload.passingYear,

//       ieltsScore:
//         payload.ieltsScore
//           ? Number(payload.ieltsScore)
//           : undefined,

//       pteScore:
//         payload.pteScore
//           ? Number(payload.pteScore)
//           : undefined,

//       toeflScore:
//         payload.toeflScore
//           ? Number(payload.toeflScore)
//           : undefined,

//       duolingoScore:
//         payload.duolingoScore
//           ? Number(payload.duolingoScore)
//           : undefined,

//       preferredCountry:
//         payload.preferredCountry,

//       preferredCourse:
//         payload.preferredCourse,

//       intakeSeason:
//         payload.preferredIntake?.toUpperCase(),

//       intakeYear:
//         payload.preferredIntakeYear
//           ? Number(payload.preferredIntakeYear)
//           : undefined,

//       budget:
//         payload.budget
//           ? Number(payload.budget)
//           : undefined,

//       source:
//         payload.leadSource,

//       referralSource:
//         payload.referralSource || undefined,

//       status:
//         payload.leadStatus,

//       branchId:
//         payload.branch,

//       counselorId:
//         payload.assignedCounselor,

//       notes:
//         payload.notes,
//     });

//     const lead = await db.lead.create({
//       data: {
//         firstName:
//           body.firstName,

//         lastName:
//           body.lastName,

//         email:
//           body.email,

//         phone:
//           body.phone,

//         alternatePhone:
//           body.alternatePhone,

//         dob:
//           body.dob,

//         gender:
//           body.gender,

//         qualification:
//           body.qualification,

//         percentage:
//           body.percentage,

//         passingYear:
//           body.passingYear,

//         ieltsScore:
//           body.ieltsScore,

//         pteScore:
//           body.pteScore,

//         toeflScore:
//           body.toeflScore,

//         duolingoScore:
//           body.duolingoScore,

//         preferredCountry:
//           body.preferredCountry,

//         preferredCourse:
//           body.preferredCourse,

//         intakeSeason:
//           body.intakeSeason,

//         intakeYear:
//           body.intakeYear,

//         budget:
//           body.budget,

//         source:
//           body.source,

//         referralSource:
//           body.referralSource,

//         status:
//           body.status,

//         country:
//           body.country,

//         branchId:
//           body.branchId,

//         counselorId:
//           body.counselorId || undefined,

//         notes:
//           body.notes,
//       },

//       include: {
//         branch: true,

//         counselor: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//     });

//     return created(
//       lead,
//       "Lead created successfully"
//     );
//   } catch (err: any) {
    
//     return handleError(err);

//   }
// }

export async function DELETE(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id") as string;
    const deletedLead = await db.lead.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true, data: deletedLead }, { status: 200 })
  } catch (error: any) {
    
    return NextResponse.json({ success: false, error: "Failed to delete leads." }, { status: 500 });
  }

}


// ─── Validation Schema ────────────────────────────────────────────────────────

const LeadCreateSchema = z.object({
  // Personal
  studentName:        z.string().min(1, "Student name is required"),
  fatherName:         z.string().optional(),
  email:              z.string().email("Invalid email address"),
  phone:              z.string().length(10, "Phone must be 10 digits"),
  dob:                z.coerce.date().optional(),
  gender:             z.nativeEnum(Gender).optional(),
  passport:           z.string().optional(),
  passportExpireDate: z.coerce.date().optional(),
  applicationDate:    z.coerce.date().optional(),
  source:             z.string().optional(),

  // Academic — Schooling
  tenthPassingYear:       z.coerce.number().int().positive().optional(),
  tenthPassingPercentage: z.coerce.number().min(0).max(100).optional(),
  twelfthYearOfPassing:   z.coerce.number().int().positive().optional(),
  twelfthPercentage:      z.coerce.number().min(0).max(100).optional(),

  // Academic — Bachelor's
  bachelorsUniversityName: z.string().optional(),
  bachelorsCourse:         z.string().optional(),
  bachelorsPercentage:     z.coerce.number().min(0).optional(),
  bachelorsYearOfPassing:  z.coerce.number().int().positive().optional(),
  backlogs:                z.coerce.number().int().min(0).optional(),
  gapsIfAny:               z.string().optional(),
  workExperience:          z.string().optional(),

  // EPT scores
  englishTestType: z.string().optional(),
  listeningScore:  z.coerce.number().min(0).optional(),
  readingScore:    z.coerce.number().min(0).optional(),
  writingScore:    z.coerce.number().min(0).optional(),
  speakingScore:   z.coerce.number().min(0).optional(),
  ieltsScore:      z.coerce.number().min(0).optional(),
  pteScore:        z.coerce.number().min(0).optional(),
  toeflScore:      z.coerce.number().min(0).optional(),
  duolingoScore:   z.coerce.number().min(0).optional(),

  // GRE / GMAT
  greGmatScore:           z.coerce.number().min(0).optional(),
  quantitativeScore:      z.coerce.number().min(0).optional(),
  verbalScore:            z.coerce.number().min(0).optional(),
  analyticalWritingScore: z.coerce.number().min(0).optional(),

  // Study preferences
  preferredCountry: z.string().optional(),
  preferredCourse:  z.string().optional(),
  preferredIntake:  z.string().optional(),
  preferredTiers:   z.array(z.string()).default([]),

  // Lead meta
  status:      z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  leadStage:   z.nativeEnum(LeadStage).default(LeadStage.INQUIRY),
  branchId:    z.string().min(1, "Branch is required"),
  counselorId: z.string().optional(),
  notes:       z.string().optional(),
});

// ─── POST /api/leads ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const body = LeadCreateSchema.parse({
      // Personal
      studentName:        payload.studentName,
      fatherName:         payload.fatherName         || undefined,
      email:              payload.emailId             ?? payload.email,
      phone:              payload.mobileNumber        ?? payload.phone,
      dob:                payload.dob                 || undefined,
      gender:             payload.gender?.toUpperCase() || undefined,
      passport:           payload.passport            || undefined,
      passportExpireDate: payload.passportExpireDate  || undefined,
      applicationDate:    payload.counsellingDate     || undefined,
      source:             payload.source              || undefined,

      // Academic — Schooling
      tenthPassingYear:       payload.tenthYearOfPassing       || undefined,
      tenthPassingPercentage: payload.tenthPercentage           || undefined,
      twelfthYearOfPassing:   payload.twelfthYearOfPassing      || undefined,
      twelfthPercentage:      payload.twelfthPercentage         || undefined,

      // Academic — Bachelor's
      bachelorsUniversityName: payload.bachelorsUniversityName  || undefined,
      bachelorsCourse:         payload.bachelorsCourse          || undefined,
      bachelorsPercentage:     payload.bachelorsPercentage      || undefined,
      bachelorsYearOfPassing:  payload.bachelorsYearOfPassing   || undefined,
      backlogs:                payload.backlogs != null ? Number(payload.backlogs) : undefined,
      gapsIfAny:               payload.gapsIfAny                || undefined,
      workExperience:          payload.workExperience           || undefined,

      // EPT
      englishTestType: payload.englishTestType  || undefined,
      listeningScore:  payload.listeningScore   || undefined,
      readingScore:    payload.readingScore     || undefined,
      writingScore:    payload.writingScore     || undefined,
      speakingScore:   payload.speakingScore    || undefined,
      // overall scores auto-populated from the same payload fields
      // if the backend still wants them separately
      ieltsScore:      payload.englishTestType === "IELTS"
                         ? (payload.listeningScore
                              ? (Number(payload.listeningScore) + Number(payload.readingScore) +
                                 Number(payload.writingScore)   + Number(payload.speakingScore)) / 4
                              : undefined)
                         : undefined,
      pteScore:        payload.englishTestType === "PTE"      ? payload.pteScore      || undefined : undefined,
      toeflScore:      payload.englishTestType === "TOEFL"    ? payload.toeflScore    || undefined : undefined,
      duolingoScore:   payload.englishTestType === "DUOLINGO" ? payload.duolingoScore || undefined : undefined,

      // GRE / GMAT
      greGmatScore:           payload.greGmatScore           || undefined,
      quantitativeScore:      payload.quantitativeScore       || undefined,
      verbalScore:            payload.verbalScore             || undefined,
      analyticalWritingScore: payload.analyticalWritingScore  || undefined,

      // Preferences
      preferredCountry: payload.preferredCountry || undefined,
      preferredCourse:  payload.preferredCourse  || undefined,
      preferredIntake:  payload.preferredIntake  || undefined,
      preferredTiers:   Array.isArray(payload.preferredTiers) ? payload.preferredTiers : [],

      // Lead meta
      status:      payload.status?.toUpperCase()     || LeadStatus.NEW,
      leadStage:   payload.leadStage?.toUpperCase()  || LeadStage.INQUIRY,
      branchId:    payload.branchId,
      counselorId: payload.counselorId               || undefined,
      notes:       payload.notes                     || undefined,
    });

    const lead = await db.lead.create({
      data: {
        // Personal
        studentName:        body.studentName,
        fatherName:         body.fatherName,
        email:              body.email,
        phone:              body.phone,
        dob:                body.dob,
        gender:             body.gender,
        passport:           body.passport,
        passportExpireDate: body.passportExpireDate,
        applicationDate:    body.applicationDate,
        source:             body.source,

        // Academic — Schooling
        tenthPassingYear:       body.tenthPassingYear,
        tenthPassingPercentage: body.tenthPassingPercentage,
        twelfthYearOfPassing:   body.twelfthYearOfPassing,
        twelfthPercentage:      body.twelfthPercentage,

        // Academic — Bachelor's
        bachelorsUniversityName: body.bachelorsUniversityName,
        bachelorsCourse:         body.bachelorsCourse,
        bachelorsPercentage:     body.bachelorsPercentage,
        bachelorsYearOfPassing:  body.bachelorsYearOfPassing,
        backlogs:                body.backlogs,
        gapsIfAny:               body.gapsIfAny,
        workExperience:          body.workExperience,

        // EPT
        englishTestType: body.englishTestType,
        listeningScore:  body.listeningScore,
        readingScore:    body.readingScore,
        writingScore:    body.writingScore,
        speakingScore:   body.speakingScore,
        ieltsScore:      body.ieltsScore,
        pteScore:        body.pteScore,
        toeflScore:      body.toeflScore,
        duolingoScore:   body.duolingoScore,

        // GRE / GMAT
        greGmatScore:           body.greGmatScore,
        quantitativeScore:      body.quantitativeScore,
        verbalScore:            body.verbalScore,
        analyticalWritingScore: body.analyticalWritingScore,

        // Preferences
        preferredCountry: body.preferredCountry,
        preferredCourse:  body.preferredCourse,
        preferredIntake:  body.preferredIntake,
        preferredTiers:   body.preferredTiers,

        // Lead meta
        status:      body.status,
        leadStage:   body.leadStage,
        branchId:    body.branchId,
        counselorId: body.counselorId,
        notes:       body.notes,
      },
      include: {
        branch: true,
        counselor: {
          select: {
            id:   true,
            name: true,
          },
        },
      },
    });

    return created(lead, "Lead created successfully");
  } catch (err: any) {
    return handleError(err);
  }
}