'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  X,
  Trash2,
  Pencil,
  AlertTriangle,
  Loader2,
  Mail,
  MapPin,
  GraduationCap,
  Plane,
} from 'lucide-react';
import {
  StudentTable,
  Student,
  StudentStatus,
} from '@/slids/modules/student/StudentTable';

interface ApiResponse {
  success: boolean;
  data: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]; // adjust to match the real StudentStatus enum values in your schema

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                              */
/* -------------------------------------------------------------------------- */

const STATUS_BADGE_CLASS: Record<string, string> = {
  active:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  inactive:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
};

function StatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border capitalize ${
        STATUS_BADGE_CLASS[status ?? ''] || STATUS_BADGE_CLASS.inactive
      }`}
    >
      {status || 'unknown'}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const isEmpty = value === undefined || value === null || value === '';
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words">
        {isEmpty ? <span className="text-slate-400">—</span> : value}
      </span>
    </div>
  );
}

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-5 pb-1 first:pt-0">
      <Icon className="h-3.5 w-3.5 text-red-500" />
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>
    </div>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/* -------------------------------------------------------------------------- */
/*  Detail sidebar (slide-in panel shown on row select)                     */
/* -------------------------------------------------------------------------- */

function StudentDetailSidebar({
  student,
  onClose,
  onEdit,
  onDelete,
}: {
  student: Student | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}) {
  const open = !!student;
  const lead = student?.lead as any; // Lead type only has `id` typed; real payload has many more fields

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Student details"
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {student && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-800 dark:text-slate-100 truncate">
                    {student.studentName}
                  </h2>
                  <StatusBadge status={student.status} />
                </div>
                <p className="text-[11px] text-slate-400 font-mono font-bold mt-0.5">
                  {student.studentNumber || 'No student ID assigned'}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-1">
              <SectionHeading icon={Mail} label="Contact" />
              <DetailRow label="Email" value={student.emailId} />
              <DetailRow label="Mobile" value={student.mobileNumber} />
              <DetailRow label="Date of birth" value={formatDate(student.dob)} />

              <SectionHeading icon={MapPin} label="Assignment" />
              <DetailRow label="Branch" value={student.branch?.name} />
              <DetailRow
                label="Branch location"
                value={
                  student.branch
                    ? `${(student.branch as any).city ?? ''}${
                        (student.branch as any).state ? ', ' + (student.branch as any).state : ''
                      }`.trim()
                    : undefined
                }
              />
              <DetailRow label="Counselor" value={student.counselor?.name ?? 'Unassigned'} />

              {lead && (
                <>
                  <SectionHeading icon={GraduationCap} label="Academic profile" />
                  <DetailRow label="Qualification" value={lead.qualification} />
                  <DetailRow label="Percentage" value={lead.percentage ? `${lead.percentage}%` : undefined} />
                  <DetailRow label="Passing year" value={lead.passingYear} />
                  <DetailRow label="Preferred course" value={lead.preferredCourse} />
                  <DetailRow label="Preferred country" value={lead.preferredCountry} />
                  <DetailRow
                    label="Test scores"
                    value={
                      [
                        lead.ieltsScore ? `IELTS ${lead.ieltsScore}` : null,
                        lead.pteScore ? `PTE ${lead.pteScore}` : null,
                        lead.toeflScore ? `TOEFL ${lead.toeflScore}` : null,
                        lead.duolingoScore ? `Duolingo ${lead.duolingoScore}` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ') || undefined
                    }
                  />

                  <SectionHeading icon={Plane} label="Visa & intake pipeline" />
                  <DetailRow
                    label="Application type"
                    value={lead.applicationType?.replace(/_/g, ' ')}
                  />
                  <DetailRow label="Current stage" value={lead.currentStage?.replace(/_/g, ' ')} />
                  <DetailRow label="Visa stage" value={lead.visaStage?.replace(/_/g, ' ')} />
                  <DetailRow
                    label="Intake"
                    value={
                      lead.intakeSeason && lead.intakeYear
                        ? `${lead.intakeSeason} ${lead.intakeYear}`
                        : undefined
                    }
                  />
                  <DetailRow label="Budget" value={lead.budget ? `₹${lead.budget}` : undefined} />
                  <DetailRow label="Source" value={lead.source} />
                  <DetailRow label="Notes" value={lead.notes} />
                </>
              )}

              <SectionHeading icon={GraduationCap} label="Applications" />
              <DetailRow
                label="Total applications"
                value={student.applications?.length || 0}
              />

              <SectionHeading icon={MapPin} label="Record info" />
              <DetailRow label="Created" value={formatDate(student.createdAt)} />
              <DetailRow label="Last updated" value={formatDate(student.updatedAt)} />
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onEdit(student)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => onDelete(student.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom delete confirmation modal                                         */
/* -------------------------------------------------------------------------- */

function DeleteConfirmModal({
  student,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  student: Student | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={!isDeleting ? onCancel : undefined}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm delete"
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6"
      >
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950/40 mb-4">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
          Delete this student?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {student.studentName}
          </span>{' '}
          will be permanently removed, including their application history. This action cannot be
          undone.
        </p>

        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Custom edit modal (prefilled, posts to /api/student/edit)               */
/* -------------------------------------------------------------------------- */

interface EditFormState {
  studentName: string;
  emailId: string;
  mobileNumber: string;
  dob: string; // yyyy-mm-dd for <input type="date">
  status: StudentStatus;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function EditStudentModal({
  student,
  onClose,
  onSaved,
}: {
  student: Student | null;
  onClose: () => void;
  onSaved: (updated: Student) => void;
}) {
  const [form, setForm] = useState<EditFormState>({
    studentName: '',
    emailId: '',
    mobileNumber: '',
    dob: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill whenever a new student is opened for editing
  useEffect(() => {
    if (student) {
      setForm({
        studentName: student.studentName ?? '',
        emailId: student.emailId ?? '',
        mobileNumber: student.mobileNumber ?? '',
        dob: toDateInputValue(student.dob),
        status: student.status,
      });
      setError(null);
    }
  }, [student]);

  if (!student) return null;

  const update = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      
      const res = await fetch('/api/student/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          studentName: form.studentName,
          emailId: form.emailId,
          mobileNumber: form.mobileNumber,
          dob: form.dob ? new Date(form.dob).toISOString() : null,
          status: form.status,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update student.');
      }
      onSaved(json.data ?? { ...student, ...form });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={!saving ? onClose : undefined}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit student"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Edit student
            </h3>
            <p className="text-[11px] text-slate-400 font-mono font-bold">
              {student.studentNumber || student.id.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={!saving ? onClose : undefined}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <Field label="Full name">
            <input
              value={form.studentName}
              onChange={(e) => update('studentName', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.emailId}
              onChange={(e) => update('emailId', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </Field>

          <Field label="Mobile">
            <input
              value={form.mobileNumber}
              onChange={(e) => update('mobileNumber', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </Field>

          <Field label="Date of birth">
            <input
              type="date"
              value={form.dob}
              onChange={(e) => update('dob', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value as StudentStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Branch, counselor, and lead/visa pipeline fields aren't editable here — manage those
            from the Leads module.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={!saving ? onClose : undefined}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                     */
/* -------------------------------------------------------------------------- */

export default function StudentDataPage({ isDarkMode = false }: { isDarkMode?: boolean }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Selection / modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input -> search query param
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/student/studentsection?${params.toString()}`, {
        cache: 'no-store',
      });
      const json: ApiResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch students.');
      }

      setStudents(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStudents([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Row select -> open detail sidebar
  const handleSelectStudent = (id: string) => {
    const found = students.find((s) => s.id === id) ?? null;
    setSelectedStudent(found);
  };

  // Edit button (from table or from sidebar) -> open prefilled edit modal
  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
  };

  // Delete button (from table or from sidebar) -> open custom confirm modal
  const handleDeleteStudent = (id: string) => {
    setStudentToDeleteId(id);
  };

  const studentToDelete = students.find((s) => s.id === studentToDeleteId) ?? null;

  const confirmDelete = async () => {
    if (!studentToDeleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/student?id=${studentToDeleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete student.');
      }
      setSelectedStudent((cur) => (cur && cur.id === studentToDeleteId ? null : cur));
      setStudentToDeleteId(null);
      fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete student.');
      setStudentToDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaved = (updated: Student) => {
    setStudentToEdit(null);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
    setSelectedStudent((cur) => (cur && cur.id === updated.id ? { ...cur, ...updated } : cur));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, mobile, or student ID..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 text-sm font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-sm text-slate-400 font-bold">Loading students…</div>
      ) : (
        <StudentTable
          students={students}
          isDarkMode={isDarkMode}
          pagination={pagination ?? undefined}
          onPageChange={setPage}
          onSelectStudent={handleSelectStudent}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      )}

      {/* Detail sidebar */}
      <StudentDetailSidebar
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />

      {/* Custom delete confirmation */}
      <DeleteConfirmModal
        student={studentToDelete}
        isDeleting={isDeleting}
        onCancel={() => setStudentToDeleteId(null)}
        onConfirm={confirmDelete}
      />

      {/* Custom edit modal */}
      <EditStudentModal
        student={studentToEdit}
        onClose={() => setStudentToEdit(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}