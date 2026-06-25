"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/slids/store";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [authenticated, setAuthenticated] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // const logdata = async () => {
  //   try {
  //     const res = await fetch("/api/auth/login", {
  //       method: "GET",
  //     });

  //     if (res.ok) {
  //       setAuthenticated(res.ok);
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch data:', error);
  //   }
  // };

  // useEffect(() => {
  //   // logdata();
  //   setHydrated(true);
  // }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");

        const data = await res.json();
        if (res.ok) {
          setAuthenticated(res.ok);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchUser();
  }, []);

    useEffect(() => {
    if (authenticated) {

      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [authenticated]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}