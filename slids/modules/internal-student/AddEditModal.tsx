'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, FileEdit, RefreshCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── Enum mirrors ────────────────────────────────────────────────────────────

type StudentStatus =
  | 'active'
  | 'visa_process'
  | 'loan_process'
  | 'admitted'
  | 'enrolled'
  | 'completed'
  | 'dropped';

type Studentstage = 'GRADUATE' | 'PURSUING';

type StudentVisaStage =
  | 'LEAD_CREATED'
  | 'APPLICATION_SUBMITTED'
  | 'OFFER_RECEIVED'
  | 'DEPOSIT_PAID'
  | 'INTERVIEW_COMPLETED'
  | 'CAS_RECEIVED'
  | 'VISA_APPLIED'
  | 'VISA_APPROVED';

type EnglishWaiverType = 'NONE' | 'CLASS_12_ENGLISH' | 'MOI';

type ApplicationType = 'BACHELOR' | 'MASTER' | 'PHD';

// ─── Shape that maps 1:1 to the Student model fields we expose ───────────────

export interface Counselor {
  id: string;
  name: string;
  email: string;
}

export interface StudentFormData {
  id?: string;
  firstName: string;
  lastName:string;
  studentNumber?: string;
  counselorId?: string;
  counselor?: Counselor | null;
  studentName: string;
  phone?: string;
  email?: string;
  dob?: string;                    // ISO date string from <input type="date">
  preferredCountry?: string;
  preferredCourse?: string;
  intake?: string;
  status: StudentStatus;
  visaStage: StudentVisaStage;
  passport?: string;
  admissionDate?: string;          // ISO date string
  currentStage: Studentstage;
  englishWaiverType: EnglishWaiverType;
  applicationType: ApplicationType;
  immigrationPortalPassword?: string;
  depositDeadline?: string;        // ISO date string
  casDeadline?: string;
  universityStart?: string;
}

// ─── Static option lists ─────────────────────────────────────────────────────

const STUDENT_STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'visa_process', label: 'Visa Process' },
  { value: 'loan_process', label: 'Loan Process' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

const VISA_STAGE_OPTIONS: { value: StudentVisaStage; label: string }[] = [
  { value: 'LEAD_CREATED', label: 'Lead Created' },
  { value: 'APPLICATION_SUBMITTED', label: 'Application Submitted' },
  { value: 'OFFER_RECEIVED', label: 'Offer Received' },
  { value: 'DEPOSIT_PAID', label: 'Deposit Paid' },
  { value: 'INTERVIEW_COMPLETED', label: 'Interview Completed' },
  { value: 'CAS_RECEIVED', label: 'CAS Received' },
  { value: 'VISA_APPLIED', label: 'Visa Applied' },
  { value: 'VISA_APPROVED', label: 'Visa Approved' },
];

const ENGLISH_WAIVER_OPTIONS: { value: EnglishWaiverType; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'CLASS_12_ENGLISH', label: 'Class 12 English Marks' },
  { value: 'MOI', label: 'MOI Waiver Letter' },
];

const APPLICATION_TYPE_OPTIONS: { value: ApplicationType; label: string }[] = [
  { value: 'BACHELOR', label: 'Undergraduate – Bachelor' },
  { value: 'MASTER', label: 'Postgraduate – Master' },
  { value: 'PHD', label: 'Doctoral – PhD' },
];

const CURRENT_STAGE_OPTIONS: { value: Studentstage; label: string }[] = [
  { value: 'GRADUATE', label: 'Graduate' },
  { value: 'PURSUING', label: 'Pursuing' },
];

const COUNTRIES = [
  'United Kingdom', 'Australia', 'Canada', 'United States', 'Ireland',
  'Germany', 'New Zealand', 'France', 'Netherlands', 'Singapore',
];

const INTAKES = [
  'WINTER', 'FALL', 'SUMMER', 'SPRING'
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert "15-Jun-2026" or ISO string to yyyy-MM-dd for <input type="date"> */
function toInputDate(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return '';
}

function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
  let res = 'Pass';
  for (let i = 0; i < 4; i++) res += chars[Math.floor(Math.random() * chars.length)];
  return res + '@2026';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  studentToEdit?: StudentFormData | null;
  studentNames?: string;
  /** Called with the server-returned student on success */
  onSuccess?: (student: StudentFormData) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddEditModal({
  isOpen,
  onClose,
  isDarkMode = false,
  studentToEdit = null,
  studentNames,
  onSuccess,
}: AddEditModalProps) {
  const isEditing = Boolean(studentToEdit?.id);

  // ── form state ──
  const [studentName, setStudentName] = useState('');
  const [firstName, setFirstname]= useState('');
  const [lastName, setLastname]= useState('');
  const [counselorId, setCounselorId] = useState('');
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [preferredCountry, setPreferredCountry] = useState('United Kingdom');
  const [intake, setIntake] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [applicationType, setApplicationType] = useState<ApplicationType>('MASTER');
  const [passport, setPassport] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailId, setEmailId] = useState('');
  const [dob, setDob] = useState('');
  const [preferredCourse, setPreferredCourse] = useState('');
  const [immigrationPortalPassword, setImmigrationPortalPassword] = useState('');
  const [englishWaiverType, setEnglishWaiverType] = useState<EnglishWaiverType>('NONE');
  const [currentStage, setCurrentStage] = useState<Studentstage>('PURSUING');
  const [depositDeadline, setDepositDeadline] = useState('');
  const [casDeadline, setCasDeadline] = useState('');
  const [universityStart, setUniversityStart] = useState('');
  const [status, setStatus] = useState<StudentStatus>('active');
  const [visaStage, setVisaStage] = useState<StudentVisaStage>('APPLICATION_SUBMITTED');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [counselors, setCounselors] = useState<any[]>([]);

  const fetchCounsellor = async () => {
    try {
      const res = await fetch(`/api/users/counsellor`);
      if (!res.ok) {
        toast.error("Counsellor not found");
      }
      const data = await res.json();
      setCounselors(data.data || []);
    } catch (error: any) {
      toast.error("Failed to load counselors");
    }
  }

  // ── populate on open ──
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(false);
    fetchCounsellor();
    
    if (studentToEdit) {
      setFirstname(studentToEdit.firstName ?? '');
      setStudentName(studentToEdit.studentName ?? '');
      setLastname(studentToEdit.lastName ?? '');
      setCounselorId(studentToEdit.counselorId ?? '');
      setSelectedCounselor(studentToEdit.counselor?.id ?? '');
      setPreferredCountry(studentToEdit.preferredCountry ?? 'United Kingdom');
      setIntake(studentToEdit.intakeSeason ?? 'FALL');
      setAdmissionDate(toInputDate(studentToEdit.admissionDate));
      setApplicationType(studentToEdit.applicationType ?? 'MASTER');
      setPassport(studentToEdit.passport ?? '');
      setMobileNumber(studentToEdit.phone ?? '');
      setEmailId(studentToEdit.email ?? '');
      setDob(toInputDate(studentToEdit.dob));
      setPreferredCourse(studentToEdit.preferredCourse ?? '');
      setImmigrationPortalPassword(studentToEdit.immigrationPortalPassword ?? '');
      setEnglishWaiverType(studentToEdit.englishWaiverType ?? 'NONE');
      setCurrentStage(studentToEdit.currentStage ?? 'PURSUING');
      setDepositDeadline(toInputDate(studentToEdit.depositDeadline));
      setCasDeadline(toInputDate(studentToEdit.casDeadline));
      setUniversityStart(toInputDate(studentToEdit.universityStart));
      setStatus(studentToEdit.status ?? 'active');
      setVisaStage(studentToEdit.visaStage ?? 'APPLICATION_SUBMITTED');
    } else {
      setStudentName('');
      setCounselorId('');
      setPreferredCountry('United Kingdom');
      setIntake('Sep 2026');
      setAdmissionDate('');
      setApplicationType('MASTER');
      setPassport('');
      setMobileNumber('');
      setEmailId('');
      setDob('');
      setPreferredCourse('');
      setImmigrationPortalPassword(randomPassword());
      setEnglishWaiverType('NONE');
      setCurrentStage('PURSUING');
      setDepositDeadline('');
      setCasDeadline('');
      setUniversityStart('');
      setStatus('active');
      setVisaStage('APPLICATION_SUBMITTED');
    }
  }, [studentToEdit, isOpen]);

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    const payload: Partial<StudentFormData> = {
      firstName,
      lastName,
      studentName,
      counselorId: selectedCounselor || undefined,
      preferredCountry,
      intake,
      admissionDate: admissionDate || undefined,
      applicationType,
      passport: passport || undefined,
      phone: mobileNumber || undefined,
      email: emailId || undefined,
      dob: dob || undefined,
      preferredCourse: preferredCourse || undefined,
      immigrationPortalPassword: immigrationPortalPassword || undefined,
      englishWaiverType,
      currentStage,
      depositDeadline: depositDeadline || undefined,
      casDeadline: casDeadline || undefined,
      universityStart: universityStart || undefined,
      status,
      visaStage,
    };

    setLoading(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/student?id=${studentToEdit!.id}`
        : '/api/student';

      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Request failed: ${res.status}`);
      }

      const data: StudentFormData = await res.json();
      setSuccess(true);
      onSuccess?.(data);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ── shared input classes ──
  const input = `w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors ${isDarkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600'
    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
    }`;

  const select = `${input} appearance-none cursor-pointer`;

  const sectionLabel =
    'text-[10px] uppercase font-black text-slate-400 tracking-widest border-b pb-1 ' +
    (isDarkMode ? 'border-slate-800' : 'border-slate-200');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950 z-[80] backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '30%', opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '30%', opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 210 }}
            className={`fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-6 sm:w-[520px] z-[90] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${isDarkMode
              ? 'bg-slate-900 border-slate-800 text-slate-100'
              : 'bg-white border-slate-100 text-slate-800'
              }`}
          >
            {/* ── Header ── */}
            <div className={`p-5 flex items-center justify-between border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="bg-red-600/10 p-2 rounded-xl text-red-600">
                  {isEditing ? <FileEdit className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider leading-none">
                    {isEditing ? 'Edit Student Profile' : 'Register New Student'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isEditing
                      ? `Updating record · ${studentToEdit?.studentNumber ?? studentToEdit?.id?.slice(0, 8)}`
                      : 'Create a new overseas student file'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
              >
                <X className="h-4.5 w-4.5 text-slate-400" />
              </button>
            </div>

            {/* ── Scrollable form ── */}
            <div className="flex-1 overflow-y-auto p-5">
              <form id="student-form" onSubmit={handleSubmit} className="space-y-5 text-xs">

                {/* 1 · Basic Info */}
                <p className={sectionLabel}>Basic Information</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className='col-span-2 flex items-center justify-between'>
                    <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
                      Studebt Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="Legal name as on passport"
                      className={input}
                      required
                    />
                  </div>

                  {/* <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastname(e.target.value)}
                      placeholder="Legal name as on passport"
                      className={input}
                      required
                    />
                  </div> */}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">
                      Counselor
                    </label>

                    <select
                      value={selectedCounselor}
                      onChange={(e) =>
                        setSelectedCounselor(e.target.value)
                      }
                      className={input}
                    >
                      <option value="">
                        Select Counselor
                      </option>

                      {counselors.map((counselor) => (
                        <option
                          key={counselor.id}
                          value={counselor.id}
                        >
                          {counselor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Application Type</label>
                    <select value={applicationType} onChange={e => setApplicationType(e.target.value as ApplicationType)} className={select}>
                      {APPLICATION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Preferred Country</label>
                    <select value={preferredCountry} onChange={e => setPreferredCountry(e.target.value)} className={select}>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Target Intake</label>
                    <select value={intake} onChange={e => setIntake(e.target.value)} className={select}>
                      {INTAKES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Preferred Course</label>
                    <input
                      type="text"
                      value={preferredCourse}
                      onChange={e => setPreferredCourse(e.target.value)}
                      placeholder="e.g. MSc Data Science"
                      className={input}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Admission Date</label>
                    <input type="date" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} className={input} />
                  </div>
                </div>

                {/* 2 · Demographics & Credentials */}
                <p className={sectionLabel}>Demographics & Credentials</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Passport Number</label>
                    <input
                      type="text"
                      value={passport}
                      onChange={e => setPassport(e.target.value)}
                      placeholder="e.g. L9876543"
                      className={input}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Date of Birth</label>
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={input} />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Mobile Number</label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      className={input}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={emailId}
                      onChange={e => setEmailId(e.target.value)}
                      placeholder="student@example.com"
                      className={input}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">English Waiver Type</label>
                    <select value={englishWaiverType} onChange={e => setEnglishWaiverType(e.target.value as EnglishWaiverType)} className={select}>
                      {ENGLISH_WAIVER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Current Stage</label>
                    <select value={currentStage} onChange={e => setCurrentStage(e.target.value as Studentstage)} className={select}>
                      {CURRENT_STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Immigration Portal Password</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={immigrationPortalPassword}
                        onChange={e => setImmigrationPortalPassword(e.target.value)}
                        placeholder="Auto-generated secure password"
                        className={`${input} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setImmigrationPortalPassword(randomPassword())}
                        title="Regenerate password"
                        className={`p-2 rounded-xl border transition-colors text-slate-400 hover:text-red-600 ${isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3 · Timeline */}
                <p className={sectionLabel}>Key Dates</p>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Deposit Deadline</label>
                    <input type="date" value={depositDeadline} onChange={e => setDepositDeadline(e.target.value)} className={input} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">CAS Deadline</label>
                    <input type="date" value={casDeadline} onChange={e => setCasDeadline(e.target.value)} className={input} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">University Start</label>
                    <input type="date" value={universityStart} onChange={e => setUniversityStart(e.target.value)} className={input} />
                  </div>
                </div>

                {/* 4 · Status & Visa Stage */}
                <p className={sectionLabel}>Status & Visa Stage</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Student Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as StudentStatus)} className={select}>
                      {STUDENT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Visa Stage</label>
                    <select value={visaStage} onChange={e => setVisaStage(e.target.value as StudentVisaStage)} className={select}>
                      {VISA_STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2 text-red-600 dark:text-red-400 text-[11px] font-medium">
                    {error}
                  </div>
                )}

              </form>
            </div>

            {/* ── Footer ── */}
            <div className={`p-4 flex gap-3 border-t ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-extrabold transition-colors ${isDarkMode
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                  }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                form="student-form"
                disabled={loading || success}
                className={`flex-1 py-2.5 text-white text-xs font-black rounded-xl shadow-lg inline-flex items-center justify-center gap-1.5 uppercase tracking-wide transition-all ${success
                  ? 'bg-emerald-600 shadow-emerald-600/20'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  } disabled:opacity-60`}
              >
                {loading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                ) : success ? (
                  <>✓ Saved</>
                ) : (
                  <><Save className="h-3.5 w-3.5" /> {isEditing ? 'Update Student' : 'Create Student'}</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}