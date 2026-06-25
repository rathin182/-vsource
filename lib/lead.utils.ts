import type { LeadStage, Qualification } from "@/slids/types/lead.types";

/** Build two-letter avatar initials from a lead's name */
export function getInitials(firstName: string, lastName?: string | null): string {
  const first = firstName.trim()[0]?.toUpperCase() ?? "";
  const last = lastName?.trim()[0]?.toUpperCase() ?? "";
  return last ? `${first}${last}` : `${first}${firstName.trim()[1]?.toUpperCase() ?? ""}`;
}

/** Tailwind class sets for each lead stage */
export const STAGE_STYLES: Record<
  LeadStage,
  { badge: string; dot: string; label: string }
> = {
  INQUIRY: {
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    dot: "bg-violet-400",
    label: "Inquiry",
  },
  HOT: {
    badge: "bg-red-50 text-red-700 ring-1 ring-red-200",
    dot: "bg-red-400",
    label: "Hot",
  },
  WARM: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-400",
    label: "Warm",
  },
  COLD: {
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    dot: "bg-sky-400",
    label: "Cold",
  },
};

/** Human-readable qualification labels */
export const QUALIFICATION_LABELS: Record<Qualification, string> = {
  BELOW_10TH: "Below 10th",
  "10TH": "10th",
  "12TH": "12th",
  DIPLOMA: "Diploma",
  BACHELOR: "Bachelor's",
  MASTER: "Master's",
  PHD: "PhD",
};

/** Format a Date to a short readable string */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}