"use client";
import { useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Badge } from "@/slids/components/ui/badge";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/slids/components/ui/dialog";
import { MapPin, Users, GraduationCap, Plus, Building2 } from "lucide-react";
import { branchesData as seed } from "@/slids/data/mock";
import type { Branch } from "@/slids/types";
import { toast } from "sonner";

export default function Branches() {
  const [list, setList] = useState<Branch[]>(seed);
  const [open, setOpen] = useState(false);
  const empty = { name: "", city: "", manager: "", staff: 5, students: 50, revenue: 1000000 };
  const [form, setForm] = useState(empty);

  const add = () => {
    if (!form.name || !form.city) return toast.error("Name and city required");
    setList([{ id: `BR${Date.now()}`, ...form, staff: Number(form.staff), students: Number(form.students), revenue: Number(form.revenue) }, ...list]);
    setOpen(false); setForm(empty);
    toast.success("Branch added");
  };

  return (
    <PageTransition>
      <PageHeader title="Branches" description="Manage office locations and team performance." actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="size-4 mr-1.5" /> New Branch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New branch</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              </div>
              <div className="grid gap-1.5"><Label>Manager</Label><Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5"><Label>Staff</Label><Input type="number" value={form.staff} onChange={(e) => setForm({ ...form, staff: Number(e.target.value) })} /></div>
                <div className="grid gap-1.5"><Label>Students</Label><Input type="number" value={form.students} onChange={(e) => setForm({ ...form, students: Number(e.target.value) })} /></div>
                <div className="grid gap-1.5"><Label>Revenue (₹)</Label><Input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((b) => (
          <Card key={b.id} className="overflow-hidden hover:shadow-md transition-all">
            <div className="h-20 bg-[image:var(--gradient-soft)] relative flex items-center px-4 border-b border-border">
              <div className="size-12 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-md">
                <Building2 className="size-5 text-white" />
              </div>
              <Badge className="ml-auto" variant="secondary">Active</Badge>
            </div>
            <CardContent className="p-5">
              <div className="font-bold">{b.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5"><MapPin className="size-3" /> {b.city}</div>
              <div className="text-xs text-muted-foreground mt-1">Managed by {b.manager}</div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="rounded-lg bg-secondary/50 p-2"><Users className="size-3.5 mx-auto text-primary" /><div className="font-bold text-sm mt-1">{b.staff}</div><div className="text-[10px] text-muted-foreground">Staff</div></div>
                <div className="rounded-lg bg-secondary/50 p-2"><GraduationCap className="size-3.5 mx-auto text-primary" /><div className="font-bold text-sm mt-1">{b.students}</div><div className="text-[10px] text-muted-foreground">Students</div></div>
                <div className="rounded-lg bg-secondary/50 p-2"><div className="text-primary text-xs font-bold mt-0.5">₹</div><div className="font-bold text-sm">{(b.revenue / 100000).toFixed(0)}L</div><div className="text-[10px] text-muted-foreground">Revenue</div></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageTransition>
  );
}
