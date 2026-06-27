'use client';

import React, { useState } from 'react';
import { Eye, Edit, Trash2, Grid, List, Mail, Phone } from 'lucide-react';

// ---- Types matching the ACTUAL Prisma schema (active fields only) ----

export type StudentStatus = 'active' | 'inactive'; // adjust to match your real StudentStatus enum values

export interface Branch {
  id: string;
  name: string;
}

export interface Counselor {
  id: string;
  name: string;
}

export interface Lead {
  id: string;
  // add real Lead fields you want surfaced here, e.g. source, status
}

export interface Application {
  id: string;
  status?: string;
  university?: string;
  course?: string;
  applicationDate?: string;
  portal?: string;
}

export interface Student {
  id: string;
  studentNumber: string | null;
  leadId: string | null;
  lead: Lead | null;
  branchId: string;
  branch: Branch;
  counselorId: string | null;
  counselor: Counselor | null;
  studentName: string;
  mobileNumber: string | null;
  emailId: string | null;
  dob: string | null;
  status: StudentStatus;
  applications: Application[];
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StudentTableProps {
  students: Student[];
  isDarkMode: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  onSelectStudent: (id: string) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  active:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  inactive:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
};

function formatDate(value: string | null): string {
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

export function StudentTable({
  students,
  isDarkMode,
  pagination,
  onPageChange,
  onSelectStudent,
  onEditStudent,
  onDeleteStudent,
}: StudentTableProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const thBgClass = isDarkMode
    ? 'bg-slate-950 border-slate-800 text-slate-400'
    : 'bg-slate-100 border-slate-200 text-slate-500';

  return (
    <div className="space-y-4" id="student-module-master-table">
      {/* View Switcher Controls */}
      <div className="flex items-center justify-between gap-4 pb-2 select-none">
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
          Layout Perspective
        </span>

        <div className="p-1 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-1">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Table Grid</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Card Grid</span>
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-auto max-h-[70vh] rounded-3xl border border-slate-200/85 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm relative">
          <table className="w-full text-left text-xs border-collapse relative">
            <thead className="text-[10px] uppercase font-black tracking-wider border-b whitespace-nowrap select-none sticky top-0 z-30">
              <tr>
                <th className={`px-3 py-3 text-center sticky top-0 left-0 z-[40] border-r w-12 ${thBgClass}`}>SNO</th>
                <th className={`px-3 py-3 sticky top-0 left-12 z-[40] border-r w-28 ${thBgClass}`}>STUD ID</th>
                <th className={`px-4 py-3 sticky top-0 left-40 z-[40] border-r w-44 min-w-[170px] ${thBgClass}`}>STUDENT NAME</th>
                <th className={`px-4 py-3 ${thBgClass}`}>BRANCH</th>
                <th className={`px-4 py-3 ${thBgClass}`}>COUNSELOR</th>
                <th className={`px-4 py-3 ${thBgClass}`}>MOBILE NUMBER</th>
                <th className={`px-4 py-3 ${thBgClass}`}>EMAIL ID</th>
                <th className={`px-4 py-3 ${thBgClass}`}>DOB</th>
                <th className={`px-4 py-3 text-center ${thBgClass}`}>STATUS</th>
                <th className={`px-4 py-3 text-center ${thBgClass}`}>APPLICATIONS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>CREATED AT</th>
                <th className={`px-5 py-3 text-right sticky top-0 right-0 z-[40] border-l ${thBgClass}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 whitespace-nowrap">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-xs text-slate-400 font-bold bg-white dark:bg-slate-900">
                    No registered students found.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const rowNumber = pagination
                    ? (pagination.page - 1) * pagination.limit + idx + 1
                    : idx + 1;

                  return (
                    <tr
                      key={student.id}
                      className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors"
                    >
                      <td className="px-3 py-3.5 font-bold font-mono text-center text-slate-400 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-12">
                        {rowNumber}
                      </td>

                      <td className="px-3 py-3.5 font-mono text-[11px] font-black tracking-wider text-slate-500 bg-white dark:bg-slate-900 sticky left-12 z-10 border-r border-slate-200 dark:border-slate-800 w-28">
                        {student.studentNumber || '—'}
                      </td>

                      <td
                        className="px-4 py-3.5 font-extrabold text-black dark:text-white hover:underline cursor-pointer sticky left-40 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 truncate w-44 min-w-[170px]"
                        onClick={() => onSelectStudent(student.id)}
                      >
                        {student.studentName}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        {student.branch?.name || '—'}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        {student.counselor?.name || 'Unassigned'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {student.mobileNumber || '—'}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                        {student.emailId || '—'}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                        {formatDate(student.dob)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border capitalize ${
                            STATUS_BADGE_CLASS[student.status] || STATUS_BADGE_CLASS.inactive
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-600 dark:text-slate-300">
                        {student.applications?.length || 0}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">
                        {formatDate(student.createdAt)}
                      </td>

                      <td className="px-5 py-3.5 text-right sticky right-0 z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            onClick={() => onSelectStudent(student.id)}
                            className="bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide inline-flex items-center gap-0.5 transition-colors"
                            title="View student"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => onEditStudent(student)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg text-[10px] font-black inline-flex items-center gap-0.5 transition-colors"
                            title="Edit student"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => onDeleteStudent(student.id)}
                            className="bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 px-2 py-1.5 rounded-lg text-[10px] font-black transition-colors"
                            title="Delete student"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="student-grid-card-view">
          {students.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 border rounded-3xl p-6">
              <p className="text-xs text-slate-400 font-bold">No registered students found.</p>
            </div>
          ) : (
            students.map((student, idx) => {
              const rowNumber = pagination
                ? (pagination.page - 1) * pagination.limit + idx + 1
                : idx + 1;

              return (
                <div
                  key={student.id}
                  className="rounded-3xl border p-5 relative flex flex-col justify-between transition-all duration-300 hover:shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-red-600/10 text-red-600 px-2.5 py-0.5 rounded-lg font-black font-mono">
                          #{rowNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-black tracking-wider">
                          {student.studentNumber || '—'}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-lg font-bold border capitalize ${
                          STATUS_BADGE_CLASS[student.status] || STATUS_BADGE_CLASS.inactive
                        }`}
                      >
                        {student.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4
                        onClick={() => onSelectStudent(student.id)}
                        className="text-base font-black text-black dark:text-white hover:text-red-600 dark:hover:text-red-400 hover:underline cursor-pointer transition-colors leading-tight"
                      >
                        {student.studentName}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] text-slate-400 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">
                          Branch: {student.branch?.name || '—'}
                        </span>
                        <span className="text-slate-200 dark:text-slate-800">•</span>
                        <span>Counselor: {student.counselor?.name || 'Unassigned'}</span>
                      </div>

                      <div className="mt-2.5 space-y-1 border-t border-dashed border-slate-100 dark:border-slate-800/80 pt-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{student.emailId || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{student.mobileNumber || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                        Applications
                      </span>
                      <span className="text-xs text-red-600 font-black font-mono">
                        {student.applications?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectStudent(student.id)}
                      className="flex-1 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white py-2 rounded-xl text-xs font-black tracking-wide inline-flex items-center justify-center gap-1 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => onEditStudent(student)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-xl text-xs font-bold transition-all"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteStudent(student.id)}
                      className="bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 p-2 rounded-xl text-xs font-bold transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-bold text-slate-400">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} students
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}