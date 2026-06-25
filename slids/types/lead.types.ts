export type Gender = "MALE" | "FEMALE" | "OTHER";

export type Qualification =
  | "BELOW_10TH"
  | "10TH"
  | "12TH"
  | "DIPLOMA"
  | "BACHELOR"
  | "MASTER"
  | "PHD";

export type LeadStage = "INQUIRY" | "HOT" | "WARM" | "COLD";

export type LeadStatus = "NEW" | "ACTIVE" | "CONVERTED" | "LOST";

export type IntakeSeason = "SPRING" | "SUMMER" | "FALL" | "WINTER";

export interface Counselor {
  id: string;
  name: string;
  email: string;
  branch: string;
  avatarInitials?: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
}

export interface Lead {
  id: string;
  // Personal
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  dob?: Date | null;
  gender?: Gender | null;
  // Academic
  qualification?: Qualification | null;
  percentage?: number | null;
  passingYear?: number | null;
  ieltsScore?: number | null;
  pteScore?: number | null;
  toeflScore?: number | null;
  duolingoScore?: number | null;
  leadStage: LeadStage;
  // Study preferences
  preferredCountry?: string | null;
  preferredCourse?: string | null;
  intakeSeason?: IntakeSeason | null;
  intakeYear?: number | null;
  budget?: number | null;
  // Lead info
  source: string;
  referralSource?: string | null;
  status: LeadStatus;
  country?: string | null;
  branchId: string;
  counselorId?: string | null;
  branch?: Branch;
  counselor?: Counselor | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignCounselorPayload {
  leadId: string;
  counselorId: string;
}

export interface BulkAssignPayload {
  leadIds: string[];
  counselorId: string;
}