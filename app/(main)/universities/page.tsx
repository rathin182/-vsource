"use client";
import { useEffect, useState, useTransition } from "react";
import {
  PageHeader,
  PageTransition,
} from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/slids/components/ui/dialog";
import {
  Search,
  Star,
  MapPin,
  Heart,
  Plus,
  LucideArrowUpRight,
  LucideLoader2,
  LucideArrowLeft,
} from "lucide-react";
import { universities as seed } from "@/slids/data/mock";
import type { University } from "@/slids/types";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";

interface MetaData {
  totalPages: number,
  total: number,
  limit: number,
  page: number
}


export default function UniversitiesPage() {
  const [list, setList] = useState<University[]>(seed);
  const [q, setQ] = useState("");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const empty = {
    name: "",
    country: "USA",
    city: "",
    ranking: 50,
    tuitionFee: 30000,
    duration: "2 years",
    intakes: "Fall, Spring",
    scholarships: true,
  };
  const [form, setForm] = useState(empty);
  const [transition, startTransition] = useTransition();

  const [specData, setSpecData] = useState<University | null>(null)
  const [isDetOpen, setIsDetOpen] = useState(false)
  const [metaData, setMetaData] = useState<MetaData>()
  const [page, setPage] = useState(1)
  const filtered = list.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.country.name.toLowerCase().includes(q.toLowerCase()),
  );

  // const add = () => {
  //   if (!form.name || !form.city) return toast.error("Name and city are required");
  //   const u: University = {
  //     id: `U${Date.now()}`, name: form.name, country: form.country, city: form.city,
  //     ranking: Number(form.ranking), tuitionFee: Number(form.tuitionFee), duration: form.duration,
  //     intakes: form.intakes.split(",").map((s) => s.trim()).filter(Boolean),
  //     scholarships: form.scholarships, programs: ["MS", "MBA"],
  //   };
  //   setList([u, ...list]);
  //   setOpen(false); setForm(empty);
  //   toast.success("University added");
  // };

  const fetchData = () =>
    startTransition(async () => {
      const req = await axios.get(`/api/universities?page=${page}`);
      if (req.status === 200) {
        setList(req.data.data);
        setMetaData(req.data.meta)

      }
    });

  useEffect(() => {
    fetchData();
  }, [page]);

  if (transition) {
    return (
      <div className="w-[80vw] h-screen grid place-items-center">
        <LucideLoader2 size={34} className="animate-spin"/>
      </div>
    )
  }
  return (
    <PageTransition>
      {isDetOpen &&
      <DetailsBlock onClose={() => setIsDetOpen(false)} university={specData as University}/> 
      }
      <PageHeader
        title="Universities & Courses"
        description="Search, shortlist and compare universities worldwide."
        actions={
          <>
            <Badge variant="secondary">{shortlist.length} shortlisted</Badge>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4 mr-1.5" /> Add University
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add university</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-1.5">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Country</Label>
                      <Input
                        value={form.country}
                        onChange={(e) =>
                          setForm({ ...form, country: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>City</Label>
                      <Input
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Ranking</Label>
                      <Input
                        type="number"
                        value={form.ranking}
                        onChange={(e) =>
                          setForm({ ...form, ranking: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Tuition $</Label>
                      <Input
                        type="number"
                        value={form.tuitionFee}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tuitionFee: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Duration</Label>
                      <Input
                        value={form.duration}
                        onChange={(e) =>
                          setForm({ ...form, duration: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Intakes (comma-separated)</Label>
                    <Input
                      value={form.intakes}
                      onChange={(e) =>
                        setForm({ ...form, intakes: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
          </>
        }
      />

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search universities or countries…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => {
          const isShort = shortlist.includes(u.id);
          return (
            <Card
              key={u.id}
              className="hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="h-24 bg-[image:var(--gradient-primary)] relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:18px_18px]" />
                <button
                  onClick={() => {
                    setShortlist(
                      isShort
                        ? shortlist.filter((i) => i !== u.id)
                        : [...shortlist, u.id],
                    );
                    toast.success(
                      isShort ? "Removed from shortlist" : "Added to shortlist",
                    );
                  }}
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
                  <MapPin className="size-3" /> {u.state}, {u.city},{" "}
                  {u.country.name}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <div className="text-muted-foreground text-[10px]">
                      Application Fees
                    </div>
                    <div className="font-semibold">${u.applicationFee}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <div className="text-muted-foreground text-[10px]">
                      Established Year
                    </div>
                    <div className="font-semibold">{u.establishedYear}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  <p className="text-xs text-gray-400">
                    {u.intakeNotes ?? "Not Provided"}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  {u.website && (
                    <Link href={u.website}>
                      <Button size="sm" variant="outline" className="flex-1">
                        <LucideArrowUpRight className="size-3.5 mr-1" /> Visit
                        Website
                      </Button>
                    </Link>
                  )}
                  <Button size="sm" className="flex-1" onClick={() => {
                    setIsDetOpen(true) 
                    setSpecData(u)}}>
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
                  <div className="w-full flex justify-between items-center my-4 px-2">
              <p className="text-sm text-gray-400">Showing: {list.length} / {metaData && metaData.total}</p>
              <div className="text-sm text-gray-400 flex justify-center items-center gap-2">
                <button disabled={metaData?.page === 1} onClick={() => setPage(page - 1)} className="px-2 py-2 text-primary  rounded-full"><LucideArrowLeft size={16}/></button>
                {metaData && metaData.page} / {metaData && metaData.totalPages}
                <button onClick={() => setPage(page + 1)} disabled={metaData?.page === metaData?.totalPages} className={`px-2 py-2 bg-primary rotate-180 text-white rounded-full ${metaData?.page === metaData?.totalPages ? "disabled:bg-primary/40" : ""}`}><LucideArrowLeft size={16}/></button>
                </div>
            </div>

    </PageTransition>
  );
}


function DetailsBlock({ university, onClose }: {
  university: University,
  onClose: () => void
}) {
  return (
    <div className="w-screen h-screen z-999 absolute inset-0 flex justify-end items-end bg-black/20">
      <div className="w-1/3 h-full bg-white flex flex-col border-l border-gray-100 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-0.5">Institution profile</p>
            <h2 className="text-[15px] font-medium text-gray-900 m-0">{university.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">

          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-blue-500 font-medium text-sm shrink-0">
              {university.name.split(' ').map(w => w[0]).slice(0,2).join('')}
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">{university.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">● Active</span>
                <span className="text-[12px] text-gray-400">Est. {university.establishedYear}</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Ranking', value: `#${university.ranking}` },
              { label: 'App fee', value: `€${university.applicationFee}` },
              { label: 'Courses', value: university._count.courses },
              { label: 'Scholarships', value: university._count.scholarships },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] text-gray-400 m-0">{label}</p>
                <p className="text-xl font-medium text-gray-900 mt-1 m-0">{value}</p>
              </div>
            ))}
          </div>

          {/* About */}
          <Section title="About">
            <p className="text-[13px] text-gray-500 leading-relaxed m-0">{university.description ?? "Not Provided"}</p>
          </Section>

          {/* Location */}
          <Section title="Location">
            <Row icon="📍" text={`${university.state}, ${university.city}, ${university.postalCode}`} />
            <Row icon="🏳️" text={university.country.name} />
            <Row icon="€" text={`Currency: ${university.currency}`} />
          </Section>

          {/* Intake */}
          <Section title="Intake notes">
            <p className="text-[13px] text-gray-500 leading-relaxed m-0">{university.intakeNotes ?? "Not Provided"}</p>
          </Section>

          {/* Contact */}
          <Section title="Contact & links">
            <Row icon="✉️" text={university.contactEmail ?? 'No email provided'} muted={!university.contactEmail} />
            <Row icon="📞" text={university.contactPhone ?? 'No phone provided'} muted={!university.contactPhone} />
            <a href={university.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] text-blue-500 no-underline">
              🌐 {university.website?.replace('https://', '')} ↗
            </a>
          </Section>

          {/* Meta */}
          <div className="pb-3">
            <p className="text-[11px] text-gray-300 m-0">ID: {university.id}</p>
            <p className="text-[11px] text-gray-300 mt-0.5 m-0">
              Added: {new Date(university.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: {
  title: string,
  children: any
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-3 m-0">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ icon, text, muted }: {
  icon: string,
  text: string,
  muted?: any
}) {
  return (
    <div className="flex items-start gap-2.5 text-[13px]">
      <span className="text-gray-300 shrink-0">{icon}</span>
      <span className={muted ? 'text-gray-300 italic' : 'text-gray-800'}>{text}</span>
    </div>
  );
}