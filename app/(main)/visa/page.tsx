"use client";
import { useEffect, useState } from "react";
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
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";

export default function StudentsPage() {
  const router = useRouter();
  const [isloading, setIsloading] = useState(false)
  const [isCreating, setIsCreating] = useState(false);
  const [list, setList] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Student | null>(null);
  const [open, setOpen] = useState(false);
  const empty = { name: "", email: "", phone: "", dob: "", country: "USA", program: "MS Computer Science", intake: "Fall 2026", status: "Active" };
  const [form, setForm] = useState(empty);
  const [branches, setBranches] = useState<{ id: string; name: string; email: string }[]>([]);

  const allStudent = async () => {
    try {
      setIsloading(true)
      const response = await fetch('/api/visaDetails/leadsdata', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      setList(data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsloading(false)
    }
  };

  const getBranches = async () => {
    const req = await axios.get("/api/branches/all");
    if (req.status === 200) {
      setBranches(req.data.data)
    }
  }

  const createStudent = async () => {
    try {
      if (!form.name || !form.email) {
        return toast.error(
          "Name and email are required"
        );
      }
      setIsCreating(true)

      const response = await fetch(
        "/api/student",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return toast.error(
          data.message
        );
      }

      await allStudent();

      setOpen(false);
      setForm(empty);

      toast.success(
        "Student created"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to create student"
      );
    } finally {
      setIsCreating(false)
    }
  };

  const filtered = list.filter((student) => {
  const search = q.toLowerCase().trim();

  return (
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(search) ||
    student.firstName?.toLowerCase().includes(search) ||
    student.lastName?.toLowerCase().includes(search) ||
    student.email?.toLowerCase().includes(search) ||
    student.phone?.toLowerCase().includes(search) ||
    student.preferredCountry?.toLowerCase().includes(search) ||
    student.status?.toLowerCase().includes(search) ||
    student.branch?.name?.toLowerCase().includes(search)
  );
});

  // const add = () => {
  //   if (!form.name || !form.email) return toast.error("Name and email are required");
  //   const s: Student = { id: `ST${Date.now()}`, ...form, progress: 20 };
  //   setList([s, ...list]);
  //   setOpen(false); setForm(empty);
  //   toast.success("Student added");
  // };

  useEffect(() => {
    allStudent();
    getBranches();
  }, []);

  if (isloading) {
    return(
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-15 w-15 border-b-2 border-red-400"></div>
      </div>
    )
  }

  return (
    <PageTransition>
      <PageHeader
        title="Visa"
        description="Complete profile management with academic & visa history."
      />

      <div className="mb-4 relative max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s: any) => (
          <Card
            key={s.id}
            className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => setSel(s)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-[image:var(--gradient-primary)] text-white font-semibold">
                    {(s.firstName || "NA")
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {s.firstName} {s.lastName}
                  </div>

                  <div className="text-xs text-muted-foreground truncate">
                    {s.admissionDate || "N/A"}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="text-[10px] capitalize"
                >
                  {s.status || "N/A"}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-3.5" />
                  {s.preferredCourse || "Not Selected"}
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="size-3.5" />
                  {s.email || "No Email"}
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="size-3.5" />
                  {s.phone || "No Phone"}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Branch:
                  </span>
                  {s.branch?.name || "N/A"}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Counselor:
                  </span>
                  {s.counselor?.name || "Unassigned"}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Country:
                  </span>
                  {s.preferredCountry || "N/A"}
                </div>
              </div>

              <div className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
                Lead No: {s.id ? s.id.slice(-6).toUpperCase() : "N/A"}
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
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-[image:var(--gradient-primary)] text-white font-bold">
                      {(sel.studentName || "NA")
                        .split(" ")
                        .map((p: string) => p[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <SheetTitle>
                        {sel.firstName} {sel.lastName}
                      </SheetTitle>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/visa/${sel.id}`)
                        }
                      >
                        View More
                      </Button>
                    </div>

                    <SheetDescription className="">
                      {sel.admissionDate || "N/A"} ·{" "}
                      {sel.preferredCountry || "N/A"} ·{" "}
                      {sel.status}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="px-4 mt-6">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger
                      value="overview"
                      className="flex-1"
                    >
                      Overview
                    </TabsTrigger>

                    <TabsTrigger
                      value="academic"
                      className="flex-1"
                    >
                      Academic
                    </TabsTrigger>

                    <TabsTrigger
                      value="lead"
                      className="flex-1"
                    >
                      Lead
                    </TabsTrigger>

                    <TabsTrigger
                      value="timeline"
                      className="flex-1"
                    >
                      Timeline
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="overview"
                    className="space-y-3 mt-4"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">
                          Email
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <Mail className="size-3.5" />
                          {sel.email || "N/A"}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">
                          Phone
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="size-3.5" />
                          {sel.phone || "N/A"}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">
                          Branch
                        </div>

                        <div className="mt-1">
                          {sel.branch?.name}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">
                          Counselor
                        </div>

                        <div className="mt-1">
                          {sel.counselor?.name ||
                            "Unassigned"}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">
                          Country
                        </div>

                        <div className="mt-1">
                          {sel.preferredCountry ||
                            "N/A"}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">
                          Status
                        </div>

                        <div className="mt-1 capitalize">
                          {sel.status}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="academic"
                    className="space-y-2 mt-4"
                  >
                    <div className="flex justify-between items-center rounded-lg border border-border p-3 text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <GraduationCap className="size-4" />
                        Preferred Country
                      </span>

                      <span className="font-medium">
                        {sel.preferredCountry ||
                          "N/A"}
                      </span>
                    </div>

                    {/* <div className="flex justify-between items-center rounded-lg border border-border p-3 text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Award className="size-4" />
                        Student Number
                      </span>

                      <span className="font-medium">
                        {sel.studentNumber}
                      </span>
                    </div> */}
                  </TabsContent>

                  <TabsContent
                    value="lead"
                    className="space-y-3 mt-4"
                  >
                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">
                        Lead Number
                      </div>

                      <div className="font-medium mt-1">
                        {sel.id ? sel.id.slice(-6).toUpperCase() : "N/A"}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">
                        Source
                      </div>

                      <div className="font-medium mt-1">
                        {sel.createdBy?.name || "N/A"}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="timeline"
                    className="space-y-3 mt-4"
                  >
                    <div className="flex gap-3">
                      <div className="size-2 rounded-full bg-primary mt-2" />

                      <div>
                        <div className="font-medium">
                          Student Created
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {new Date(
                            sel.createdAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="size-2 rounded-full bg-primary mt-2" />

                      <div>
                        <div className="font-medium">
                          Timeline Entries
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {sel._count?.timeline || 0}
                        </div>
                      </div>
                    </div>
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
