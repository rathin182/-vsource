'use client';

import React, { useState } from 'react';
import { GripVertical, ArrowRight, UserCheck, Inbox, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { LocalStudent } from './StudentTable';

interface KanbanBoardProps {
  students: LocalStudent[];
  setStudents: React.Dispatch<React.SetStateAction<LocalStudent[]>>;
  isDarkMode: boolean;
  onSelectStudent: (id: string) => void;
  filterIntake: string;
  filterCountry: string;
  filterCounsellor: string;
  filterVisaStatus: string;
  filterLoanStatus: string;
}

const KANBAN_COLUMNS = [
  { 
    id: 'Inquiry', 
    label: 'Inquiry', 
    headerStyle: 'border-sky-200 dark:border-sky-900/50 text-sky-800 dark:text-sky-300 bg-sky-50/60 dark:bg-sky-950/15', 
    badgeStyle: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' 
  },
  { 
    id: 'Documents', 
    label: 'Documents', 
    headerStyle: 'border-yellow-300 dark:border-yellow-900/50 text-yellow-805 dark:text-yellow-300 bg-yellow-100/50 dark:bg-yellow-950/15', 
    badgeStyle: 'bg-yellow-100/90 text-yellow-950 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300' 
  },
  { 
    id: 'Applied', 
    label: 'Applied', 
    headerStyle: 'border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/15', 
    badgeStyle: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
  },
  { 
    id: 'Offer Received', 
    label: 'Offer Received', 
    headerStyle: 'border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/15', 
    badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
  },
  { 
    id: 'Visa Process', 
    label: 'Visa Process', 
    headerStyle: 'border-purple-200 dark:border-purple-900/50 text-purple-800 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/15', 
    badgeStyle: 'bg-purple-100 text-purple-800 dark:bg-purple-955 dark:text-purple-300' 
  },
  { 
    id: 'Enrolled', 
    label: 'Enrolled', 
    headerStyle: 'border-green-300 dark:border-green-900/50 text-green-800 dark:text-green-300 bg-green-50/60 dark:bg-green-950/15', 
    badgeStyle: 'bg-green-600 text-white dark:bg-green-700 dark:text-green-100' 
  }
] as const;

export function KanbanBoard({
  students,
  setStudents,
  isDarkMode,
  onSelectStudent,
  filterIntake,
  filterCountry,
  filterCounsellor,
  filterVisaStatus,
  filterLoanStatus
}: KanbanBoardProps) {

  // State for interactive popups in simple English
  const [moveConfirm, setMoveConfirm] = useState<{
    studentId: string;
    studentName: string;
    fromStage: string;
    toStage: string;
  } | null>(null);

  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Maps student current stage text to the correct Kanban Column ID
  const mapStageToKanban = (stage: string): string => {
    const val = (stage || '').toLowerCase().trim();
    if (val === 'lead created' || val === 'inquiry' || !val) return 'Inquiry';
    if (val === 'documents') return 'Documents';
    if (val === 'application submitted' || val === 'applied') return 'Applied';
    if (val === 'offer received' || val === 'deposit paid') return 'Offer Received';
    if (val === 'visa approved' || val === 'enrolled') return 'Enrolled';
    return 'Visa Process';
  };

  // Convert column key back to standard Stage Value
  const mapKanbanToStageValue = (kanbanStage: string): string => {
    switch (kanbanStage) {
      case 'Inquiry': return 'Lead Created';
      case 'Documents': return 'Documents';
      case 'Applied': return 'Application Submitted';
      case 'Offer Received': return 'Offer Received';
      case 'Visa Process': return 'Visa Applied';
      case 'Enrolled': return 'Visa Approved';
      default: return 'Lead Created';
    }
  };

  // Colors as specified: yellow, white, green, last option red
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

  // Beautiful styling colors featuring proper vibrant, cheerful yellow!
  const getColorClasses = (colorTheme: 'red' | 'green' | 'yellow' | 'white') => {
    switch (colorTheme) {
      case 'red':
        return isDarkMode
          ? 'bg-rose-950/20 border-rose-800 text-slate-100 hover:bg-rose-955/30 hover:border-rose-700 shadow-rose-950/5'
          : 'bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100/40 hover:border-rose-300 shadow-rose-200/10';
      case 'green':
        return isDarkMode
          ? 'bg-emerald-950/25 border-emerald-800 text-slate-100 hover:bg-emerald-950/35 hover:border-emerald-700 shadow-emerald-950/5'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100/40 hover:border-emerald-300 shadow-emerald-200/10';
      case 'yellow':
        // PROPER vibrant, warm cheerful yellow as requested!
        return isDarkMode
          ? 'bg-yellow-950/40 border-yellow-600/80 text-yellow-100 hover:bg-yellow-900/50 hover:border-yellow-500 shadow-yellow-950/10'
          : 'bg-amber-100/90 border-amber-300 text-amber-950 font-medium hover:bg-amber-200/80 hover:border-amber-400 shadow-amber-200/20';
      case 'white':
      default:
        return isDarkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-850 hover:border-slate-700 shadow-slate-950/5'
          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-slate-100/30';
    }
  };

  const getProgressPercent = (kanbanStage: string): number => {
    switch (kanbanStage) {
      case 'Inquiry': return 16;
      case 'Documents': return 33;
      case 'Applied': return 50;
      case 'Offer Received': return 66;
      case 'Visa Process': return 83;
      case 'Enrolled': return 100;
      default: return 16;
    }
  };

  // Drag handles and verification
  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    e.dataTransfer.setData("studentId", studentId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleOnDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData("studentId");
    if (!studentId) return;

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentStageName = mapStageToKanban(student.currentStage);
    const KANBAN_ORDER = ['Inquiry', 'Documents', 'Applied', 'Offer Received', 'Visa Process', 'Enrolled'];
    const currentIndex = KANBAN_ORDER.indexOf(currentStageName);
    const targetIndex = KANBAN_ORDER.indexOf(targetStage);

    if (targetIndex < currentIndex) {
      setWarningMessage(`You cannot move "${student.name}" backward once they have reached a higher stage.`);
      return;
    }

    if (targetIndex > currentIndex + 1) {
      setWarningMessage(`Please move "${student.name}" one status at a time. The next logical stage is "${KANBAN_ORDER[currentIndex + 1]}".`);
      return;
    }

    if (targetIndex === currentIndex) {
      return; // Dropped in the exact same column
    }

    // Logical single step forward
    if (targetIndex === currentIndex + 1) {
      setMoveConfirm({
        studentId: student.id,
        studentName: student.name,
        fromStage: currentStageName,
        toStage: targetStage
      });
    }
  };

  const confirmMove = () => {
    if (!moveConfirm) return;
    const { studentId, toStage, fromStage } = moveConfirm;
    const nextStageValue = mapKanbanToStageValue(toStage);

    setStudents(prev => {
      return prev.map(s => {
        if (s.id === studentId) {
          const nowLabel = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
          const newRemark = {
            date: nowLabel,
            note: `Moved candidate status from ${fromStage} to ${toStage}`
          };
          return {
            ...s,
            currentStage: nextStageValue as any,
            remarks: [newRemark, ...(s.remarks || [])]
          };
        }
        return s;
      });
    });

    setMoveConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Applications Pipeline Tracking Board</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage enrollment journeys below. Drag cards forward or use buttons to move them step-by-step.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
            Drag to Move
          </span>
          <span className="text-[10px] uppercase font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
            Total of {students.length} students
          </span>
        </div>
      </div>

      {/* Kanban Board Container. 
          To fulfill "remove the scrollbars on each column let the page size or height increase",
          we do not put max height constraints or overflow-y-auto on columns. 
          The columns grow to fit their tallest card stack perfectly. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-row xl:overflow-x-auto gap-4 items-start pb-10 select-none scrollbar-thin">
        {KANBAN_COLUMNS.map((col, colIndex) => {
          // Filter students for this column based on active global filters
          const columnStudents = students.filter(student => {
            if (mapStageToKanban(student.currentStage) !== col.id) return false;
            if (filterIntake !== 'All' && student.intake !== filterIntake) return false;
            if (filterCountry !== 'All' && student.country !== filterCountry) return false;
            if (filterCounsellor !== 'All' && student.counsellor !== filterCounsellor) return false;
            if (filterVisaStatus !== 'All' && student.visaDetails.visaStatus !== filterVisaStatus) return false;
            if (filterLoanStatus !== 'All' && student.loan.status !== filterLoanStatus) return false;
            return true;
          });

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleOnDrop(e, col.id)}
              className="flex flex-col bg-slate-50/45 dark:bg-slate-950/40 p-4 border border-slate-200/60 dark:border-slate-850/70 rounded-[28px] xl:w-80 xl:min-w-80 w-full shadow-xs"
            >
              {/* Header section of each Kanban category */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl ${col.badgeStyle}`}>
                    {col.label}
                  </span>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500">
                  {columnStudents.length}
                </span>
              </div>

              {/* Vertical list of student cards without secondary scrollbar restriction, allows standard flow height expansion */}
              <div className="flex flex-col gap-3">
                {columnStudents.length === 0 ? (
                  <div className="py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center">
                    <span className="text-xl mb-1">📭</span>
                    <span>No students at this stage</span>
                  </div>
                ) : (
                  columnStudents.map(student => {
                    const colorKey = getStudentColorThemeKey(student);
                    const colorClass = getColorClasses(colorKey);
                    const progressPercent = getProgressPercent(col.id);
                    const progressColor = colorKey === 'green' ? 'bg-emerald-500' : colorKey === 'yellow' ? 'bg-amber-500' : colorKey === 'red' ? 'bg-rose-500' : 'bg-slate-400';
                    const activeApp = student.applications?.[0];

                    return (
                      <div
                        key={student.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, student.id)}
                        onClick={() => onSelectStudent(student.id)}
                        className={`p-5 rounded-[22px] border transition-all duration-300 relative flex flex-col justify-between cursor-pointer active:scale-[0.985] group shadow-sm ${colorClass}`}
                      >
                        <div>
                          {/* Top row: grip + student name */}
                          <div className="flex justify-between items-start gap-2 mb-2.5">
                            <div className="flex items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                              <div className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 transition-colors p-0.5">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <h5 
                                onClick={() => onSelectStudent(student.id)}
                                className="font-extrabold text-[#000000] dark:text-white text-xs hover:underline truncate cursor-pointer min-w-0 select-text"
                              >
                                {student.name}
                              </h5>
                            </div>
                            <span className="text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-mono flex-shrink-0">
                              {student.country.substring(0, 3)}
                            </span>
                          </div>

                          {/* University details row */}
                          <div className="mb-3.5 pl-6 min-w-0">
                            <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-205 line-clamp-1">
                              {activeApp?.university || 'University of York'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {activeApp?.course || 'No course selected'}
                            </p>
                          </div>

                          {/* Progress bar visualizer */}
                          <div className="mb-3.5 pl-6">
                            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 mb-1 leading-none">
                              <span>Compliance & Checklists</span>
                              <span className="font-mono">{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Footer details + actionable handoffs */}
                        <div className="pl-6">
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/50 dark:border-slate-800/40 text-[9px] font-bold">
                            <span className="font-mono text-slate-400 dark:text-slate-400">{student.intake}</span>
                            <span className="bg-red-500/10 dark:bg-red-500/25 text-red-600 dark:text-red-400 font-black px-2 py-0.5 rounded-md text-[8px] font-mono">
                              {student.counsellor}
                            </span>
                          </div>

                          {/* Interaction controls using easy-to-read terms */}
                          <div className="mt-3.5 flex items-center justify-between gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectStudent(student.id);
                              }}
                              className="text-[9px] font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 px-3 rounded-xl transition-all cursor-pointer"
                            >
                              Check Folio
                            </button>

                            {colIndex < KANBAN_COLUMNS.length - 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMoveConfirm({
                                    studentId: student.id,
                                    studentName: student.name,
                                    fromStage: col.id,
                                    toStage: KANBAN_COLUMNS[colIndex + 1].id
                                  });
                                }}
                                className="text-[9.5px] font-black bg-rose-600 hover:bg-rose-700 text-white py-1 px-3 rounded-xl shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                              >
                                Next Step →
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple, easy confirmation dialog */}
      <AnimatePresence>
        {moveConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-[24px] p-6 border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
            >
              <div className="flex items-center gap-2 mb-2 text-rose-600">
                <span className="text-[10px] font-black tracking-widest uppercase bg-rose-500/10 px-2.5 py-1 rounded-md">Are you sure?</span>
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-2">Move student to next stage?</h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-semibold">
                Do you want to confirm moving <span className="text-[#000000] dark:text-white font-extrabold">{moveConfirm.studentName}</span> from <span className="font-bold underline text-slate-700 dark:text-slate-300">{moveConfirm.fromStage}</span> to <span className="font-bold underline text-emerald-600 dark:text-emerald-400">{moveConfirm.toStage}</span>?
              </p>

              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 leading-normal mb-6 font-medium italic">
                Note: You can only move students forward one step at a time. Once they are moved forward, they cannot go back.
              </p>

              <div className="flex justify-end gap-2 text-[11px] font-bold">
                <button
                  onClick={() => setMoveConfirm(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMove}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
                >
                  Move Forward
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Dynamic warning modal using simple, easily readable English */}
        {warningMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-[24px] p-6 border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
            >
              <div className="flex items-center gap-2 mb-2 text-rose-600">
                <span className="text-[10px] font-black tracking-widest uppercase bg-rose-500/10 px-2.5 py-1 rounded-md">Heads Up</span>
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-2">Stage Change Blocked</h3>
              
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed font-semibold">
                {warningMessage}
              </p>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mb-5 italic">
                Enrollment rules specify that students should only go forward one step at a time, and never go back.
              </p>

              <div className="flex justify-end text-[11px] font-bold">
                <button
                  onClick={() => setWarningMessage(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 dark:hover:bg-slate-700 text-white shadow-sm cursor-pointer"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
