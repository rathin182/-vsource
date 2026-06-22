'use client';

import React from 'react';
import { X, Calendar, Filter, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { counsellorsList, countriesList, intakesList, visaStatusesList, loanStatusesList } from '@/slids/data/mockData';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  
  // Filter States
  filterCounsellor: string;
  setFilterCounsellor: (v: string) => void;
  
  filterCountry: string;
  setFilterCountry: (v: string) => void;
  
  filterIntake: string;
  setFilterIntake: (v: string) => void;
  
  filterVisaStatus: string;
  setFilterVisaStatus: (v: string) => void;
  
  filterLoanStatus: string;
  setFilterLoanStatus: (v: string) => void;
  
  filterCasStatus: string;
  setFilterCasStatus: (v: string) => void;
  
  filterNbfc: string;
  setFilterNbfc: (v: string) => void;
  
  filterFintechAssignee: string;
  setFilterFintechAssignee: (v: string) => void;
  
  filterAppStatus: string;
  setFilterAppStatus: (v: string) => void;
  
  filterUniversity: string;
  setFilterUniversity: (v: string) => void;
  
  // Date Fields
  filterDateType: string;
  setFilterDateType: (v: string) => void;
  
  customStartDate: string;
  setCustomStartDate: (v: string) => void;
  
  customEndDate: string;
  setCustomEndDate: (v: string) => void;
  
  // Helpers
  uniqueUniversities: string[];
  uniqueFintechAssignees: string[];
  resetAllFilters: () => void;
  activeFiltersCount: number;
}

export function FilterSidebar({
  isOpen,
  onClose,
  isDarkMode,
  filterCounsellor,
  setFilterCounsellor,
  filterCountry,
  setFilterCountry,
  filterIntake,
  setFilterIntake,
  filterVisaStatus,
  setFilterVisaStatus,
  filterLoanStatus,
  setFilterLoanStatus,
  filterCasStatus,
  setFilterCasStatus,
  filterNbfc,
  setFilterNbfc,
  filterFintechAssignee,
  setFilterFintechAssignee,
  filterAppStatus,
  setFilterAppStatus,
  filterUniversity,
  setFilterUniversity,
  filterDateType,
  setFilterDateType,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  uniqueUniversities,
  uniqueFintechAssignees,
  resetAllFilters,
  activeFiltersCount,
}: FilterSidebarProps) {
  
  const dateOptions = [
    { value: 'All', label: 'All Time' },
    { value: 'Today', label: 'Today (15-Jun-2026)' },
    { value: 'Yesterday', label: 'Yesterday (14-Jun-2026)' },
    { value: 'Last 7 Days', label: 'Last 7 Days' },
    { value: 'Last 30 Days', label: 'Last 30 Days' },
    { value: 'This Month', label: 'This Month (June)' },
    { value: 'Last Month', label: 'Last Month (May)' },
    { value: 'This Quarter', label: 'This Quarter (Q2)' },
    { value: 'Last Quarter', label: 'Last Quarter (Q1)' },
    { value: 'This Year', label: 'This Year (2026)' },
    { value: 'Custom Date', label: 'Custom Date Range...' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 transition-opacity"
            id="filters-backdrop"
          />

          {/* DRAWER CONTENT */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`fixed inset-y-0 right-0 z-50 w-full max-w-md h-full flex flex-col justify-between shadow-2xl border-l ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-100 text-slate-800'
            }`}
            id="filters-container-drawer"
          >
            {/* Header section */}
            <div className="p-5 border-b border-inherit flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-red-600/10 p-2 rounded-xl text-red-650 text-red-600">
                  <Filter className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Advanced Filter Center</h3>
                  <p className="text-[10px] text-slate-400">Apply filters dynamically ({activeFiltersCount} active)</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                id="btn-close-filters-drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Filters Block */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* DATE RANGE CORNER */}
              <div className="p-4 rounded-2xl border border-dashed border-red-500/20 bg-red-600/5 space-y-3">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                  <Calendar className="h-4 w-4" />
                  <span>Admission Date Filter</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-1">Predefined Range</label>
                    <select
                      value={filterDateType}
                      onChange={(e) => setFilterDateType(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-1 focus:ring-red-600 focus:outline-none ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-850'
                      }`}
                      id="select-date-range-type"
                    >
                      {dateOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {filterDateType === 'Custom Date' && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs rounded-xl border focus:ring-1 focus:ring-red-650 focus:outline-none ${
                            isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                          id="date-picker-start"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs rounded-xl border focus:ring-1 focus:ring-red-650 focus:outline-none ${
                            isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                          id="date-picker-end"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CORE CLASSIFICATIONS */}
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b pb-1 dark:border-slate-800">Student Profiles & Advising</p>

                {/* Counsellor dropdown */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Assigned Counsellor</label>
                  <select
                    value={filterCounsellor}
                    onChange={(e) => setFilterCounsellor(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-205' : 'bg-slate-50 border-slate-200 text-slate-850'
                    }`}
                  >
                    <option value="All">All Counsellors</option>
                    {counsellorsList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Country dropdown */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Target Country</label>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-205' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All Countries</option>
                    {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Intake dropdown */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Intake Cycle</label>
                  <select
                    value={filterIntake}
                    onChange={(e) => setFilterIntake(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All Intakes</option>
                    {intakesList.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                {/* University dropdown */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Target University</label>
                  <select
                    value={filterUniversity}
                    onChange={(e) => setFilterUniversity(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All Universities</option>
                    {uniqueUniversities.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* FLOWS STATUS ENGINES */}
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b pb-1 dark:border-slate-800">Compliance & Status Stages</p>

                {/* Application Status */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Application Status</label>
                  <select
                    value={filterAppStatus}
                    onChange={(e) => setFilterAppStatus(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All Application Statuses</option>
                    {['Draft', 'Applied', 'Pending', 'Offer Received', 'Priority Offer Received', 'Conditional Offer', 'Unconditional Offer', 'Rejected', 'Deferred'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* CAS Status */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">CAS Status</label>
                  <select
                    value={filterCasStatus}
                    onChange={(e) => setFilterCasStatus(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All CAS Statuses</option>
                    {['Received', 'Pending', 'Not Required'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Visa Status */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Visa Compliance Status</label>
                  <select
                    value={filterVisaStatus}
                    onChange={(e) => setFilterVisaStatus(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All Visas</option>
                    {visaStatusesList.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                {/* Loan Status */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Loan Status</label>
                  <select
                    value={filterLoanStatus}
                    onChange={(e) => setFilterLoanStatus(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All Loans</option>
                    {loanStatusesList.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* NBFC */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Lending NBFC</label>
                  <select
                    value={filterNbfc}
                    onChange={(e) => setFilterNbfc(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All NBFC Lenders</option>
                    {['Poonawalla', 'Credila', 'Avanse', 'ICICI', 'HDFC Credila', 'Self Funding', 'Other'].map(nbfc => (
                      <option key={nbfc} value={nbfc}>{nbfc}</option>
                    ))}
                  </select>
                </div>

                {/* Fintech Assignee */}
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fintech Assignee Liaison</label>
                  <select
                    value={filterFintechAssignee}
                    onChange={(e) => setFilterFintechAssignee(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="All">All Fintech Assignees</option>
                    {uniqueFintechAssignees.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Bottom Actions Row */}
            <div className="p-4 border-t border-inherit flex gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={resetAllFilters}
                className="flex-1 py-2.5 rounded-xl border border-rose-500/35 hover:bg-rose-500/5 text-rose-500 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all"
                id="btn-reset-filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All</span>
              </button>
              
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/10 inline-flex items-center justify-center transition-all"
                id="btn-apply-filters"
              >
                <span>Apply Filters</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
