"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
import axios from "axios";
import { useState, useMemo, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStage = "INQUIRY" | "HOT" | "WARM" | "COLD";

interface Counselor {
  id: string;
  name: string;
  email: string;
}

interface Lead {
  id: string;
  studentName: string;
  email: string;
  phone: string;
  source: string;
  country: { name: string };
  leadStage: LeadStage;
  preferredCourse?: string | null;
  intakeSeason?: string | null;
  intakeYear?: number | null;
  counselorId?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(studentName: string) {
  return `${studentName[0]}`.toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UnassignedLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<
    { total: number; limit: number; totalPages: number; page: number }[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // FIX: this used to be a single shared string (`selectedCoun`) — meaning
  // whichever lead's dropdown you touched last set ONE global counselor,
  // and every "Assign" button used that same value. Now it's keyed per lead.
  const [perLeadCounselor, setPerLeadCounselor] = useState<
    Record<string, string>
  >({});

  const [counsellor, setCounsellor] = useState<Counselor[]>([]);
  const [bulkCounselorId, setBulkCounselorId] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "">("");
  const [toast, setToast] = useState<string | null>(null);

  // Loading flags so buttons disable correctly during in-flight requests
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Only show leads without a counselor
  const unassigned = leads?.length > 0 ? leads.filter((l) => !l.counselorId) : [];

  const getLeads = async () => {
    const req = await axios.get("/api/leads/unassigned");
    if (req.status === 200) {
      setMeta(req.data.meta);
      setLeads(req.data.data);
    }
  };

  const getCons = async () => {
    const req = await axios.get(`/api/users/counsellor?few=${Boolean(true)}`);
    if (req.status === 200) {
      setCounsellor(req.data.data);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return unassigned.filter((l) => {
      if (stageFilter && l.leadStage !== stageFilter) return false;
      if (q) {
        const hay =
          `${l.studentName} ${l.email} ${l.phone}`.toLowerCase();
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

  // Update only this lead's chosen counselor — never touches any other lead
  function setLeadCounselor(leadId: string, counselorId: string) {
    setPerLeadCounselor((prev) => ({ ...prev, [leadId]: counselorId }));
  }

  // ── Single-lead assign (per-row dropdown + button) ───────────────────────
  async function assignSingle(leadId: string) {
    const counselorId = perLeadCounselor[leadId];
    if (!counselorId) return;

    const counselor = counsellor.find((c) => c.id === counselorId);
    const lead = leads.find((l) => l.id === leadId);

    setAssigningLeadId(leadId);
    try {
      await axios.post("/api/leads/unassigned", {
        leadId,
        counselorId,
      });

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, counselorId } : l)),
      );
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(leadId);
        return n;
      });
      // Clean up this lead's local selection now that it's assigned
      setPerLeadCounselor((prev) => {
        const n = { ...prev };
        delete n[leadId];
        return n;
      });

      showToast(`${lead?.studentName} assigned to ${counselor?.name}`);
    } catch (err) {
      showToast(`Failed to assign ${lead?.studentName}. Try again.`);
    } finally {
      setAssigningLeadId(null);
    }
  }

  // ── Bulk assign (select multiple leads + one counselor) ──────────────────
  async function assignBulk() {
    if (!bulkCounselorId || selectedIds.size === 0) return;

    const counselor = counsellor.find((c) => c.id === bulkCounselorId);
    const idsToAssign = Array.from(selectedIds);
    const count = idsToAssign.length;

    setBulkAssigning(true);
    try {
      // Adjust endpoint/payload shape to match your bulk API route if different
      await axios.post("/api/leads/unassigned/bulk", {
        leadIds: idsToAssign,
        counselorId: bulkCounselorId,
      });

      setLeads((prev) =>
        prev.map((l) =>
          selectedIds.has(l.id) ? { ...l, counselorId: bulkCounselorId } : l,
        ),
      );
      setSelectedIds(new Set());
      setBulkCounselorId("");
      showToast(
        `${count} lead${count > 1 ? "s" : ""} assigned to ${counselor?.name}`,
      );
    } catch (err) {
      showToast(`Failed to assign ${count} lead${count > 1 ? "s" : ""}. Try again.`);
    } finally {
      setBulkAssigning(false);
    }
  }

  const allSelected =
    filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));

  useEffect(() => {
    getLeads();
    getCons();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-8xl space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Unassigned Leads
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Leads without a counsellor — {unassigned.length} pending
          </p>
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
            {selectedIds.size > 0 ? (
              <span className="font-medium text-gray-800">
                {selectedIds.size} selected
              </span>
            ) : (
              "Select leads to bulk assign"
            )}
          </span>

          <Select value={bulkCounselorId} onValueChange={setBulkCounselorId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Choose counsellor…" />
            </SelectTrigger>

            <SelectContent>
              {counsellor.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} · {c.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={assignBulk}
            disabled={!bulkCounselorId || selectedIds.size === 0 || bulkAssigning}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bulkAssigning
              ? "Assigning…"
              : `Assign ${selectedIds.size > 0 ? `(${selectedIds.size})` : ""}`}
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
          {(search || stageFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStageFilter("");
              }}
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
              {unassigned.length === 0
                ? "All leads have been assigned 🎉"
                : "No leads match your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((lead) => {
              const isSelected = selectedIds.has(lead.id);
              const thisLeadCounselor = perLeadCounselor[lead.id] ?? "";
              const isAssigningThis = assigningLeadId === lead.id;

              return (
                <div
                  key={lead.id}
                  className={`flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 transition-all ${
                    isSelected
                      ? "border-blue-300 bg-blue-50/40"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleSelect(lead.id, e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 cursor-pointer"
                    aria-label={`Select ${lead.studentName}`}
                  />

                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {getInitials(lead.studentName)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {lead.studentName}
                      </span>
                      {lead.country && (
                        <span className="text-xs text-gray-400">
                          📍 {lead.country.name}
                        </span>
                      )}
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                        {lead.source}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      <span>{lead.email}</span>
                      <span>{lead.phone}</span>
                      {lead.preferredCourse && (
                        <span>{lead.preferredCourse}</span>
                      )}
                      {lead.intakeYear && (
                        <span>
                          {lead.intakeSeason} {lead.intakeYear}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Per-lead assign — scoped to THIS lead only via perLeadCounselor[lead.id] */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      value={thisLeadCounselor}
                      onValueChange={(value) => setLeadCounselor(lead.id, value)}
                    >
                      <SelectTrigger className="w-[220px] text-xs">
                        <SelectValue placeholder="Assign to…" />
                      </SelectTrigger>

                      <SelectContent>
                        {counsellor.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name} · {c.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => assignSingle(lead.id)}
                      disabled={!thisLeadCounselor || isAssigningThis}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAssigningThis ? "Assigning…" : "Assign"}
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
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}