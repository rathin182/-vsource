"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Button } from "@/slids/components/ui/button";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Input } from "@/slids/components/ui/input";
import { Textarea } from "@/slids/components/ui/textarea";
import { Label } from "@/slids/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
import { toast } from "sonner";

const leadFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  mobileNumber: z.string().min(10, "Enter a valid mobile number"),
  alternateMobile: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  highestQualification: z.string().min(1, "Qualification is required"),
  percentage: z.number({ invalid_type_error: "Percentage is required" }).min(0).max(100),
  passingYear: z.number({ invalid_type_error: "Passing year is required" }).min(2000).max(2035),
  ieltsScore: z.string().optional(),
  pteScore: z.string().optional(),
  toeflScore: z.string().optional(),
  duolingoScore: z.string().optional(),
  preferredCountry: z.string().min(1, "Select a preferred country"),
  preferredCourse: z.string().min(1, "Preferred course is required"),
  preferredIntake: z.string().min(1, "Preferred intake is required"),
  preferredIntakeYear: z.string().min(1, "Preferred intake year is required"),
  budget: z.string().min(1, "Budget is required"),
  leadSource: z.string().min(1, "Lead source is required"),
  branch: z.string().min(1, "Branch is required"),
  assignedCounselor: z.string().min(1, "Assigned counselor is required"),
  leadStatus: z.string().min(1, "Lead status is required"),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const genderOptions = ["Male", "Female", "Other"];
const qualificationOptions = ["High School", "Diploma", "Bachelors", "Masters", "PhD"];
const intakeOptions = ["Fall", "Spring", "Summer", "Winter"];
const intakeYears = ["2025", "2026", "2027", "2028"];
const countryOptions = [
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Germany",
  "Ireland",
  "New Zealand",
  "France",
];
const sourceOptions = [
  "Website",
  "Referral",
  "Walk-in",
  "Education Fair",
  "Google Ads",
  "Social Media",
];
const branchOptions = ["Hyderabad", "Bangalore", "Chennai", "Delhi", "Mumbai"];
const counselorOptions = ["Aditi Rao", "Vinod Bansal", "Sneha Kapoor", "Manoj Verma", "Pooja Iyer"];
const statusOptions = ["New", "Contacted", "Qualified", "Converted", "Lost"];

export default function AddLeadPage() {
    const router = useRouter();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      alternateMobile: "",
      dob: "",
      gender: undefined,
      highestQualification: "Bachelors",
      percentage: 70,
      passingYear: 2025,
      ieltsScore: "",
      pteScore: "",
      toeflScore: "",
      duolingoScore: "",
      preferredCountry: "USA",
      preferredCourse: "MBA",
      preferredIntake: "Fall",
      preferredIntakeYear: "2026",
      budget: "",
      leadSource: "Website",
      branch: "Hyderabad",
      assignedCounselor: "Aditi Rao",
      leadStatus: "New",
      referralSource: "",
      notes: "",
    },
  });

  const onSubmit = async (values: LeadFormValues, continueFlow = false) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    toast.success("Lead saved successfully");

    if (continueFlow) {
       router.push("/leads/all");
      return;
    }

    reset(values as LeadFormValues);
  };

  const handleReset = () => reset();

  const sections = useMemo(
    () => [
      {
        title: "Personal Information",
        fields: [
          "firstName",
          "lastName",
          "email",
          "mobileNumber",
          "alternateMobile",
          "dob",
          "gender",
        ],
      },
      {
        title: "Academic Information",
        fields: [
          "highestQualification",
          "percentage",
          "passingYear",
          "ieltsScore",
          "pteScore",
          "toeflScore",
          "duolingoScore",
        ],
      },
      {
        title: "Study Preferences",
        fields: [
          "preferredCountry",
          "preferredCourse",
          "preferredIntake",
          "preferredIntakeYear",
          "budget",
        ],
      },
      {
        title: "Lead Information",
        fields: ["leadSource", "branch", "assignedCounselor", "leadStatus", "referralSource"],
      },
    ],
    [],
  );

  return (
    <PageTransition>
      <PageHeader
        title="Add Lead"
        description="Capture the full profile for a new enquiry and assign a counselor immediately."
      />

      <Card>
        <CardContent className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-3xl border border-border bg-background p-6">
              <div className="text-sm font-semibold">Personal Information</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register("lastName")} />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input id="mobileNumber" {...register("mobileNumber")} />
                  {errors.mobileNumber && (
                    <p className="text-xs text-destructive">{errors.mobileNumber.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="alternateMobile">Alternate Mobile</Label>
                  <Input id="alternateMobile" {...register("alternateMobile")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" {...register("dob")} />
                </div>
                <div className="grid gap-2">
                  <Label>Gender</Label>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Gender</SelectLabel>
                            {genderOptions.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-border bg-background p-6">
              <div className="text-sm font-semibold">Academic Information</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <Label>Highest Qualification</Label>
                  <Controller
                    control={control}
                    name="highestQualification"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Qualification</SelectLabel>
                            {qualificationOptions.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.highestQualification && (
                    <p className="text-xs text-destructive">
                      {errors.highestQualification.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Percentage</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register("percentage", { valueAsNumber: true })}
                  />
                  {errors.percentage && (
                    <p className="text-xs text-destructive">{errors.percentage.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Passing Year</Label>
                  <Input type="number" {...register("passingYear", { valueAsNumber: true })} />
                  {errors.passingYear && (
                    <p className="text-xs text-destructive">{errors.passingYear.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>IELTS Score</Label>
                  <Input {...register("ieltsScore")} placeholder="e.g. 6.5" />
                </div>
                <div className="grid gap-2">
                  <Label>PTE Score</Label>
                  <Input {...register("pteScore")} placeholder="e.g. 60" />
                </div>
                <div className="grid gap-2">
                  <Label>TOEFL Score</Label>
                  <Input {...register("toeflScore")} placeholder="e.g. 90" />
                </div>
                <div className="grid gap-2">
                  <Label>Duolingo Score</Label>
                  <Input {...register("duolingoScore")} placeholder="e.g. 110" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-3xl border border-border bg-background p-6 md:col-span-2">
              <div className="text-sm font-semibold">Study Preferences</div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Preferred Country</Label>
                  <Controller
                    control={control}
                    name="preferredCountry"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Country</SelectLabel>
                            {countryOptions.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.preferredCountry && (
                    <p className="text-xs text-destructive">{errors.preferredCountry.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Preferred Course</Label>
                  <Input {...register("preferredCourse")} />
                  {errors.preferredCourse && (
                    <p className="text-xs text-destructive">{errors.preferredCourse.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Preferred Intake</Label>
                  <Controller
                    control={control}
                    name="preferredIntake"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select intake" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Intake</SelectLabel>
                            {intakeOptions.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Preferred Intake Year</Label>
                  <Controller
                    control={control}
                    name="preferredIntakeYear"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Year</SelectLabel>
                            {intakeYears.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label>Budget</Label>
                  <Input {...register("budget")} placeholder="e.g. 15,000 USD" />
                  {errors.budget && (
                    <p className="text-xs text-destructive">{errors.budget.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-border bg-background p-6">
            <div className="text-sm font-semibold">Lead Information</div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Lead Source</Label>
                <Controller
                  control={control}
                  name="leadSource"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Lead source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Lead Source</SelectLabel>
                          {sourceOptions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label>Branch</Label>
                <Controller
                  control={control}
                  name="branch"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Branch</SelectLabel>
                          {branchOptions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label>Assigned Counselor</Label>
                <Controller
                  control={control}
                  name="assignedCounselor"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select counselor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Counselor</SelectLabel>
                          {counselorOptions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label>Lead Status</Label>
                <Controller
                  control={control}
                  name="leadStatus"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          {statusOptions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2 md:col-span-3">
                <Label>Referral Source</Label>
                <Input {...register("referralSource")} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-6">
            <div className="text-sm font-semibold mb-3">Notes</div>
            <Textarea
              rows={5}
              {...register("notes")}
              placeholder="Add any important context or next steps here."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleSubmit((values) => onSubmit(values, false))}
              disabled={isSubmitting}
            >
              Save Lead
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleSubmit((values) => onSubmit(values, true))}
              disabled={isSubmitting}
            >
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}