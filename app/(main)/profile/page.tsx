"use client";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Avatar, AvatarFallback } from "@/slids/components/ui/avatar";
import { useAuth } from "@/slids/store";
import { Camera } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  return (
    <PageTransition>
      <PageHeader title="Profile" description="Manage your personal account and organization." />
      <Card className="overflow-hidden mb-4">
        <div className="h-32 bg-[image:var(--gradient-primary)] relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <CardContent className="p-6 -mt-12 relative">
          <div className="flex items-end gap-4">
            <Avatar className="size-24 ring-4 ring-background"><AvatarFallback className="bg-[image:var(--gradient-primary)] text-white text-2xl font-bold">{user?.name?.split(" ").map((p) => p[0]).join("")}</AvatarFallback></Avatar>
            <Button size="sm" variant="outline" className="mb-1"><Camera className="size-4 mr-1.5" /> Change photo</Button>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold">{user?.name}</div>
            <div className="text-sm text-muted-foreground capitalize">{user?.role} · {user?.email}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { l: "Full name", v: user?.name ?? "" },
            { l: "Email", v: user?.email ?? "" },
            { l: "Phone", v: "+91 98765 43210" },
            { l: "Designation", v: user?.role === "admin" ? "Administrator" : "Senior Counselor" },
            { l: "Branch", v: "Hyderabad HQ" },
            { l: "Department", v: "Operations" },
          ].map((f) => (
            <div key={f.l} className="grid gap-1.5"><Label>{f.l}</Label><Input defaultValue={f.v} /></div>
          ))}
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
