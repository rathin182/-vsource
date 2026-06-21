"use client";
import { useMemo, useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
import { Label } from "@/slids/components/ui/label";
import { Badge } from "@/slids/components/ui/badge";
import { Search, CalendarDays, ListChecks, Clock } from "lucide-react";
import { followups as seedFollowups } from "@/slids/data/followups";
import type { Followup } from "@/slids/types";

const statusOptions = ["Pending", "Completed", "Missed", "Rescheduled"];

export default function AllFollowupPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [counselor, setCounselor] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  const counselors = Array.from(new Set(seedFollowups.map((item) => item.counselor)));

  const filtered = useMemo(() => {
    return seedFollowups.filter((item) => {
      const q = query.toLowerCase();
      const matchSearch =
        !q ||
        item.student.toLowerCase().includes(q) ||
        item.counselor.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q);
      const matchStatus = status === "any" || !status || item.status === status;
      const matchCounselor = counselor === "any" || !counselor || item.counselor === counselor;
      const matchFromDate = !fromDate || new Date(item.date) >= new Date(fromDate);
      const matchToDate = !toDate || new Date(item.date) <= new Date(toDate);
      return matchSearch && matchStatus && matchCounselor && matchFromDate && matchToDate;
    });
  }, [query, status, counselor, fromDate, toDate]);

  return (
    <PageTransition>
      <PageHeader
        title="All Followup"
        description="Track every follow-up action with dates, counselors, type and a timeline view."
        actions={
          <>
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => setViewMode((mode) => (mode === "table" ? "timeline" : "table"))}
            >
              {viewMode === "table" ? (
                <Clock className="size-4 mr-2" />
              ) : (
                <ListChecks className="size-4 mr-2" />
              )}{" "}
              {viewMode === "table" ? "Timeline View" : "Table View"}
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search followups"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Counselor</Label>
            <Select value={counselor} onValueChange={setCounselor}>
              <SelectTrigger>
                <SelectValue placeholder="Any counselor" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Counselor</SelectLabel>
                  <SelectItem value="any">Any</SelectItem>
                  {counselors.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="any">Any</SelectItem>
                  {statusOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>From</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>To</Label>
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setStatus("");
                setCounselor("");
                setFromDate("");
                setToDate("");
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {viewMode === "timeline" ? (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="grid gap-3 md:grid-cols-[1fr_5fr] items-start">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {item.status}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.student}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.followupType} with {item.counselor}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{item.time}</div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.remarks}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-secondary/30 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Counselor</th>
                  <th className="px-4 py-3">Followup Type</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No followups found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-4 font-medium">{item.student}</td>
                      <td className="px-4 py-4">{item.counselor}</td>
                      <td className="px-4 py-4">{item.followupType}</td>
                      <td className="px-4 py-4">
                        {new Date(item.date).toLocaleDateString()} {item.time}
                      </td>
                      <td className="px-4 py-4">{item.country}</td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="capitalize">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{item.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}