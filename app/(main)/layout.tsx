"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/slids/store";
import { Toaster } from "@/slids/components/ui/sonner";
import DashboardShell from '@/slids/layouts/DashboardShell'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // const logdata = async () => {
  //   try {
  //     const res = await fetch("/api/auth/login", {
  //       method: "GET",
  //     });

  //     if (res.ok) {
  //       setAuthenticated(true);
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch data:', error);
  //   }
  // };

  // useEffect(() => {
  //   logdata();
  // }, []);


  // useEffect(() => {
  //   if (isAuthenticated) {

  //     router.replace("/dashboard");
  //   } else {
  //     router.replace("/login");
  //   }
  // }, [isAuthenticated]);

  return (
    <>
      <DashboardShell>
        {children}
      </DashboardShell>
      <Toaster richColors position="top-right" />
    </>
  );
}
