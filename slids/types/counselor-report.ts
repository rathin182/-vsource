// types/counselor-report.ts
//
// Types for GET /api/report/counselor/[counselorId]  (counselorId passed
// as a QUERY PARAM — the route reads sp.get("counselorId"), not the path
// segment, so callers must always call:
//   /api/report/counselor/{counselorId}?counselorId={counselorId}&...
// This file is a 1:1 mirror of the JSON that route actually returns.
// Do not invent fields that aren't in the backend — the previous
// "all counselors" frontend assumed a shape (byStatus, byStage, list,
// upcoming, topUniversities, etc.) that this backend does not produce.

// ─── shared / generic ──────────────────────────────────────────────────────

export interface StatusCount {
  status: string;
  count: number;
}

export interface BranchRef {
  id: string;
  name: string;
  code?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "custom";

export interface CounselorReportFilters {
  datePreset: DatePreset;
  startDate: string;
  endDate: string;
  branchId: string;
  page: number;
  pageSize: number;
}

// ─── profile ────────────────────────────────────────────────────────────

export interface CounselorProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  monthlyTarget: number | null;
  role: { id: string; name: string; description: string | null };
  branches: BranchRef[];
  memberSince: string;
  lastUpdated: string;
}

// ─── summary ────────────────────────────────────────────────────────────

export interface CounselorReportSummary {
  totalLeadsAssigned: number;
  primaryLeadsCount: number;
  joinedLeadsCount: number;
  convertedLeadsCount: number;
  unconvertedLeadsCount: number;
  lostLeadsCount: number;
  qualifiedLeadsCount: number;
  conversionRate: number;
  totalStudents: number;
  totalApplications: number;
  offerApplications: number;
  visaApprovedCount: number;
  casReceivedCount: number;
  totalLoanInquiries: number;
  loanSanctionedCount: number;
  totalSanctionedAmount: number;
  totalDisbursedAmount: number;
  totalDocsUploaded: number;
  totalRemarksAuthored: number;
  totalLeadTimelineEntriesCreated: number;
  totalLeadTimelineEntriesUpdatedOnly: number;
  totalStudentTimelineEntriesCreated: number;
  leadsCreatedNotAssigned: number;
  leadsUpdatedNotAssigned: number;
}

// ─── monthly activity / branch performance ────────────────────────────────

export interface MonthlyActivityPoint {
  key: string;
  label: string;
  leads: number;
  students: number;
  applications: number;
}

export interface BranchPerformancePoint {
  branchId: string;
  branch: string;
  leads: number;
  students: number;
  applications: number;
}

// ─── status breakdowns ──────────────────────────────────────────────────

export interface CounselorStatusBreakdowns {
  leadStatus: StatusCount[];
  studentStatus: StatusCount[];
  applicationStatus: StatusCount[];
  visaStatus: StatusCount[];
  casStatus: StatusCount[];
  loanStatus: StatusCount[];
  leadSource: StatusCount[];
  country: StatusCount[];
}

// ─── raw lead record (as returned in leads.primary / leads.joinedViaTeam) ─

export interface CounselorLeadRecord {
  id: string;
  studentName: string | null;
  email: string;
  phone: string;
  status: string;
  leadStage: string;
  source: string | null;
  country: string | null;
  preferredCountry: string | null;
  preferredCourse: string | null;
  preferredIntake: string | null;
  intakeSeason: string | null;
  budget: number | string | null;
  createdAt: string;
  updatedAt: string;
  branch: { id: string; name: string } | null;
  student: { id: string } | null;
}

// ─── student courses / visa / loan (raw, nested inside student.lead) ──────

export interface CounselorStudentCourse {
  id: string;
  universityName: string;
  courseName: string;
  applicationStatus: string;
  applicationDate: string;
  createdAt: string;
}

export interface CounselorVisaDetail {
  id: string;
  status: string;
  casStatus: string | null;
  depositStatus: string | null;
  ihsStatus: string | null;
  visaFeeStatus: string | null;
  casDeadline: string | null;
  depositDeadline: string | null;
  universityStartDate: string | null;
  createdAt: string;
}

export interface CounselorLoanInquiry {
  id: string;
  bank: string;
  assignee: string | null;
  amount: number | string;
  emi: number | string;
  status: string;
  appliedAt: string;
  leadId?: string | null;
  studentId?: string | null;
}

// ─── student record (raw, as returned in `students[]`) ────────────────────

export interface CounselorStudentRecord {
  id: string;
  studentNumber: string | null;
  studentName: string;
  mobileNumber: string | null;
  emailId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  branch: { id: string; name: string } | null;
  lead: {
    id: string;
    source: string | null;
    country: string | null;
    leadStage: string;
    studentCourses: CounselorStudentCourse[];
    visaDetail: CounselorVisaDetail[];
    loanInquiries: CounselorLoanInquiry[];
  } | null;
  loanInquiries: CounselorLoanInquiry[];
}

// ─── docs / remarks / timelines ─────────────────────────────────────────

export interface CounselorDoc {
  id: string;
  name: string | null;
  address: string;
  type: string | null;
  createdAt: string;
  leadId: string | null;
}

export interface CounselorRemark {
  id: string;
  title: string | null;
  message: string;
  type: string;
  createdAt: string;
  leadId: string | null;
}

export interface CounselorLeadTimeline {
  id: string;
  leadId: string;
  description: string;
  nextFollowup: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CounselorStudentTimeline {
  id: string;
  studentId: string;
  type: string;
  title: string;
  description: string | null;
  followupDate: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface CounselorAdminLead {
  id: string;
  studentName: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  branch: { id: string; name: string } | null;
  counselor: { id: string; name: string } | null;
}

// ─── unified paginated row ──────────────────────────────────────────────

export type CounselorRecordType = "lead" | "student";

export interface CounselorReportRow {
  recordType: CounselorRecordType;
  recordId: string;
  assignmentType?: "primary" | "joined";
  studentNumber?: string | null;
  studentName: string;
  email: string | null;
  phone: string | null;
  branchName: string;
  source: string;
  country: string;
  status: string;
  stage: string | null;
  latestUniversity?: string | null;
  latestApplicationStatus?: string | null;
  applicationsCount?: number;
  visaStatus?: string;
  loanStatus?: string | null;
  createdAt: string;
}

export interface CounselorReportPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── full response payload ──────────────────────────────────────────────

export interface CounselorReportData {
  profile: CounselorProfile;
  summary: CounselorReportSummary;
  monthlyActivity: MonthlyActivityPoint[];
  branchPerformance: BranchPerformancePoint[];
  statusBreakdowns: CounselorStatusBreakdowns;

  leads: {
    primary: CounselorLeadRecord[];
    joinedViaTeam: CounselorLeadRecord[];
  };
  students: CounselorStudentRecord[];
  studentCourses: (CounselorStudentCourse & { leadId: string | null })[];
  visaDetails: (CounselorVisaDetail & { leadId: string | null })[];
  loanInquiries: CounselorLoanInquiry[];
  docs: CounselorDoc[];
  remarks: CounselorRemark[];
  leadTimelines: {
    created: CounselorLeadTimeline[];
    updatedOnly: CounselorLeadTimeline[];
  };
  studentTimelines: CounselorStudentTimeline[];
  adminActivity: {
    leadsCreated: CounselorAdminLead[];
    leadsUpdated: CounselorAdminLead[];
  };

  rows: CounselorReportRow[];
  pagination: CounselorReportPagination;

  appliedFilters: {
    datePreset: DatePreset;
    startDate: string | null;
    endDate: string | null;
    branchId: string | null;
  };
}

export interface CounselorReportResponse {
  success: boolean;
  data?: CounselorReportData;
  error?: string;
}

// ─── /api/auth/me ─────────────────────────────────────────────────────────

export interface AuthMeUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: {
    id: string;
    name: string;
  };
}

export interface AuthMeResponse {
  success: boolean;
  data?: AuthMeUser;
  user?: AuthMeUser; // some /auth/me implementations key it as `user` — handled defensively
  error?: string;
}