export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type ApplicationStage = "inquiry" | "documents" | "applied" | "offer" | "visa" | "enrolled";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  branch: string;
  counselor: string;
  country: string;
  createdAt: string;
  allocationDate?: string;
  nextFollowup?: string;
}

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
  name: string;
  email: string;
  phone: string;
  dob: string;
  country: string;
  program: string;
  intake: string;
  status: string;
  progress: number;
  avatar?: string;
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
