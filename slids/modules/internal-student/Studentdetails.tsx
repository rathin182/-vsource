'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  FileCheck2,
  BarChart3,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  ChevronRight,
  Filter,
  TrendingUp,
  Percent,
  DollarSign,
  User,
  MapPin,
  Calendar,
  GraduationCap,
  Check,
  Briefcase,
  Globe2,
  Trash2,
  Eye,
  FileSignature,
  SlidersHorizontal,
  FolderOpen,
  LayoutGrid,
  TableProperties,
  ArrowUpRight,
  ExternalLink,
  GripVertical,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

// Import our custom operational modules
import { FilterSidebar } from '@/slids/modules/internal-student/FilterSidebar';
import { DMSSection, DocumentItem } from '@/slids/modules/internal-student/DMSSection';
import { StudentTable, LocalStudent } from '@/slids/modules/internal-student/StudentTable';
import { KanbanBoard } from '@/slids/modules/internal-student/KanbanBoard';
import { AddEditModal } from '@/slids/modules/internal-student/AddEditModal';
import { initialStudents, recentActivities, Student, Application } from '@/slids/data/mockData';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StudentVisaStage } from "@/lib/generated/prisma/client";

const BANK_OPTIONS = [
  "Poonawalla",
  "Credila",
  "Avanse",
  "ICICI",
  "HDFC Credila",
  "SBI",
  "Axis Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Self Funding",
  "Other",
];

const STEPS: { label: string; value: StudentVisaStage; }[] = [
  {
    label: "Lead Created",
    value: "LEAD_CREATED",
  },
  {
    label: "Application Submitted",
    value: "APPLICATION_SUBMITTED",
  },
  {
    label: "Offer Received",
    value: "OFFER_RECEIVED",
  },
  {
    label: "Deposit Paid",
    value: "DEPOSIT_PAID",
  },
  {
    label: "Interview Completed",
    value: "INTERVIEW_COMPLETED",
  },
  {
    label: "CAS Received",
    value: "CAS_RECEIVED",
  },
  {
    label: "Visa Applied",
    value: "VISA_APPLIED",
  },
  {
    label: "Visa Approved",
    value: "VISA_APPROVED",
  },
];

// Admission parsed dates solver
const parseStudentAdmissionDate = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const day = parseInt(parts[0], 10);
  const year = parseInt(parts[2], 10);
  const mNames: Record<string, number> = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  };
  const month = mNames[parts[1].toLowerCase()] !== undefined ? mNames[parts[1].toLowerCase()] : 5;
  return new Date(year, month, day);
};

const isDateInFilter = (studentDateStr: string, filterType: string, customStart: string, customEnd: string): boolean => {
  if (filterType === 'All') return true;
  const studentDate = parseStudentAdmissionDate(studentDateStr);
  const sTime = studentDate.getTime();

  switch (filterType) {
    case 'Today': {
      const target = new Date(2026, 5, 15);
      return studentDate.getFullYear() === target.getFullYear() &&
        studentDate.getMonth() === target.getMonth() &&
        studentDate.getDate() === target.getDate();
    }
    case 'Yesterday': {
      const target = new Date(2026, 5, 14);
      return studentDate.getFullYear() === target.getFullYear() &&
        studentDate.getMonth() === target.getMonth() &&
        studentDate.getDate() === target.getDate();
    }
    case 'Last 7 Days': {
      const minDate = new Date(2026, 5, 9);
      const maxDate = new Date(2026, 5, 15, 23, 59, 59);
      return sTime >= minDate.getTime() && sTime <= maxDate.getTime();
    }
    case 'Last 30 Days': {
      const minDate = new Date(2026, 4, 16); // May 16, 2026
      const maxDate = new Date(2026, 5, 15, 23, 59, 59);
      return sTime >= minDate.getTime() && sTime <= maxDate.getTime();
    }
    case 'This Month': {
      return studentDate.getFullYear() === 2026 && studentDate.getMonth() === 5;
    }
    case 'Last Month': {
      return studentDate.getFullYear() === 2026 && studentDate.getMonth() === 4;
    }
    case 'This Quarter': {
      return studentDate.getFullYear() === 2026 && [3, 4, 5].includes(studentDate.getMonth());
    }
    case 'Last Quarter': {
      return studentDate.getFullYear() === 2026 && [0, 1, 2].includes(studentDate.getMonth());
    }
    case 'This Year': {
      return studentDate.getFullYear() === 2026;
    }
    case 'Custom Date': {
      if (!customStart) return true;
      const start = new Date(customStart);
      const end = customEnd ? new Date(customEnd) : new Date(2026, 5, 15);
      end.setHours(23, 59, 59, 999);
      return sTime >= start.getTime() && sTime <= end.getTime();
    }
    default:
      return true;
  }
};

type StudentCourses = {
  id: string;
  universityName: string;
  courseName: string;
  immigrationPortal: string;
  applicationDate: string;
  applicationStatus: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
};

export default function StudentData({ student, reloadStudent, }: any) {
  const Router = useRouter();
  // Backwards compatible initial state mapped with extra credentials & local documents
  const [students, setStudents] = useState<LocalStudent[]>(() => {
    return initialStudents.map((s, index) => {
      const firstNames = s.name.split(' ');
      const pName = firstNames[0] || 'Student';
      return {
        ...s,
        password: `Pass${pName}@2026`,
        twelfthEnglishMoi: index % 3 === 0 ? 'MOI Waiver Letter' : index % 3 === 1 ? '82% in XII English' : '88% in XII English',
        documents: [
          {
            id: `doc-${s.id}-1`,
            category: 'Passport',
            name: `${pName}_Passport_Full.pdf`,
            fileType: 'pdf',
            uploadedAt: '12-May-2026',
            fileSize: '1.2 MB',
            content: `OFFICIAL PASSPORT RECORD\nRepublic of India\nPASSPORT REGISTRATION: ${s.passportNumber}\nFull Name: ${s.name}\nNationality: INDIAN\nSex: Male\nDate of Expiry: 14-Aug-2032`
          },
          {
            id: `doc-${s.id}-2`,
            category: '12th Marks Memo',
            name: `${pName}_12th_Transcript.pdf`,
            fileType: 'pdf',
            uploadedAt: '12-May-2026',
            fileSize: '780 KB',
            content: `COUNCIL FOR THE INDIAN SCHOOL CERTIFICATE EXAMINATIONS\nCandidate: ${s.name}\nEnglish: 85/100\nMathematics: 92/100\nPhysics: 89/100\nMOI Assessment: English Language Medium certified.`
          },
          {
            id: `doc-${s.id}-3`,
            category: 'Lears SOP',
            name: `${pName}_StatementOfPurpose.pdf`,
            fileType: 'pdf',
            uploadedAt: '14-May-2026',
            fileSize: '410 KB',
            content: `STATEMENT OF PURPOSE\nTo the Academic Registry,\nMy name is ${s.name}. I am writing to express my desire to pursue further studies in ${s.applications[0]?.course || 'Computer Science'} of ${s.applications[0]?.university || 'Target Institution'}.`
          }
        ]
      };
    });
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'students' | 'applications' | 'loans' | 'visas' | 'reports'>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(student.id || null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  // Detail page state variables
  const [detailTab, setDetailTab] = useState<'info' | 'documents' | 'applications' | 'finance' | 'visa' | 'remarks'>('info');

  // Search state
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Advanced Filters State Management
  const [filterCounsellor, setFilterCounsellor] = useState<string>('All');
  const [filterIntake, setFilterIntake] = useState<string>('All');
  const [filterCountry, setFilterCountry] = useState<string>('All');
  const [filterVisaStatus, setFilterVisaStatus] = useState<string>('All');
  const [filterLoanStatus, setFilterLoanStatus] = useState<string>('All');
  const [filterCasStatus, setFilterCasStatus] = useState<string>('All');
  const [filterNbfc, setFilterNbfc] = useState<string>('All');
  const [filterFintechAssignee, setFilterFintechAssignee] = useState<string>('All');
  const [filterAppStatus, setFilterAppStatus] = useState<string>('All');
  const [filterUniversity, setFilterUniversity] = useState<string>('All');
  const [filterDateType, setFilterDateType] = useState<string>('All');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modals / Toggles
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState<boolean>(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState<boolean>(false);
  const [studentToEdit, setStudentToEdit] = useState<LocalStudent | null>(null);

  // Application sub-module (Tab 3) workflow states
  const [appLayout, setAppLayout] = useState<'cards' | 'table'>('cards');
  const [showAddAppForm, setShowAddAppForm] = useState<boolean>(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appPortal, setAppPortal] = useState<string>('GVOC');
  const [appDate, setAppDate] = useState<string>('15-Jun-2026');
  const [appUniversity, setAppUniversity] = useState<string>('');
  const [appCourse, setAppCourse] = useState<string>('');
  const [appIntake, setAppIntake] = useState<string>('Sep 2026');
  const [appStatus, setAppStatus] = useState<string>('Pending');
  const [isSavingApp, setIsSavingApp] = useState(false);
  const [remarkTitle, setRemarkTitle] = useState<string>('');
  const [remarkType, setRemarkType] = useState("NOTE");
  const [isRemarkLoading, setIsRemarkLoading] = useState(false);
  const [loanBank, setLoanBank] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanEmi, setLoanEmi] = useState("");
  const [loanStatus, setLoanStatus] = useState("PENDING");
  const [isLoanLoading, setIsLoanLoading] = useState(false);
  const [loanAssignee, setLoanAssignee] = useState("");
  const [stageModal, setStageModal] = useState(false);
  const [selectedStage, setSelectedStage] =
    useState<StudentVisaStage | null>(null);
  const [confirmationText, setConfirmationText] = useState("");


  // Notification Banner triggers
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    { id: 'n-1', text: 'New Visa SLA guidelines updated for UK VFS.', time: '10 mins ago', read: false },
    { id: 'n-2', text: 'Financial sanction pre-draft requested for Sandeep.', time: '1 hour ago', read: false },
    { id: 'n-3', text: 'CAS Issued for Student Prasad Panjugula!', time: '1 day ago', read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Add/Edit basic user remark state
  const [newRemarkText, setNewRemarkText] = useState<string>('');



  // Reset Filters wrapper
  const resetFilters = () => {
    setFilterCounsellor('All');
    setFilterIntake('All');
    setFilterCountry('All');
    setFilterVisaStatus('All');
    setFilterLoanStatus('All');
    setFilterCasStatus('All');
    setFilterNbfc('All');
    setFilterFintechAssignee('All');
    setFilterAppStatus('All');
    setFilterUniversity('All');
    setFilterDateType('All');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterCounsellor !== 'All') count++;
    if (filterCountry !== 'All') count++;
    if (filterIntake !== 'All') count++;
    if (filterVisaStatus !== 'All') count++;
    if (filterLoanStatus !== 'All') count++;
    if (filterCasStatus !== 'All') count++;
    if (filterNbfc !== 'All') count++;
    if (filterFintechAssignee !== 'All') count++;
    if (filterAppStatus !== 'All') count++;
    if (filterUniversity !== 'All') count++;
    if (filterDateType !== 'All') count++;
    return count;
  }, [
    filterCounsellor, filterCountry, filterIntake, filterVisaStatus, filterLoanStatus,
    filterCasStatus, filterNbfc, filterFintechAssignee, filterAppStatus, filterUniversity,
    filterDateType
  ]);

  // Unique list derivations from the live dataset for dropdown options
  const uniqueUniversities = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => s.applications.forEach(app => list.add(app.university)));
    return Array.from(list).filter(Boolean);
  }, [students]);

  const uniqueFintechAssignees = useMemo(() => {
    const list = new Set<string>();
    students.forEach(s => {
      if (s.loan.assignee) list.add(s.loan.assignee);
    });
    return Array.from(list).filter(Boolean);
  }, [students]);



  // Sorted & Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search matching criteria
      if (globalSearch.trim() !== '') {
        const q = globalSearch.toLowerCase();
        const matchesSearch = student.name.toLowerCase().includes(q) ||
          student.counsellor.toLowerCase().includes(q) ||
          student.passportNumber.toLowerCase().includes(q) ||
          student.email.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (filterCounsellor !== 'All' && student.counsellor !== filterCounsellor) return false;
      if (filterIntake !== 'All' && student.intake !== filterIntake) return false;
      if (filterCountry !== 'All' && student.country !== filterCountry) return false;
      if (filterVisaStatus !== 'All' && student.visaDetails.visaStatus !== filterVisaStatus) return false;
      if (filterLoanStatus !== 'All' && student.loan.status !== filterLoanStatus) return false;
      if (filterCasStatus !== 'All' && student.visaDetails.casStatus !== filterCasStatus) return false;
      if (filterNbfc !== 'All' && student.loan.nbfc !== filterNbfc) return false;
      if (filterFintechAssignee !== 'All' && student.loan.assignee !== filterFintechAssignee) return false;

      if (filterAppStatus !== 'All') {
        const hasMatchingApp = student.applications.some(app => app.status === filterAppStatus);
        if (!hasMatchingApp) return false;
      }

      if (filterUniversity !== 'All') {
        const hasMatchingUni = student.applications.some(app => app.university === filterUniversity);
        if (!hasMatchingUni) return false;
      }

      if (!isDateInFilter(student.admissionDate, filterDateType, customStartDate, customEndDate)) return false;

      return true;
    });
  }, [
    students, globalSearch, filterCounsellor, filterIntake, filterCountry, filterVisaStatus, filterLoanStatus,
    filterCasStatus, filterNbfc, filterFintechAssignee, filterAppStatus, filterUniversity, filterDateType,
    customStartDate, customEndDate
  ]);

  // Target statistics strictly reactive to filters / specs
  const stats = useMemo(() => {
    const totalCount = filteredStudents.length;

    // Spec default alignment: Total count 15, applications 28, etc.
    const appsCount = filteredStudents.reduce((sum, s) => sum + s.applications.length, 0);

    // Offers Status matching conditionally acceptable
    const offersCount = filteredStudents.reduce((sum, s) => {
      const matchOffers = s.applications.filter(app =>
        ['Offer Received', 'Priority Offer Received', 'Conditional Offer', 'Unconditional Offer'].includes(app.status)
      );
      return sum + matchOffers.length;
    }, 0);

    // CAS Received (CAS status value is Received or CAS Received)
    const casCount = filteredStudents.filter(s =>
      ['Received', 'CAS Received'].includes(s.visaDetails.casStatus)
    ).length;

    // Visa Approved count
    const visaCount = filteredStudents.filter(s =>
      ['Approved', 'Visa Approved'].includes(s.visaDetails.visaStatus)
    ).length;

    // Loan Approved or Sanctioned cases
    const loansCount = filteredStudents.filter(s =>
      ['Sanctioned', 'Approved'].includes(s.loan.status)
    ).length;

    return {
      totalStudents: totalCount,
      applicationsSubmitted: appsCount,
      offersReceived: offersCount,
      casReceived: casCount,
      visaApproved: visaCount,
      loansSanctioned: loansCount
    };
  }, [filteredStudents]);

  // Dynamic visual charts aggregation helpers (SVG rendered)
  const chartsData = useMemo(() => {
    // Applications by intake cycle
    const intakes = { "Sep 2026": 0, "Jan 2026": 0, "May 2026": 0 };
    filteredStudents.forEach(s => {
      if (s.intake in intakes) intakes[s.intake] += s.applications.length;
    });

    // Visa Status Breakdown
    const visas = { "Visa Approved": 0, "Visa Applied": 0, "Visa Decision Pending": 0, "Visa Rejected": 0, "Draft Pending": 0 };
    filteredStudents.forEach(s => {
      const vs = s.visaDetails.visaStatus as string;
      if (vs === 'Visa Approved' || vs === 'Approved') {
        visas["Visa Approved"]++;
      } else if (vs === 'Visa Applied' || vs === 'Applied') {
        visas["Visa Applied"]++;
      } else if (vs === 'Visa Decision Pending' || vs === 'Decision Pending') {
        visas["Visa Decision Pending"]++;
      } else if (vs === 'Visa Rejected' || vs === 'Rejected') {
        visas["Visa Rejected"]++;
      } else {
        visas["Draft Pending"]++;
      }
    });

    // Top University applications list
    const unis: Record<string, number> = {};
    filteredStudents.forEach(s => s.applications.forEach(a => unis[a.university] = (unis[a.university] || 0) + 1));
    const sortedUnis = Object.entries(unis)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Loan status metrics
    const loans = { "Sanctioned": 0, "Approved": 0, "Pending": 0, "Rejected": 0 };
    filteredStudents.forEach(s => {
      const ls = s.loan.status;
      if (ls in loans) loans[ls]++;
    });

    // Countries metrics
    const countries: Record<string, number> = {};
    filteredStudents.forEach(s => countries[s.country] = (countries[s.country] || 0) + 1);

    // Counsellors metrics
    const counsellors: Record<string, number> = {};
    filteredStudents.forEach(s => counsellors[s.counsellor] = (counsellors[s.counsellor] || 0) + 1);

    return {
      intake: Object.entries(intakes).map(([name, value]) => ({ name, value })),
      visa: Object.entries(visas).map(([name, value]) => ({ name, value })),
      university: sortedUnis.map(([name, value]) => ({ name, value })),
      loan: Object.entries(loans).map(([name, value]) => ({ name, value })),
      country: Object.entries(countries).map(([name, value]) => ({ name, value })),
      counsellor: Object.entries(counsellors).map(([name, value]) => ({ name, value }))
    };
  }, [filteredStudents]);

  // Selected Student Object active state lookup
  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Handle student router selector

  const handleStageChange = async (step: StudentVisaStage) => {
    try {
      if (!student?.id) {
        return toast.error("Student not found.");
      }

      if (student.visaStage === step) {
        return toast.info(
          "Student is already in this stage."
        );
      }

      const response = await fetch(
        "/api/student/visa-stage",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: student.id,
            stage: step,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return toast.error(
          data.message || "Failed to update visa stage."
        );
      }

      toast.success(
        data.message || "Visa stage updated successfully."
      );

      setStageModal(false);
      setSelectedStage(null);
      setConfirmationText("");

      await reloadStudent();
    } catch (error: any) {
      console.error("Visa Stage Update Error:", error);

      toast.error(
        error.message || "Something went wrong."
      );
    }
  };

  // EDIT BASIC PROFILE WRAPPER
  const openEditModal = (student: LocalStudent) => {
    setStudentToEdit(student);
    setIsAddEditOpen(true);
  };

  const openAddModal = () => {
    setStudentToEdit(null);
    setIsAddEditOpen(true);
  };

  // DELETE CASE FILE
  const handleDeleteStudent = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this student's folders and case records? This is irreversible.")) {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudentId === id) {
        setSelectedStudentId(null);
      }
    }
  };

  // CHANGE STATUS SELECT FROM TABLE INLINE OR FROM TIMELINE (Wired with progress colors!)
  const handleTableStatusChange = (studentId: string, field: string, value: any) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const updated = { ...s };

        if (field === 'appStatus') {
          const apps = [...updated.applications];
          if (apps[0]) {
            apps[0] = { ...apps[0], status: value };
          }
          updated.applications = apps;
        }
        if (field === 'depositStatus') {
          updated.visaDetails = { ...updated.visaDetails, depositStatus: value };
        }
        if (field === 'ihsPayment') {
          updated.visaDetails = { ...updated.visaDetails, ihsPayment: value };
        }
        if (field === 'interviewStatus') {
          updated.visaDetails = { ...updated.visaDetails, interviewStatus: value };
        }
        if (field === 'casStatus') {
          updated.visaDetails = { ...updated.visaDetails, casStatus: value };
        }
        if (field === 'visaStatus') {
          updated.visaDetails = { ...updated.visaDetails, visaStatus: value };
          if (value === 'Visa Approved' || value === 'Approved') {
            updated.currentStage = 'Visa Approved';
          } else if (value === 'Visa Applied' || value === 'Applied') {
            updated.currentStage = 'Visa Applied';
          }
        }
        if (field === 'loanStatus') {
          updated.loan = { ...updated.loan, status: value };
        }
        if (field === 'pfStatus') {
          updated.loan = { ...updated.loan, pfStatus: value };
        }
        if (field === 'nbfc') {
          updated.loan = { ...updated.loan, nbfc: value };
        }
        return updated;
      }
      return s;
    }));
  };

  // SAVE EDIT/ADD PROFILE FORM SUBMIT COMMAND
  const handleSaveStudentPayload = (payload: Partial<LocalStudent>) => {
    if (studentToEdit) {
      // Updating
      setStudents(prev => prev.map(s => {
        if (s.id === studentToEdit.id) {
          const updated = {
            ...s,
            ...payload,
            loan: {
              ...s.loan,
              ...payload.loan
            },
            visaDetails: {
              ...s.visaDetails,
              ...payload.visaDetails
            }
          } as LocalStudent;

          // Sync currentStage to Visa Approved or Applied if visaStatus changes
          const vStat = updated.visaDetails?.visaStatus as any;
          if (vStat === 'Approved' || vStat === 'Visa Approved') {
            updated.currentStage = 'Visa Approved' as any;
          } else if (vStat === 'Applied' || vStat === 'Visa Applied') {
            updated.currentStage = 'Visa Applied' as any;
          }
          return updated;
        }
        return s;
      }));
    } else {
      // Appending new Student
      const nextId = (Math.max(...students.map(s => Number(s.id)), 0) + 1).toString();
      const pName = payload.name?.split(' ')[0] || 'Student';
      const newStudent: LocalStudent = {
        id: nextId,
        name: payload.name || 'New Student',
        counsellor: payload.counsellor || 'Prasad Panjugula',
        country: payload.country || 'United Kingdom',
        intake: payload.intake || 'Sep 2026',
        admissionDate: payload.admissionDate || '15-Jun-2026',
        applicationType: payload.applicationType || "Master's Degree",
        englishRequirement: payload.twelfthEnglishMoi || 'MOI Waiver Letter',
        passportNumber: payload.passportNumber || 'N/A',
        mobileNumber: payload.mobileNumber || 'N/A',
        email: payload.email || 'N/A',
        password: payload.password || `Pass${pName}@2026`,
        twelfthEnglishMoi: payload.twelfthEnglishMoi || 'MOI Waiver Letter',
        currentStage: ((payload.visaDetails?.visaStatus as any) === 'Approved' || (payload.visaDetails?.visaStatus as any) === 'Visa Approved') ? ('Visa Approved' as any) : ('Lead Created' as any),
        applications: [
          {
            id: `app-${nextId}-1`,
            portal: 'GVOC',
            university: 'Teesside University',
            course: 'MSc Data Science & AI',
            applicationDate: '15-Jun-2026',
            status: (payload.applications?.[0]?.status || 'Pending') as any
          }
        ],
        visaDetails: {
          depositStatus: payload.visaDetails?.depositStatus || 'Deposit Not Paid',
          ihsPayment: payload.visaDetails?.ihsPayment || 'Pending',
          interviewStatus: payload.visaDetails?.interviewStatus || 'Pending',
          casStatus: payload.visaDetails?.casStatus || 'CAS Not Applied',
          visaStatus: payload.visaDetails?.visaStatus || 'Draft Pending'
        } as any,
        loan: {
          assignee: payload.loan?.assignee || 'Sunil',
          nbfc: payload.loan?.nbfc || 'Credila',
          status: payload.loan?.status || 'Pending',
          pfStatus: payload.loan?.pfStatus || 'Pending',
          sanctionedAmount: payload.loan?.sanctionedAmount || '₹0',
          disbursedAmount: payload.loan?.disbursedAmount || '₹0'
        },
        remarks: [
          { date: '15-Jun-2026', note: 'Case file created in CRM under counsellor Prasad.' }
        ],
        documents: [
          {
            id: `doc-${nextId}-1`,
            category: 'Passport',
            name: `${pName}_Passport_2026.pdf`,
            fileType: 'pdf',
            uploadedAt: '15-Jun-2026',
            fileSize: '1.2 MB',
            content: `OFFICIAL PASSPORT\nHOLDER: ${payload.name}\nPASSPORT: ${payload.passportNumber}`
          }
        ]
      };

      setStudents(prev => [newStudent, ...prev]);
    }
  };

  // DMS DOCUMENT METADATA SYNCS
  const handleAddDocumentToStudent = (studentId: string, docPayload: Omit<DocumentItem, 'id'>) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const item: DocumentItem = {
          ...docPayload,
          id: `doc-${s.id}-${Date.now()}`
        };
        return {
          ...s,
          documents: [...s.documents, item]
        };
      }
      return s;
    }));
  };

  const handleDeleteDocumentFromStudent = (studentId: string, docId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          documents: s.documents.filter(d => d.id !== docId)
        };
      }
      return s;
    }));
  };

  const handleReplaceDocumentInStudent = (studentId: string, docId: string, updated: Partial<DocumentItem>) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          documents: s.documents.map(d => d.id === docId ? { ...d, ...updated } : d)
        };
      }
      return s;
    }));
  };

  // ADDS REMARK LOG LINE TO ACTIVE PORTFOLIO CHRONOLOGY
  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRemarkText.trim() || !student.id) { return; };

    try {
      setIsRemarkLoading(true);

      const payload = {
        title: remarkTitle,
        message: newRemarkText,
        type: remarkType,
      };

      const res = await fetch(
        `/api/student/remark?id=${student.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return toast.error(
          data.message || "Failed to add remark"
        );
      }

      toast.success("Remark added successfully");

      setRemarkTitle("");
      setNewRemarkText("");
      setRemarkType("NOTE");

      // Refresh latest student data
      await reloadStudent();
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setIsRemarkLoading(false);
    }
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student.id || !loanBank.trim() || !loanAmount || !loanEmi) {
      return toast.error("Please fill all required fields.");
    }

    try {
      setIsLoanLoading(true);

      const payload = {
        bank: loanBank,
        amount: Number(loanAmount),
        emi: Number(loanEmi),
        status: loanStatus,
        assignee: loanAssignee
      };

      const res = await fetch(
        `/api/student/loaninquiry?id=${student.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return toast.error(
          data.message || "Failed to save loan."
        );
      }

      toast.success("Loan inquiry added.");

      // Reset form
      setLoanBank("");
      setLoanAmount("");
      setLoanEmi("");
      setLoanStatus("PENDING");

      // Refresh student data
      await reloadStudent();
    } catch (error) {
      console.error(error);

      toast.error("Something went wrong.");
    } finally {
      setIsLoanLoading(false);
    }
  };

  // MULTIPLE UNIVERSITY APPLICATIONS WORKFLOW IMPLEMENTATION (TAB 3)
  const handleTriggerAddApp = () => {
    setEditingAppId(null);
    setAppPortal('Direct');
    setAppDate('15-Jun-2026');
    setAppUniversity('');
    setAppCourse('');
    setAppIntake('Sep 2026');
    setAppStatus('Pending');
    setShowAddAppForm(true);
  };

  const handleTriggerEditApp = (app: StudentCourses) => {
    setEditingAppId(app.id);

    setAppPortal(app.immigrationPortal);

    // For <input type="date" />
    setAppDate(
      new Date(app.applicationDate)
        .toISOString()
        .split("T")[0]
    );

    setAppUniversity(app.universityName);

    setAppCourse(app.courseName);

    // Remove if you don't have intake in StudentCourses
    setAppIntake("");

    setAppStatus(app.applicationStatus);

    setShowAddAppForm(true);
  };

  const handleSaveUniversityAppForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appUniversity.trim() || !appCourse.trim() || !student.id) return;

    try {
      setIsSavingApp(true);

      const payload = {
        portal: appPortal,
        applicationDate: appDate,
        university: appUniversity,
        course: appCourse,
        status: appStatus,
      };

      let response;

      // Edit existing application
      if (editingAppId) {
        response = await fetch(
          `/api/student/application?id=${editingAppId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      }

      // Create new application
      else {
        response = await fetch(
          `/api/student/application?id=${student.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message || "Failed to save application"
        );
        return;
      }

      toast.success(
        editingAppId
          ? "Application updated successfully"
          : "Application added successfully"
      );
      reloadStudent();
      // Reset form
      setShowAddAppForm(false);
      setEditingAppId(null);

      setAppPortal("");
      setAppDate("");
      setAppUniversity("");
      setAppCourse("");
      setAppStatus("DRAFT");

      // Optional: reload student data
      // fetchStudent();
      // router.refresh();

    } catch (error: any) {
      toast.error(
        error.message || "Something went wrong"
      );
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleDeleteUniversityApp = (appId: string) => {
    if (confirm("Are you sure you want to delete this university application entry?")) {
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudentId) {
          return {
            ...s,
            applications: s.applications.filter(app => app.id !== appId)
          };
        }
        return s;
      }));
    }
  };

  // SAVE TAB 4 FINANCIAL DETAILS FORM BACK TO IMMIGRATION FOLDER
  const handleSaveFinancesTab = (e: React.FormEvent, finPayload: any) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudentId) {
        return {
          ...s,
          loan: {
            ...s.loan,
            ...finPayload
          }
        };
      }
      return s;
    }));
    alert("Financial credit and NBFC parameters updated successfully!");
  };

  const confirmStageChange = async () => {
    if (!selectedStage) return;

    await handleStageChange(selectedStage);

    setStageModal(false);
    setSelectedStage(null);
    setConfirmationText("");
  };

  useEffect(() => {
    if (!student?.loanInquiries?.length) return;

    const loan = student.loanInquiries[0];

    setLoanAssignee(loan.assignee || "");
    setLoanBank(loan.bank || "");
    setLoanAmount(String(loan.amount || ""));
    setLoanEmi(String(loan.emi || ""));
    setLoanStatus(loan.status || "PENDING");
  }, [student]);

  const currentStage =
    student?.visaStage ?? "LEAD_CREATED";

  const activeIndex = STEPS.findIndex(
    step => step.value === currentStage
  );

  const currentIndex = STEPS.findIndex(
    step => step.value === student.visaStage
  );

  // UI tab definitions (Home-style horizontal pill tabs, mapped onto StudentData's own tab keys)
  const tabs = [
    { key: 'info', label: 'Basic Information', icon: User, color: 'text-red-500' },
    { key: 'documents', label: 'Documents', icon: FolderOpen, color: 'text-blue-500' },
    { key: 'applications', label: 'University Applications', icon: FileText, color: 'text-emerald-500' },
    { key: 'finance', label: 'Finance & Lending', icon: CreditCard, color: 'text-amber-500' },
    { key: 'visa', label: 'Visa Process', icon: FileCheck2, color: 'text-purple-500' },
    { key: 'remarks', label: 'Remarks', icon: FileSignature, color: 'text-rose-500' }
  ];

  const activeTabLabel = tabs.find(tab => tab.key === detailTab)?.label ?? 'Module';

  return (
    <div className={`flex min-h-screen bg-background text-foreground transition-colors duration-200`}>
      <div className="grow flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key="student-detail-profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => Router.push('/students')}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 hover:underline"
                  >
                    ← Back
                  </button>

                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {student.studentName ?? 'Unnamed Student'}
                    </h2>

                    <p className="text-xs text-slate-500">
                      Counselor:{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {student.counselor?.name ?? 'Not Assigned'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* VISUAL STEPPER TIMELINE AND COMPLIANCE INTEGRATION TRACKER (Interactive!) */}
              <div className={`p-6 rounded-3xl border shadow-md space-y-4 dark:bg-slate-900 dark:border-slate-805 bg-white border-slate-100`}>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block">Visa compliance pipeline stepper</span>
                  <span className="text-[9.5px] text-slate-400 font-medium">Click any node block to force trigger stage update</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 relative py-2">
                  {STEPS.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;
                    const isLocked = index < currentIndex;

                    return (
                      <button
                        key={step.value}
                        disabled={isLocked}
                        onClick={() => {
                          setSelectedStage(step.value);
                          setConfirmationText("");
                          setStageModal(true);
                        }}
                        className={`p-3 rounded-2xl text-center border text-xs font-bold transition-all flex flex-col justify-between h-[85px] overflow-hidden select-none
        ${isActive
                            ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/15"
                            : isCompleted
                              ? "bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                              : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-500"
                          }
        ${isLocked
                            ? "cursor-not-allowed opacity-70"
                            : "cursor-pointer hover:scale-[1.03]"
                          }
      `}
                      >
                        <span className="text-[10px] font-black font-mono self-start opacity-80">
                          0{index + 1}
                        </span>

                        <p className="text-[10px] tracking-tight uppercase leading-tight font-black text-left">
                          {step.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                {/* Horizontal Tabs */}
                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isSelected = detailTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setDetailTab(tab.key as any)}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold transition-all ${isSelected
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                            }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : tab.color}`} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`p-6 rounded-3xl border shadow-xl min-h-[500px] dark:bg-slate-900 dark:border-slate-800 bg-white border-slate-100`}
                >
                  {/* T1. INFORMATION PANEL */}
                  {detailTab === 'info' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b pb-3 border-inherit">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            Basic Information
                          </h4>
                          <p className="text-xs font-bold text-red-600">All fields are editable using basic edit option</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                          >
                            Edit Basic Info
                          </button>
                          {/* <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer"
                          >
                            Delete Record
                          </button> */}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Student Identification ID', val: `STU${100 + Number(student.id)}`, icon: User },
                          { label: 'Assigned Adviser/Counsellor', val: student.counselor?.name, icon: Briefcase },
                          { label: 'Admission Enrollment Date', val: new Date(student.createdAt).toLocaleDateString("en-IN"), icon: Calendar },
                          { label: 'Degree Track Program', val: student.preferredCourse, icon: GraduationCap },
                          { label: 'Passport Registration ID', val: student.passportNumber, icon: FileSignature },
                          { label: 'Admissions Mobile Number', val: student.mobileNumber, icon: Globe2 },
                          { label: 'Registered Email Address', val: student.emailId, icon: FileText },
                          { label: 'Target Country Location', val: student.preferredCountry, icon: MapPin },
                          { label: 'Target Intake Cycle', val: student.intake, icon: Calendar },
                          { label: 'XII English Score / Waiver Medium', val: student.twelfthEnglishMoi || 'MOI Waiver Letter', icon: FileCheck2 }
                        ].map((v, i) => {
                          const ItemIcon = v.icon;
                          return (
                            <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center gap-3 border border-slate-100 dark:border-slate-850">
                              <div className="p-2 bg-red-600/10 text-red-600 rounded-xl">
                                <ItemIcon className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-0.5">{v.label}</span>
                                <span className="text-xs font-extrabold text-slate-850 dark:text-slate-150">{v.val || 'Not provided'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* T2. DOCUMENT MANAGEMENT SYSTEM TAB */}
                  {detailTab === 'documents' && (
                    <div className="space-y-4">
                      <div className="pb-2 border-b border-inherit">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Documents</h4>
                        <p className="text-xs text-slate-400">Validate marksheet transcripts, visa stamps, or passport PDFs below.</p>
                      </div>

                      <DMSSection
                        studentId={student.id}
                        studentName={student.studentName}
                        documents={student.docs || []}
                        isDarkMode={isDarkMode}
                        reloadStudent={reloadStudent}
                        onAddDocument={(doc) => handleAddDocumentToStudent(student.id, doc)}
                        onDeleteDocument={(docId) => handleDeleteDocumentFromStudent(student.id, docId)}
                        onReplaceDocument={(docId, updated) => handleReplaceDocumentInStudent(student.id, docId, updated)}
                      />
                    </div>
                  )}

                  {/* T3. ADVANCED MULTIPLE APPLICATIONS TAB PANEL */}
                  {detailTab === 'applications' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-inherit">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">University Applications</h4>
                          <p className="text-xs text-slate-400">Manage multiple university files per applicant folder</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Layout selector toggle */}
                          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex gap-1">
                            <button
                              onClick={() => setAppLayout('cards')}
                              className={`p-1.5 rounded-lg text-xs ${appLayout === 'cards' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                              title="Render applications as Cards"
                            >
                              <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setAppLayout('table')}
                              className={`p-1.5 rounded-lg text-xs ${appLayout === 'table' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                              title="Render applications into a list table"
                            >
                              <TableProperties className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            onClick={handleTriggerAddApp}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4.5 py-2 rounded-xl inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="h-4.5 w-4.5" />
                            <span>Add New Course Program</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Add Form Dialog inside the Tab */}
                      {showAddAppForm && (
                        <form onSubmit={handleSaveUniversityAppForm} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 animate-fadeIn space-y-3">
                          <h5 className="font-extrabold text-xs uppercase tracking-wider text-red-600 mb-2">
                            {editingAppId ? 'Update University Application' : 'Register New University Target'}
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block">University Name</label>
                              <input
                                type="text"
                                value={appUniversity}
                                onChange={(e) => setAppUniversity(e.target.value)}
                                placeholder="e.g. University of Manchester"
                                className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block">Course Name</label>
                              <input
                                type="text"
                                value={appCourse}
                                onChange={(e) => setAppCourse(e.target.value)}
                                placeholder="e.g. MSc Advanced Computer Science"
                                className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block">Immigration Portal</label>
                              <input
                                type="text"
                                value={appPortal}
                                onChange={(e) => setAppPortal(e.target.value)}
                                placeholder="e.g. GVOC / Centurus / Direct"
                                className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block">
                                Application Date
                              </label>

                              <input
                                type="date"
                                value={appDate}
                                onChange={(e) => setAppDate(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block">Application Status</label>
                              <select
                                value={appStatus}
                                onChange={(e) => setAppStatus(e.target.value)}
                                className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                              >
                                {['Draft', 'Applied', 'Pending', 'Offer Received', 'Priority Offer Received', 'Conditional Offer', 'Unconditional Offer', 'Rejected', 'Deferred'].map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end justify-end gap-2 pt-5">
                              <button
                                type="button"
                                onClick={() => setShowAddAppForm(false)}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-850"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-black shadow"
                              >
                                Save Entry
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {student?.studentCourses?.length === 0 ? (
                        <p className="text-center py-12 text-slate-400">No registered university applications on file. Add one above.</p>
                      ) : appLayout === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student?.studentCourses?.map((app, i) => (
                            <div
                              key={app.id || i}
                              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-850 flex flex-col justify-between whitespace-normal"
                            >
                              <div>
                                <div className="flex justify-between items-center mb-3">
                                  <span className="bg-red-600 text-white font-black text-[8px] py-0.5 px-2 rounded-full font-mono uppercase tracking-widest">
                                    {app.immigrationPortal}
                                  </span>

                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-[9px] py-0.5 px-2 rounded-md">
                                    {app.applicationStatus.replaceAll("_", " ")}
                                  </span>
                                </div>

                                <h5 className="font-extrabold text-sm mb-1">
                                  {app.universityName}
                                </h5>

                                <p className="text-[11px] text-slate-400 font-medium mb-4">
                                  {app.courseName}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-805/50 text-[10px] text-slate-400">
                                <span>
                                  Date Filed:{" "}
                                  {new Date(app.applicationDate).toLocaleDateString(
                                    "en-IN"
                                  )}
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerEditApp(app)}
                                    className="text-red-600 hover:underline font-bold"
                                  >
                                    Edit
                                  </button>

                                  <span className="text-slate-300">|</span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteUniversityApp(app.id)
                                    }
                                    className="text-rose-500 hover:underline font-bold"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-850">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-950 text-[9px] uppercase font-black text-slate-400 tracking-wider">
                              <tr>
                                <th className="px-4 py-2.5">Portal</th>
                                <th className="px-4 py-2.5">University</th>
                                <th className="px-4 py-2.5">Course Program</th>
                                <th className="px-4 py-2.5">Date Applied</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5 text-right">
                                  Actions
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {student?.studentCourses?.map((app, i) => (
                                <tr
                                  key={app.id || i}
                                  className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850"
                                >
                                  <td className="px-4 py-3 font-mono font-bold text-red-600">
                                    {app.immigrationPortal}
                                  </td>

                                  <td className="px-4 py-3 font-bold">
                                    {app.universityName}
                                  </td>

                                  <td className="px-4 py-3 text-slate-500">
                                    {app.courseName}
                                  </td>

                                  <td className="px-4 py-3 text-slate-400">
                                    {new Date(
                                      app.applicationDate
                                    ).toLocaleDateString("en-IN")}
                                  </td>

                                  <td className="px-4 py-3">
                                    <span className="bg-slate-100 dark:bg-slate-850 text-[10px] font-black px-2 py-0.5 rounded">
                                      {app.applicationStatus.replaceAll(
                                        "_",
                                        " "
                                      )}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 text-right space-x-1.5">
                                    <button
                                      onClick={() =>
                                        handleTriggerEditApp(app)
                                      }
                                      className="text-red-600 font-bold"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleDeleteUniversityApp(app.id)
                                      }
                                      className="text-rose-500 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* T4. FINANCIAL CREDIT CONTROL PANEL */}
                  {detailTab === 'finance' && (
                    <div className="space-y-6">
                      <div className="pb-3 border-b border-inherit">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Finance & Lending</h4>
                        <p className="text-xs text-slate-400">Manage Lending NBFC credits, processing fee waivers, and sanctioned payouts.</p>
                      </div>
                      <form
                        onSubmit={handleSaveLoan}
                        className="space-y-4 text-xs"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-1.5 block">
                              Fintech Assignee Representative
                            </label>

                            <input
                              type="text"
                              value={loanAssignee}
                              onChange={(e) => setLoanAssignee(e.target.value)}
                              placeholder="John Smith"
                              className="w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-1.5 block">
                              Lending Partner / Bank
                            </label>

                            <select
                              value={loanBank}
                              onChange={(e) =>
                                setLoanBank(e.target.value)
                              }
                              className="w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                              required
                            >
                              <option value="">
                                Select Bank
                              </option>

                              {BANK_OPTIONS.map((bank) => (
                                <option
                                  key={bank}
                                  value={bank}
                                >
                                  {bank}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-1.5 block">
                              Loan Status
                            </label>

                            <select
                              value={loanStatus}
                              onChange={(e) =>
                                setLoanStatus(e.target.value)
                              }
                              className="w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                            >
                              <option value="PENDING">
                                Pending
                              </option>

                              <option value="APPROVED">
                                Approved
                              </option>

                              <option value="REJECTED">
                                Rejected
                              </option>

                              <option value="DISBURSED">
                                Disbursed
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-1.5 block">
                              Loan Amount
                            </label>

                            <input
                              type="number"
                              value={loanAmount}
                              onChange={(e) =>
                                setLoanAmount(e.target.value)
                              }
                              placeholder="1500000"
                              required
                              className="w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 mb-1.5 block">
                              EMI Amount
                            </label>

                            <input
                              type="number"
                              value={loanEmi}
                              onChange={(e) =>
                                setLoanEmi(e.target.value)
                              }
                              placeholder="25000"
                              required
                              className="w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-inherit flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoanLoading}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black px-6 py-2.5 rounded-xl uppercase tracking-wider shadow"
                          >
                            {isLoanLoading
                              ? "Saving..."
                              : "Save Loan"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* T5. VISA STATS MILESTONES PROGRESS TRACKER */}
                  {detailTab === 'visa' && (
                    <div className="space-y-6">
                      <div className="pb-3 border-b border-inherit">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Visa Process</h4>
                        <p className="text-xs text-slate-400">Alter key embassy timeline metrics. Changes refresh progress bars instantly.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1.5">Deposit Payment Status</label>
                          <select
                            value={student?.visaDetails?.depositStatus}
                            onChange={(e) => handleTableStatusChange(student.id, 'depositStatus', e.target.value)}
                            className={`w-full px-3.5 py-2 rounded-xl border dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                          >
                            {['Deposit Paid', 'Deposit Not Paid', 'Paid', 'Pending', 'Waived'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1.5">IHS Charge Status</label>
                          <select
                            value={student?.visaDetails?.ihsPayment}
                            onChange={(e) => handleTableStatusChange(student.id, 'ihsPayment', e.target.value)}
                            className={`w-full px-3.5 py-2 rounded-xl border dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                          >
                            {['Paid', 'Pending', 'Not Required'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1.5">Embassy Interview</label>
                          <select
                            value={student?.visaDetails?.interviewStatus}
                            onChange={(e) => handleTableStatusChange(student.id, 'interviewStatus', e.target.value)}
                            className={`w-full px-3.5 py-2 rounded-xl border dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                          >
                            {['Completed', 'Pending', 'Waived'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1.5">CAS Issue Status</label>
                          <select
                            value={student?.visaDetails?.casStatus}
                            onChange={(e) => handleTableStatusChange(student.id, 'casStatus', e.target.value)}
                            className={`w-full px-3.5 py-2 rounded-xl border dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                          >
                            {['CAS Received', 'CAS Under Review', 'CAS Not Applied', 'Received', 'Pending', 'Not Required'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[9px] uppercase font-bold text-slate-450 block mb-1.5">Official Visa Stamp Decision</label>
                          <select
                            value={student?.visaDetails?.visaStatus}
                            onChange={(e) => handleTableStatusChange(student.id, 'visaStatus', e.target.value)}
                            className={`w-full px-3.5 py-2 rounded-xl border dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200`}
                          >
                            {['Visa Approved', 'Visa Applied', 'Visa Decision Pending', 'Visa Rejected', 'Draft Pending', 'Approved', 'Applied', 'Decision Pending', 'Rejected'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="p-4 bg-emerald-500/10 border border-emerald-550/20 text-xs rounded-2xl flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">Embassy milestone fields saved back to case file. Dynamic pipeline is in sync.</p>
                      </div>
                    </div>
                  )}

                  {/* T6. CHRONOLOGICAL REMARKS HUB */}
                  {detailTab === "remarks" && (
                    <div className="space-y-6">
                      <div className="pb-3 border-b border-inherit">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                          Remarks
                        </h4>

                        <p className="text-xs text-slate-400 font-medium">
                          Record chronological logs or parent conversation summaries below.
                        </p>
                      </div>

                      <form
                        onSubmit={handleAddRemark}
                        className="space-y-3"
                      >
                        <input
                          type="text"
                          value={remarkTitle}
                          onChange={(e) => setRemarkTitle(e.target.value)}
                          placeholder="Remark title (optional)"
                          className="w-full px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                          <select
                            value={remarkType}
                            onChange={(e) => setRemarkType(e.target.value)}
                            className="px-3 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                          >
                            <option value="NOTE">Note</option>
                            <option value="CALL">Call</option>
                            <option value="MEETING">Meeting</option>
                            <option value="FOLLOW_UP">Follow Up</option>
                            <option value="WARNING">Warning</option>
                          </select>

                          <input
                            type="text"
                            value={newRemarkText}
                            onChange={(e) =>
                              setNewRemarkText(e.target.value)
                            }
                            placeholder="Type a new compliance note, advisory update..."
                            className="md:col-span-2 px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 dark:bg-[#020618] dark:border-[#020618] bg-white border-slate-200"
                            required
                          />

                          <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer"
                          >
                            Add Remark
                          </button>
                        </div>
                      </form>

                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3">
                        {student?.remarks?.length === 0 ? (
                          <p className="text-center py-10 text-slate-400 text-xs">
                            No remarks found.
                          </p>
                        ) : (
                          student?.remarks
                            ?.slice()
                            .reverse()
                            .map((rem: any) => (
                              <div
                                key={rem.id}
                                className="relative pl-6 border-l-2 border-red-600/30 pb-4 last:pb-0"
                              >
                                <span className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-red-600" />

                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-mono bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-500">
                                    {new Date(
                                      rem.createdAt
                                    ).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>

                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {rem.createdBy?.name ||
                                      "System"}
                                  </span>
                                </div>

                                {rem.title && (
                                  <h5 className="text-xs font-black text-slate-800 dark:text-white mb-1">
                                    {rem.title}
                                  </h5>
                                )}

                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {rem.message}
                                </p>

                                <div className="mt-2">
                                  <span className="inline-flex px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wide bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                    {rem.type}
                                  </span>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {stageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-red-500/30 p-6 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-black text-red-500">
                Compliance Confirmation
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                You are about to update the student's visa stage.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Current Stage
                </span>

                <span className="font-bold text-white">
                  {
                    STEPS.find(
                      s => s.value === student.visaStage
                    )?.label
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">
                  New Stage
                </span>

                <span className="font-bold text-red-400">
                  {
                    STEPS.find(
                      s => s.value === selectedStage
                    )?.label
                  }
                </span>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs uppercase font-black text-slate-400">
                Type CONFIRM to continue
              </label>

              <input
                value={confirmationText}
                onChange={(e) =>
                  setConfirmationText(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
                placeholder="CONFIRM"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setStageModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
              >
                Cancel
              </button>

              <button
                disabled={confirmationText !== "CONFIRM"}
                onClick={confirmStageChange}
                className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FLOATING FILTER SIDEBAR DRAWER PANEL (Fully Responsive!) */}
      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        isDarkMode={isDarkMode}
        filterCounsellor={filterCounsellor}
        setFilterCounsellor={setFilterCounsellor}
        filterCountry={filterCountry}
        setFilterCountry={setFilterCountry}
        filterIntake={filterIntake}
        setFilterIntake={setFilterIntake}
        filterVisaStatus={filterVisaStatus}
        setFilterVisaStatus={setFilterVisaStatus}
        filterLoanStatus={filterLoanStatus}
        setFilterLoanStatus={setFilterLoanStatus}
        filterCasStatus={filterCasStatus}
        setFilterCasStatus={setFilterCasStatus}
        filterNbfc={filterNbfc}
        setFilterNbfc={setFilterNbfc}
        filterFintechAssignee={filterFintechAssignee}
        setFilterFintechAssignee={setFilterFintechAssignee}
        filterAppStatus={filterAppStatus}
        setFilterAppStatus={setFilterAppStatus}
        filterUniversity={filterUniversity}
        setFilterUniversity={setFilterUniversity}
        filterDateType={filterDateType}
        setFilterDateType={setFilterDateType}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        resetAllFilters={resetFilters}
        activeFiltersCount={activeFiltersCount}
        uniqueUniversities={uniqueUniversities}
        uniqueFintechAssignees={uniqueFintechAssignees}
      />

      {/* 4. DRAWER DIALOG BOX FOR ADD & EDIT STUDENT FOLIO */}
      <AddEditModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        isDarkMode={isDarkMode}
        studentToEdit={student}
        onSave={handleSaveStudentPayload}
      />
    </div>
  );
}