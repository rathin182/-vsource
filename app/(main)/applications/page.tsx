"use client";
import { useEffect, useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/slids/components/ui/dialog";
import { Plus, GripVertical } from "lucide-react";
import { applications as seed } from "@/slids/data/mock";
import type { Application, ApplicationStage } from "@/slids/types";
import { toast } from "sonner";

const STAGES: { key: ApplicationStage; label: string; color: string }[] = [
  { key: "inquiry", label: "Inquiry", color: "bg-info/15 text-info" },
  { key: "documents", label: "Documents", color: "bg-warning/15 text-warning" },
  { key: "applied", label: "Applied", color: "bg-primary/10 text-primary" },
  { key: "offer", label: "Offer Received", color: "bg-success/15 text-success" },
  { key: "visa", label: "Visa Process", color: "bg-chart-5/15 text-chart-5" },
  { key: "enrolled", label: "Enrolled", color: "bg-success text-white" },
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("today");
  const empty = { studentName: "", university: "", program: "MS Computer Science", intake: "Fall 2026", counselor: "Aditi Rao" };
  const [form, setForm] = useState(empty);

  const me = async () => {
    try {
      const response = await fetch(
        "/api/auth/me"
      );

      const user = await response.json();
      const role = user?.role?.id
      const leadRes = await fetch(
        `/api/leads/leadsforcounsoler?counselorId=${role}`
      );


      const leadData = await leadRes.json();

      // const formatted = leadData.data.map((lead: any) => ({
      //   id: lead.id,
      //   stage: lead.leadStage,
      //   studentName:
      //     `${lead.firstName} ${lead.lastName ?? ""}`.trim(),
      //   university:
      //     lead.preferredCountry ?? "Not Selected",
      //   program:
      //     lead.preferredCourse ?? "Not Selected",
      //   intake:
      //     lead.intakeSeason ?? "N/A",
      //   counselor:
      //     lead.counselor?.name ?? "N/A",
      // }));

      const formatted = leadData.data.map((lead: any) => ({
        id: lead.id,
        stage: lead.leadStage,
        studentName:
          `${lead.firstName} ${lead.lastName ?? ""}`.trim(),
        university:
          lead.preferredCountry ?? "Not Selected",
        program:
          lead.preferredCourse ?? "Not Selected",
        intake:
          lead.intakeSeason ?? "N/A",
        counselor:
          lead.counselor?.name ?? "N/A",
        createdAt: lead.createdAt,
      }));
      setApps(formatted || []);
    } catch (error) {
      console.error(
        "Error fetching data:",
        error
      );
    }
  };



  const moveTo = async (
    id: string,
    stage: ApplicationStage
  ) => {
    // Update UI immediately
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, stage }
          : a
      )
    );
    console.log(id, stage);
    try {
      await fetch(`/api/leads/leadsforcounsoler?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadStage: stage,
        }),
      });

      me()

    } catch (error) {
      console.error(error);
    }
  };

  const add = () => {
    if (!form.studentName || !form.university) return toast.error("Student and university required");
    setApps([{ id: `AP${Date.now()}`, ...form, stage: "inquiry", updatedAt: new Date().toISOString() }, ...apps]);
    setOpen(false); setForm(empty);
    toast.success("Application created");
  };

  const filteredApps = apps.filter((app) => {
    const created = new Date(app.createdAt);

    const today = new Date();

    if (filter === "today") {
      return (
        created.toDateString() === today.toDateString()
      );
    }

    if (filter === "yesterday") {
      const yesterday = new Date();

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      return (
        created.toDateString() === yesterday.toDateString()
      );
    }

    if (filter === "7days") {
      const last7 = new Date();

      last7.setDate(
        last7.getDate() - 7
      );

      return created >= last7;
    }

    return true;
  });

  useEffect(() => {
    me();
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Applications"
        description="Kanban pipeline from inquiry to enrollment."
        actions={
          <div>
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
              className="h-9 rounded-md border px-3 text-sm"
            >
              <option value="today">
                Today
              </option>

              <option value="yesterday">
                Yesterday
              </option>

              <option value="7days">
                Last 7 Days
              </option>

              <option value="all">
                All
              </option>
            </select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="size-4 mr-1.5" /> New Application</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New application</DialogTitle></DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-1.5"><Label>Student name</Label><Input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label>University</Label><Input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5"><Label>Program</Label><Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} /></div>
                    <div className="grid gap-1.5"><Label>Intake</Label><Input value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} /></div>
                  </div>
                  <div className="grid gap-1.5"><Label>Counselor</Label><Input value={form.counselor} onChange={(e) => setForm({ ...form, counselor: e.target.value })} /></div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const items = filteredApps.filter((a) => a.stage === stage.key.toUpperCase());
          return (
            <div
              key={stage.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragId && moveTo(dragId, stage.key)}
              className="rounded-2xl bg-secondary/40 border border-border p-3 min-h-[420px]"
            >
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className={`text-[10px] ${stage.color}`}>{stage.label}</Badge>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a) => (
                  <Card key={a.id} draggable onDragStart={() => setDragId(a.id)} onDragEnd={() => setDragId(null)} className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{a.studentName}</div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">{a.university}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{a.program}</div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-[9px]">{a.intake}</Badge>
                            <span className="text-[10px] text-muted-foreground">{a.counselor.split(" ")[0]}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && <div className="text-center text-[11px] text-muted-foreground py-8">Drop here</div>}
              </div>
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
