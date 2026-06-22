'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, FileEdit, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { LocalStudent } from './StudentTable';
import { counsellorsList, countriesList, intakesList } from '@/slids/data/mockData';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  studentToEdit: LocalStudent | null; // null if Adding
  onSave: (studentData: Partial<LocalStudent>) => void;
}

export function AddEditModal({
  isOpen,
  onClose,
  isDarkMode,
  studentToEdit,
  onSave
}: AddEditModalProps) {
  // Form states
  const [name, setName] = useState('');
  const [counsellor, setCounsellor] = useState('Prasad Panjugula');
  const [country, setCountry] = useState('United Kingdom');
  const [intake, setIntake] = useState('Sep 2026');
  const [admissionDate, setAdmissionDate] = useState('15-Jun-2026');
  const [applicationType, setApplicationType] = useState('Master');
  const [passportNumber, setPassportNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twelfthEnglishMoi, setTwelfthEnglishMoi] = useState('MOI Waiver Letter');
  const [pursuingGraduate, setPursuingGraduate] = useState<'Pursuing' | 'Graduate'>('Graduate');
  const [depositDeadlineDate, setDepositDeadlineDate] = useState('30-Jun-2026');
  const [casDeadlineDate, setCasDeadlineDate] = useState('10-Aug-2026');
  const [univStartDate, setUnivStartDate] = useState('15-Sep-2026');
  
  // Financiers
  const [assignee, setAssignee] = useState('Sunil');
  const [nbfc, setNbfc] = useState('Credila');
  const [sanctionedAmount, setSanctionedAmount] = useState('₹25,00,000');
  const [disbursedAmount, setDisbursedAmount] = useState('₹15,00,000');

  // Statuses
  const [appStatus, setAppStatus] = useState('Pending');
  const [depositStatus, setDepositStatus] = useState('Pending');
  const [ihsPayment, setIhsPayment] = useState('Pending');
  const [interviewStatus, setInterviewStatus] = useState('Pending');
  const [casStatus, setCasStatus] = useState('Pending');
  const [visaStatus, setVisaStatus] = useState('Draft Pending');
  const [loanStatus, setLoanStatus] = useState('Pending');
  const [pfStatus, setPfStatus] = useState('Pending');

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name || '');
      setCounsellor(studentToEdit.counsellor || 'Prasad Panjugula');
      setCountry(studentToEdit.country || 'United Kingdom');
      setIntake(studentToEdit.intake || 'Sep 2026');
      setAdmissionDate(studentToEdit.admissionDate || '15-Jun-2026');
      setApplicationType(studentToEdit.applicationType || 'Master');
      setPassportNumber(studentToEdit.passportNumber || '');
      setMobileNumber(studentToEdit.mobileNumber || '');
      setEmail(studentToEdit.email || '');
      setPassword(studentToEdit.password || `Pass${studentToEdit.name.split(' ')[0]}@2026`);
      setTwelfthEnglishMoi(studentToEdit.twelfthEnglishMoi || 'MOI Waiver Letter');
      setPursuingGraduate(studentToEdit.pursuingGraduate || 'Graduate');
      setDepositDeadlineDate(studentToEdit.depositDeadlineDate || '30-Jun-2026');
      setCasDeadlineDate(studentToEdit.casDeadlineDate || '10-Aug-2026');
      setUnivStartDate(studentToEdit.univStartDate || '15-Sep-2026');
      
      setAssignee(studentToEdit.loan?.assignee || 'Sunil');
      setNbfc(studentToEdit.loan?.nbfc || 'Credila');
      setSanctionedAmount(studentToEdit.loan?.sanctionedAmount || '₹0');
      setDisbursedAmount(studentToEdit.loan?.disbursedAmount || '₹0');

      const firstApp = studentToEdit.applications?.[0] || { status: 'Pending' };
      setAppStatus(firstApp.status || 'Pending');
      setDepositStatus(studentToEdit.visaDetails?.depositStatus || 'Pending');
      setIhsPayment(studentToEdit.visaDetails?.ihsPayment || 'Pending');
      setInterviewStatus(studentToEdit.visaDetails?.interviewStatus || 'Pending');
      setCasStatus(studentToEdit.visaDetails?.casStatus || 'Pending');
      setVisaStatus(studentToEdit.visaDetails?.visaStatus || 'Draft Pending');
      setLoanStatus(studentToEdit.loan?.status || 'Pending');
      setPfStatus(studentToEdit.loan?.pfStatus || 'Pending');
    } else {
      setName('');
      setCounsellor('Prasad Panjugula');
      setCountry('United Kingdom');
      setIntake('Sep 2026');
      setAdmissionDate('15-Jun-2026');
      setApplicationType('Master');
      setPassportNumber('');
      setMobileNumber('');
      setEmail('');
      setPassword(`Pass${Math.random().toString(36).slice(-4).toUpperCase()}@2026`);
      setTwelfthEnglishMoi('MOI Waiver Letter');
      setPursuingGraduate('Graduate');
      setDepositDeadlineDate('30-Jun-2026');
      setCasDeadlineDate('10-Aug-2026');
      setUnivStartDate('15-Sep-2026');
      setAssignee('Sunil');
      setNbfc('Credila');
      setSanctionedAmount('₹25,00,000');
      setDisbursedAmount('₹0');

      setAppStatus('Pending');
      setDepositStatus('Pending');
      setIhsPayment('Pending');
      setInterviewStatus('Pending');
      setCasStatus('Pending');
      setVisaStatus('Draft Pending');
      setLoanStatus('Pending');
      setPfStatus('Pending');
    }
  }, [studentToEdit, isOpen]);

  const randomizePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
    let res = 'Pass';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    res += '@2026';
    setPassword(res);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const studentPayload: Partial<LocalStudent> = {
      name,
      counsellor,
      country: country as any,
      intake: intake as any,
      admissionDate,
      applicationType,
      passportNumber,
      mobileNumber,
      email,
      password,
      twelfthEnglishMoi,
      pursuingGraduate,
      depositDeadlineDate,
      casDeadlineDate,
      univStartDate,
      loan: {
        assignee,
        nbfc: nbfc as any,
        status: loanStatus as any,
        pfStatus: pfStatus as any,
        sanctionedAmount,
        disbursedAmount
      },
      visaDetails: {
        ...studentToEdit?.visaDetails,
        depositStatus: depositStatus as any,
        ihsPayment: ihsPayment as any,
        interviewStatus: interviewStatus as any,
        casStatus: casStatus as any,
        visaStatus: visaStatus as any
      } as any,
      applications: studentToEdit?.applications?.map((app, idx) => 
        idx === 0 ? { ...app, status: appStatus as any } : app
      ) || [
        {
          id: `app-temp-1`,
          portal: 'GVOC',
          university: 'Teesside University',
          course: 'MSc Data Science & AI',
          applicationDate: '15-Jun-2026',
          status: appStatus as any
        }
      ]
    };

    onSave(studentPayload);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 z-[80] transition-opacity backdrop-blur-xs"
            id="addedit-backdrop-blur"
          />

          {/* Core Panel Card Box */}
          <motion.div
            initial={{ y: '30%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '30%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 210 }}
            className={`fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-6 sm:w-[500px] z-[90] h-[92vh] sm:h-auto flex flex-col justify-between rounded-3xl shadow-2xl border ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-100 text-slate-800'
            }`}
            id="addedit-container-box"
          >
            {/* Header Dialog Tab */}
            <div className="p-5 border-b border-inherit flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-red-600/10 p-2 rounded-xl text-red-650 text-red-600">
                  {studentToEdit ? <FileEdit className="h-4.5 w-4.5" /> : <UserPlus className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    {studentToEdit ? 'Modify Admissions Profile' : 'Register New Oversea Student'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {studentToEdit ? `Updating STU${100 + Number(studentToEdit.id)} file records` : 'Initiate new folders and compliance checklists'}
                  </p>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Scrollable Form parameters */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* 1. BASIC USER METADATA */}
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b pb-1 dark:border-slate-800">Basic Folio Information</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Student Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter legal passport name"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Assigned Counsellor</label>
                    <select
                      value={counsellor}
                      onChange={(e) => setCounsellor(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-655 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {counsellorsList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Target Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {countriesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Target Intake</label>
                    <select
                      value={intake}
                      onChange={(e) => setIntake(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {intakesList.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Admission Date</label>
                    <input
                      type="text"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      placeholder="e.g. 15-Jun-2026"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. DEMOGRAPHICS & CONTACT */}
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b pb-1 dark:border-slate-800">Demographics & Credentials</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Passport Number</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="e.g. L9876543"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">12th English / MOI Waiver</label>
                    <input
                      type="text"
                      value={twelfthEnglishMoi}
                      onChange={(e) => setTwelfthEnglishMoi(e.target.value)}
                      placeholder="e.g. MOI Waiver Letter / 85%"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Application Type</label>
                    <select
                      value={applicationType}
                      onChange={(e) => setApplicationType(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="Master">Postgraduate Master Folder</option>
                      <option value="Bachelor">Undergraduate Bachelor Folder</option>
                      <option value="PhD">Doctoral PhD Folder</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Mobile Number</label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@overseas-edu.com"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Immigration Portal Password</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Secure system password"
                        className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={randomizePassword}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl border border-inherit text-slate-400 hover:text-red-600"
                        title="Randomize secure credentials key"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timeline Dates & Graduation Status */}
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b pb-1 dark:border-slate-800">Timeline Dates & Graduation Status</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Pursuing / Graduate</label>
                    <select
                      value={pursuingGraduate}
                      onChange={(e) => setPursuingGraduate(e.target.value as 'Pursuing' | 'Graduate')}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="Graduate">Graduate</option>
                      <option value="Pursuing">Pursuing</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Deposit Deadline Date</label>
                    <input
                      type="text"
                      value={depositDeadlineDate}
                      onChange={(e) => setDepositDeadlineDate(e.target.value)}
                      placeholder="e.g. 30-Jun-2026"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">CAS Deadline Date</label>
                    <input
                      type="text"
                      value={casDeadlineDate}
                      onChange={(e) => setCasDeadlineDate(e.target.value)}
                      placeholder="e.g. 10-Aug-2026"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Univ Start Date</label>
                    <input
                      type="text"
                      value={univStartDate}
                      onChange={(e) => setUnivStartDate(e.target.value)}
                      placeholder="e.g. 15-Sep-2026"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {/* 3. FINANCES & LENDERS */}
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b pb-1 dark:border-slate-800">Financial Credit Parameters</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Fintech Assignee Broker</label>
                    <input
                      type="text"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      placeholder="e.g. Sunil / Priya"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Preferred Lending NBFC</label>
                    <select
                      value={nbfc}
                      onChange={(e) => setNbfc(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {['Poonawalla', 'Credila', 'Avanse', 'ICICI', 'HDFC Credila', 'Self Funding', 'Other'].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Sanctioned Amount</label>
                    <input
                      type="text"
                      value={sanctionedAmount}
                      onChange={(e) => setSanctionedAmount(e.target.value)}
                      placeholder="e.g. ₹25,00,000"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Disbursement Release</label>
                    <input
                      type="text"
                      value={disbursedAmount}
                      onChange={(e) => setDisbursedAmount(e.target.value)}
                      placeholder="e.g. ₹15,00,000"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                 {/* 4. PROCESS & VISA STATUS TRACKING */}
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b pb-1 dark:border-slate-800">Process & Visa Status Tracking</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Application Status</label>
                    <select
                      value={appStatus}
                      onChange={(e) => setAppStatus(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {['Draft', 'Applied', 'Pending', 'Offer Received', 'Priority Offer Received', 'Conditional Offer', 'Unconditional Offer', 'Rejected', 'Deferred'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Deposit status</label>
                    <select
                      value={depositStatus}
                      onChange={(e) => setDepositStatus(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {['Deposit Paid', 'Deposit Not Paid', 'Paid', 'Pending', 'Waived'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">IHS & Visa Paid Status</label>
                    <select
                      value={ihsPayment}
                      onChange={(e) => setIhsPayment(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {['Paid', 'Pending', 'Not Required'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Interview Status</label>
                    <select
                      value={interviewStatus}
                      onChange={(e) => setInterviewStatus(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {['Completed', 'Pending', 'Waived'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">CAS Status</label>
                    <select
                      value={casStatus}
                      onChange={(e) => setCasStatus(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {['CAS Received', 'CAS Under Review', 'CAS Not Applied', 'Received', 'Pending', 'Not Required'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Visa Status</label>
                    <select
                      value={visaStatus}
                      onChange={(e) => setVisaStatus(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {['Visa Approved', 'Visa Applied', 'Visa Decision Pending', 'Visa Rejected', 'Draft Pending', 'Approved', 'Applied', 'Decision Pending', 'Rejected'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Loan Status</label>
                    <select
                      value={loanStatus}
                      onChange={(e) => setLoanStatus(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {['Pending', 'Under Review', 'Approved', 'Rejected', 'Sanctioned', 'Disbursed'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">PF Status</label>
                    <select
                      value={pfStatus}
                      onChange={(e) => setPfStatus(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-650 ${
                        isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {['Paid', 'Pending', 'Waived', 'Not Applicable'].map(opt => (
                        <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit action button */}
                <button type="submit" className="hidden" id="addedit-submit-btn-tag" />
              </form>
            </div>

            {/* Bottom Form Actions */}
            <div className="p-4 border-t border-inherit flex gap-3 bg-slate-50 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-400 text-xs font-extrabold inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => document.getElementById('addedit-submit-btn-tag')?.click()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/15 inline-flex items-center justify-center gap-1.5 uppercase tracking-wide transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Commit Case Folder</span>
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
