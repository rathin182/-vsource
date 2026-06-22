'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Shield, ShieldOff, FileText, ChevronRight, Grid, List, Mail, Phone, Calendar } from 'lucide-react';
import { Student } from '@/slids/data/mockData';
import { DocumentItem } from './DMSSection';

export interface LocalStudent extends Student {
  password?: string;
  twelfthEnglishMoi?: string;
  pursuingGraduate?: 'Pursuing' | 'Graduate';
  depositDeadlineDate?: string;
  casDeadlineDate?: string;
  univStartDate?: string;
  documents: DocumentItem[];
}

interface StudentTableProps {
  students: LocalStudent[];
  isDarkMode: boolean;
  onSelectStudent: (id: string) => void;
  onEditStudent: (student: LocalStudent) => void;
  onDeleteStudent: (id: string) => void;
  onStatusChange: (id: string, field: string, value: any) => void;
}

export function StudentTable({
  students,
  isDarkMode,
  onSelectStudent,
  onEditStudent,
  onDeleteStudent,
  onStatusChange
}: StudentTableProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    // Detect mobile size on mount and set grid/card view by default if screen is small
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('grid');
      }
    };
    
    // Set initial view state depending on viewport width asynchronously to avoid synchronous effect updates
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        setViewMode('grid');
      }, 0);
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to calculate completions percentage
  const getProgressPercentage = (student: LocalStudent): number => {
    const stage = student.currentStage;
    switch (stage) {
      case 'Lead Created':
        return 12.5;
      case 'Application Submitted':
        return 25;
      case 'Offer Received':
        return 37.5;
      case 'Deposit Paid':
        return 50;
      case 'Interview Completed':
        return 62.5;
      case 'CAS Received':
        return 75;
      case 'Visa Applied':
        return 87.5;
      case 'Visa Approved':
        return 100;
      default: {
        const vStat = student.visaDetails?.visaStatus as string;
        if (vStat === 'Approved' || vStat === 'Visa Approved') return 100;
        if (vStat === 'Applied' || vStat === 'Visa Applied') return 87.5;
        const cas = student.visaDetails?.casStatus as string;
        if (cas === 'Received' || cas === 'CAS Received') return 75;
        const interview = student.visaDetails?.interviewStatus as string;
        if (interview === 'Completed') return 62.5;
        const dep = student.visaDetails?.depositStatus as string;
        if (dep === 'Paid' || dep === 'Deposit Paid') return 50;
        const app = student.applications?.[0]?.status;
        if (app && ['Offer Received', 'Priority Offer Received', 'Conditional Offer', 'Unconditional Offer'].includes(app)) return 37.5;
        if (app && ['Applied', 'Pending', 'Under Review'].includes(app)) return 25;
        return 12.5;
      }
    }
  };

  const togglePassword = (studentId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Student Progress Color Logic (Mandated by Prompt Guidelines)
  const getCellColorClass = (val: string) => {
    if (!val) return 'bg-white text-slate-800 border-slate-100 dark:bg-slate-900 dark:text-slate-205';
    const s = val.toLowerCase().trim();

    // GREEN (Deposit Paid, CAS Received, Visa Approved, Loan Sanctioned, Disbursed, Approved, Paid, Completed, Waived, Received)
    if ([
      'deposit paid', 'cas received', 'visa approved', 'loan sanctioned', 'disbursed',
      'approved', 'paid', 'completed', 'waived', 'received'
    ].includes(s) || s === 'disbursed' || s === 'sanctioned') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
    }

    // RED (Application Rejected, Student Dropped, Visa Rejected, File Closed, Rejected, Dropped, Cancelled, Hold, Paused, Deferred)
    if ([
      'application rejected', 'student dropped', 'visa rejected', 'file closed',
      'rejected', 'dropped', 'cancelled', 'hold', 'paused', 'deferred', 'student requested hold'
    ].includes(s)) {
      return 'bg-rose-150 text-rose-950 border-rose-250 dark:bg-rose-955/35 dark:text-rose-300 dark:border-rose-900';
    }

    // YELLOW (University Decision Pending, CAS Under Review, Visa Decision Pending, Applied, Under Review, Decision Pending, Intake Change, Waiting for Documents)
    if ([
      'university decision pending', 'cas under review', 'visa decision pending',
      'applied', 'under review', 'decision pending', 'pending', 'waiting for documents', 'intake change requested'
    ].includes(s) || (s.includes('pending') && !s.includes('not')) || s.includes('review')) {
      return 'bg-yellow-50 text-yellow-950 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800';
    }

    // WHITE (Application Not Submitted, CAS Not Applied, Deposit Not Paid, Draft, Draft Pending, Not Required, Not Applied)
    return 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800';
  };

  const getStudentColorThemeKey = (student: LocalStudent): 'red' | 'green' | 'yellow' | 'white' => {
    const stage = (student.currentStage || '').toLowerCase().trim();
    const visaStat = (student.visaDetails?.visaStatus || '').toLowerCase().trim();
    const loanStat = (student.loan?.status || '').toLowerCase().trim();
    const firstAppStat = (student.applications?.[0]?.status || '').toLowerCase().trim();
    
    const isRed = (s: string) => [
      'dropped', 'student dropped', 'rejected', 'visa rejected', 'file closed', 'cancelled', 'hold', 'drop'
    ].includes(s) || s === 'hold';
    
    const hasRejectedApp = student.applications?.some(app => (app.status || '').toLowerCase() === 'rejected');
    
    if (isRed(stage) || isRed(visaStat) || isRed(loanStat) || isRed(firstAppStat) || hasRejectedApp) {
      return 'red';
    }
    
    const isGreen = (s: string) => [
      'enrolled', 'visa approved', 'visa approved / enrolled', 'approved', 'disbursed', 'completed', 'paid', 'sanctioned'
    ].includes(s);
    
    if (stage === 'enrolled' || stage === 'visa approved' || isGreen(visaStat) || isGreen(stage)) {
      return 'green';
    }
    
    // For inquiry/documents check if files/documents are present -> makes it active "yellow" state
    if (stage === 'lead created' || stage === 'inquiry' || stage === 'documents') {
      if (student.documents && student.documents.length > 0) {
        return 'yellow';
      }
      return 'white';
    }
    
    return 'yellow';
  };

  const getCardBgColorClass = (student: LocalStudent) => {
    const colorTheme = getStudentColorThemeKey(student);
    switch (colorTheme) {
      case 'red':
        return isDarkMode
          ? 'bg-rose-950/25 border-rose-800 text-slate-100 hover:bg-rose-950/35 shadow-rose-950/5'
          : 'bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100/40 shadow-rose-200/10';
      case 'green':
        return isDarkMode
          ? 'bg-emerald-950/25 border-emerald-800 text-slate-100 hover:bg-emerald-950/35 shadow-emerald-950/5'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100/40 shadow-emerald-200/10';
      case 'yellow':
        return isDarkMode
          ? 'bg-yellow-950/45 border-yellow-600/85 text-yellow-101 hover:bg-yellow-900/50 shadow-yellow-950/10'
          : 'bg-amber-100 border-amber-300 text-amber-950 hover:bg-amber-200/90 shadow-amber-200/15';
      case 'white':
      default:
        return isDarkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-850 shadow-slate-950/5'
          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-slate-100/30';
    }
  };

  const thBgClass = isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500';

  return (
    <div className="space-y-4" id="student-module-master-table">
      {/* View Switcher Controls */}
      <div className="flex items-center justify-between gap-4 pb-2 select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Layout Perspective</span>
        </div>
        
        <div className="p-1 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-1">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-red-650 shadow-sm'
                : 'text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Table Grid</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-red-655 text-red-600 shadow-sm'
                : 'text-slate-400 dark:text-slate-550 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Card Grid</span>
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        /* Table Grid View (Desktop Perfect) */
        <div className="overflow-auto max-h-[70vh] rounded-3xl border border-slate-200/85 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm relative">
          <table className="w-full text-left text-xs border-collapse relative animate-fade-in">
            {/* Header row with precise columns defined by User */}
            <thead className="text-[10px] uppercase font-black tracking-wider border-b whitespace-nowrap select-none sticky top-0 z-30">
              <tr>
                <th className={`px-3 py-3 text-center sticky top-0 left-0 z-[40] border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-12 ${thBgClass}`}>SNO</th>
                <th className={`px-3 py-3 sticky top-0 left-12 z-[40] border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-20 ${thBgClass}`}>STUD ID</th>
                <th className={`px-4 py-3 sticky top-0 left-32 z-[40] border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-40 min-w-[160px] ${thBgClass}`}>STUDENT NAME</th>
                <th className={`px-4 py-3 ${thBgClass}`}>COUNSELLOR NAME</th>
                <th className={`px-4 py-3 ${thBgClass}`}>DATE OF ADMISSION</th>
                <th className={`px-4 py-3 ${thBgClass}`}>TYPE OF APPLICATION</th>
                <th className={`px-4 py-3 ${thBgClass}`}>PASSPORT NO</th>
                <th className={`px-4 py-3 ${thBgClass}`}>MOBILE NUMBER</th>
                <th className={`px-4 py-3 ${thBgClass}`}>EMAIL ID</th>
                <th className={`px-4 py-3 ${thBgClass}`}>PASSWORD</th>
                <th className={`px-4 py-3 ${thBgClass}`}>COUNTRY</th>
                <th className={`px-4 py-3 text-center ${thBgClass}`}>INTAKE</th>
                <th className={`px-4 py-3 ${thBgClass}`}>12TH ENGLISH & MOI</th>
                <th className={`px-4 py-3 min-w-[150px] ${thBgClass}`}>APP STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>PORTAL</th>
                <th className={`px-4 py-3 ${thBgClass}`}>APPLICATION DATE</th>
                <th className={`px-4 py-3 ${thBgClass}`}>UNIVERSITY NAME</th>
                <th className={`px-4 py-3 ${thBgClass}`}>COURSE NAME</th>
                <th className={`px-4 py-3 ${thBgClass}`}>PURSUING / GRADUATE</th>
                <th className={`px-4 py-3 ${thBgClass}`}>OFFER STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>DEPOSIT DEADLINE DATE</th>
                <th className={`px-4 py-3 ${thBgClass}`}>DEPOSIT STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>IHS&VISA PAID STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>INTERVIEW STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>CAS DEADLINE DATE</th>
                <th className={`px-4 py-3 ${thBgClass}`}>CAS STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>VISA STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>UNIV START DATE</th>
                <th className={`px-4 py-3 ${thBgClass}`}>FINTECH ASSIGNEE</th>
                <th className={`px-4 py-3 ${thBgClass}`}>NBFC</th>
                <th className={`px-4 py-3 ${thBgClass}`}>LOAN STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>PF STATUS</th>
                <th className={`px-4 py-3 ${thBgClass}`}>SANCTIONED</th>
                <th className={`px-4 py-3 ${thBgClass}`}>DISBURSED</th>
                <th className={`px-4 py-3 min-w-[185px] ${thBgClass}`}>REMARKS</th>
                <th className={`px-5 py-3 text-right sticky top-0 right-0 z-[40] border-l ${thBgClass}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 whitespace-nowrap">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={36} className="text-center py-12 text-xs text-slate-400 font-bold bg-white dark:bg-slate-900">
                    No registered active students found. Check filter exclusions.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const firstApp = student.applications[0] || {
                    portal: 'Direct',
                    applicationDate: '15-Jun-2026',
                    university: 'N/A',
                    course: 'N/A',
                    status: 'Draft'
                  };

                  const latestRemark = student.remarks[student.remarks.length - 1]?.note || 'No active remarks';

                  return (
                    <tr 
                      key={student.id}
                      className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors"
                    >
                      {/* 1. SNO (Sticky left-0) */}
                      <td className="px-3 py-3.5 font-bold font-mono text-center text-slate-400 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] w-12">
                        {idx + 1}
                      </td>

                      {/* 2. Student unique ID (Sticky left-12) */}
                      <td className="px-3 py-3.5 font-mono text-[11px] font-black tracking-wider text-slate-500 bg-white dark:bg-slate-900 sticky left-12 z-10 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] w-20">
                        STU{100 + Number(student.id)}
                      </td>

                      {/* 3. Student Name (Sticky left-32) */}
                      <td className="px-4 py-3.5 font-extrabold text-[#000000] dark:text-white hover:underline cursor-pointer sticky left-32 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] truncate w-40 min-w-[160px]" onClick={() => onSelectStudent(student.id)}>
                        {student.name}
                      </td>

                      {/* 4. Counsellor Name */}
                      <td className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                        {student.counsellor}
                      </td>

                      {/* 5. Date of Admission */}
                      <td className="px-4 py-3.5 text-slate-500 font-semibold font-mono text-[11px]">
                        {student.admissionDate}
                      </td>

                      {/* 6. Type of Application */}
                      <td className="px-4 py-3.5 text-slate-550 dark:text-slate-400 font-semibold">
                        {student.applicationType || 'Undergrad'}
                      </td>

                      {/* 7. Passport Number */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {student.passportNumber}
                      </td>

                      {/* 8. Mobile Number */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-605 dark:text-slate-400">
                        {student.mobileNumber}
                      </td>

                      {/* 9. Email ID */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                        {student.email}
                      </td>

                      {/* 10. Password */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span>{visiblePasswords[student.id] ? (student.password || 'Pass@2026') : '••••••••'}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePassword(student.id); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
                          >
                            {visiblePasswords[student.id] ? <ShieldOff className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>

                      {/* 11. Country */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-350">
                        {student.country}
                      </td>

                      {/* 12. Intake */}
                      <td className="px-4 py-3.5 text-center font-bold">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                          {student.intake}
                        </span>
                      </td>

                      {/* 13. 12th English / MOI */}
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {student.twelfthEnglishMoi || 'MOI Waiver Letter'}
                      </td>

                      {/* 14. Application Status overall */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(firstApp.status)}`}>
                          {firstApp.status}
                        </span>
                      </td>

                      {/* 15. Portal */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[10px] text-red-650 bg-red-600/5 px-2 py-0.5 rounded">
                        {firstApp.portal}
                      </td>

                      {/* 16. Application Date */}
                      <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">
                        {firstApp.applicationDate}
                      </td>

                      {/* 17. University Name */}
                      <td className="px-4 py-3.5 text-slate-800 dark:text-slate-205 font-bold truncate max-w-[180px]" title={firstApp.university}>
                        {firstApp.university}
                      </td>

                      {/* 18. Course Name */}
                      <td className="px-4 py-3.5 text-slate-550 dark:text-slate-400 truncate max-w-[150px]" title={firstApp.course}>
                        {firstApp.course}
                      </td>

                      {/* 19. Pursuing / Graduate */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-bold font-mono">
                        {student.pursuingGraduate || 'Graduate'}
                      </td>

                      {/* 20. Offer Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(firstApp.status)}`}>
                          {firstApp.status}
                        </span>
                      </td>

                      {/* 21. Deposit Deadline Date */}
                      <td className="px-4 py-3.5 font-semibold text-slate-500 font-mono text-[11px]">
                        {student.depositDeadlineDate || '30-Jun-2026'}
                      </td>

                      {/* 22. Deposit Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(student.visaDetails.depositStatus)}`}>
                          {student.visaDetails.depositStatus}
                        </span>
                      </td>

                      {/* 23. IHS & Visa Paid Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(student.visaDetails.ihsPayment)}`}>
                          {student.visaDetails.ihsPayment}
                        </span>
                      </td>

                      {/* 24. Interview Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(student.visaDetails.interviewStatus)}`}>
                          {student.visaDetails.interviewStatus}
                        </span>
                      </td>

                      {/* 25. CAS Deadline Date */}
                      <td className="px-4 py-3.5 font-semibold text-slate-500 font-mono text-[11px]">
                        {student.casDeadlineDate || '10-Aug-2026'}
                      </td>

                      {/* 26. CAS Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(student.visaDetails.casStatus)}`}>
                          {student.visaDetails.casStatus}
                        </span>
                      </td>

                      {/* 27. Visa Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(student.visaDetails.visaStatus)}`}>
                          {student.visaDetails.visaStatus}
                        </span>
                      </td>

                      {/* 28. Univ Start Date */}
                      <td className="px-4 py-3.5 font-semibold text-slate-500 font-mono text-[11px]">
                        {student.univStartDate || '15-Sep-2026'}
                      </td>

                      {/* 29. Fintech Assignee */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium font-mono text-[11px]">
                        {student.loan.assignee}
                      </td>

                      {/* 30. NBFC */}
                      <td className="px-4 py-3.5 text-slate-605 dark:text-slate-300 font-bold">
                        {student.loan.nbfc}
                      </td>

                      {/* 31. Loan Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(student.loan.status)}`}>
                          {student.loan.status}
                        </span>
                      </td>

                      {/* 32. PF Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getCellColorClass(student.loan.pfStatus || 'Pending')}`}>
                          {student.loan.pfStatus || 'Pending'}
                        </span>
                      </td>

                      {/* 33. Sanctioned */}
                      <td className="px-4 py-3.5 font-black text-slate-805 dark:text-slate-300 font-mono">
                        {student.loan.sanctionedAmount}
                      </td>

                      {/* 34. Disbursed */}
                      <td className="px-4 py-3.5 font-bold text-emerald-600 font-mono">
                        {student.loan.disbursedAmount}
                      </td>

                      {/* 35. Remarks timeline note */}
                      <td className="px-4 py-3.5 text-[11px] text-slate-500 max-w-[200px] truncate" title={latestRemark}>
                        {latestRemark}
                      </td>

                      {/* 36. Actions sticky right */}
                      <td className="px-5 py-3.5 text-right sticky right-0 z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-[-2px_0_5px_rgba(0,0,0,0.035)]">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          <button
                            onClick={() => onSelectStudent(student.id)}
                            className="bg-red-600/10 text-red-650 hover:bg-red-600 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                            title="View complete student folders"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Detail</span>
                          </button>

                          <button
                            onClick={() => onEditStudent(student)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg text-[10px] font-black inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                            title="Edit Student Basic Information"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => onDeleteStudent(student.id)}
                            className="bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 px-2 py-1.5 rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                            title="Delete Case File"
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
        /* Mobile Card Grid View (Responsive with completion calculation indicator loop) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="student-grid-card-view">
          {students.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 border rounded-3xl p-6">
              <p className="text-xs text-slate-400 font-bold">No registered active students found in criteria.</p>
            </div>
          ) : (
            students.map((student, idx) => {
              const firstApp = student.applications[0] || {
                portal: 'Direct',
                applicationDate: '15-Jun-2026',
                university: 'N/A',
                course: 'N/A',
                status: 'Draft'
              };
              const latestRemark = student.remarks[student.remarks.length - 1]?.note || 'No active remarks';
              const percent = getProgressPercentage(student);

              return (
                <div 
                  key={student.id} 
                  className={`rounded-3xl border p-5 relative flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                    getCardBgColorClass(student)
                  }`}
                >
                  <div>
                    {/* Card Top Pill Bar */}
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-red-650/10 text-red-600 px-2.5 py-0.5 rounded-lg font-black font-mono">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-black tracking-wider">
                          STU{100 + Number(student.id)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md font-bold text-slate-705 dark:text-slate-300">
                          {student.intake}
                        </span>
                        <span className="text-[10px] bg-red-650/5 text-red-600 font-black px-2 py-0.5 rounded-md">
                          {student.country}
                        </span>
                      </div>
                    </div>

                    {/* Student Identity Block */}
                    <div className="mb-4">
                      <h4 
                        onClick={() => onSelectStudent(student.id)}
                        className="text-base font-black text-black dark:text-white hover:text-red-600 dark:hover:text-red-400 hover:underline cursor-pointer transition-colors leading-tight"
                      >
                        {student.name}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] text-slate-404 text-slate-400 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Counsellor: {student.counsellor}</span>
                        <span className="text-slate-200 dark:text-slate-800">•</span>
                        <span>Adm: {student.admissionDate}</span>
                        <span className="text-slate-200 dark:text-slate-800">•</span>
                        <span className="text-slate-500 font-black text-[10px] uppercase">{student.applicationType || 'Undergrad'}</span>
                      </div>

                      {/* Extended contact details container */}
                      <div className="mt-2.5 space-y-1 border-t border-dashed border-slate-100 dark:border-slate-800/80 pt-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 text-xs text-slate-605 dark:text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{student.mobileNumber}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                            <span>Pas:</span>
                            <span className="font-semibold">{visiblePasswords[student.id] ? (student.password || 'Pass@2026') : '••••••••'}</span>
                            <button 
                              onClick={() => togglePassword(student.id)}
                              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
                            >
                              {visiblePasswords[student.id] ? <ShieldOff className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS BAR WITH THE PERCENTAGE COMPLETED (CRITICAL USER MANDATE) */}
                    <div className="mb-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between gap-2 mb-1.5 font-bold select-none">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                          Dossier Completion Progress
                        </span>
                        <span className="text-xs text-red-650 text-red-600 font-black font-mono">
                          {percent}%
                        </span>
                      </div>
                      
                      {/* Linear progress line container template */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] mt-2 select-none">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Workflow Phase</span>
                        <span className="font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[9px] bg-red-600/5 px-1.5 py-0.5 rounded text-red-656">
                          {student.currentStage}
                        </span>
                      </div>
                    </div>

                    {/* Primary Enrollment details Card - Hidden as of now to reduce card length */}
                    {/*
                    <div className="mb-4 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] uppercase font-black text-amber-600 tracking-wider">
                          Primary Course Enrollment
                        </span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${getCellColorClass(firstApp.status)}`}>
                          {firstApp.status}
                        </span>
                      </div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate" title={firstApp.university}>
                        {firstApp.university}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 italic">
                        {firstApp.course}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-100 dark:border-slate-800/20">
                        <span>Portal: <span className="font-semibold text-slate-600 dark:text-slate-300">{firstApp.portal}</span></span>
                        <span>Filing Date: {firstApp.applicationDate}</span>
                      </div>
                    </div>
                    */}

                    {/* Core Process Timelines indicators / Workflow Status Flags - Hidden as of now to reduce card length */}
                    {/*
                    <div className="mb-4 text-[10px] space-y-1.5">
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest border-b pb-0.5 border-slate-105 dark:border-slate-800">
                        Workflow Status Flags
                      </p>
                      
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 font-medium">Deposit:</span>
                          <span className={`px-1.5 py-0.5 font-bold rounded text-[9px] ${getCellColorClass(student.visaDetails.depositStatus)}`}>
                            {student.visaDetails.depositStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 font-medium">CAS:</span>
                          <span className={`px-1.5 py-0.5 font-bold rounded text-[9px] ${getCellColorClass(student.visaDetails.casStatus)}`}>
                            {student.visaDetails.casStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 font-medium">IHS & Fee:</span>
                          <span className={`px-1.5 py-0.5 font-bold rounded text-[9px] ${getCellColorClass(student.visaDetails.ihsPayment)}`}>
                            {student.visaDetails.ihsPayment}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 font-medium">Visa status:</span>
                          <span className={`px-1.5 py-0.5 font-bold rounded text-[9px] ${getCellColorClass(student.visaDetails.visaStatus)}`}>
                            {student.visaDetails.visaStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between col-span-2 pt-1 border-t border-dashed border-slate-100 dark:border-slate-850">
                          <span className="text-slate-400 font-medium">Fintech Loan ({student.loan.nbfc}):</span>
                          <span className={`px-1.5 py-0.5 font-bold rounded text-[9px] ${getCellColorClass(student.loan.status)}`}>
                            {student.loan.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between col-span-2">
                          <span className="text-slate-400 font-medium">Sanctioned / Disbursed:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                            {student.loan.sanctionedAmount} / <span className="font-black text-emerald-600">{student.loan.disbursedAmount}</span>
                          </span>
                        </div>

                      </div>
                    </div>
                    */}
                  </div>

                  {/* Card Bottom / Footer Actions and bubble remarks */}
                  <div className="mt-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 shrink-0">
                    <div className="text-[11px] px-2.5 py-2 bg-slate-100/50 dark:bg-slate-950/40 rounded-xl text-slate-500 italic truncate max-h-[36px] items-center" title={latestRemark}>
                      &ldquo;{latestRemark}&rdquo;
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectStudent(student.id)}
                        className="flex-1 bg-red-650/10 text-red-655 text-red-600 hover:bg-red-600 hover:text-white py-1.8 py-2 rounded-xl text-xs font-black tracking-wide inline-flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Dossier file</span>
                      </button>

                      <button
                        onClick={() => onEditStudent(student)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Edit Info"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteStudent(student.id)}
                        className="bg-rose-550/10 hover:bg-rose-600 hover:text-white text-rose-500 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Delete Portfolio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
