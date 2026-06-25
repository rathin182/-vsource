// app\components\universities\university-card.tsx
"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/slids/components/ui/dropdown-menu";
import { Separator } from "@/slids/components/ui/separator";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Heart,
  Building2,
  Globe,
  Trophy,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { University } from "@/slids/types/index";

interface UniversityCardProps {
  university: University;
  shortlisted?: boolean;
  onShortlist?: (university: University) => void;
  onEdit?: (university: University) => void;
  onDelete?: (university: University) => void;
}

function UniversityCardComponent({
  university,
  shortlisted = false,
  onShortlist,
  onEdit,
  onDelete,
}: UniversityCardProps) {
  const initials = university.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const statusVariant: Record<University["status"], string> = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    inactive: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    // archived: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  const tierVariant: Record<string, string> = {
    T1: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    T2: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    T3: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    T4: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  };
  return (
    <Card className="group h-full overflow-hidden rounded-2xl border bg-background transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="p-0">
        {/* Logo Section */}
        <div className="flex h-40 items-center justify-center border-b bg-muted/20 px-6">
          {university.logo ? (
            <img
              src={university.logo}
              alt={university.name}
              className="max-h-20 max-w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
              {initials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          <div className="text-center">
            <h3 className="line-clamp-2 text-xl font-bold text-foreground">
              {university.name}
            </h3>

            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="outline" className={tierVariant[university.tier]}>
                {university.tier}
              </Badge>

              <Badge
                variant="outline"
                className={statusVariant[university.status]}
              >
                {university.status}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {university.city}, {university.country?.name}
            </p>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3 text-center">
              <p className="text-xs text-muted-foreground">Ranking</p>
              <p className="font-semibold">
                {university.ranking ? `#${university.ranking}` : "-"}
              </p>
            </div>

            <div className="rounded-xl border p-3 text-center">
              <p className="text-xs text-muted-foreground">Courses</p>
              <p className="font-semibold">
                {university._count?.courses ?? 0}
              </p>
            </div>

            <div className="rounded-xl border p-3 text-center">
              <p className="text-xs text-muted-foreground">Fee</p>
              <p className="font-semibold">
                {university.applicationFee
                  ? `${university.currency || "$"} ${Number(
                      university.applicationFee,
                    ).toLocaleString()}`
                  : "Free"}
              </p>
            </div>

            <div className="rounded-xl border p-3 text-center">
              <p className="text-xs text-muted-foreground">Scholarships</p>
              <p className="font-semibold">
                {university._count?.scholarships ?? 0}
              </p>
            </div>
          </div>

          <Link href={`/universities/details/${university.id}`}>
            <Button className="w-full rounded-xl">
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
      <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="font-medium text-sm truncate">{value}</div>
    </div>
  );
}

export const UniversityCard = memo(UniversityCardComponent);