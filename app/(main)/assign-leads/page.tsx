"use client";

import axios from "axios";
import { useState, useMemo, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStage = "INQUIRY" | "HOT" | "WARM" | "COLD";

interface Counselor {
  id: string;
  name: string;
  branch: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  source: string;
  country?: string | null;
  leadStage: LeadStage;
  preferredCourse?: string | null;
  intakeSeason?: string | null;
  intakeYear?: number | null;
  counselorId?: string | null;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const COUNSELORS: Counselor[] = [
  { id: "c1", name: "Priya Sharma", branch: "Delhi" },
  { id: "c2", name: "Rahul Mehta", branch: "Mumbai" },
  { id: "c3", name: "Anjali Singh", branch: "Delhi" },
  { id: "c4", name: "Karan Patel", branch: "Bangalore" },
  { id: "c5", name: "Nisha Verma", branch: "Mumbai" },
];

const INITIAL_LEADS: Lead[] = [
  { id: "L001", firstName: "Aarav", lastName: "Joshi", email: "aarav.joshi@gmail.com", phone: "+91-9810011001", source: "Website", country: "Canada", leadStage: "INQUIRY", preferredCourse: "MBA", intakeSeason: "FALL", intakeYear: 2025, counselorId: null },
  { id: "L002", firstName: "Meera", lastName: "Nair", email: "meera.nair@yahoo.com", phone: "+91-9820022002", source: "Social Media", country: "UK", leadStage: "HOT", preferredCourse: "Undergraduate", intakeSeason: "SPRING", intakeYear: 2025, counselorId: null },
  { id: "L003", firstName: "Rohan", lastName: "Gupta", email: "rohan.gupta@hotmail.com", phone: "+91-9830033003", source: "Referral", country: "Australia", leadStage: "WARM", preferredCourse: "Engineering", intakeSeason: "FALL", intakeYear: 2026, counselorId: null },
  { id: "L004", firstName: "Sneha", lastName: null, email: "sneha.k@gmail.com", phone: "+91-9840044004", source: "Walk-in", country: "Germany", leadStage: "INQUIRY", preferredCourse: "Data Science", intakeSeason: "WINTER", intakeYear: 2025, counselorId: null },
  { id: "L005", firstName: "Vikram", lastName: "Bose", email: "vikram.bose@gmail.com", phone: "+91-9850055005", source: "Website", country: "USA", leadStage: "HOT", preferredCourse: "MBA", intakeSeason: "FALL", intakeYear: 2025, counselorId: null },
  { id: "L006", firstName: "Priyanka", lastName: "Das", email: "priyanka.das@outlook.com", phone: "+91-9860066006", source: "Event", country: "Canada", leadStage: "COLD", preferredCourse: "Undergraduate", intakeSeason: "SUMMER", intakeYear: 2026, counselorId: null },
  { id: "L007", firstName: "Arjun", lastName: "Kumar", email: "arjun.kumar@gmail.com", phone: "+91-9870077007", source: "Social Media", country: "New Zealand", leadStage: "WARM", preferredCourse: "IT", intakeSeason: "SPRING", intakeYear: 2025, counselorId: null },
  { id: "L008", firstName: "Divya", lastName: "Reddy", email: "divya.reddy@gmail.com", phone: "+91-9880088008", source: "Referral", country: "UK", leadStage: "INQUIRY", preferredCourse: "Nursing", intakeSeason: "FALL", intakeYear: 2026, counselorId: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName?: string | null) {
  return `${firstName[0]}${lastName ? lastName[0] : firstName[1] ?? ""}`.toUpperCase();
}

const STAGE_CONFIG: Record<LeadStage, { label: string; className: string }> = {
  HOT:     { label: "Hot",     className: "text-red-700" },
  WARM:    { label: "Warm",    className: "text-amber-700" },
  COLD:    { label: "Cold",    className: "text-sky-700" },
  INQUIRY: { label: "Inquiry", className: "text-violet-700" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function UnassignedLeads() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [perLeadCounselor, setPerLeadCounselor] = useState<Record<string, string>>({});
  const [bulkCounselorId, setBulkCounselorId] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "">("");
  const [toast, setToast] = useState<string | null>(null);

  // Only show leads without a counselor
  const unassigned = leads.filter((l) => !l.counselorId);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return unassigned.filter((l) => {
      if (stageFilter && l.leadStage !== stageFilter) return false;
      if (q) {
        const hay = `${l.firstName} ${l.lastName ?? ""} ${l.email} ${l.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [unassigned, search, stageFilter]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(filtered.map((l) => l.id)) : new Set());
  }

  function assignSingle(leadId: string) {
    const counselorId = perLeadCounselor[leadId];
    if (!counselorId) return;
    const counselor = COUNSELORS.find((c) => c.id === counselorId);
    const lead = leads.find((l) => l.id === leadId);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, counselorId } : l))
    );
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(leadId); return n; });
    showToast(`${lead?.firstName} assigned to ${counselor?.name}`);
  }

  function assignBulk() {
    if (!bulkCounselorId || selectedIds.size === 0) return;
    const counselor = COUNSELORS.find((c) => c.id === bulkCounselorId);
    const count = selectedIds.size;
    setLeads((prev) =>
      prev.map((l) => selectedIds.has(l.id) ? { ...l, counselorId: bulkCounselorId } : l)
    );
    setSelectedIds(new Set());
    setBulkCounselorId("");
    showToast(`${count} lead${count > 1 ? "s" : ""} assigned to ${counselor?.name}`);
  }

  const allSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-8xl space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Unassigned Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Leads without a counsellor — {unassigned.length} pending
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3">
          {(["HOT", "WARM", "COLD", "INQUIRY"] as LeadStage[]).map((stage) => {
            const count = unassigned.filter((l) => l.leadStage === stage).length;
            const { label, className } = STAGE_CONFIG[stage];
            return (
              <div key={stage} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>
                <span className="text-sm font-semibold text-gray-800">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Bulk assign bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            aria-label="Select all"
          />
          <span className="flex-1 text-sm text-gray-500 min-w-[140px]">
            {selectedIds.size > 0
              ? <span className="font-medium text-gray-800">{selectedIds.size} selected</span>
              : "Select leads to bulk assign"}
          </span>
          <select
            value={bulkCounselorId}
            onChange={(e) => setBulkCounselorId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Choose counsellor…</option>
            {COUNSELORS.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.branch}</option>
            ))}
          </select>
          <button
            onClick={assignBulk}
            disabled={!bulkCounselorId || selectedIds.size === 0}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Assign {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as LeadStage | "")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All stages</option>
            <option value="HOT">Hot</option>
            <option value="WARM">Warm</option>
            <option value="COLD">Cold</option>
            <option value="INQUIRY">Inquiry</option>
          </select>
          {(search || stageFilter) && (
            <button
              onClick={() => { setSearch(""); setStageFilter(""); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {/* Lead cards */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <p className="text-sm text-gray-400">
              {unassigned.length === 0 ? "All leads have been assigned 🎉" : "No leads match your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((lead) => {
              const { label, className } = STAGE_CONFIG[lead.leadStage];
              const isSelected = selectedIds.has(lead.id);
              return (
                <div
                  key={lead.id}
                  className={`flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 transition-all ${
                    isSelected ? "border-blue-300 bg-blue-50/40" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleSelect(lead.id, e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 cursor-pointer"
                    aria-label={`Select ${lead.firstName}`}
                  />

                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {getInitials(lead.firstName, lead.lastName)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {lead.firstName} {lead.lastName ?? ""}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
                        {label}
                      </span>
                      {lead.country && (
                        <span className="text-xs text-gray-400">📍 {lead.country}</span>
                      )}
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                        {lead.source}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      <span>{lead.email}</span>
                      <span>{lead.phone}</span>
                      {lead.preferredCourse && <span>{lead.preferredCourse}</span>}
                      {lead.intakeYear && <span>{lead.intakeSeason} {lead.intakeYear}</span>}
                    </div>
                  </div>

                  {/* Per-lead assign */}
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={perLeadCounselor[lead.id] ?? ""}
                      onChange={(e) =>
                        setPerLeadCounselor((prev) => ({ ...prev, [lead.id]: e.target.value }))
                      }
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Assign to…</option>
                      {COUNSELORS.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} · {c.branch}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => assignSingle(lead.id)}
                      disabled={!perLeadCounselor[lead.id]}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}