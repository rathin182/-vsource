// app\(dashboard)\universities\[id]\page.tsx
"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  ExternalLink,
  Globe2,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  Trophy,
  Trash2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/slids/components/ui/card";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import { Separator } from "@/slids/components/ui/separator";

interface Country {
  name?: string | null;
}

interface Course {
  id: string;
  name: string;
  courseCode?: string;
  degree?: string;
  description?: string;

  durationMonths?: number;

  annualTuitionFee?: number | string;
  totalTuitionFee?: number | string;
  currency?: string;

  minimumPercentage?: number;
  backlogLimit?: number;

  applicationDeadline?: string | null;

  englishRequirement?: string;

  ieltsOverall?: number;
  ieltsListening?: number;
  ieltsReading?: number;
  ieltsWriting?: number;
  ieltsSpeaking?: number;

  greRequired?: boolean;
  gmatRequired?: boolean;

  status?: boolean;
}

interface Scholarship {
  id: string;
  name: string;
  description?: string;

  amount?: number | string;
  percentage?: number;

  status: string;

  courseId?: string;
  universityId?: string;

  createdAt: string;
  updatedAt: string;
}

interface UniversityDetails {
  id: string;
  name: string;
  tier?: "T1" | "T2" | "T3" | "T4";
  status?: string | null;
  logo?: string | null;

  city?: string | null;
  state?: string | null;
  country?: Country | null;
  website?: string | null;

  ranking?: number | string | null;
  establishedYear?: number | null;
  applicationFee?: number | string | null;
  currency?: string | null;

  description?: string | null;
  intakeNotes?: string | null;

  address?: string | null;
  postalCode?: string | null;

  courses?: Course[];
  scholarships?: Scholarship[];
}

function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode = "USD",
) {
  if (amount === null || amount === undefined || amount === "") {
    return "N/A";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "N/A";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch {
    return `${currencyCode.toUpperCase()} ${numericAmount.toLocaleString()}`;
  }
}

function normalizeWebsiteUrl(website: string) {
  if (/^https?:\/\//i.test(website)) {
    return website;
  }

  return `https://${website}`;
}

function getWebsiteLabel(website: string) {
  return website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}
export default function UniversityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/universities/${universityId}`);

      toast.success("University deleted successfully");

      router.push("/universities");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete university");
    }
  };
  const universityId = String(params?.id ?? "");

  const [university, setUniversity] = useState<UniversityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchUniversity = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/universities/${universityId}`);
      console.log(response.data.data);

      setUniversity(response.data.data);
      setIsError(false);
    } catch (e) {
      console.error(e);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (universityId) fetchUniversity();
  }, [universityId]);

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (isError || !university) {
    return <PageErrorState />;
  }

  const courses = university.courses ?? [];
  const scholarships = university.scholarships ?? [];

  const status = university.status?.toLowerCase() || "inactive";

  const statusStyles: Record<string, string> = {
    active:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    inactive:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    archived:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  };
  const tierStyles: Record<string, string> = {
    T1: "border-purple-500/20 bg-purple-500/10 text-purple-700",
    T2: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    T3: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    T4: "border-orange-500/20 bg-orange-500/10 text-orange-700",
  };

  const location = [university.city, university.state, university.country?.name]
    .filter(Boolean)
    .join(", ");

  const applicationFee =
    Number(university.applicationFee) === 0
      ? "Free"
      : formatCurrency(university.applicationFee, university.currency || "USD");

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            asChild
            variant="ghost"
            className="w-fit gap-2 px-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/universities">
              <ArrowLeft className="h-4 w-4" />
              Back to Universities
            </Link>
          </Button>

          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl bg-background sm:flex-none"
              onClick={() => router.push(`/universities/action?id=${university.id}`)
              }
            >
              <Pencil className="h-4 w-4" />
              Edit University
            </Button>
          </div>
        </div>

        {/* University header */}
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="h-2 bg-primary" />

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-stretch lg:p-8">
            <div className="flex min-h-[160px] items-center justify-center rounded-2xl border bg-white px-8 py-7 shadow-sm">
              {university.logo ? (
                <img
                  src={university.logo}
                  alt={`${university.name} logo`}
                  className="max-h-24 w-full max-w-[275px] object-contain"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
                  {getInitials(university.name)}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col justify-center">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {university.tier && (
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 ${
                      tierStyles[university.tier]
                    }`}
                  >
                    {university.tier}
                  </Badge>
                )}

                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 capitalize ${
                    statusStyles[status] ??
                    "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {status}
                </Badge>

                <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  University Profile
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {university.name}
              </h1>

              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                {location && (
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>

                    <span>{location}</span>
                  </div>
                )}

                {university.website && (
                  <a
                    href={normalizeWebsiteUrl(university.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 transition-colors hover:text-primary"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Globe2 className="h-4 w-4" />
                    </div>

                    <span className="truncate">
                      {getWebsiteLabel(university.website)}
                    </span>

                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/20 px-5 py-5 sm:px-7 lg:px-8">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                icon={<Trophy />}
                label="University Ranking"
                value={
                  university.ranking ? `#${university.ranking}` : "Not added"
                }
              />

              <MetricCard
                icon={<CalendarDays />}
                label="Established"
                value={university.establishedYear?.toString() || "Not added"}
              />

              <MetricCard
                icon={<DollarSign />}
                label="Application Fee"
                value={applicationFee}
              />

              <MetricCard
                icon={<BookOpen />}
                label="Available Courses"
                value={courses.length.toString()}
              />
            </div>
          </div>
        </section>

        {/* Content layout */}
        <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-6">
            <InfoCard
              icon={<Building2 />}
              title="About University"
              description="Overview and general university information"
            >
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {university.description ||
                  "No university description has been added yet."}
              </p>
            </InfoCard>

            <InfoCard
              icon={<CheckCircle2 />}
              title="Intake Information"
              description="Important notes for student admissions"
            >
              {university.intakeNotes ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {university.intakeNotes}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-muted-foreground/60" />

                  <p className="text-sm font-medium text-foreground">
                    No admission notes
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Intake and admission notes will appear here.
                  </p>
                </div>
              )}
            </InfoCard>
          </aside>

          {/* Main content */}
          <main className="min-w-0 space-y-6">
            <Card className="overflow-hidden rounded-3xl border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <SectionIcon>
                      <GraduationCap className="h-5 w-5" />
                    </SectionIcon>

                    <div>
                      <CardTitle className="text-xl">
                        Available Courses
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Degree programmes offered by this university
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="w-fit rounded-full px-3 py-1"
                  >
                    {courses.length}{" "}
                    {courses.length === 1 ? "Course" : "Courses"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {courses.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen />}
                    title="No courses available"
                    description="Courses added for this university will appear here."
                  />
                ) : (
<div className="space-y-4">
  {courses.map((course) => (
    <CourseCard
      key={course.id}
      course={course}
      universityCurrency={university.currency || "USD"}
    />
  ))}
</div>
                )}
              </CardContent>
            </Card>

            {/* Scholarships */}
            <Card className="overflow-hidden rounded-3xl border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <SectionIcon>
                      <Award className="h-5 w-5" />
                    </SectionIcon>

                    <div>
                      <CardTitle className="text-xl">Scholarships</CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Financial aid and scholarship opportunities
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="w-fit rounded-full px-3 py-1"
                  >
                    {scholarships.length}{" "}
                    {scholarships.length === 1 ? "Scholarship" : "Scholarships"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {scholarships.length === 0 ? (
                  <EmptyState
                    icon={<Award />}
                    title="No scholarships available"
                    description="Scholarships added for this university will appear here."
                  />
                ) : (
                  <div className="space-y-4">
                    {scholarships.map((scholarship) => (
                      <ScholarshipCard
                        key={scholarship.id}
                        scholarship={scholarship}
                        currency={university.currency || "USD"}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

function PageLoadingState() {
  return (
    <div className="flex min-h-[500px] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading university details...</p>
      </div>
    </div>
  );
}

function PageErrorState() {
  return (
    <div className="mx-auto flex min-h-[500px] max-w-lg items-center px-4">
      <Card className="w-full rounded-2xl">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>

          <h1 className="text-xl font-semibold">University not found</h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The university may have been deleted, archived, or the page address
            may be incorrect.
          </p>

          <Button asChild className="mt-6 gap-2 rounded-xl">
            <Link href="/universities">
              <ArrowLeft className="h-4 w-4" />
              Back to Universities
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-muted/20 p-4 transition-colors hover:bg-muted/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 truncate text-base font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <CardHeader className="border-b bg-muted/20 px-5 py-5">
        <div className="flex items-start gap-3">
          <SectionIcon>{icon}</SectionIcon>

          <div className="min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>

            {description && (
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
      {children}
    </div>
  );
}

function CourseCard({
  course,
  universityCurrency,
}: {
  course: Course;
  universityCurrency: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b bg-muted/20 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-xl font-semibold text-foreground"
              title={course.name}
            >
              {course.name}
            </h3>

            {course.degree && (
              <Badge variant="secondary" className="capitalize">
                {course.degree}
              </Badge>
            )}

            <Badge
              className={
                course.status
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : "bg-red-100 text-red-700 hover:bg-red-100"
              }
            >
              {course.status ? "Active" : "Inactive"}
            </Badge>
          </div>

          {course.courseCode && (
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {course.courseCode}
            </p>
          )}

          {course.description && (
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
              {course.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={course.greRequired ? "default" : "outline"}>
            GRE {course.greRequired ? "Required" : "Not Required"}
          </Badge>

          <Badge variant={course.gmatRequired ? "default" : "outline"}>
            GMAT {course.gmatRequired ? "Required" : "Not Required"}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Course */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Course Details
          </h4>

          <DetailRow
            icon={<Clock3 />}
            label="Duration"
            value={
              course.durationMonths
                ? `${course.durationMonths} Months`
                : "Not specified"
            }
          />

          <DetailRow
            icon={<CalendarDays />}
            label="Deadline"
            value={
              course.applicationDeadline
                ? new Date(course.applicationDeadline).toLocaleDateString()
                : "Not Announced"
            }
          />

          <DetailRow
            icon={<BookOpen />}
            label="Status"
            value={course.status ? "Active" : "Inactive"}
          />
        </div>

        {/* Fees */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Fees & Eligibility
          </h4>

          <DetailRow
            icon={<DollarSign />}
            label="Annual Tuition"
            value={formatCurrency(
              course.annualTuitionFee,
              course.currency || universityCurrency
            )}
          />

          <DetailRow
            icon={<DollarSign />}
            label="Total Tuition"
            value={formatCurrency(
              course.totalTuitionFee,
              course.currency || universityCurrency
            )}
          />

          <DetailRow
            icon={<GraduationCap />}
            label="Minimum Percentage"
            value={
              course.minimumPercentage != null
                ? `${course.minimumPercentage}%`
                : "Not specified"
            }
          />

          <DetailRow
            icon={<BookOpen />}
            label="Backlog Limit"
            value={
              course.backlogLimit != null
                ? `${course.backlogLimit}`
                : "Not specified"
            }
          />
        </div>

        {/* English */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            English Requirements
          </h4>

          <DetailRow
            icon={<CheckCircle2 />}
            label="Requirement"
            value={course.englishRequirement || "N/A"}
          />

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 text-sm font-medium">
              IELTS Scores
            </div>

            <div className="grid grid-cols-5 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">Overall</p>
                <p className="font-semibold text-base">
                  {course.ieltsOverall ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground">Listening</p>
                <p className="font-semibold text-base">
                  {course.ieltsListening ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground">Reading</p>
                <p className="font-semibold text-base">
                  {course.ieltsReading ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground">Writing</p>
                <p className="font-semibold text-base">
                  {course.ieltsWriting ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground">Speaking</p>
                <p className="font-semibold text-base">
                  {course.ieltsSpeaking ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-2 py-0 text-sm transition-colors hover:bg-muted/40">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className="shrink-0 text-primary [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>

        <span>{label}</span>
      </div>

      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function ScholarshipCard({
  scholarship,
  currency,
}: {
  scholarship: Scholarship;
  currency: string;
}) {
  const hasAmount =
    scholarship.amount !== null &&
    scholarship.amount !== undefined &&
    Number(scholarship.amount) > 0;

  const hasPercentage =
    scholarship.percentage !== null &&
    scholarship.percentage !== undefined &&
    Number(scholarship.percentage) > 0;

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b bg-muted/20 p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Award className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-foreground">
              {scholarship.name}
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {scholarship.description ||
                "No scholarship description has been added."}
            </p>
          </div>
        </div>

        <Badge
          className={
            scholarship.status === "active"
              ? "bg-green-100 text-green-700 hover:bg-green-100"
              : "bg-red-100 text-red-700 hover:bg-red-100"
          }
        >
          {scholarship.status}
        </Badge>
      </div>

      {/* Body */}
      <div className="grid gap-6 p-6 lg:grid-cols-3">
        {/* Award Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Award Details
          </h4>

          <DetailRow
            icon={<DollarSign />}
            label="Scholarship Amount"
            value={
              hasAmount
                ? formatCurrency(scholarship.amount, currency)
                : "Not Available"
            }
          />

          <DetailRow
            icon={<Award />}
            label="Tuition Waiver"
            value={
              hasPercentage
                ? `${scholarship.percentage}%`
                : "Not Available"
            }
          />
        </div>

        {/* Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Information
          </h4>

          <DetailRow
            icon={<BookOpen />}
            label="Scholarship ID"
            value={scholarship.id.slice(0, 8)}
          />

          <DetailRow
            icon={<CheckCircle2 />}
            label="Status"
            value={scholarship.status}
          />
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Timeline
          </h4>

          <DetailRow
            icon={<CalendarDays />}
            label="Created"
            value={new Date(
              scholarship.createdAt,
            ).toLocaleDateString()}
          />

          <DetailRow
            icon={<CalendarDays />}
            label="Updated"
            value={new Date(
              scholarship.updatedAt,
            ).toLocaleDateString()}
          />
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>

      <h3 className="font-semibold text-foreground">{title}</h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
