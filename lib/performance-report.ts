// types/performance-report.ts
//
// Shared types for /api/report/dashboard/performance.
// Every field here is a 1:1 mirror of what
// app/api/report/dashboard/performance/route.ts actually returns / accepts.
// Keep this file in sync with the route — it is the single source of
// truth for both PerformanceReportsPage.tsx and ReportFilterSheet.tsx.

// ─── filters (query params) ───────────────────────────────────────────────

export type ReportRecordScope = "all" | "leads" | "students";

export type ReportDatePreset =
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

export interface PerformanceReportFilters {
  recordScope: ReportRecordScope;
  datePreset: ReportDatePreset;
  startDate: string;
  endDate: string;
  search: string;
  branchId: string;
  counselorId: string;
  leadStatus: string;
  leadSource: string;
  countryId: string;
  intakeId: string;
  universityId: string;
  applicationStatus: string;
  casStatus: string;
  visaStatus: string;
  loanStatus: string;
  nbfc: string;
  fintechAssigneeId: string;
}

// ─── filter options (dropdown sources) ────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface BranchOption extends FilterOption {}

export interface CounselorOption extends FilterOption {
  branchIds: string[];
}

export interface CountryOption extends FilterOption {}

export interface UniversityOption extends FilterOption {
  countryId: string;
}

export interface IntakeOption extends FilterOption {}

export interface PerformanceReportFilterOptions {
  branches: BranchOption[];
  counselors: CounselorOption[];
  countries: CountryOption[];
  universities: UniversityOption[];
  intakes: IntakeOption[];
  // enum LeadStatus
  leadStatuses: string[];
  leadSources: string[];
  // enum StudentcoursesStatus
  applicationStatuses: string[];
  // enum CasStatus
  casStatuses: string[];
  // enum VisaStatus
  visaStatuses: string[];
  // enum LoanStatus
  loanStatuses: string[];
  // LoanInquiry.bank distinct values
  nbfcs: string[];
  // LoanInquiry.assignee distinct values
  fintechAssignees: FilterOption[];
}

// ─── summary cards ─────────────────────────────────────────────────────────

export interface PerformanceReportSummary {
  totalLeads: number; // = totalPipelineRecords (unconverted leads + students)
  qualifiedLeads: number;
  totalStudents: number;
  conversionRate: number; // %
  totalApplications: number;
  offerApplications: number;
  totalPipelineRecords: number;
  lostLeads: number;
  visaApprovedStudents: number;
  casReceivedStudents: number;
  totalSanctionedAmount: number;
  loanSanctionedStudents: number;
}

// ─── charts ─────────────────────────────────────────────────────────────

export interface MonthlyVolumePoint {
  key: string; // "2026-06"
  label: string; // "Jun 2026"
  leads: number;
  students: number;
  applications: number;
}

export interface CountryDemandPoint {
  country: string;
  leads: number;
  students: number;
  applications: number;
}

export interface LeadSourcePoint {
  source: string;
  total: number;
}

export interface StatusCountPoint {
  status: string;
  count: number;
}

export interface BranchPerformancePoint {
  branchId: string;
  branch: string;
  leads: number;
  students: number;
  applications: number;
  conversionRate: number;
  visaApproved: number;
  sanctionedAmount: number;
  disbursedAmount: number;
}

// ─── unified table row ─────────────────────────────────────────────────────

export type PerformanceRecordType = "lead" | "student";

export interface PerformanceReportRow {
  recordType: PerformanceRecordType;
  recordId: string;
  leadNumber: string | null; // always null — Lead model has no leadNumber field
  studentName: string;
  courseName: string;
  mobileNumber: string | null;
  emailId: string | null;
  branchName: string;
  counselorName: string;
  source: string;
  countryName: string;
  lifecycleStatus: string;
  currentStage: string | null;
  latestUniversityName: string;
  applicationsCount: number;
  latestApplicationStatus: string | null;
  visaStatus: string;
  loanStatus: string;
  createdAt: string; // ISO
  nextFollowup: string | null; // ISO
}

export interface PerformanceReportPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── full response payload ─────────────────────────────────────────────────

export interface PerformanceReportData {
  summary: PerformanceReportSummary;
  monthlyVolume: MonthlyVolumePoint[];
  countryDemand: CountryDemandPoint[];
  branchPerformance: BranchPerformancePoint[];
  leadSourceBreakdown: LeadSourcePoint[];
  leadStatusBreakdown: StatusCountPoint[];
  applicationStatusBreakdown: StatusCountPoint[];
  visaStatusBreakdown: StatusCountPoint[];
  rows: PerformanceReportRow[];
  pagination: PerformanceReportPagination;
  filterOptions: PerformanceReportFilterOptions;
}

export interface PerformanceReportResponse {
  success: boolean;
  data?: PerformanceReportData;
  error?: string;
}