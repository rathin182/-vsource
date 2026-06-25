import {
  Calendar,
  Clock3,
  DollarSign,
  GraduationCap,
  Building2,
  BookOpen,
  Globe,
  Award,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/slids/components/ui/sheet";
import { formatDuration, formatFee, UniversityCourse } from "./common";


export default function CourseDetailSheet({
  course,
  onClose,
}: {
  course: UniversityCourse | null;
  onClose: () => void;
}) {
  if (!course) return null;

  const Row = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-none">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {value || "-"}
      </span>
    </div>
  );

  const StatCard = ({
    icon,
    title,
    value,
  }: {
    icon: React.ReactNode;
    title: string;
    value: React.ReactNode;
  }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{title}</span>
      </div>

      <div className="mt-3 text-xl font-bold text-gray-900">{value}</div>
    </div>
  );

  const ScoreCard = ({
    label,
    score,
  }: {
    label: string;
    score: number | null | undefined;
  }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {score ?? "-"}
      </p>
    </div>
  );

  return (
    <Sheet open={!!course} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl p-0">

        {/* Hero */}

        <div className="border-b bg-gradient-to-r from-slate-50 via-white to-slate-100 p-8">
          <div className="flex items-start gap-5">

            {course.university.logo ? (
              <img
                src={course.university.logo}
                alt={course.university.name}
                className="h-20 w-20 rounded-xl border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border bg-gray-100">
                <Building2 size={34} />
              </div>
            )}

            <div className="flex-1">

              <h2 className="text-3xl font-bold text-gray-900">
                {course.name}
              </h2>

              <p className="mt-1 text-gray-500">
                {course.university.name}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                  {course.degree}
                </span>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                  {course.university.country.name}
                </span>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                  {course.intake?.name}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    course.status
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {course.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-6">

          {/* Quick Stats */}

          <section>

            <h3 className="mb-4 text-lg font-semibold">
              Overview
            </h3>

            <div className="grid grid-cols-2 gap-4">

              <StatCard
                icon={<DollarSign size={18} />}
                title="Annual Tuition"
                value={formatFee(
                  Number(course.annualTuitionFee),
                  course.currency
                )}
              />

              <StatCard
                icon={<DollarSign size={18} />}
                title="Total Tuition"
                value={formatFee(
                  Number(course.totalTuitionFee),
                  course.currency
                )}
              />

              <StatCard
                icon={<Clock3 size={18} />}
                title="Duration"
                value={formatDuration(course.durationMonths)}
              />

              <StatCard
                icon={<Calendar size={18} />}
                title="Deadline"
                value={
                  course.applicationDeadline
                    ? new Date(
                        course.applicationDeadline
                      ).toLocaleDateString()
                    : "Open"
                }
              />

            </div>
          </section>

          {/* Admission */}

          <section>

            <h3 className="mb-4 text-lg font-semibold">
              Admission Requirements
            </h3>

            <div className="rounded-xl border bg-white p-5">

              <Row
                label="Minimum Percentage"
                value={`${course.minimumPercentage}%`}
              />

              <Row
                label="Maximum Backlogs"
                value={course.backlogLimit}
              />

              <Row
                label="English Requirement"
                value={course.englishRequirement}
              />

              <Row
                label="GRE"
                value={
                  course.greRequired ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 size={16} />
                      Required
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500">
                      <XCircle size={16} />
                      Not Required
                    </span>
                  )
                }
              />

              <Row
                label="GMAT"
                value={
                  course.gmatRequired ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 size={16} />
                      Required
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500">
                      <XCircle size={16} />
                      Not Required
                    </span>
                  )
                }
              />
            </div>
          </section>

          {/* IELTS */}

          <section>

            <h3 className="mb-4 text-lg font-semibold">
              English Proficiency (IELTS)
            </h3>

            <div className="grid grid-cols-2 gap-4">

              <ScoreCard
                label="Overall"
                score={course.ieltsOverall}
              />

              <ScoreCard
                label="Listening"
                score={course.ieltsListening}
              />

              <ScoreCard
                label="Reading"
                score={course.ieltsReading}
              />

              <ScoreCard
                label="Writing"
                score={course.ieltsWriting}
              />

              <ScoreCard
                label="Speaking"
                score={course.ieltsSpeaking}
              />

            </div>

          </section>

          {/* Scholarships */}

          <section>

            <h3 className="mb-4 text-lg font-semibold">
              Scholarships
            </h3>

            {course.scholarships.length > 0 ? (
              <div className="space-y-3">

                {course.scholarships.map((scholarship: any) => (
                  <div
                    key={scholarship.id}
                    className="rounded-xl border bg-white p-5"
                  >
                    <div className="flex items-center gap-2">

                      <Award className="text-yellow-500" size={18} />

                      <span className="font-semibold">
                        {scholarship.name}
                      </span>

                    </div>

                    {scholarship.description && (
                      <p className="mt-2 text-sm text-gray-500">
                        {scholarship.description}
                      </p>
                    )}

                  </div>
                ))}

              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-gray-500">
                No scholarships available
              </div>
            )}

          </section>

          {/* About */}

          {course.description && (
            <section>

              <h3 className="mb-4 text-lg font-semibold">
                About this Program
              </h3>

              <div className="rounded-xl border bg-white p-5 leading-7 text-gray-600">
                {course.description}
              </div>

            </section>
          )}

          {/* Metadata */}

          <section>

            <h3 className="mb-4 text-lg font-semibold">
              Course Information
            </h3>

            <div className="rounded-xl border bg-white p-5">

              <Row
                label="Course Code"
                value={course.courseCode}
              />

              <Row
                label="Degree"
                value={course.degree}
              />

              <Row
                label="University Tier"
                value={course.university.tier}
              />

              <Row
                label="Country"
                value={course.university.country.name}
              />

              <Row
                label="Created"
                value={new Date(
                  course.createdAt
                ).toLocaleDateString()}
              />

              <Row
                label="Last Updated"
                value={new Date(
                  course.updatedAt
                ).toLocaleDateString()}
              />

            </div>

          </section>

        </div>

      </SheetContent>
    </Sheet>
  );
}