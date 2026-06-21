"use client";
import { useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/slids/components/ui/dialog";
import { Search, Star, MapPin, GraduationCap, Award, Heart, Plus } from "lucide-react";
import { universities as seed } from "@/slids/data/mock";
import type { University } from "@/slids/types";
import { toast } from "sonner";

export default function UniversitiesPage() {
  const [list, setList] = useState<University[]>(seed);
  const [q, setQ] = useState("");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const empty = { name: "", country: "USA", city: "", ranking: 50, tuitionFee: 30000, duration: "2 years", intakes: "Fall, Spring", scholarships: true };
  const [form, setForm] = useState(empty);

  const filtered = list.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.country.toLowerCase().includes(q.toLowerCase()));

  const add = () => {
    if (!form.name || !form.city) return toast.error("Name and city are required");
    const u: University = {
      id: `U${Date.now()}`, name: form.name, country: form.country, city: form.city,
      ranking: Number(form.ranking), tuitionFee: Number(form.tuitionFee), duration: form.duration,
      intakes: form.intakes.split(",").map((s) => s.trim()).filter(Boolean),
      scholarships: form.scholarships, programs: ["MS", "MBA"],
    };
    setList([u, ...list]);
    setOpen(false); setForm(empty);
    toast.success("University added");
  };

  return (
    <PageTransition>
      <PageHeader
        title="Universities & Courses"
        description="Search, shortlist and compare universities worldwide."
        actions={<>
          <Badge variant="secondary">{shortlist.length} shortlisted</Badge>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="size-4 mr-1.5" /> Add University</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add university</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5"><Label>Ranking</Label><Input type="number" value={form.ranking} onChange={(e) => setForm({ ...form, ranking: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>Tuition $</Label><Input type="number" value={form.tuitionFee} onChange={(e) => setForm({ ...form, tuitionFee: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
                </div>
                <div className="grid gap-1.5"><Label>Intakes (comma-separated)</Label><Input value={form.intakes} onChange={(e) => setForm({ ...form, intakes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>}
      />

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search universities or countries…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => {
          const isShort = shortlist.includes(u.id);
          return (
            <Card key={u.id} className="hover:shadow-md transition-all overflow-hidden group">
              <div className="h-24 bg-[image:var(--gradient-primary)] relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:18px_18px]" />
                <button
                  onClick={() => { setShortlist(isShort ? shortlist.filter((i) => i !== u.id) : [...shortlist, u.id]); toast.success(isShort ? "Removed from shortlist" : "Added to shortlist"); }}
                  className="absolute top-3 right-3 size-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30"
                >
                  <Heart className={`size-4 ${isShort ? "fill-white" : ""}`} />
                </button>
                <div className="absolute bottom-2 left-4 flex items-center gap-1.5 text-white text-xs">
                  <Star className="size-3 fill-current" /> Rank #{u.ranking}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="font-bold leading-tight">{u.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <MapPin className="size-3" /> {u.city}, {u.country}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="rounded-lg bg-secondary/50 p-2"><div className="text-muted-foreground text-[10px]">Tuition</div><div className="font-semibold">${u.tuitionFee.toLocaleString()}</div></div>
                  <div className="rounded-lg bg-secondary/50 p-2"><div className="text-muted-foreground text-[10px]">Duration</div><div className="font-semibold">{u.duration}</div></div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {u.intakes.map((i) => <Badge key={i} variant="outline" className="text-[10px]">{i}</Badge>)}
                  {u.scholarships && <Badge className="text-[10px] gap-0.5 bg-success/15 text-success border-success/20" variant="outline"><Award className="size-2.5" /> Scholarship</Badge>}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1"><GraduationCap className="size-3.5 mr-1" /> Programs</Button>
                  <Button size="sm" className="flex-1">View Details</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageTransition>
  );
}
