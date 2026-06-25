"use client";

import { useState } from "react";
import { Counselor, Lead, LeadStage } from "@/slids/types/lead.types";
import { StageBadge } from "./Stage";
import { getInitials, QUALIFICATION_LABELS, formatDate } from "@/lib/lead.utils";

interface LeadCardProps {
  lead: Lead;
  counselors: Counselor[];
  selected: boolean;
  onToggleSelect: (id: string, checked: boolean) => void;
  onAssign: (leadId: string, counselorId: string) => Promise<void>;
}

export function LeadCard({
  lead,
  counselors,
  selected,
  onToggleSelect,
  onAssign,
}: LeadCardProps) {
  const [selectedCounselorId, setSelectedCounselorId] = useState("");
  const [loading, setLoading] = useState(false);

  const initials = getInitials(lead.firstName, lead.lastName);

  async function handleAssign() {
    if (!selectedCounselorId) return;
    setLoading(true);
    try {
      await onAssign(lead.id, selectedCounselorId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`group flex items-start gap-4 rounded-xl border bg-white p-4 transition-all duration-150 ${
        selected
          ? "border-blue-300 bg-blue-50/40 shadow-sm"
          : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onToggleSelect(lead.id, e.target.checked)}
        aria-label={`Select ${lead.firstName} ${lead.lastName ?? ""}`}
        className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />

      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
        {initials}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Name + stage */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {lead.firstName} {lead.lastName ?? ""}
          </span>
          <StageBadge stage={lead.leadStage} />
          {lead.country && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              📍 {lead.country}
            </span>
          )}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
            {lead.source}
          </span>
        </div>

        {/* Contact + preferences */}
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>{lead.email}</span>
          <span>{lead.phone}</span>
          {lead.preferredCourse && <span>📚 {lead.preferredCourse}</span>}
          {lead.intakeYear && lead.intakeSeason && (
            <span>
              🗓 {lead.intakeSeason} {lead.intakeYear}
            </span>
          )}
          {lead.qualification && (
            <span>{QUALIFICATION_LABELS[lead.qualification]}</span>
          )}
          <span className="text-gray-400">Added {formatDate(lead.createdAt)}</span>
        </div>
      </div>

      {/* Assignment controls */}
      <div className="flex shrink-0 items-center gap-2">
        <select
          value={selectedCounselorId}
          onChange={(e) => setSelectedCounselorId(e.target.value)}
          aria-label="Select counsellor"
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Assign to…</option>
          {counselors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.branch}
            </option>
          ))}
        </select>

        <button
          onClick={handleAssign}
          disabled={!selectedCounselorId || loading}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Saving…" : "Assign"}
        </button>
      </div>
    </div>
  );
}