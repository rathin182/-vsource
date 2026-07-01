"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false); // default false
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok) {
          setRole(data.role.name);
          setAuthenticated(true);
        } else {
          setAuthenticated(false); // explicitly mark as not authenticated
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setAuthenticated(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Wait until fetch completes — role being set means we got a valid response
    if (role === null) return;
    
    if (authenticated) {
      if (role.toLowerCase() === "counsellor") {
        router.replace("/applications");
      } else if (role.toLowerCase() === "receptionist") {
        router.replace("/leads/all");
      } else {
        router.replace("/leads/all");
      }
    } else {
      router.replace("/login");
    }
  }, [authenticated, role]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}