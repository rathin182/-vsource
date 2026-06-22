"use client";
import { useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Badge } from "@/slids/components/ui/badge";
import { Progress } from "@/slids/components/ui/progress";
import { Avatar, AvatarFallback } from "@/slids/components/ui/avatar";
import { Search, Plus, Filter, Mail, Phone, GraduationCap, FileText, Award } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/slids/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/slids/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/slids/components/ui/tabs";
import { students as seed } from "@/slids/data/mock";
import type { Student } from "@/slids/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const router = useRouter();
  const [list, setList] = useState<Student[]>(seed);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Student | null>(null);
  const [open, setOpen] = useState(false);
  const empty = { name: "", email: "", phone: "", dob: "", country: "USA", program: "MS Computer Science", intake: "Fall 2026", status: "Active" };
  const [form, setForm] = useState(empty);

  const filtered = list.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  const add = () => {
    if (!form.name || !form.email) return toast.error("Name and email are required");
    const s: Student = { id: `ST${Date.now()}`, ...form, progress: 20 };
    setList([s, ...list]);
    setOpen(false); setForm(empty);
    toast.success("Student added");
  };

  return (
    <PageTransition>
      <PageHeader
        title="Students"
        description="Complete profile management with academic & visa history."
        actions={<>
          <Button variant="outline" size="sm"><Filter className="size-4 mr-1.5" /> Filter</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="size-4 mr-1.5" /> Add Student</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add new student</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1.5"><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>DOB</Label><Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Program</Label><Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label>Intake</Label><Input value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>}
      />

      <div className="mb-4 relative max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 duration-200" onClick={() => setSel(s)}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-[image:var(--gradient-primary)] text-white font-semibold">
                    {s.name.split(" ").map((p) => p[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.id} · {s.intake}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><GraduationCap className="size-3.5" /> {s.program}</div>
                <div className="flex items-center gap-2"><Mail className="size-3.5" /> {s.email}</div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Profile completeness</span>
                  <span className="font-medium">{s.progress}%</span>
                </div>
                <Progress value={s.progress} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!sel} onOpenChange={(v) => !v && setSel(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {sel && (
            <div>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-14"><AvatarFallback className="bg-[image:var(--gradient-primary)] text-white font-bold">{sel.name.split(" ").map((p) => p[0]).join("")}</AvatarFallback></Avatar>
                    <div>
                      <div className="flex gap-3 mb-2">
                        <SheetTitle>{sel.name}</SheetTitle>
                        <div>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/students/${sel.id}`)}>View More</Button>
                        </div>
                      </div>
                      <SheetDescription>{sel.id} · {sel.country} · {sel.intake}</SheetDescription>
                    </div>
                </div>
              </SheetHeader>
              <div className="px-4 mt-6">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="academics" className="flex-1">Academics</TabsTrigger>
                    <TabsTrigger value="docs" className="flex-1">Documents</TabsTrigger>
                    <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-border p-3"><div className="text-[11px] text-muted-foreground">Email</div><div className="flex items-center gap-1.5 mt-1"><Mail className="size-3.5" />{sel.email}</div></div>
                      <div className="rounded-lg border border-border p-3"><div className="text-[11px] text-muted-foreground">Phone</div><div className="flex items-center gap-1.5 mt-1"><Phone className="size-3.5" />{sel.phone}</div></div>
                      <div className="rounded-lg border border-border p-3"><div className="text-[11px] text-muted-foreground">DOB</div><div className="mt-1">{sel.dob}</div></div>
                      <div className="rounded-lg border border-border p-3"><div className="text-[11px] text-muted-foreground">Program</div><div className="mt-1">{sel.program}</div></div>
                    </div>
                  </TabsContent>
                  <TabsContent value="academics" className="space-y-2 mt-4">
                    {[{ l: "10th Grade", v: "CBSE · 92%" }, { l: "12th Grade", v: "State Board · 88%" }, { l: "Bachelors", v: "B.Tech CSE · 8.4 CGPA" }, { l: "IELTS", v: "7.5 Overall" }].map((r) => (
                      <div key={r.l} className="flex justify-between items-center rounded-lg border border-border p-3 text-sm"><span className="text-muted-foreground flex items-center gap-2"><Award className="size-4" />{r.l}</span><span className="font-medium">{r.v}</span></div>
                    ))}
                  </TabsContent>
                  <TabsContent value="docs" className="mt-4 grid grid-cols-2 gap-3">
                    {["Passport", "Transcripts", "SOP", "LOR-1", "LOR-2", "IELTS Scorecard"].map((d) => (
                      <div key={d} className="rounded-lg border border-dashed border-border p-4 text-center text-xs hover:border-primary transition-colors cursor-pointer"><FileText className="size-5 mx-auto mb-1.5 text-primary" />{d}</div>
                    ))}
                  </TabsContent>
                  <TabsContent value="timeline" className="space-y-2 mt-4 text-sm">
                    {["Inquiry received", "Counselor assigned", "Documents uploaded", "University shortlist confirmed", "Application submitted", "Offer received"].map((t, i) => (
                      <div key={i} className="flex gap-3"><div className="size-2 rounded-full bg-primary mt-2" /><div className="flex-1"><div className="font-medium">{t}</div><div className="text-[11px] text-muted-foreground">{i + 1} weeks ago</div></div></div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}
