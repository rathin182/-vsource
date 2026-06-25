export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type ApplicationStage = "inquiry" | "documents" | "applied" | "offer" | "visa" | "enrolled";

export interface Lead {
  id: string;

  // Personal Information
  firstName: string;
  lastName?: string | null;

  email: string;
  phone: string;
  alternatePhone?: string | null;

  dob?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;

  // Academic Information
  qualification?: string | null;
  percentage?: number | null;
  passingYear?: number | null;

  ieltsScore?: number | null;
  pteScore?: number | null;
  toeflScore?: number | null;
  duolingoScore?: number | null;

  // Study Preferences
  preferredCountry?: string | null;
  preferredCourse?: string | null;

  intakeSeason?: string | null;
  intakeYear?: number | null;

  budget?: string | null;

  // Lead Information
  source: string;
  referralSource?: string | null;

  status: LeadStatus;

  country?: string | null;

  branchId: string;
  counselorId: string;

  branch: {
    id: string;
    name: string;
    city: string;
  };

  counselor: {
    id: string;
    name: string;
    email: string;
  };

  // Notes
  notes?: string | null;

  // Conversion
  student?: {
    id: string;
    name: string;
  } | null;

  createdAt: string;
  updatedAt: string;
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

interface Country {
  id: string;
  code: string;
  name: string;
}

interface Count {
  courses: number;
  scholarships: number;
}

export interface University {
  _count: Count;
  address: string;
  applicationFee: string;
  city: string;
  contactEmail: string;
  contactPerson: string;
  contactPhone: string;
  country: Country;
  countryId: string;
  createdAt: string;
  currency: string;
  description: string;
  establishedYear: number;
  id: string;
  intakeNotes: string;
  logo: string;
  name: string;
  postalCode: string;
  ranking: number;
  state: string;
  status: "active" | "inactive";
  updatedAt: string;
  website: string;
  tier: string
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
  createdAt: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email: string;
  phone: string;
  status: boolean;
  usersCount: number;
  studentsCount: number;
  leadsCount: number;
  createdAt: string;
  updatedAt: string;
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


export interface CourseFormData {
  name: string;
  degree: string;

  universityId: string;
  countryId?: string;

  intakeId?: string;

  durationMonths?: number;

  annualTuitionFee?: number;
  totalTuitionFee?: number;
  currency?: string;

  minimumPercentage?: number;
  backlogLimit?: number;

  englishRequirement?: string;

  ieltsOverall?: number;
  ieltsListening?: number;
  ieltsReading?: number;
  ieltsWriting?: number;
  ieltsSpeaking?: number;

  greRequired: boolean;
  gmatRequired: boolean;

  courseCode?: string;
  applicationDeadline?: string;

  description?: string;

  status: boolean;
}