"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Badge } from "@/slids/components/ui/badge";
import { Skeleton } from "@/slids/components/ui/skeleton";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/slids/components/ui/sheet";
import { Eye, SearchX } from "lucide-react";
import CourseDetailSheet from "./details";
import { formatDuration, formatFee, formatIntake, UniversityCourse } from "./common";

// ─── API helpers ──────────────────────────────────────────────────────────────

interface FetchCoursesParams {
  search?: string;
  university?: string;
  country?: string;
  degree?: string;
  intakeMonth?: string;
  intakeYear?: string;
}

async function fetchCourses(
  params: FetchCoursesParams
): Promise<UniversityCourse[]> {
  const res = await fetch("/api/courses/finder");

  if (!res.ok) throw new Error("Failed to load courses");

  const json = await res.json();

  const courses: UniversityCourse[] = Array.isArray(json)
    ? json
    : json.data ?? [];

  return courses.filter((course) => {
    return Object.entries(params).every(([key, value]) => {
      if (!value || value === "all" || value === "any") return true;

      const search = String(value).toLowerCase();

      switch (key) {
        case "search":
          return (
            course.name?.toLowerCase().includes(search) ||
            course.courseCode?.toLowerCase().includes(search)
          );

        case "university":
          return course.university?.name
            ?.toLowerCase()
            .includes(search);

        case "country":
          return course.university?.country?.name
            ?.toLowerCase()
            .includes(search);

        case "degree":
          return course.degree?.toLowerCase() === search;

        case "intake":
          return course.intake?.name?.toLowerCase() === search;

        default:
          return true;
      }
    });
  });
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </CardContent>
    </Card>
  );
}

// ─── Course card ───────────────────────────────────────────────────────────────

function CourseCard({
  course,
  onView,
}: {
  course: UniversityCourse;
  onView: (course: UniversityCourse) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border transition hover:shadow-md">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        {course.university?.logo ? (
          <img
            src={course.university.logo}
            alt={course.university.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-xs font-semibold text-muted-foreground">
            {course?.university?.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate font-semibold">{course?.university?.name}</div>
          <div className="text-sm text-muted-foreground">
            {course?.university?.country?.name ?? "—"}
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        <div>
          <div className="text-base font-semibold leading-snug">{course.name}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {course.degree} · {formatDuration(course.durationMonths)}
          </div>
        </div>

        <div className="grid gap-1.5 text-sm text-muted-foreground">
          <div>
            <span className="text-foreground font-medium">Annual tuition:</span>{" "}
            {formatFee(Number(course.annualTuitionFee), course.currency)}
          </div>
          <div>
            <span className="text-foreground font-medium">Intake:</span>{" "}
            {formatIntake(course.intake)}
          </div>
          {course.applicationDeadline && (
            <div>
              <span className="text-foreground font-medium">Deadline:</span>{" "}
              {new Date(course.applicationDeadline).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">IELTS</div>
            <div className="font-semibold">{course.ieltsOverall ?? "N/A"}</div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Min %</div>
            <div className="font-semibold">
              {course.minimumPercentage != null ? `${course.minimumPercentage}%` : "N/A"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {course.greRequired && <Badge variant="outline">GRE Required</Badge>}
          {course.gmatRequired && <Badge variant="outline">GMAT Required</Badge>}
        </div>

        <Button size="sm" variant="outline" onClick={() => onView(course)}>
          <Eye className="mr-2 size-4" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Detail sheet ──────────────────────────────────────────────────────────────

// function CourseDetailSheet({
//   course,
//   onClose,
// }: {
//   course: UniversityCourse | null;
//   onClose: () => void;
// }) {
//   return (
//     // <div className=""></div>
//     <Sheet open={!!course} onOpenChange={(open) => !open && onClose()}>
//       <SheetContent className="overflow-y-auto">
//         {course && (
//           <>
//             <SheetHeader>
//               <SheetTitle>{course.name}</SheetTitle>
//               <SheetDescription>{course.university.name}</SheetDescription>
//             </SheetHeader>

//             <div className="space-y-5 px-4 py-4">
//               {/* University logo / banner */}
//               {course.university.logo && (
//                 <img
//                   src={course.university.logo}
//                   alt={course.university.name}
//                   className="h-24 w-full rounded-2xl object-cover"
//                 />
//               )}

//               {/* Core info */}
//               <div className="grid gap-2 text-sm text-muted-foreground">
//                 {[
//                   ["Country", course.university.country],
//                   ["Degree", course.degree],
//                   ["Duration", formatDuration(course.durationMonths)],
//                   ["Intake", formatIntake(course.intake)],
//                   ["Annual Tuition", formatFee(course.annualTuitionFee, course.currency)],
//                   ["Total Tuition", formatFee(course.totalTuitionFee, course.currency)],
//                   [
//                     "Application Deadline",
//                     course.applicationDeadline
//                       ? new Date(course.applicationDeadline).toLocaleDateString()
//                       : null,
//                   ],
//                   ["Course Code", course.courseCode],
//                   ["Min Percentage", course.minimumPercentage != null ? `${course.minimumPercentage}%` : null],
//                   ["Max Backlogs", course.backlogLimit?.toString()],
//                   ["English Requirement", course.englishRequirement],
//                 ]
//                   .filter(([, v]) => v)
//                   .map(([label, value]) => (
//                     <div key={label as string}>
//                       <span className="font-semibold text-foreground">{label}:</span> {value}
//                     </div>
//                   ))}
//               </div>

//               {/* English test scores */}
//               <div>
//                 <div className="mb-2 text-sm font-semibold">English Test Requirements</div>
//                 <div className="grid grid-cols-2 gap-2">
//                   {(
//                     [
//                       ["IELTS Overall", course.ieltsOverall],
//                       ["IELTS Listening", course.ieltsListening],
//                       ["IELTS Reading", course.ieltsReading],
//                       ["IELTS Writing", course.ieltsWriting],
//                       ["IELTS Speaking", course.ieltsSpeaking],
//                     ] as [string, number | null | undefined][]
//                   )
//                     .filter(([, v]) => v != null)
//                     .map(([label, value]) => (
//                       <div key={label} className="rounded-2xl border border-border p-3">
//                         <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
//                           {label}
//                         </div>
//                         <div className="mt-1 font-semibold">{value}</div>
//                       </div>
//                     ))}
//                 </div>
//               </div>

//               {/* Entrance exams */}
//               {(course.greRequired || course.gmatRequired) && (
//                 <div className="flex gap-2">
//                   {course.greRequired && <Badge variant="secondary">GRE Required</Badge>}
//                   {course.gmatRequired && <Badge variant="secondary">GMAT Required</Badge>}
//                 </div>
//               )}

//               {/* Description */}
//               {course.description && (
//                 <div>
//                   <div className="mb-2 text-sm font-semibold">About the Program</div>
//                   <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground leading-relaxed">
//                     {course.description}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </SheetContent>
//     </Sheet>
//   );
// }

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CourseFinderPage() {
  // Filter state
  const [searchCourse, setSearchCourse] = useState("");
  const [searchUniversity, setSearchUniversity] = useState("");
  const [country, setCountry] = useState("");
  const [degree, setDegree] = useState("");
  const [intakeMonth, setIntakeMonth] = useState("");
  const [intakeYear, setIntakeYear] = useState("");

  // Data state
  const [courses, setCourses] = useState<UniversityCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedCourse, setSelectedCourse] = useState<UniversityCourse | null>(null);

  // Debounce ref for text inputs
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCourses = useCallback(async (params: FetchCoursesParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCourses(params);
      setCourses(data);
    } catch {
      setError("Could not load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever select filters change immediately
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadCourses({
        search: searchCourse,
        university: searchUniversity,
        country,
        degree,
        intakeMonth,
        intakeYear,
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchCourse, searchUniversity, country, degree, intakeMonth, intakeYear, loadCourses]);

  const handleReset = () => {
    setSearchCourse("");
    setSearchUniversity("");
    setCountry("");
    setDegree("");
    setIntakeMonth("");
    setIntakeYear("");
  };

  const hasFilters =
    searchCourse || searchUniversity || country || degree || intakeMonth || intakeYear;

  return (
    <PageTransition>
      <PageHeader
        title="Course Finder"
        description="Search programs across international universities."
      />


      {/* ── Filters ── */}
      <Card className="mb-6">
        <CardContent className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr] py-8">
          {/* Col 1 — Course search */}
          <div className="grid gap-2">
            <Label>Search Course</Label>
            <Input
              value={searchCourse}
              onChange={(e) => setSearchCourse(e.target.value)}
              placeholder="Search course"
            />
          </div>

          {/* Col 2 — University search */}
          <div className="grid gap-2">
            <Label>Search University</Label>
            <Input
              value={searchUniversity}
              onChange={(e) => setSearchUniversity(e.target.value)}
              placeholder="Search university"
            />
          </div>

          {/* Col 3 — Select filters + Reset */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Country */}
            {/* <div className="grid gap-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Country</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    {[
                      "Australia",
                      "Canada",
                      "Cyprus",
                      "Germany",
                      "Ireland",
                      "New Zealand",
                      "UK",
                      "USA",
                    ].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div> */}

            {/* Level */}
            {/* <div className="grid gap-2">
              <Label>Level</Label>
              <Select value={degree} onValueChange={setDegree}>
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Level</SelectLabel>
                    <SelectItem value="any">Any</SelectItem>
                    {[
                      "Bachelor",
                      "Master",
                      "PhD",
                      "Diploma",
                      "Certificate",
                      "Associate",
                    ].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div> */}

            {/* Intake Month */}
            {/* <div className="grid gap-2">
              <Label>Intake Month</Label>
              <Select value={intakeMonth} onValueChange={setIntakeMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Any month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Intake Month</SelectLabel>
                    <SelectItem value="any">Any</SelectItem>
                    {[
                      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                    ].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div> */}

            {/* Intake Year */}
            {/* <div className="grid gap-2">
              <Label>Intake Year</Label>
              <Select value={intakeYear} onValueChange={setIntakeYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Any year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Intake Year</SelectLabel>
                    <SelectItem value="any">Any</SelectItem>
                    {["2025", "2026", "2027"].map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div> */}

            {/* Reset */}
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Results count ── */}
      {!loading && !error && (
        <p className="mb-4 text-sm text-muted-foreground">
          {courses.length === 0
            ? "No courses found"
            : `${courses.length} ${courses.length === 1 ? "course" : "courses"} found`}
        </p>
      )}

      {/* ── Error state ── */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <SearchX className="size-10 opacity-40" />
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadCourses({})}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Course grid ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
          : courses.map((course, i) => (
              <CourseCard key={i} course={course} onView={setSelectedCourse} />
            ))}
      </div>

      {/* ── Empty state ── */}
      {!loading && !error && courses.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <SearchX className="size-10 opacity-40" />
          <p className="text-sm">No courses match your filters.</p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* ── Detail sheet ── */}
      <CourseDetailSheet course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </PageTransition>
  );
}