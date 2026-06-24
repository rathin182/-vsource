"use client";

import { useEffect, useMemo, useState } from "react";
import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
} from "@/slids/components/ui/dialog";

import { Card, CardContent } from "@/slids/components/ui/card";
import { Input } from "@/slids/components/ui/input";
import { Button } from "@/slids/components/ui/button";
import { Badge } from "@/slids/components/ui/badge";
import CourseForm from "@/slids/components/courses/course-form";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CourseSummary {
courseName: string;
universitiesCount: number;
averageFee: number;
minimumFee: number;
maximumFee: number;
}

interface CourseDetail {
universityId: string;
universityName: string;
annualTuitionFee: number | null;
totalTuitionFee: number | null;
durationMonths: number | null;
intake: string | null;
minimumPercentage: number | null;
backlogLimit: number | null;
ieltsOverall: number | null;
greRequired: boolean;
gmatRequired: boolean;
}

function StatItem({
label,
value,
}: {
label: string;
value: string | number;
}) {
return ( <div> <p className="text-xs text-muted-foreground">
{label} </p>

  <p className="font-semibold text-base mt-1">
    {value}
  </p>
</div>

);
}

export default function CoursesPage() {
const [courses, setCourses] = useState<CourseSummary[]>([]);
const [loading, setLoading] = useState(true);

const [search, setSearch] = useState("");

const [open, setOpen] = useState(false);
const [selectedCourse, setSelectedCourse] = useState("");

const [details, setDetails] = useState<CourseDetail[]> ([]);

const router = useRouter()

useEffect(() => {
loadCourses();
}, []);

async function loadCourses() {
try {
const res = await fetch("/api/courses");
const data = await res.json();

  setCourses(data);
} finally {
  setLoading(false);
}


}

async function handleDetails(
courseName: string
) {
const res = await fetch(
`/api/courses?courseName=${encodeURIComponent(
        courseName
      )}`
);


const data = await res.json();

setSelectedCourse(courseName);
setDetails(data);
setOpen(true);


}

const filteredCourses = useMemo(() => {
return courses.filter((course) =>
course.courseName
.toLowerCase()
.includes(search.toLowerCase())
);
}, [courses, search]);

const totalUniversities = useMemo(() => {
return courses.reduce(
(acc, item) =>
acc + item.universitiesCount,
0
);
}, [courses]);

const avgCourseFee = useMemo(() => {
if (!courses.length) return 0;


return Math.round(
  courses.reduce(
    (acc, item) =>
      acc + item.averageFee,
    0
  ) / courses.length
);


}, [courses]);

return ( 
<div className="p-6 md:p-8 max-w-7xl mx-auto"> 
  <div className="flex justify-between items-start">

  <div className="mb-8"> 
    <h1 className="text-3xl font-bold">
Courses Directory </h1>
    <p className="text-muted-foreground mt-2">
      Compare courses offered by
      universities, tuition fees,
      requirements and admission
      criteria.
    </p>
  </div>

            <Button
            onClick={() => router.push("/courses/add")}
          >
            <Plus className="size-4 mr-2" /> Add Course
          </Button>
  </div>

  <div className="grid md:grid-cols-3 gap-4 mb-8">
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          Total Courses
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {courses.length}
        </h2>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          University Listings
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {totalUniversities}
        </h2>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          Average Tuition Fee
        </p>

        <h2 className="text-3xl font-bold mt-2">
          $
          {avgCourseFee.toLocaleString()}
        </h2>
      </CardContent>
    </Card>
  </div>

  <div className="mb-6">
    <Input
      placeholder="Search course..."
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
    />
  </div>

  {loading ? (
    <div className="text-center py-20">
      Loading courses...
    </div>
  ) : (
    <div className="space-y-4">
      {filteredCourses.map((course) => (
        <Card
          key={course.courseName}
          className="transition"
        >
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap gap-3 items-center">
                  <h2 className="text-xl font-bold">
                    {course.courseName}
                  </h2>

                  <Badge>
                    {
                      course.universitiesCount
                    }{" "}
                    Universities
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-6">
                  <StatItem
                    label="Average Fee"
                    value={`$${course.averageFee.toLocaleString()}`}
                  />

                  <StatItem
                    label="Minimum Fee"
                    value={`$${course.minimumFee.toLocaleString()}`}
                  />

                  <StatItem
                    label="Maximum Fee"
                    value={`$${course.maximumFee.toLocaleString()}`}
                  />

                  <StatItem
                    label="Providers"
                    value={
                      course.universitiesCount
                    }
                  />
                </div>
              </div>

              <div>
                <Button
                  onClick={() =>
                    handleDetails(
                      course.courseName
                    )
                  }
                >
                  Compare Universities
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {!filteredCourses.length && (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No courses found
          </CardContent>
        </Card>
      )}
    </div>
  )}

  <Dialog
    open={open}
    onOpenChange={setOpen}
  >
    <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl">
          {selectedCourse}
        </DialogTitle>
      </DialogHeader>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {details.map((item) => (
          <Card
            key={item.universityId}
            className="h-full"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">
                  {
                    item.universityName
                  }
                </h3>

                <Badge variant="secondary">
                  {item.intake ||
                    "N/A"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-5">
                <StatItem
                  label="Annual Fee"
                  value={
                    item.annualTuitionFee
                      ? `$${item.annualTuitionFee.toLocaleString()}`
                      : "-"
                  }
                />

                <StatItem
                  label="Total Fee"
                  value={
                    item.totalTuitionFee
                      ? `$${item.totalTuitionFee.toLocaleString()}`
                      : "-"
                  }
                />

                <StatItem
                  label="Duration"
                  value={
                    item.durationMonths
                      ? `${item.durationMonths} Months`
                      : "-"
                  }
                />

                <StatItem
                  label="IELTS"
                  value={
                    item.ieltsOverall ??
                    "-"
                  }
                />

                <StatItem
                  label="Minimum %"
                  value={
                    item.minimumPercentage ??
                    "-"
                  }
                />

                <StatItem
                  label="Backlogs"
                  value={
                    item.backlogLimit ??
                    "-"
                  }
                />

                <StatItem
                  label="GRE"
                  value={
                    item.greRequired
                      ? "Required"
                      : "Not Required"
                  }
                />

                <StatItem
                  label="GMAT"
                  value={
                    item.gmatRequired
                      ? "Required"
                      : "Not Required"
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DialogContent>
  </Dialog>
</div>
);
}
