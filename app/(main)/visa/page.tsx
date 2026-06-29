"use client";
import { useEffect, useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Badge } from "@/slids/components/ui/badge";
import { Avatar, AvatarFallback } from "@/slids/components/ui/avatar";
import { Search, Mail, Phone, GraduationCap, Award } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/slids/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/slids/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/slids/components/ui/table";
import type { Student } from "@/slids/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function StudentsPage() {
  const router = useRouter();
  const [isloading, setIsloading] = useState(false);
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
      setIsloading(true);
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
      setIsloading(false);
    }
  };

  const getBranches = async () => {
    const req = await axios.get("/api/branches/all");
    if (req.status === 200) {
      setBranches(req.data.data);
    }
  };

  const createStudent = async () => {
    try {
      if (!form.name || !form.email) {
        return toast.error("Name and email are required");
      }
      setIsCreating(true);

      const response = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        return toast.error(data.message);
      }

      await allStudent();
      setOpen(false);
      setForm(empty);
      toast.success("Student created");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create student");
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = list.filter((student: any) => {
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

  useEffect(() => {
    allStudent();
    getBranches();
  }, []);

  const initials = (name?: string) =>
    (name || "NA")
      .split(" ")
      .map((p: string) => p[0])
      .join("")
      .toUpperCase();

  if (isloading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-15 w-15 border-b-2 border-red-400"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Visa"
        description="Complete profile management with academic & visa history."
      />

      <div className="mb-4 relative max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name…"
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Counselor</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lead No</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((s: any) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => setSel(s)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-[image:var(--gradient-primary)] text-white text-xs font-semibold">
                        {initials(s.firstName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">
                      {s.studentName || "—"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {s.email || "No Email"}
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {s.phone || "No Phone"}
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="size-3.5" />
                    {s.preferredCourse || "Not Selected"}
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {s.branch?.name || "N/A"}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {s.counselor?.name || "Unassigned"}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {s.preferredCountry || "N/A"}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {s.status || "N/A"}
                  </Badge>
                </TableCell>

                <TableCell className="text-muted-foreground text-xs">
                  {s.id ? s.id.slice(-6).toUpperCase() : "N/A"}
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!sel} onOpenChange={(v) => !v && setSel(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {sel && (
            <div>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-[image:var(--gradient-primary)] text-white font-bold">
                      {initials((sel as any).studentName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <SheetTitle>
                        {sel.studentName || "—"}
                      </SheetTitle>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/visa/${sel.id}`)}
                      >
                        View More
                      </Button>
                    </div>

                    <SheetDescription>
                      {(sel as any).admissionDate || "N/A"} ·{" "}
                      {(sel as any).preferredCountry || "N/A"} ·{" "}
                      {sel.status}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="px-4 mt-6">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="academic" className="flex-1">Academic</TabsTrigger>
                    <TabsTrigger value="lead" className="flex-1">Lead</TabsTrigger>
                    <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">Email</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Mail className="size-3.5" />
                          {sel.email || "N/A"}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">Phone</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="size-3.5" />
                          {sel.phone || "N/A"}
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">Branch</div>
                        <div className="mt-1">{(sel as any).branch?.name}</div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">Counselor</div>
                        <div className="mt-1">{(sel as any).counselor?.name || "Unassigned"}</div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">Country</div>
                        <div className="mt-1">{(sel as any).preferredCountry || "N/A"}</div>
                      </div>

                      <div className="rounded-lg border border-border p-3">
                        <div className="text-[11px] text-muted-foreground">Status</div>
                        <div className="mt-1 capitalize">{sel.status}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="academic" className="space-y-2 mt-4">
                    <div className="flex justify-between items-center rounded-lg border border-border p-3 text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <GraduationCap className="size-4" />
                        Preferred Country
                      </span>
                      <span className="font-medium">{(sel as any).preferredCountry || "N/A"}</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="lead" className="space-y-3 mt-4">
                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">Lead Number</div>
                      <div className="font-medium mt-1">
                        {sel.id ? sel.id.slice(-6).toUpperCase() : "N/A"}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3">
                      <div className="text-xs text-muted-foreground">Source</div>
                      <div className="font-medium mt-1">
                        {(sel as any).createdBy?.name || "N/A"}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-3 mt-4">
                    <div className="flex gap-3">
                      <div className="size-2 rounded-full bg-primary mt-2" />
                      <div>
                        <div className="font-medium">Student Created</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date((sel as any).createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="size-2 rounded-full bg-primary mt-2" />
                      <div>
                        <div className="font-medium">Timeline Entries</div>
                        <div className="text-xs text-muted-foreground">
                          {(sel as any)._count?.timeline || 0}
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