"use client";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Textarea } from "@/slids/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
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
import { courses as seedCourses } from "@/slids/data/courses";
import type { Course } from "@/slids/types";
import { Search, Plus, Eye, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const courseSchema = z.object({
  logo: z.string().url("Enter a valid URL"),
  universityName: z.string().min(1, "University name is required"),
  courseName: z.string().min(1, "Course name is required"),
  country: z.string().min(1, "Country is required"),
  applicationFee: z.string().min(1, "Application fee is required"),
  yearlyTuition: z.string().min(1, "Yearly tuition is required"),
  duration: z.string().min(1, "Duration is required"),
  intakeMonth: z.string().min(1, "Intake month is required"),
  intakeYear: z.string().min(1, "Intake year is required"),
  level: z.string().min(1, "Level is required"),
  ielts: z.string().optional(),
  pte: z.string().optional(),
  toefl: z.string().optional(),
  duolingo: z.string().optional(),
  description: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function CourseFinderPage() {
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [searchCourse, setSearchCourse] = useState("");
  const [searchUniversity, setSearchUniversity] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState("");
  const [intakeMonth, setIntakeMonth] = useState("");
  const [intakeYear, setIntakeYear] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const countries = Array.from(new Set(seedCourses.map((course) => course.country)));
  const levels = Array.from(new Set(seedCourses.map((course) => course.level)));
  const intakeMonths = Array.from(new Set(seedCourses.map((course) => course.intakeMonth)));
  const intakeYears = Array.from(new Set(seedCourses.map((course) => course.intakeYear)));

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      return (
        (!searchCourse || course.courseName.toLowerCase().includes(searchCourse.toLowerCase())) &&
        (!searchUniversity ||
          course.universityName.toLowerCase().includes(searchUniversity.toLowerCase())) &&
        (country === "all" || !country || course.country === country) &&
        (level === "any" || !level || course.level === level) &&
        (intakeMonth === "any" || !intakeMonth || course.intakeMonth === intakeMonth) &&
        (intakeYear === "any" || !intakeYear || course.intakeYear === intakeYear)
      );
    });
  }, [courses, searchCourse, searchUniversity, country, level, intakeMonth, intakeYear]);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      logo: "https://logo.clearbit.com/atlantiscollege.edu",
      universityName: "Atlantis College",
      courseName: "Master of Business Administration",
      country: "Cyprus",
      applicationFee: "N/A",
      yearlyTuition: "€ 7,000",
      duration: "12 Months",
      intakeMonth: "Sep",
      intakeYear: "2026",
      level: "Master",
      ielts: "5",
      pte: "58",
      toefl: "84",
      duolingo: "95",
      description:
        "A practical MBA program designed for international leaders focusing on operations, finance and growth strategies.",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const saveCourse = (values: CourseFormValues) => {
    const updated: Course = {
      id: editingCourse?.id ?? `CR${Date.now()}`,
      ...values,
      
    };

    setCourses((current) => {
      if (editingCourse) {
        return current.map((course) => (course.id === editingCourse.id ? updated : course));
      }
      return [updated, ...current];
    });
    toast.success(editingCourse ? "Course updated" : "Course added");
    setDialogOpen(false);
    setEditingCourse(null);
    reset(values);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    reset(course);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCourses((current) => current.filter((course) => course.id !== id));
    toast.success("Course removed");
  };

  return (
    <PageTransition>
      <PageHeader
        title="Course Finder"
        description="Manage international universities and study programs."
        actions={
          <Button
            onClick={() => {
              setEditingCourse(null);
              reset();
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4 mr-2" /> Add Course
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
          <div className="grid gap-2">
            <Label>Search Course</Label>
            <Input
              value={searchCourse}
              onChange={(event) => setSearchCourse(event.target.value)}
              placeholder="Search course"
            />
          </div>
          <div className="grid gap-2">
            <Label>Search University</Label>
            <Input
              value={searchUniversity}
              onChange={(event) => setSearchUniversity(event.target.value)}
              placeholder="Search university"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="grid gap-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Country</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    {countries.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Level</SelectLabel>
                    <SelectItem value="any">Any</SelectItem>
                    {levels.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Intake Month</Label>
              <Select value={intakeMonth} onValueChange={setIntakeMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Any month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Intake Month</SelectLabel>
                    <SelectItem value="any">Any</SelectItem>
                    {intakeMonths.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Intake Year</Label>
              <Select value={intakeYear} onValueChange={setIntakeYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Any year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Intake Year</SelectLabel>
                    <SelectItem value="any">Any</SelectItem>
                    {intakeYears.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchCourse("");
                  setSearchUniversity("");
                  setCountry("");
                  setLevel("");
                  setIntakeMonth("");
                  setIntakeYear("");
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <Card
            key={course.id}
            className="overflow-hidden rounded-2xl border border-border shadow-md transition hover:shadow-lg"
          >
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <Image
                src={course.logo}
                alt={course.universityName}
                width={100}
                height={100}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div>
                <div className="font-semibold">{course.universityName}</div>
                <div className="text-sm text-muted-foreground">{course.country}</div>
              </div>
            </div>
            <CardContent className="space-y-4 p-5">
              <div>
                <div className="text-lg font-semibold">{course.courseName}</div>
                <div className="text-sm text-muted-foreground">
                  {course.level} · {course.duration}
                </div>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div>Application fee: {course.applicationFee}</div>
                <div>Yearly tuition: {course.yearlyTuition}</div>
                <div>
                  Intake: {course.intakeMonth} {course.intakeYear}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border p-3 bg-secondary/50">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    IELTS
                  </div>
                  <div className="font-medium">{course.ielts || "N/A"}</div>
                </div>
                <div className="rounded-xl border border-border p-3 bg-secondary/50">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    PTE
                  </div>
                  <div className="font-medium">{course.pte || "N/A"}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedCourse(course)}>
                  {" "}
                  <Eye className="size-4 mr-2" /> View Details
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(course)}>
                  {" "}
                  <Edit3 className="size-4 mr-2" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(course.id)}>
                  {" "}
                  <Trash2 className="size-4 mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCourse(null);
            reset();
          }
        }}
      >
        <DialogContent className="max-w-4xl h-[85vh]  overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(saveCourse)} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>University Logo URL</Label>
                <Input {...register("logo")} />
                {errors.logo && <p className="text-xs text-destructive">{errors.logo.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label>University Name</Label>
                <Input {...register("universityName")} />
                {errors.universityName && (
                  <p className="text-xs text-destructive">{errors.universityName.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Course Name</Label>
                <Input {...register("courseName")} />
                {errors.courseName && (
                  <p className="text-xs text-destructive">{errors.courseName.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Country</Label>
                <Input {...register("country")} />
                {errors.country && (
                  <p className="text-xs text-destructive">{errors.country.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Application Fee</Label>
                <Input {...register("applicationFee")} />
                {errors.applicationFee && (
                  <p className="text-xs text-destructive">{errors.applicationFee.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Yearly Tuition Fee</Label>
                <Input {...register("yearlyTuition")} />
                {errors.yearlyTuition && (
                  <p className="text-xs text-destructive">{errors.yearlyTuition.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Duration</Label>
                <Input {...register("duration")} />
                {errors.duration && (
                  <p className="text-xs text-destructive">{errors.duration.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Intake Month</Label>
                <Input {...register("intakeMonth")} />
                {errors.intakeMonth && (
                  <p className="text-xs text-destructive">{errors.intakeMonth.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Intake Year</Label>
                <Input {...register("intakeYear")} />
                {errors.intakeYear && (
                  <p className="text-xs text-destructive">{errors.intakeYear.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Level</Label>
                <Input {...register("level")} />
                {errors.level && <p className="text-xs text-destructive">{errors.level.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label>IELTS Score</Label>
                <Input {...register("ielts")} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>PTE Score</Label>
                <Input {...register("pte")} />
              </div>
              <div className="grid gap-2">
                <Label>TOEFL Score</Label>
                <Input {...register("toefl")} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Duolingo Score</Label>
              <Input {...register("duolingo")} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea rows={4} {...register("description")} />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingCourse(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {editingCourse ? "Save Changes" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <SheetContent>
          {selectedCourse && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedCourse.courseName}</SheetTitle>
                <SheetDescription>{selectedCourse.universityName}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 py-3">
                <Image
                  src={selectedCourse.logo}
                  alt={selectedCourse.universityName}
                  className="h-24 w-full rounded-2xl object-cover"
                />
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground">Country:</span>{" "}
                    {selectedCourse.country}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Level:</span>{" "}
                    {selectedCourse.level}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Intake:</span>{" "}
                    {selectedCourse.intakeMonth} {selectedCourse.intakeYear}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Application Fee:</span>{" "}
                    {selectedCourse.applicationFee}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Yearly Tuition Fee:</span>{" "}
                    {selectedCourse.yearlyTuition}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Duration:</span>{" "}
                    {selectedCourse.duration}
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-2xl border border-border p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                      IELTS
                    </div>
                    <div className="text-base font-semibold">{selectedCourse.ielts || "N/A"}</div>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                      PTE
                    </div>
                    <div className="text-base font-semibold">{selectedCourse.pte || "N/A"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Requirements</div>
                  <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                    {selectedCourse.description}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}