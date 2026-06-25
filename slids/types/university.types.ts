export type DegreeType =
  | "diploma"
  | "bachelors"
  | "masters"
  | "phd"
  | "mba"
  | "certificate";

export type UniversityStatus = "active" | "inactive" | "archived";


export interface BasicDetails {
  name: string;
  countryId: string;
  logo: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  ranking: string;
  establishedYear: string;
  applicationFee: string;
  currency: string;
  description: string;
  status: UniversityStatus;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  tier: string
  intakeNotes: string
}

export interface Course {
  id: string; // local id for list management
  name: string;
  degree: DegreeType;
  durationMonths: string;
  annualTuitionFee: string;
  totalTuitionFee: string;
  currency: string;
  intakeId: string;
  minimumPercentage: string;
  backlogLimit: string;
  englishRequirement: string;
  ieltsOverall: string;
  ieltsListening: string;
  ieltsReading: string;
  ieltsWriting: string;
  ieltsSpeaking: string;
  greRequired: boolean;
  gmatRequired: boolean;
  courseCode: string;
  description: string;
  applicationDeadline: string;
  status: boolean;
}

export interface Scholarship {
  id: string; // local id for list management
  name: string;
  amount: string;
  percentage: string;
  description: string;
  status: UniversityStatus;
  courseId: string; // references a course's local id
}

export interface UniversityFormData {
  basicDetails: BasicDetails;
  courses: Course[];
  scholarships: Scholarship[];
}

// ─── Enums (mirror Prisma schema) ─────────────────────────────────────────────

export interface CourseInput {
  /** Present on edit, absent on create */
  id?: string;
  name: string;
  degree: DegreeType;
  durationMonths?: string | number | null;
  annualTuitionFee?: string | number | null;
  totalTuitionFee?: string | number | null;
  currency?: string | null;
  intakeId?: string | null;
  minimumPercentage?: string | number | null;
  backlogLimit?: string | number | null;
  englishRequirement?: string | null;
  ieltsOverall?: string | number | null;
  ieltsListening?: string | number | null;
  ieltsReading?: string | number | null;
  ieltsWriting?: string | number | null;
  ieltsSpeaking?: string | number | null;
  greRequired?: boolean;
  gmatRequired?: boolean;
  courseCode?: string | null;
  description?: string | null;
  applicationDeadline?: string | null; // ISO date string
  status?: boolean;
}

export interface ScholarshipInput {
  /** Present on edit, absent on create */
  id?: string;
  name: string;
  amount?: string | number | null;
  percentage?: string | number | null;
  description?: string | null;
  status?: UniversityStatus;
  /** courseId references a real DB course id on edit, or a temp local id on create */
  courseId?: string | null;
}
type Tier = "T1" | "T2" | "T3" | "T4"

export interface UniversityInput {
  // Basic details
  name: string;
  countryId: string;
  logo?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  ranking?: string | number | null;
  establishedYear?: string | number | null;
  applicationFee?: string | number | null;
  currency?: string | null;
  description?: string | null;
  status?: UniversityStatus;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  tier: Tier;
  intakeNotes?: string;
  // Relations
  courses?: CourseInput[];
  scholarships?: ScholarshipInput[];
}

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Query param shapes (GET /api/universities) ───────────────────────────────

export interface UniversityListQuery {
  page?: number;
  limit?: number;
  search?: string;
  countryId?: string;
  city?: string;
  status?: UniversityStatus;
}