"use client";
import { useEffect, useState, useTransition } from "react";
import {
  PageHeader,
  PageTransition,
} from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Badge } from "@/slids/components/ui/badge";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/slids/components/ui/dialog";
import {
  MapPin,
  Users,
  GraduationCap,
  Plus,
  Building2,
  TrendingUp,
  LucideLoader2,
  LucideArrowLeft,
} from "lucide-react";
import type { Branch } from "@/slids/types";
import { toast } from "sonner";
import axios from "axios";

interface MetaData {
  totalPages: number;
  total: number;
  limit: number;
  page: number;
}

export default function Branches() {
  const [list, setList] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [transition, startTransition] = useTransition();
  const empty = {
    name: "",
    city: "",
    manager: "",
    staff: 5,
    students: 50,
    revenue: 1000000,
  };
  const [form, setForm] = useState(empty);
  const [metaData, setMetaData] = useState<MetaData>();
  const [page, setPage] = useState(1)
  // const add = () => {
  //   if (!form.name || !form.city) return toast.error("Name and city required");
  //   setList([{ id: `BR${Date.now()}`, ...form, usersCount: Number(form.staff), studentsCount: Number(form.students), revenue: Number(form.revenue) }, ...list]);
  //   setOpen(false); setForm(empty);
  //   toast.success("Branch added");
  // };

  const fetchData = () =>
    startTransition(async () => {
      const req = await axios.get(`/api/branches?page=${page}`);
      if (req.status === 200) {
        console.log(req.data);
        setList(req.data.data);
        setMetaData(req.data.meta);
      }
    });

  useEffect(() => {
    fetchData();
  }, [page]);

  if (transition) {
    return (
      <div className="w-[80vw] h-screen grid place-items-center">
        <LucideLoader2 size={34} className="animate-spin" />
      </div>
    );
  }
  return (
    <PageTransition>
      <PageHeader
        title="Branches"
        description="Manage office locations and team performance."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4 mr-1.5" /> New Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New branch</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
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
                <div className="grid gap-1.5">
                  <Label>Manager</Label>
                  <Input
                    value={form.manager}
                    onChange={(e) =>
                      setForm({ ...form, manager: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Staff</Label>
                    <Input
                      type="number"
                      value={form.staff}
                      onChange={(e) =>
                        setForm({ ...form, staff: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Students</Label>
                    <Input
                      type="number"
                      value={form.students}
                      onChange={(e) =>
                        setForm({ ...form, students: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Revenue (₹)</Label>
                    <Input
                      type="number"
                      value={form.revenue}
                      onChange={(e) =>
                        setForm({ ...form, revenue: Number(e.target.value) })
                      }
                    />
                  </div>
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
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list?.length > 0 &&
          list.map((b) => (
            <Card
              key={b.id}
              className="overflow-hidden hover:shadow-md transition-all"
            >
              <div className="h-20 bg-[image:var(--gradient-soft)] relative flex items-center px-4 border-b border-border">
                <div className="size-12 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-md">
                  <Building2 className="size-5 text-white" />
                </div>
                <Badge
                  className="ml-auto"
                  variant={b.status ? "default" : "secondary"}
                >
                  {b.status ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="font-bold">{b.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="size-3" /> {b.city}, {b.state}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  {b.code}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <Users className="size-3.5 mx-auto text-primary" />
                    <div className="font-bold text-sm mt-1">{b.usersCount}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Users
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <GraduationCap className="size-3.5 mx-auto text-primary" />
                    <div className="font-bold text-sm mt-1">
                      {b.studentsCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Students
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <TrendingUp className="size-3.5 mx-auto text-primary" />
                    <div className="font-bold text-sm mt-1">{b.leadsCount}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Leads
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
      <div className="w-full flex justify-between items-center my-4 px-2">
        <p className="text-sm text-gray-400">
          Showing: {list.length} / {metaData && metaData.total}
        </p>
        <div className=""></div>
        <div className="text-sm text-gray-400 flex justify-center items-center gap-2">
          <button onClick={() => setPage(page - 1)} disabled={metaData?.page === 1} className="px-2 py-2 text-primary  rounded-full">
            <LucideArrowLeft size={16} />
          </button>
          {metaData && metaData.page} / {metaData && metaData.totalPages}
          <button onClick={() => setPage(page + 1)} disabled={metaData?.page === metaData?.totalPages} className="px-2 py-2 bg-primary rotate-180 text-white rounded-full">
            <LucideArrowLeft size={16} />
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
