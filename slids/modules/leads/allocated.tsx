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
import type { Lead } from "@/slids/types";
import { toast } from "sonner";

export default function AllocatedLeadsPage() {
  const [counselorFilter, setCounselorFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [reassignLead, setReassignLead] = useState<Lead | null>(null);
  const [reassignCounselor, setReassignCounselor] = useState("");

  const counselors = Array.from(new Set(seedLeads.map((item) => item.counselor)));
  const branches = Array.from(new Set(seedLeads.map((item) => item.branch)));
  const statuses = Array.from(new Set(seedLeads.map((item) => item.status)));

  const allocatedLeads = useMemo(() => {
    return seedLeads
      .filter((lead) => !!lead.allocationDate)
      .map((lead) => ({
        ...lead,
        nextFollowup: lead.nextFollowup || new Date(Date.now() + 2 * 86400000).toISOString(),
      }));
  }, []);

  const filteredLeads = useMemo(() => {
    return allocatedLeads.filter((lead) => {
      const counselorMatch =
        counselorFilter === "all" || !counselorFilter || lead.counselor === counselorFilter;
      const branchMatch = branchFilter === "all" || !branchFilter || lead.branch === branchFilter;
      const statusMatch = statusFilter === "all" || !statusFilter || lead.status === statusFilter;
      return counselorMatch && branchMatch && statusMatch;
    });
  }, [allocatedLeads, counselorFilter, branchFilter, statusFilter]);

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
            <Select value={counselorFilter} onValueChange={setCounselorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All counselors" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Counselor</SelectLabel>
                  <SelectItem value="all">All</SelectItem>
                  {counselors.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Filter by Branch</Label>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Branch</SelectLabel>
                  <SelectItem value="all">All</SelectItem>
                  {branches.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Filter by Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="all">Any</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
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
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Assigned Counselor</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3 hidden lg:table-cell">Allocation Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden xl:table-cell">Next Followup</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    No allocated leads match the filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-4 font-medium">{lead.name}</td>
                    <td className="px-4 py-4 hidden md:table-cell">{lead.counselor}</td>
                    <td className="px-4 py-4">{lead.branch}</td>
                    <td className="px-4 py-4">{lead.country}</td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {lead.allocationDate
                        ? new Date(lead.allocationDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-4">{lead.status}</td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      {lead.nextFollowup ? new Date(lead.nextFollowup).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-4 space-x-1 whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Dialog
                        open={reassignLead?.id === lead.id}
                        onOpenChange={(open) => setReassignLead(open ? lead : null)}
                      >
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-8">
                            <ChevronRight className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reassign Counselor</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-2">
                            <div className="grid gap-2">
                              <Label>Current Student</Label>
                              <Input value={lead.name} disabled />
                            </div>
                            <div className="grid gap-2">
                              <Label>Assign Counselor</Label>
                              <Select
                                value={reassignCounselor}
                                onValueChange={setReassignCounselor}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select counselor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {counselors.map((name) => (
                                      <SelectItem key={name} value={name}>
                                        {name}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => setReassignLead(null)}
                            >
                              Cancel
                            </Button>
                            <Button type="button" onClick={handleReassign}>
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

      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent>
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLead.name}</SheetTitle>
                <SheetDescription>Assigned to {selectedLead.counselor}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 py-3">
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Branch
                  </div>
                  <div>{selectedLead.branch}</div>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Country
                  </div>
                  <div>{selectedLead.country}</div>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Allocation Date
                  </div>
                  <div>
                    {new Date(
                      selectedLead.allocationDate || selectedLead.createdAt,
                    ).toLocaleDateString()}
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Next Followup
                  </div>
                  <div>
                    {selectedLead.nextFollowup
                      ? new Date(selectedLead.nextFollowup).toLocaleDateString()
                      : "Not set"}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    Counselor Notes
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This lead is currently allocated to {selectedLead.counselor} and is being
                    handled in the {selectedLead.branch} branch.
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