export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type ApplicationStage = "inquiry" | "documents" | "applied" | "offer" | "visa" | "enrolled";

export interface Lead {
  id: string;
  leadNumber: string;
  leadType: string;

  studentName: string;
  fatherName: string;

  emailId: string;
  mobileNumber: string;
  place: string;

  source: string;
  status: LeadStatus;

  preferredCountry: string;
  preferredCourse: string;
  preferredIntake: string;

  branchId: string;
  branch: {
    id: string;
    name: string;
    code: string;
  };

  counselors: {
    counselor: {
      id: string;
      name: string;
    };
  }[];

  englishTestType?: string;

  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  listeningScore?: number;

  greGmatScore?: number;
  verbalScore?: number;
  quantitativeScore?: number;
  analyticalWritingScore?: number;

  tenthPercentage?: number;
  tenthYearOfPassing?: number;

  twelfthPercentage?: number;
  twelfthYearOfPassing?: number;

  bachelorsCourse?: string;
  bachelorsUniversityName?: string;
  bachelorsPercentage?: number;
  bachelorsYearOfPassing?: number;

  backlogs?: number;
  workExperience?: string;
  gapsIfAny?: string;

  passport?: string;
  passportExpireDate?: string;

  counsellingDate?: string;
  nextFollowup?: string;

  isConverted: boolean;
  convertedAt?: string;

  remarks?: string | null;

  createdAt: string;
  updatedAt: string;

  _count: {
    timelines: number;
  };
}

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;

export const APPLICATION_STAGES = ["inquiry", "documents", "applied", "offer", "visa", "enrolled"] as const;

export interface Followup {
  id: string;
  student: string;
  counselor: string;
  followupType: string;
  date: string;
  time: string;
  country: string;
  status: "Pending" | "Completed" | "Missed" | "Rescheduled";
  remarks: string;
  notes: string;
}

export interface Course {
  id: string;
  logo: string;
  universityName: string;
  courseName: string;
  country: string;
  applicationFee: string;
  yearlyTuition: string;
  duration: string;
  intakeMonth: string;
  intakeYear: string;
  level: string;
  requirements: string;
  ielts: string;
  pte: string;
  toefl: string;
  duolingo: string;
  description: string;
}

export interface Student {
  id: string;

  studentNumber: string;

  leadId: string;
  branchId: string;
  counselorId?: string | null;

  studentName: string;
  mobileNumber?: string | null;
  emailId?: string | null;

  preferredCountry?: string | null;
  preferredCourse?: string | null;

  status: string;

  createdAt: string;
  updatedAt: string;

  branch?: {
    id: string;
    name: string;
    code: string;
  };

  counselor?: {
    id: string;
    name: string;
    email: string;
  } | null;

  lead?: {
    id: string;
    leadNumber: string;
    source: string;
  };

  _count?: {
    timeline: number;
  };
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  ranking: number;
  tuitionFee: number;
  duration: string;
  intakes: string[];
  scholarships: boolean;
  programs: string[];
  image?: string;
}

export interface Application {
  id: string;
  studentName: string;
  university: string;
  program: string;
  stage: ApplicationStage;
  intake: string;
  counselor: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  manager: string;
  staff: number;
  students: number;
  revenue: number;
}

export interface Counselor {
  id: string;
  name: string;
  email: string;
  branch: string;
  leads: number;
  conversions: number;
  rating: number;
}

export interface CoachingBatch {
  id: string;
  name: string;
  type: "IELTS" | "PTE" | "TOEFL" | "GRE" | "GMAT";
  faculty: string;
  schedule: string;
  students: number;
  startDate: string;
}

export interface LoanInquiry {
  id: string;
  student: string;
  bank: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "disbursed";
  emi: number;
  appliedAt: string;
}

export interface Role { id: string; name: string; users: number; permissions: Record<string, { c: boolean; r: boolean; u: boolean; d: boolean }>; }
export interface UserRow { id: string; name: string; email: string; role: string; branch: string; status: "active" | "inactive"; lastLogin: string; }
export interface NotificationItem { id: string; title: string; description: string; time: string; read: boolean; type: "lead" | "application" | "system"; }
