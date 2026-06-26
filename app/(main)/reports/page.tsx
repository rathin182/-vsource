"use client";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Download, Filter } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { monthlyRevenue, countryAdmissions, leadSourceSplit, branchesData } from "@/slids/data/mock";
import { RadioGroup, RadioGroupItem } from "@/slids/components/ui/radio-group";
import { Label } from "@/slids/components/ui/label";
import { useState } from "react";
import OverallReports from "./OverallReports";
import BranchReports from "./BranchReports";
import CounselorReports from "./CounselorReports";

const COLORS = ["oklch(0.58 0.22 27)", "oklch(0.62 0.15 240)", "oklch(0.65 0.17 155)", "oklch(0.78 0.16 75)", "oklch(0.55 0.2 305)"];

export default function Reports() {
const [view, setView] = useState("overall");

return (
  <PageTransition>
    <PageHeader
      title="Reports & Analytics"
      description="Deep dive into revenue, conversions and branch performance."
      actions={
        <RadioGroup
          value={view}
          onValueChange={setView}
          className="flex items-center gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="overall" id="overall" />
            <Label htmlFor="overall">Overall</Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="branches" id="branches" />
            <Label htmlFor="branches">Branches</Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="counselor" id="counselor" />
            <Label htmlFor="counselor">Counselor</Label>
          </div>
        </RadioGroup>
      }
    />

    {view === "overall" && (
      <OverallReports />
    )}

    {view === "branches" && (
      <BranchReports />
    )}

    {view === "counselor" && (
      <CounselorReports />
    )}
  </PageTransition>
);
}
