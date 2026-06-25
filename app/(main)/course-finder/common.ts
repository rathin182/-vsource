import { DegreeType } from "@/slids/types/university.types";

export function formatFee(amount?: number | null, currency?: string | null) {
  if (!amount) return "N/A";
  return currency
    ? `${currency} ${Number(amount).toLocaleString()}`
    : Number(amount).toLocaleString();
}

export function formatDuration(months?: number | null) {
  if (!months) return "N/A";
  if (months % 12 === 0) return `${months / 12} ${months / 12 === 1 ? "Year" : "Years"}`;
  return `${months} Months`;
}

export function formatIntake(intake?: Intake | null) {
  if (!intake) return "N/A";
  return intake.label ? [intake.month, intake.year].filter(Boolean).join(" ") : "N/A";
}

export interface UniversityCourse {
  id: string;
  name: string;
  courseCode: string;
  degree: string;
  description: string | null;

  annualTuitionFee: string;
  totalTuitionFee: string;
  currency: string;

  durationMonths: number;

  applicationDeadline: string | null;

  minimumPercentage: number | null;
  backlogLimit: number | null;
  englishRequirement: string | null;

  greRequired: boolean;
  gmatRequired: boolean;

  ieltsOverall: number | null;
  ieltsListening: number | null;
  ieltsReading: number | null;
  ieltsWriting: number | null;
  ieltsSpeaking: number | null;

  intakeId: string;
  intake: Intake;

  universityId: string;
  university: University;

  scholarships: Scholarship[];

  status: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Intake {
  id: string;
  label: string;
  month: string;
  year: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface University {
  id: string;
  name: string;
  tier: string;

  countryId: string;
  country: {name: string};

  logo: string | null;

  website?: string | null;
  city?: string | null;
  state?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface Scholarship {
  id: string;

  name: string;

  description?: string | null;

  amount?: string | null;

  currency?: string | null;

  percentage?: number | null;

  eligibility?: string | null;

  deadline?: string | null;

  renewable?: boolean;

  status?: boolean;

  createdAt?: string;

  updatedAt?: string;
}