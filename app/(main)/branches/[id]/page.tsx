"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import axios from "axios";

const BranchFormSchema = z.object({
  name: z.string().min(1, "Branch name is required"),

  code: z.string().min(1, "Branch code is required"),

  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
    .optional()
    .or(z.literal("")),

  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  address: z.string().optional(),
  status: z.boolean().optional(),
});

type BranchFormValues = z.infer<typeof BranchFormSchema>;


export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [countries, setCountries] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(BranchFormSchema),
    defaultValues: {
      status: true,
      country: "India",
    },
  });

  const phone = watch("phone") || "";
  const selectedCountry = watch("country");

  // Fetch existing branch data
  useEffect(() => {
    if (!id) return;

    const fetchBranch = async () => {
      try {
        setFetching(true);
        setFetchError(null);

        const response = await fetch(`/api/branches/${id}`);
        const res = await response.json();

        const result = res.data
        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch branch details");
        }

        console.log(result);
        

        // Populate form with fetched data
        reset({
          name: result.name || "",
          code: result.code || "",
          email: result.email || "",
          phone: result.phone || "",
          city: result.city || "",
          state: result.state || "",
          country: result.country || "India",
          pincode: result.pincode || "",
          address: result.address || "",
          status: result.status ?? true,
        });
      } catch (error: any) {
        setFetchError(error.message || "Something went wrong while loading branch");
      } finally {
        setFetching(false);
      }
    };

    fetchBranch();
  }, [id, reset]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setValue("phone", value, { shouldValidate: true });
  };

  const onSubmit = async (values: BranchFormValues) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/branches/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update branch");
      }

      alert("Branch updated successfully");
      router.back();
    } catch (error: any) {
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  

  const getCountries = async () => {
    const res = await axios.get("/api/countries/all");
    if (res.status === 200) {
      setCountries(res.data.data); 
    }
  }

  useEffect(() => {
    getCountries();
  }, [])
  // Loading skeleton
  if (fetching) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-24 bg-muted animate-pulse rounded mb-3" />
            <div className="h-9 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-5 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Fetch error state
  if (fetchError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-6 px-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-destructive font-medium mb-2">Failed to load branch</p>
            <p className="text-muted-foreground text-sm mb-6">{fetchError}</p>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            className="mb-3 px-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-3xl font-bold">Edit Branch</h1>

          <p className="text-muted-foreground mt-1">
            Update the details for this branch.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Branch details and identification</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label>Branch Name *</Label>
                  <Input
                    placeholder="Delhi Branch"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Branch Code *</Label>
                  <Input
                    placeholder="DEL001"
                    {...register("code")}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="branch@company.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={phone}
                    onChange={handlePhoneChange}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Branch location and address information</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label>Country</Label>
                  <Select
                    value={selectedCountry || "India"}
                    onValueChange={(value) => setValue("country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.length > 0 && countries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>State</Label>
                  <Input placeholder="Delhi" {...register("state")} />
                </div>

                <div>
                  <Label>City</Label>
                  <Input placeholder="New Delhi" {...register("city")} />
                </div>

                <div>
                  <Label>Pincode</Label>
                  <Input placeholder="110001" {...register("pincode")} />
                </div>

                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    rows={4}
                    placeholder="Enter complete branch address..."
                    {...register("address")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Branch availability and visibility</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <Switch
                  checked={watch("status")}
                  onCheckedChange={(value) => setValue("status", value)}
                />
                <Label>Active Branch</Label>
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
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}