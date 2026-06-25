"use client";

import { useState } from "react";
import { Counselor } from "@/slids/types/lead.types";


interface BulkAssignBarProps {
  selectedCount: number;
  totalVisible: number;
  allSelected: boolean;
  counselors: Counselor[];
  onToggleAll: (checked: boolean) => void;
  onBulkAssign: (counselorId: string) => Promise<void>;
}

export function BulkAssignBar({
  selectedCount,
  totalVisible,
  allSelected,
  counselors,
  onToggleAll,
  onBulkAssign,
}: BulkAssignBarProps) {
  const [counselorId, setCounselorId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBulkAssign() {
    if (!counselorId || selectedCount === 0) return;
    setLoading(true);
    try {
      await onBulkAssign(counselorId);
      setCounselorId("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
      {/* Select all checkbox */}
      <input
        type="checkbox"
        checked={allSelected}
        onChange={(e) => onToggleAll(e.target.checked)}
        aria-label="Select all visible leads"
        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />

      {/* Selection label */}
      <span className="flex-1 text-sm text-gray-500">
        {selectedCount > 0 ? (
          <span className="font-medium text-gray-800">
            {selectedCount} of {totalVisible} selected
          </span>
        ) : (
          "Select leads to bulk-assign"
        )}
      </span>

      {/* Bulk counsellor picker */}
      <select
        value={counselorId}
        onChange={(e) => setCounselorId(e.target.value)}
        aria-label="Counsellor for bulk assignment"
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Choose counsellor…</option>
        {counselors.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.branch}
          </option>
        ))}
      </select>

      <button
        onClick={handleBulkAssign}
        disabled={!counselorId || selectedCount === 0 || loading}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Assigning…" : `Assign ${selectedCount > 0 ? `(${selectedCount})` : ""}`}
      </button>
    </div>
  );
}