"use client";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Avatar, AvatarFallback } from "@/slids/components/ui/avatar";
import { useAuth } from "@/slids/store";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function Profile() {
  // const { user } = useAuth();
  const [user, setUser] = useState<any>({});

  const me = async () => {
    try {
      const response = await fetch(
        "/api/auth/me"
      );

      if (!response.ok) {
        toast.error("something went wrong");
        return;
      }

      const user = await response.json();
      setUser(user)

    } catch (error) {
      console.error(
        "Error fetching data:",
        error
      );
    }
  };

  useEffect(() => {
    me()
  }, []);
  
  return (
    <PageTransition>
      <PageHeader
        title="Profile"
        description="Manage your personal account and organization."
      />

      <Card className="mb-6 overflow-hidden">
        <div className="relative h-36 bg-[image:var(--gradient-primary)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,white_1px,transparent_1px)] opacity-20 [background-size:20px_20px]" />
        </div>

        <CardContent className="relative -mt-10 p-6">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-5">
              <Avatar className="size-24 ring-4 ring-background">
                <AvatarFallback className="bg-[image:var(--gradient-primary)] text-2xl font-bold text-white">
                  {user?.name
                    ?.split(" ")
                    ?.map((p: string) => p[0])
                    ?.join("") || "U"}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-2xl font-bold">
                  {user?.name}
                </h2>

                <p className="text-muted-foreground">
                  {user?.email}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {user?.role?.name}
                  </span>

                  {user?.branches?.map((branch: any) => (
                    <span
                      key={branch.id}
                      className="rounded-full bg-muted px-3 py-1 text-xs"
                    >
                      {branch.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* <Button variant="outline">
              <Camera className="mr-2 h-4 w-4" />
              Change Photo
            </Button> */}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

          <div>
            <Label>Full Name</Label>

            <Input
              value={user?.name || ""}
              readOnly
            />
          </div>

          <div>
            <Label>Email Address</Label>

            <Input
              value={user?.email || ""}
              readOnly
            />
          </div>

          <div>
            <Label>Role</Label>

            <Input
              value={user?.role?.name || ""}
              readOnly
            />
          </div>

          <div>
            <Label>Monthly Target</Label>

            <Input
              value={user?.monthlyTarget ?? 0}
              readOnly
            />
          </div>

          <div>
            <Label>Branch</Label>

            <Input
              value={
                user?.branches?.length
                  ? user.branches
                    .map((b: any) => b.name)
                    .join(", ")
                  : "No Branch Assigned"
              }
              readOnly
            />
          </div>

          <div>
            <Label>Created On</Label>

            <Input
              value={
                user?.createdAt
                  ? new Date(
                    user.createdAt
                  ).toLocaleDateString()
                  : ""
              }
              readOnly
            />
          </div>

          <div className="md:col-span-2">
            <Label>User ID</Label>

            <Input
              value={user?.id || ""}
              readOnly
            />
          </div>

        </CardContent>
      </Card>
    </PageTransition>


  );
}
