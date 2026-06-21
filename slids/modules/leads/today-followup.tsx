"use client";
import { useMemo, useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Badge } from "@/slids/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/slids/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/slids/components/ui/dialog";
import { Search, CheckCircle2, Clock3, AlertTriangle, MessageSquare, Calendar } from "lucide-react";
import { followups as seedFollowups } from "@/slids/data/followups";
import type { Followup } from "@/slids/types";
import { toast } from "sonner";

const statusMeta = {
  Pending: { label: "Pending", color: "bg-warning/15 text-warning border-warning/20" },
  Completed: { label: "Completed", color: "bg-success/15 text-success border-success/20" },
  Missed: { label: "Missed", color: "bg-destructive/15 text-destructive border-destructive/20" },
  Rescheduled: { label: "Rescheduled", color: "bg-primary/15 text-primary border-primary/20" },
};

export default function TodayFollowupPage() {
  const [followups, setFollowups] = useState<Followup[]>(
    seedFollowups.filter((item) => new Date(item.date) <= new Date(Date.now() + 86400000 * 1)),
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Followup | null>(null);
  const [rescheduleFollowup, setRescheduleFollowup] = useState<Followup | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [noteFollowup, setNoteFollowup] = useState<Followup | null>(null);
  const [noteText, setNoteText] = useState("");

  const counts = useMemo(() => {
    return {
      pending: followups.filter((item) => item.status === "Pending").length,
      completed: followups.filter((item) => item.status === "Completed").length,
      missed: followups.filter((item) => item.status === "Missed").length,
    };
  }, [followups]);

  const filtered = useMemo(() => {
    const queryValue = query.toLowerCase();
    return followups.filter((item) => {
      return (
        !queryValue ||
        item.student.toLowerCase().includes(queryValue) ||
        item.counselor.toLowerCase().includes(queryValue) ||
        item.country.toLowerCase().includes(queryValue)
      );
    });
  }, [followups, query]);

  const completeFollowup = (id: string) => {
    setFollowups((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "Completed" } : item)),
    );
    toast.success("Follow-up marked complete");
  };

  const reschedule = () => {
    if (!rescheduleFollowup || !rescheduleDate) {
      toast.error("Select a new follow-up date.");
      return;
    }
    setFollowups((current) =>
      current.map((item) =>
        item.id === rescheduleFollowup.id
          ? { ...item, date: new Date(rescheduleDate).toISOString(), status: "Rescheduled" }
          : item,
      ),
    );
    setRescheduleFollowup(null);
    setRescheduleDate("");
    toast.success("Follow-up rescheduled");
  };

  const addNote = () => {
    if (!noteFollowup) {
      return;
    }
    setFollowups((current) =>
      current.map((item) =>
        item.id === noteFollowup.id ? { ...item, notes: `${item.notes} ${noteText}` } : item,
      ),
    );
    setNoteFollowup(null);
    setNoteText("");
    toast.success("Note added");
  };

  return (
    <PageTransition>
      <PageHeader
        title="Today Followup"
        description="Keep todays pipeline moving with pending calls, completed conversations, and missed follow-ups."
      />

      <div className="grid gap-4 xl:grid-cols-3 mb-6">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Pending Followups</div>
              <Clock3 className="size-5 text-warning" />
            </div>
            <div className="text-3xl font-semibold">{counts.pending}</div>
            <p className="text-sm text-muted-foreground">Calls and messages waiting for today.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Completed Followups</div>
              <CheckCircle2 className="size-5 text-success" />
            </div>
            <div className="text-3xl font-semibold">{counts.completed}</div>
            <p className="text-sm text-muted-foreground">Progress recorded by counselors.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Missed Followups</div>
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div className="text-3xl font-semibold">{counts.missed}</div>
            <p className="text-sm text-muted-foreground">Urgent follow-ups that need catch-up.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-[1.7fr_0.9fr] p-5">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search today followups"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3 hidden md:table-cell">Mobile</th>
                <th className="px-4 py-3">Counselor</th>
                <th className="px-4 py-3">Followup Time</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    No follow-ups scheduled for today.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-4">{item.student}</td>
                    <td className="px-4 py-4 hidden md:table-cell">{item.time}</td>
                    <td className="px-4 py-4">{item.counselor}</td>
                    <td className="px-4 py-4">
                      {new Date(item.date).toLocaleDateString()} {item.time}
                    </td>
                    <td className="px-4 py-4">{item.country}</td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={
                          statusMeta[item.status]?.color ??
                          "bg-secondary/15 text-secondary border-secondary/20"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 max-w-xs text-sm text-muted-foreground">
                      {item.notes}
                    </td>
                    <td className="px-4 py-4 space-x-1 whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => completeFollowup(item.id)}
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                      <Dialog
                        open={rescheduleFollowup?.id === item.id}
                        onOpenChange={(open) => setRescheduleFollowup(open ? item : null)}
                      >
                        <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-8">
                            <Calendar className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reschedule Followup</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-2">
                            <div className="grid gap-2">
                              <Label>New date</Label>
                              <Input
                                type="date"
                                value={rescheduleDate}
                                onChange={(event) => setRescheduleDate(event.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => setRescheduleFollowup(null)}
                            >
                              Cancel
                            </Button>
                            <Button type="button" onClick={reschedule}>
                              Reschedule
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => setNoteFollowup(item)}
                      >
                        <MessageSquare className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet open={!!noteFollowup} onOpenChange={(open) => !open && setNoteFollowup(null)}>
        <SheetContent>
          {noteFollowup && (
            <>
              <SheetHeader>
                <SheetTitle>Add Note</SheetTitle>
                <SheetDescription>
                  {noteFollowup.student} | {noteFollowup.counselor}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 py-3">
                <div className="grid gap-2">
                  <Label>Note</Label>
                  <Input value={noteText} onChange={(event) => setNoteText(event.target.value)} />
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                  Current note: {noteFollowup.notes}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setNoteFollowup(null)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={addNote}>
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}