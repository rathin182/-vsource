interface StatCardProps {
  label: string;
  value: number | string;
  accent?: "default" | "blue" | "amber" | "red";
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "text-gray-900",
  blue: "text-blue-600",
  amber: "text-amber-600",
  red: "text-red-600",
};

export function StatCard({ label, value, accent = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${ACCENT_CLASSES[accent]}`}>
        {value}
      </p>
    </div>
  );
}