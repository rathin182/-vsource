"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/slids/components/ui/button";
import {
Card,
CardContent,
CardHeader,
CardTitle,
CardDescription,
} from "@/slids/components/ui/card";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Textarea } from "@/slids/components/ui/textarea";
import { Switch } from "@/slids/components/ui/switch";

import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/slids/components/ui/select";

const BranchFormSchema = z.object({
name: z
.string()
.min(1, "Branch name is required"),

code: z
.string()
.min(1, "Branch code is required"),

email: z
.string()
.email("Invalid email")
.optional()
.or(z.literal("")),

phone: z
.string()
.regex(
/^[0-9]{10}$/,
"Phone number must be exactly 10 digits"
)
.optional()
.or(z.literal("")),

city: z.string().optional(),

state: z.string().optional(),

country: z.string().optional(),

pincode: z.string().optional(),

address: z.string().optional(),

status: z.boolean().optional(),
});

type BranchFormValues = z.infer<
typeof BranchFormSchema

> ;

const countries = [
"India",
"Canada",
"Australia",
"United States",
"United Kingdom",
"Germany",
"Ireland",
"New Zealand",
"France",
"Singapore",
"UAE",
];

export default function BranchFormPage() {
const router = useRouter();

const [loading, setLoading] =
useState(false);

const {
register,
handleSubmit,
reset,
setValue,
watch,
formState: { errors },
} = useForm<BranchFormValues>({
resolver: zodResolver(
BranchFormSchema
),
defaultValues: {
status: true,
country: "India",
},
});

const phone =
watch("phone") || "";

const handlePhoneChange = (
e: React.ChangeEvent<HTMLInputElement>
) => {
const value = e.target.value
.replace(/\D/g, "")
.slice(0, 10);


setValue("phone", value, {
  shouldValidate: true,
});


};

const onSubmit = async (
values: BranchFormValues
) => {
try {
setLoading(true);


  const response = await fetch(
    "/api/branches",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(values),
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to create branch"
    );
  }

  alert(
    "Branch created successfully"
  );

  reset();

  router.back();
} catch (error: any) {
  alert(
    error.message ||
      "Something went wrong"
  );
} finally {
  setLoading(false);
}


};

return ( <div className="max-w-7xl mx-auto p-6">
{/* Header */}


  <div className="flex items-center justify-between mb-8">
    <div>
      <Button
        variant="ghost"
        className="mb-3 px-0"
        onClick={() =>
          router.back()
        }
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold">
        Create Branch
      </h1>

      <p className="text-muted-foreground mt-1">
        Add a new branch office
        to your organization.
      </p>
    </div>
  </div>

  <form
    onSubmit={handleSubmit(
      onSubmit
    )}
  >
    <div className="space-y-6">
      {/* Basic Details */}

      <Card>
        <CardHeader>
          <CardTitle>
            Basic Information
          </CardTitle>

          <CardDescription>
            Branch details and
            identification
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label>
                Branch Name *
              </Label>

              <Input
                placeholder="Delhi Branch"
                {...register(
                  "name"
                )}
              />

              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {
                    errors.name
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <Label>
                Branch Code *
              </Label>

              <Input
                placeholder="DEL001"
                {...register(
                  "code"
                )}
              />

              {errors.code && (
                <p className="text-red-500 text-sm mt-1">
                  {
                    errors.code
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <Label>
                Email
              </Label>

              <Input
                type="email"
                placeholder="branch@company.com"
                {...register(
                  "email"
                )}
              />

              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {
                    errors.email
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <Label>
                Phone Number
              </Label>

              <Input
                value={phone}
                onChange={
                  handlePhoneChange
                }
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
              />

              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {
                    errors.phone
                      .message
                  }
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}

      <Card>
        <CardHeader>
          <CardTitle>
            Location Details
          </CardTitle>

          <CardDescription>
            Branch location and
            address information
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <Label>
                Country
              </Label>

              <Select
                defaultValue="India"
                onValueChange={(
                  value
                ) =>
                  setValue(
                    "country",
                    value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>

                <SelectContent>
                  {countries.map(
                    (
                      country
                    ) => (
                      <SelectItem
                        key={
                          country
                        }
                        value={
                          country
                        }
                      >
                        {
                          country
                        }
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                State
              </Label>

              <Input
                placeholder="Delhi"
                {...register(
                  "state"
                )}
              />
            </div>

            <div>
              <Label>
                City
              </Label>

              <Input
                placeholder="New Delhi"
                {...register(
                  "city"
                )}
              />
            </div>

            <div>
              <Label>
                Pincode
              </Label>

              <Input
                placeholder="110001"
                {...register(
                  "pincode"
                )}
              />
            </div>

            <div className="md:col-span-2">
              <Label>
                Address
              </Label>

              <Textarea
                rows={4}
                placeholder="Enter complete branch address..."
                {...register(
                  "address"
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}

      <Card>
        <CardHeader>
          <CardTitle>
            Settings
          </CardTitle>

          <CardDescription>
            Branch availability
            and visibility
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              checked={watch(
                "status"
              )}
              onCheckedChange={(
                value
              ) =>
                setValue(
                  "status",
                  value
                )
              }
            />

            <Label>
              Active Branch
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Footer Actions */}

    <div className="sticky bottom-0 bg-background border-t mt-8 py-4">
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.back()
          }
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating..."
            : "Create Branch"}
        </Button>
      </div>
    </div>
  </form>
</div>


);
}
