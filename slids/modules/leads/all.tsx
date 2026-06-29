"use client";
import { useMemo, useState, useEffect } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Badge } from "@/slids/components/ui/badge";
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
import { Avatar, AvatarFallback } from "@/slids/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/slids/components/ui/sheet";
import { Search, Filter, Download, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { leads as seedLeads } from "@/slids/data/leads";
import type { Lead, LeadStatus } from "@/slids/types";
import { toast } from "sonner";
import { Skeleton } from "@/slids/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { leadStatuses } from "@/slids/data/leads";

const statusStyle: Record<LeadStatus, string> = {
  new: "bg-info/15 text-info border-info/20",
  contacted: "bg-warning/15 text-warning border-warning/20",
  qualified: "bg-primary/10 text-primary border-primary/20",
  converted: "bg-success/15 text-success border-success/20",
  lost: "bg-muted text-muted-foreground border-border",
};

const statusTabs: Array<LeadStatus | "all"> = [
  "all",
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

export default function AllLeadsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [branch, setBranch] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [branches, setBranches] = useState<any[]>([]);
  const [leadStage, setLeadStage] = useState("");
  const [country, setCountry] = useState("");
  const [counselor, setCounselor] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [deleteing, setDeleting] = useState(false);
  const [user, setUser] = useState<any>({});
  const [convert, setConvert] = useState(false);
  const statuses = leadStatuses;

  const me = async () => {
    try {
      const response = await fetch(
        "/api/auth/me"
      );

      if (!response.ok) {
        toast.error("something went wrong");
        return;
      }

      const user = await response.json();
      setUser(user)

    } catch (error) {
      console.error(
        "Error fetching data:",
        error
      );
    }
  };

  const fetchLeads = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();

      params.append("page", page.toString());
      params.append("limit", "10");

      const response = await fetch(`/api/leads/allleads`, { credentials: "include", });

      if (!response.ok) {
        throw new Error(
          "Failed to fetch leads"
        );
      }

      const result = await response.json();

      setLeads(result.data);

      // setTotalPages(
      //   result.meta?.totalPages ??
      //     Math.ceil(
      //       result.meta.total /
      //         result.meta.limit
      //     )
      // );
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load leads"
      );
    } finally {
      setIsLoading(false);
    }
  };
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
      // setBranchCount(data.meta.totalPages);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchBranches();
    me();
  }, []);

  // const filteredLeads = useMemo(() => {
  //   return leads
  //     .filter((item) => {
  //       const queryValue = query.toLowerCase();
  //       const matchQuery =
  //         !queryValue ||
  //         item.name.toLowerCase().includes(queryValue) ||
  //         item.email.toLowerCase().includes(queryValue) ||
  //         item.phone.includes(queryValue) ||
  //         item.id.toLowerCase().includes(queryValue);
  //       const matchStatus = status === "all" || item.status === status;
  //       const matchBranch = branch === "all" || !branch || item.branch === branch;
  //       const matchSource = source === "all" || !source || item.source === source;
  //       return matchQuery && matchStatus && matchBranch && matchSource;
  //     })
  //     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // }, [leads, query, status, branch, source]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((item) => {
        const queryValue = query.toLowerCase();

        const matchQuery =
          !queryValue ||
          item.firstName
            ?.toLowerCase()
            .includes(queryValue) ||
          item.lastName
            ?.toLowerCase()
            .includes(queryValue) ||
          item.email
            ?.toLowerCase()
            .includes(queryValue) ||
          item.phone
            ?.includes(queryValue) ||
          item.preferredCountry
            ?.toLowerCase()
            .includes(queryValue);
        item.preferredCourse
          ?.includes(queryValue) ||
          item.intakeSeason
            ?.includes(queryValue)

        const matchStatus =
          status === "all" ||
          item.status === status;

        const matchBranch =
          branch === "all" ||
          !branch ||
          item.branch?.id === branch;

        const matchSource =
          source === "all" ||
          !source ||
          item.source === source;

        return (
          matchQuery &&
          matchStatus &&
          matchBranch &&
          matchSource
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [leads, query, status, branch, source]);


  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const pageLeads = filteredLeads.slice(start, start + pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  const uniqueBranches = Array.from(new Set(seedLeads.map((item) => item.branch)));
  const uniqueSources = Array.from(new Set(seedLeads.map((item) => item.source)));
  const removeLead = async () => {
    try {
      if (!selectedLeadId) {
        toast.error("Could not found Lead Id");
      }
      setDeleting(true)

      const res = await fetch(
        `/api/leads?id=${selectedLeadId.toString()}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          }
        }
      );

      const data = await res.json();
    } catch (error) {
      toast.error("Failed to Delete Lead");
    } finally {
      setDeleting(false)
      setShowDeletePopup(false);
      fetchLeads();
    }
  };

  const openDeletePopup = (id: any) => {
    setSelectedLeadId(id);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    if (!selectedLeadId) return;

    await removeLead(selectedLeadId);

    setShowDeletePopup(false);
    setSelectedLeadId(null);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setSelectedLeadId(null);
  };

  const handleConvertToStudent = async (leads: any, selectedlead: any) => {

    if (leads !== "CONVERTED") {
      return toast.error(
        "Only converted leads can be converted to students."
      );
    }

    try {
      setConvert(true)
      const res = await fetch(`/api/student`, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(selectedlead),
      });

      if (!res.ok) {
        toast.error("Convert Error");
        return;
      }

      const data = await res.json();
      toast.success("Success", {
        description: data.message,
      });
    } catch (error) {
      toast.error("Convert Error");
    } finally {
      setConvert(false);
      fetchLeads();
    }


  };

  const canConvertStudent = [
    "SUPER ADMIN",
    "ADMIN",
    "COUNSELLOR",
  ].includes(user?.role?.name?.toUpperCase());

  return (
    <PageTransition>
      <PageHeader
        title="All Leads"
        description="Manage every enquiry in the CRM with search, filters, export and status-driven navigation."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success("Export started")}>
              {" "}
              <Download className="size-4 mr-2" /> Export
            </Button>
            <Button size="sm" onClick={() => router.push("/leads/add")}>
              {" "}
              <Plus className="size-4 mr-2" /> Add Lead
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 lg:grid-cols-[1.9fr_2.1fr] xl:grid-cols-[1.8fr_2.2fr] p-5">
          <div className="relative flex items-center mt-5">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search leads by name email or phone number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as LeadStatus | "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
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
            <div className="grid gap-2">
              <Label>Branch</Label>
              <Select
                value={branch}
                onValueChange={(value) => {
                  setBranch(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any branch" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Branch</SelectLabel>

                    <SelectItem value="all">
                      Any Branch
                    </SelectItem>

                    {branches.map((item) => (
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
              <Label>Source</Label>
              <Select value={source} onValueChange={(value) => setSource(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Source</SelectLabel>
                    <SelectItem value="all">Any</SelectItem>
                    {uniqueSources.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {!isLoading &&
          statusTabs.map((tab) => (
            <Button
              key={tab}
              variant={tab === status ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatus(tab)}
            >
              {tab === "all"
                ? "All Leads"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
      </div>

      {/* main card */}
      {/* <div> */}
{/* Table Header */}
<div className="bg-secondary/30">
  {isLoading ? (
    <div className="flex px-4 py-3 gap-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="flex-1">
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  ) : (
    <div className="flex px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
      <div className="w-24 shrink-0">Lead No</div>
      <div className="flex-1 min-w-[140px]">Student</div>
      <div className="w-28 shrink-0">Mobile</div>
      <div className="w-40 shrink-0 hidden lg:block">Email</div>
      <div className="w-24 shrink-0">Source</div>
      <div className="w-28 shrink-0 hidden lg:block">Branch</div>
      <div className="w-28 shrink-0 hidden xl:block">Counselor</div>
      <div className="w-24 shrink-0">Country</div>
      <div className="w-24 shrink-0">Status</div>
      <div className="w-24 shrink-0 hidden xl:block">Created</div>
      <div className="w-24 shrink-0 hidden xl:block">Follow-up</div>
      <div className="w-20 shrink-0">Actions</div>
    </div>
  )}
</div>

{/* Table Body */}
<div>
  {isLoading ? (
    Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-center px-4 py-4 border-b border-border gap-4">
        <div className="w-24 shrink-0">
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>

        <div className="w-28 shrink-0">
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="w-40 shrink-0 hidden lg:block">
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="w-24 shrink-0">
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="w-28 shrink-0 hidden lg:block">
          <Skeleton className="h-4 w-28" />
        </div>

        <div className="w-28 shrink-0 hidden xl:block">
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="w-24 shrink-0">
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="w-24 shrink-0">
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>

        <div className="w-24 shrink-0 hidden xl:block">
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="w-24 shrink-0 hidden xl:block">
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="w-20 shrink-0">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    ))
  ) : filteredLeads.length === 0 ? (
    <div className="py-12 text-center text-sm text-muted-foreground">
      No leads found.
    </div>
  ) : (
    filteredLeads.map((lead) => (
      <div
        key={lead.id}
        className="flex items-center px-4 py-4 border-b border-border hover:bg-secondary/40 gap-4"
      >
        {/* ID */}
        <div className="w-24 shrink-0 font-medium text-sm">
          {lead.id.slice(0, 8)}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-[140px] text-md">
          <div className="flex items-center gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback>
                {`${lead.firstName ?? ""} ${lead.lastName ?? ""}`
                  .trim()
                  .split(" ")
                  .map((part: string) => part[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              {lead.firstName} {lead.lastName}
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="w-28 shrink-0 text-sm">
          {lead.phone ?? "—"}
        </div>

        {/* Email */}
        <div className="w-40 shrink-0 hidden lg:block text-muted-foreground text-sm">
          {lead.email ?? "—"}
        </div>

        {/* Source */}
        <div className="w-24 shrink-0 text-sm">
          {lead.source ?? "—"}
        </div>

        {/* Branch */}
        <div className="w-28 shrink-0 hidden lg:block text-sm">
          {lead.branch?.name ?? "—"}
        </div>

        {/* Counselor */}
        <div className="w-28 shrink-0 hidden xl:block text-sm">
          {lead.counselor?.name ?? "Unassigned"}
        </div>

        {/* Preferred Country */}
        <div className="w-24 shrink-0 text-sm">
          {lead.preferredCountry ?? "—"}
        </div>

        {/* Status */}
        <div className="w-24 shrink-0 text-sm">
          <Badge
            variant="outline"
            className={`capitalize ${statusStyle[lead.status as LeadStatus]}`}
          >
            {lead.status ?? "—"}
          </Badge>
        </div>

        {/* Created Date */}
        <div className="w-24 shrink-0 hidden xl:block text-sm">
          {new Date(lead.createdAt).toLocaleDateString()}
        </div>

        {/* Follow-up / Student Conversion */}
        <div className="w-24 shrink-0 hidden xl:block text-sm">
          {lead.student ? <Badge>Converted</Badge> : "—"}
        </div>

        {/* Actions */}
        <div className="w-20 shrink-0 flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => setSelected(lead)}
          >
            <Eye className="size-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-destructive"
            onClick={() => openDeletePopup(lead.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    ))
  )}
</div>
      {/* </div> */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
        <div>
          {filteredLeads.length} result{filteredLeads.length === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <span>
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pageCount}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {showDeletePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[400px] rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">
              Delete Lead
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>

              <Button
                variant="destructive"
                disabled={deleteing}
                onClick={() => { removeLead(); }}
              >
                {deleteing ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet
        open={!!selected}
        onOpenChange={(value) =>
          !value && setSelected(null)
        }
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-5">
                  <SheetTitle className="text-xl font-semibold">
                    {selected.firstName} {selected.lastName}
                  </SheetTitle>

                  {canConvertStudent && (
                    <button
                      disabled={selected?.student?.id}
                      title={
                        selected?.student?.id
                          ? "Already converted to student"
                          : "Convert to Student"
                      }
                      onClick={() =>
                        handleConvertToStudent(selected.status, selected)
                      }
                      className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200
      ${selected?.student?.id
                          ? "cursor-not-allowed bg-gray-400 opacity-60"
                          : "cursor-pointer bg-red-600 hover:bg-red-700 hover:shadow-md active:scale-95"
                        }`}
                    >
                      {selected?.student?.id ? "Already Converted" : "Convert to Student"}
                    </button>
                  )}
                </div>

                <SheetDescription>
                  {selected.email}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 py-4">

                {/* Contact */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Contact Information
                  </div>

                  <div>
                    Phone: {selected.phone}
                  </div>

                  <div>
                    Alternate:{" "}
                    {selected.alternatePhone ?? "—"}
                  </div>

                  <div>
                    Email: {selected.email}
                  </div>

                  <div>
                    DOB:{" "}
                    {selected.dob
                      ? new Date(
                        selected.dob
                      ).toLocaleDateString()
                      : "—"}
                  </div>

                  <div>
                    Gender:{" "}
                    {selected.gender ?? "—"}
                  </div>
                </div>

                {/* Assignment */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Assignment
                  </div>

                  <div>
                    Branch:{" "}
                    {selected.branch?.name}
                  </div>

                  <div>
                    Counselor:{" "}
                    {selected.counselor?.name ?? "—"}
                  </div>
                </div>

                {/* Study Preference */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Study Preference
                  </div>

                  <div>
                    Country:{" "}
                    {selected.preferredCountry ??
                      "—"}
                  </div>

                  <div>
                    Course:{" "}
                    {selected.preferredCourse ??
                      "—"}
                  </div>

                  <div>
                    Intake:{" "}
                    {selected.intakeSeason ??
                      "—"}{" "}
                    {selected.intakeYear ?? ""}
                  </div>

                  <div>
                    Budget:{" "}
                    {selected.budget
                      ? `₹${selected.budget}`
                      : "—"}
                  </div>
                </div>

                {/* Academic */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Academic
                  </div>

                  <div>
                    Qualification:{" "}
                    {selected.qualification ??
                      "—"}
                  </div>

                  <div>
                    Percentage:{" "}
                    {selected.percentage ?? "—"}%
                  </div>

                  <div>
                    Passing Year:{" "}
                    {selected.passingYear ??
                      "—"}
                  </div>
                </div>

                {/* English Tests */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    English Test Scores
                  </div>

                  <div>
                    IELTS:{" "}
                    {selected.ieltsScore ??
                      "—"}
                  </div>

                  <div>
                    PTE:{" "}
                    {selected.pteScore ??
                      "—"}
                  </div>

                  <div>
                    TOEFL:{" "}
                    {selected.toeflScore ??
                      "—"}
                  </div>

                  <div>
                    Duolingo:{" "}
                    {selected.duolingoScore ??
                      "—"}
                  </div>
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </div>

                  <Badge
                    variant="outline"
                    className={`capitalize ${statusStyle[
                      selected.status as LeadStatus
                    ]
                      }`}
                  >
                    {selected.status}
                  </Badge>
                </div>

                {/* Notes */}
                <div className="rounded-2xl border border-border p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    Lead Information
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Source: {selected.source}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Created:{" "}
                    {new Date(
                      selected.createdAt
                    ).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Referral:{" "}
                    {selected.referralSource ??
                      "—"}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Notes:{" "}
                    {selected.notes ??
                      "No remarks"}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}
