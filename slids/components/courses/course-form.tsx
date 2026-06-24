"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/slids/components/ui/card";

import {
  Input,
} from "@/slids/components/ui/input";

import {
  Textarea,
} from "@/slids/components/ui/textarea";

import {
  Button,
} from "@/slids/components/ui/button";

import {
  Label,
} from "@/slids/components/ui/label";

import {
  Switch,
} from "@/slids/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
import { CourseFormData } from "@/slids/types";

interface University {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
}

interface Intake {
  id: string;
  name: string;
}

export default function CourseForm() {
  const { register, handleSubmit, setValue, watch } =
    useForm<CourseFormData>({
      defaultValues: {
        greRequired: false,
        gmatRequired: false,
        status: true,
      },
    });

  const [universities, setUniversities] =
    useState<University[]>([]);

  const [countries, setCountries] =
    useState<Country[]>([]);

  const [intakes, setIntakes] =
    useState<Intake[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    const [
      universityRes,
      countryRes,
      intakeRes,
    ] = await Promise.all([
      fetch("/api/universities/all"),
      fetch("/api/countries/all"),
      fetch("/api/intakes/all"),
    ]);
    console.log(await universityRes.json());
    
    setUniversities(await universityRes.json());
    setCountries(await countryRes.json());
    setIntakes(await intakeRes.json());
  }

  async function onSubmit(data: any) {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert("Course Created");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            Course Information
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>
              Course Name
            </Label>
            <Input
              {...register("name")}
            />
          </div>

          <div>
            <Label>
              Course Code
            </Label>
            <Input
              {...register(
                "courseCode"
              )}
            />
          </div>

          <div>
            <Label>
              Degree Type
            </Label>

            <Select
              onValueChange={(v) =>
                setValue(
                  "degree",
                  v
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Degree" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="BACHELORS">
                  Bachelors
                </SelectItem>

                <SelectItem value="MASTERS">
                  Masters
                </SelectItem>

                <SelectItem value="PHD">
                  PhD
                </SelectItem>

                <SelectItem value="DIPLOMA">
                  Diploma
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              Duration (Months)
            </Label>

            <Input
              type="number"
              {...register(
                "durationMonths",
                {
                  valueAsNumber:
                    true,
                }
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            University Details
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>
              University
            </Label>

            <Select
              onValueChange={(v) =>
                setValue(
                  "universityId",
                  v
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select University" />
              </SelectTrigger>

              <SelectContent>
                {universities.length > 0 && universities.map(
                  (
                    university
                  ) => (
                    <SelectItem
                      key={
                        university.id
                      }
                      value={
                        university.id
                      }
                    >
                      {
                        university.name
                      }
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              Country
            </Label>

            <Select
              onValueChange={(v) =>
                setValue(
                  "countryId",
                  v
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>

              <SelectContent>
                {countries.length > 0 && countries.map(
                  (
                    country
                  ) => (
                    <SelectItem
                      key={
                        country.id
                      }
                      value={
                        country.id
                      }
                    >
                      {country.name}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Intake</Label>

            <Select
              onValueChange={(v) =>
                setValue(
                  "intakeId",
                  v
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Intake" />
              </SelectTrigger>

              <SelectContent>
                {intakes.length > 0 && intakes.map(
                  (
                    intake
                  ) => (
                    <SelectItem
                      key={
                        intake.id
                      }
                      value={
                        intake.id
                      }
                    >
                      {intake.name}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Tuition Fees
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-3 gap-4">
          <Input
            type="number"
            placeholder="Annual Fee"
            {...register(
              "annualTuitionFee",
              {
                valueAsNumber:
                  true,
              }
            )}
          />

          <Input
            type="number"
            placeholder="Total Fee"
            {...register(
              "totalTuitionFee",
              {
                valueAsNumber:
                  true,
              }
            )}
          />

          <Input
            placeholder="Currency"
            {...register(
              "currency"
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Academic Requirements
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-3 gap-4">
          <Input
            type="number"
            placeholder="Minimum %"
            {...register(
              "minimumPercentage",
              {
                valueAsNumber:
                  true,
              }
            )}
          />

          <Input
            type="number"
            placeholder="Backlog Limit"
            {...register(
              "backlogLimit",
              {
                valueAsNumber:
                  true,
              }
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            IELTS Requirements
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-5 gap-4">
          <Input
            type="number"
            step="0.5"
            placeholder="Overall"
            {...register(
              "ieltsOverall",
              {
                valueAsNumber:
                  true,
              }
            )}
          />

          <Input
            type="number"
            step="0.5"
            placeholder="Listening"
            {...register(
              "ieltsListening",
              {
                valueAsNumber:
                  true,
              }
            )}
          />

          <Input
            type="number"
            step="0.5"
            placeholder="Reading"
            {...register(
              "ieltsReading",
              {
                valueAsNumber:
                  true,
              }
            )}
          />

          <Input
            type="number"
            step="0.5"
            placeholder="Writing"
            {...register(
              "ieltsWriting",
              {
                valueAsNumber:
                  true,
              }
            )}
          />

          <Input
            type="number"
            step="0.5"
            placeholder="Speaking"
            {...register(
              "ieltsSpeaking",
              {
                valueAsNumber:
                  true,
              }
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Additional Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            rows={6}
            placeholder="Course Description"
            {...register(
              "description"
            )}
          />

          <Input
            type="date"
            {...register(
              "applicationDeadline"
            )}
          />

          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <Switch
                checked={watch(
                  "greRequired"
                )}
                onCheckedChange={(
                  v
                ) =>
                  setValue(
                    "greRequired",
                    v
                  )
                }
              />

              <Label>
                GRE Required
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={watch(
                  "gmatRequired"
                )}
                onCheckedChange={(
                  v
                ) =>
                  setValue(
                    "gmatRequired",
                    v
                  )
                }
              />

              <Label>
                GMAT Required
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={watch(
                  "status"
                )}
                onCheckedChange={(
                  v
                ) =>
                  setValue(
                    "status",
                    v
                  )
                }
              />

              <Label>
                Active
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
      >
        Create Course
      </Button>
    </form>
  );
}