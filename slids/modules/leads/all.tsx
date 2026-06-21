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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLeads(seedLeads);
      setIsLoading(false);
    }, 450);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((item) => {
        const queryValue = query.toLowerCase();
        const matchQuery =
          !queryValue ||
          item.name.toLowerCase().includes(queryValue) ||
          item.email.toLowerCase().includes(queryValue) ||
          item.phone.includes(queryValue) ||
          item.id.toLowerCase().includes(queryValue);
        const matchStatus = status === "all" || item.status === status;
        const matchBranch = branch === "all" || !branch || item.branch === branch;
        const matchSource = source === "all" || !source || item.source === source;
        return matchQuery && matchStatus && matchBranch && matchSource;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leads, query, status, branch, source]);

  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const pageLeads = filteredLeads.slice(start, start + pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

  const uniqueBranches = Array.from(new Set(seedLeads.map((item) => item.branch)));
  const uniqueSources = Array.from(new Set(seedLeads.map((item) => item.source)));

  const removeLead = (id: string) => {
    setLeads((current) => current.filter((item) => item.id !== id));
    toast.success("Lead deleted");
  };

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
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search leads by name, email or ID"
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
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Branch</Label>
              <Select value={branch} onValueChange={(value) => setBranch(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Branch</SelectLabel>
                    <SelectItem value="all">Any</SelectItem>
                    {uniqueBranches.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
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
        {statusTabs.map((tab) => (
          <Button
            key={tab}
            variant={tab === status ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatus(tab)}
          >
            {tab === "all" ? "All Leads" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-secondary/30 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-4 py-3">Lead ID</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Email</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Branch</th>
                    <th className="px-4 py-3 hidden xl:table-cell">Counselor</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden xl:table-cell">Created Date</th>
                    <th className="px-4 py-3 hidden xl:table-cell">Next Followup</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLeads.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-sm text-muted-foreground">
                        No leads match your filters.
                      </td>
                    </tr>
                  ) : (
                    pageLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border hover:bg-secondary/40">
                        <td className="px-4 py-4 font-medium">{lead.id}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback>
                                {lead.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div>{lead.name}</div>
                              <div className="text-muted-foreground text-xs">{lead.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">{lead.phone}</td>
                        <td className="px-4 py-4 hidden lg:table-cell text-muted-foreground">
                          {lead.email}
                        </td>
                        <td className="px-4 py-4">{lead.source}</td>
                        <td className="px-4 py-4 hidden lg:table-cell">{lead.branch}</td>
                        <td className="px-4 py-4 hidden xl:table-cell">{lead.counselor}</td>
                        <td className="px-4 py-4">{lead.country}</td>
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={`capitalize ${statusStyle[lead.status]}`}
                          >
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell">
                          {lead.nextFollowup
                            ? new Date(lead.nextFollowup).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-4 space-x-1 whitespace-nowrap">
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
                            className="size-8"
                            onClick={() => toast.success("Edit route will be added soon")}
                          >
                            {" "}
                            <Pencil className="size-4" />{" "}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive"
                            onClick={() => removeLead(lead.id)}
                          >
                            {" "}
                            <Trash2 className="size-4" />{" "}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

      <Sheet open={!!selected} onOpenChange={(value) => !value && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{selected.id}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 py-3">
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Contact
                  </div>
                  <div>{selected.phone}</div>
                  <div>{selected.email}</div>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Assignment
                  </div>
                  <div>Branch: {selected.branch}</div>
                  <div>Counselor: {selected.counselor}</div>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </div>
                  <Badge variant="outline" className={`capitalize ${statusStyle[selected.status]}`}>
                    {selected.status}
                  </Badge>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    Notes
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lead created on {new Date(selected.createdAt).toLocaleDateString()}. Next
                    follow-up is scheduled for{" "}
                    {selected.nextFollowup
                      ? new Date(selected.nextFollowup).toLocaleDateString()
                      : "TBD"}
                    .
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
