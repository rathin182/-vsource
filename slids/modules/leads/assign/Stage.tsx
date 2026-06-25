import { STAGE_STYLES } from "@/lib/lead.utils";
import { LeadStage } from "@/slids/types/lead.types";

interface StageBadgeProps {
  stage: LeadStage;
}

export function StageBadge({ stage }: StageBadgeProps) {
  const { badge, dot, label } = STAGE_STYLES[stage];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}