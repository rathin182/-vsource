"use client";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Download, Filter, Loader2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { monthlyRevenue, countryAdmissions, leadSourceSplit, branchesData } from "@/slids/data/mock";
import { RadioGroup, RadioGroupItem } from "@/slids/components/ui/radio-group";
import { Label } from "@/slids/components/ui/label";
import { useCallback, useEffect, useState } from "react";
import OverallReports from "./OverallReports";
import BranchReports from "./BranchReports";
import CounselorReports from "./CounselorReports";
import PerformanceReportsPage from "@/slids/modules/Report/Overall/PerformanceReportsPage";
import { AuthMeResponse, AuthMeUser } from "@/slids/types/counselor-report";
import { toast } from "sonner";
import MyCounselorReport from "@/slids/modules/Report/singlecounselor/MyCounselorReport";

const COLORS = ["oklch(0.58 0.22 27)", "oklch(0.62 0.15 240)", "oklch(0.65 0.17 155)", "oklch(0.78 0.16 75)", "oklch(0.55 0.2 305)"];
type LoadState = "checking_auth" | "not_logged_in" | "not_counselor" | "loading_report" | "ready" | "error";

export default function Reports() {
  const [view, setView] = useState("overall");
  const [user, setUser] = useState<AuthMeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const me = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/auth/me"
      );

      if (!response.ok) {
        toast.error("something went wrong");
        return;
      }

      const user = await response.json();

      if (user.role?.name !== "Counsellor") {
        return;
      }
      setUser(user)

    } catch (error) {
      console.error(
        "Error fetching data:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    me()
  }, []);

  if (loading) {
  return (
   <PageTransition>
  <div className="flex h-[70vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-red-500" />
  </div>
</PageTransition>
  );
}

  return (
    <PageTransition>
      <PageHeader
        title="Reports & Analytics"
        description="Deep dive into revenue, conversions and branch performance."
        actions={
          user?.role?.name !== "Counsellor" && (
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
          )
        }
      />

      {user?.role?.name !== "Counsellor" && (
        <>
          {view === "overall" && (
            <PerformanceReportsPage />
          )}

          {view === "branches" && (
            <BranchReports />
          )}

          {view === "counselor" && (
            <CounselorReports />
          )}
        </>
      )}

      {user?.role?.name === "Counsellor" && (
        <div>
          <MyCounselorReport me={user} reload={me} />
        </div>
      )}

    </PageTransition>
  );
}
