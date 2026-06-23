"use client";
import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/slids/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/slids/components/ui/sheet";
import { Search, ChevronRight, Eye } from "lucide-react";
import { leads as seedLeads } from "@/slids/data/leads";
import { leadStatuses } from "@/slids/data/leads";
import type { Lead } from "@/slids/types";
import { toast } from "sonner";
import { Skeleton } from "@/slids/components/ui/skeleton";

export default function AllocatedLeadsPage() {
  const [counselorFilter, setCounselorFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [reassignLead, setReassignLead] = useState<Lead | null>(null);
  const [reassignCounselor, setReassignCounselor] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchCount, setBranchCount] = useState(1);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [counselors, setCounselors] = useState<any[]>([]);


  // const counselors = Array.from(new Set(seedLeads.map((item) => item.counselor)));
  // const branches = Array.from(new Set(seedLeads.map((item) => item.branch)));
  const statuses = leadStatuses;

  const fetchCounsellor = async () => {
    try {
      const res = await fetch(`/api/users/counselors`, { credentials: "include", });
      if (!res.ok) {
        toast.error("Counsellor not found");
      }
      const data = await res.json();
      setCounselors(data.data || []);
    } catch (error: any) {
      toast.error("Failed to load counselors");
    }
  }

  const fetchBranches = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();

      params.append("page", page.toString());
      params.append("limit", "10");

      if (query) {
        params.append("search", query);
      }

      const res = await fetch(
        `/api/branches?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();

      setBranches(data.data);
      setBranchCount(data.meta.totalPages);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();

      params.append("page", page.toString());
      params.append("limit", "10");

      if (query.trim()) {
        params.append("search", query);
      }

      if (
        statusFilter &&
        statusFilter !== "all"
      ) {
        params.append(
          "status",
          statusFilter
        );
      }

      if (
        branchFilter &&
        branchFilter !== "all"
      ) {
        params.append(
          "branchId",
          branchFilter
        );
      }

      if (
        counselorFilter &&
        counselorFilter !== "all"
      ) {
        params.append(
          "counselorId",
          counselorFilter
        );
      }

      const res = await fetch(
        `/api/leads?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch leads"
        );
      }

      const result = await res.json();
      console.log(result.data);

      setLeads(result.data);

      if (result.meta) {
        setTotalPages(
          result.meta.totalPages ??
          Math.ceil(
            result.meta.total /
            result.meta.limit
          )
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchCounsellor();
    fetchLeads();
  }, []);


  const filteredLeads = leads.filter((lead) => {
    const counselorMatch =
      counselorFilter === "all" ||
      !counselorFilter ||
      lead.counselor?.users?.some(
        (user: any) =>
          user.id === counselorFilter
      );

    const branchMatch =
      branchFilter === "all" ||
      !branchFilter ||
      lead.branch?.id === branchFilter;

    const statusMatch =
      statusFilter === "all" ||
      !statusFilter ||
      lead.status === statusFilter;

    return (
      counselorMatch &&
      branchMatch &&
      statusMatch
    );
  });

  // const filteredLeads = useMemo(() => {
  //   return allocatedLeads.filter((lead) => {
  //     const counselorMatch =
  //       counselorFilter === "all" || !counselorFilter || lead.counselor === counselorFilter;
  //     const branchMatch = branchFilter === "all" || !branchFilter || lead.branch === branchFilter;
  //     const statusMatch = statusFilter === "all" || !statusFilter || lead.status === statusFilter;
  //     return counselorMatch && branchMatch && statusMatch;
  //   });

  // }, [allocatedLeads, counselorFilter, branchFilter, statusFilter]);

  const handleReassign = () => {
    if (!reassignLead || !reassignCounselor) {
      toast.error("Select a counselor to reassign.");
      return;
    }
    toast.success(`${reassignLead.name} reassigned to ${reassignCounselor}`);
    setReassignLead(null);
    setReassignCounselor("");
  };

  return (
    <PageTransition>
      <PageHeader
        title="Allocated Leads"
        description="Review counselor allocations and move leads to the next stage with a single action."
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-2">
            <Label>Filter by Counselor</Label>

            <Select
              value={counselorFilter}
              onValueChange={setCounselorFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All counselors" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>
                    Counselor
                  </SelectLabel>

                  <SelectItem value="all">
                    All
                  </SelectItem>

                  {Array.isArray(counselors) &&
                    counselors.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Filter by Branch</Label>

            <Select
              value={branchFilter}
              onValueChange={setBranchFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>
                    Branch
                  </SelectLabel>

                  <SelectItem value="all">
                    Any Branch
                  </SelectItem>

                  {Array.isArray(branches) &&
                    branches.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Filter by Status</Label>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any status" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>
                    Status
                  </SelectLabel>

                  <SelectItem value="all">
                    Any
                  </SelectItem>

                  {statuses.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-4 py-3">
                  Student Name
                </th>

                <th className="px-4 py-3 hidden md:table-cell">
                  Assigned Counselor
                </th>

                <th className="px-4 py-3">
                  Branch
                </th>

                <th className="px-4 py-3">
                  Country
                </th>

                <th className="px-4 py-3 hidden lg:table-cell">
                  Allocation Date
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3 hidden xl:table-cell">
                  Converted
                </th>

                <th className="px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map(
                  (_, index) => (
                    <tr
                      key={index}
                      className="border-b border-border"
                    >
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>

                      <td className="px-4 py-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-40" />
                      </td>

                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-28" />
                      </td>

                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>

                      <td className="px-4 py-4 hidden lg:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </td>

                      <td className="px-4 py-4">
                        <Skeleton className="h-7 w-20 rounded-full" />
                      </td>

                      <td className="px-4 py-4 hidden xl:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No allocated leads match the filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead: any) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border hover:bg-secondary/30"
                  >
                    {/* Student Name */}
                    <td className="px-4 py-4 font-medium">
                      {lead.firstName}{" "}
                      {lead.lastName ?? ""}
                    </td>

                    {/* Counselor */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      {lead.counselor?.users?.[0]?.name ?? "Unassigned"}
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-4">
                      {lead.branch?.name ?? "—"}
                    </td>

                    {/* Country */}
                    <td className="px-4 py-4">
                      {lead.preferredCountry ??
                        "—"}
                    </td>

                    {/* Allocation Date */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {new Date(
                        lead.createdAt
                      ).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <Badge variant="outline">
                        {lead.status}
                      </Badge>
                    </td>

                    {/* Converted */}
                    <td className="px-4 py-4 hidden xl:table-cell">
                      {lead.student
                        ? "Yes"
                        : "No"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 space-x-1 whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() =>
                          setSelectedLead(lead)
                        }
                      >
                        <Eye className="size-4" />
                      </Button>

                      <Dialog
                        open={
                          reassignLead?.id ===
                          lead.id
                        }
                        onOpenChange={(open) =>
                          setReassignLead(
                            open ? lead : null
                          )
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Reassign Counselor
                            </DialogTitle>
                          </DialogHeader>

                          <div className="grid gap-4 py-2">
                            <div className="grid gap-2">
                              <Label>
                                Student
                              </Label>

                              <Input
                                value={`${lead.firstName} ${lead.lastName ?? ""
                                  }`}
                                disabled
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label>
                                Assign Counselor
                              </Label>

                              <Select
                                value={
                                  reassignCounselor
                                }
                                onValueChange={
                                  setReassignCounselor
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select counselor" />
                                </SelectTrigger>

                                <SelectContent>
                                  <SelectGroup>
                                    {counselors.map(
                                      (item: any) => (
                                        <SelectItem
                                          key={item.id}
                                          value={
                                            item.id
                                          }
                                        >
                                          {item.name}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() =>
                                setReassignLead(
                                  null
                                )
                              }
                            >
                              Cancel
                            </Button>

                            <Button
                              onClick={
                                handleReassign
                              }
                            >
                              Reassign
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet
        open={!!selectedLead}
        onOpenChange={(open) =>
          !open && setSelectedLead(null)
        }
      >
        <SheetContent className="overflow-y-auto">
          {selectedLead && (
            <div>
              <SheetHeader>
                <SheetTitle>
                  {selectedLead.firstName}{" "}
                  {selectedLead.lastName ?? ""}
                </SheetTitle>

                <SheetDescription>
                  Assigned to{" "}
                  {selectedLead.counselor?.users?.[0]?.name ?? "Unassigned"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 py-4">

                {/* Branch */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Branch
                  </div>

                  <div>
                    {selectedLead.branch?.name}
                  </div>
                </div>

                {/* Country */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Preferred Country
                  </div>

                  <div>
                    {selectedLead.preferredCountry ??
                      "—"}
                  </div>
                </div>

                {/* Contact */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Contact Information
                  </div>

                  <div>
                    Phone:{" "}
                    {selectedLead.phone}
                  </div>

                  <div>
                    Email:{" "}
                    {selectedLead.email}
                  </div>

                  <div>
                    Alternate:{" "}
                    {selectedLead.alternatePhone ??
                      "—"}
                  </div>
                </div>

                {/* Academic */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Academic
                  </div>

                  <div>
                    Qualification:{" "}
                    {selectedLead.qualification ??
                      "—"}
                  </div>

                  <div>
                    Percentage:{" "}
                    {selectedLead.percentage ??
                      "—"}
                    %
                  </div>

                  <div>
                    Passing Year:{" "}
                    {selectedLead.passingYear ??
                      "—"}
                  </div>
                </div>

                {/* Study Preference */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Study Preference
                  </div>

                  <div>
                    Course:{" "}
                    {selectedLead.preferredCourse ??
                      "—"}
                  </div>

                  <div>
                    Intake:{" "}
                    {selectedLead.intakeSeason ??
                      "—"}{" "}
                    {selectedLead.intakeYear ??
                      ""}
                  </div>

                  <div>
                    Budget:{" "}
                    {selectedLead.budget
                      ? `₹${selectedLead.budget}`
                      : "—"}
                  </div>
                </div>

                {/* English Tests */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    English Scores
                  </div>

                  <div>
                    IELTS:{" "}
                    {selectedLead.ieltsScore ??
                      "—"}
                  </div>

                  <div>
                    PTE:{" "}
                    {selectedLead.pteScore ??
                      "—"}
                  </div>

                  <div>
                    TOEFL:{" "}
                    {selectedLead.toeflScore ??
                      "—"}
                  </div>

                  <div>
                    Duolingo:{" "}
                    {selectedLead.duolingoScore ??
                      "—"}
                  </div>
                </div>

                {/* Created */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Lead Created
                  </div>

                  <div>
                    {new Date(
                      selectedLead.createdAt
                    ).toLocaleDateString()}
                  </div>
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </div>

                  <Badge
                    variant="outline"
                    className="capitalize"
                  >
                    {selectedLead.status}
                  </Badge>
                </div>

                {/* Notes */}
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Notes
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {selectedLead.notes ??
                      "No notes available."}
                  </p>
                </div>

                {/* Counselor */}
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Counselor
                  </div>

                  <p className="text-sm">
                    {
                      selectedLead.counselor?.users?.[0]
                        ?.name
                    }
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {
                      selectedLead.counselor?.users?.[0]
                        ?.email
                    }
                  </p>
                </div>

                {/* Conversion */}
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Conversion Status
                  </div>

                  <p className="text-sm">
                    {selectedLead.student
                      ? "Converted to Student"
                      : "Not Converted"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}