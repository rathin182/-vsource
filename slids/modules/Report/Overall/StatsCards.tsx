"use client";

import {
  Users,
  GraduationCap,
  FileText,
  Building2,
  UserCheck,
  University,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/slids/components/ui/card";

export interface OverallStats {
  totalLeads: number;
  totalStudents: number;
  totalApplications: number;
  totalBranches: number;
  totalCounselors: number;
  totalUniversities: number;
  conversionRate: number;
  visaApprovalRate: number;
}

interface Props {
  data: OverallStats;
}

export default function StatsCards({ data }: Props) {
  const cards = [
    {
      title: "Total Leads",
      value: data.totalLeads,
      icon: Users,
      color:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    },
    {
      title: "Students",
      value: data.totalStudents,
      icon: GraduationCap,
      color:
        "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
    },
    {
      title: "Applications",
      value: data.totalApplications,
      icon: FileText,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
    },
    {
      title: "Branches",
      value: data.totalBranches,
      icon: Building2,
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
    },
    {
      title: "Counselors",
      value: data.totalCounselors,
      icon: UserCheck,
      color:
        "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
    },
    {
      title: "Universities",
      value: data.totalUniversities,
      icon: University,
      color:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400",
    },
    {
      title: "Conversion",
      value: `${data.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      title: "Visa Approval",
      value: `${data.visaApprovalRate.toFixed(1)}%`,
      icon: BadgeCheck,
      color:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.title}
            className="overflow-hidden border bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {card.title}
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  {card.value}
                </h2>
              </div>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.color}`}
              >
                <Icon className="h-7 w-7" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}