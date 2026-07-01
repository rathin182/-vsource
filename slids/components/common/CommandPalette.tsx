"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/slids/components/ui/command";

import { useUi } from "@/slids/store";

import {
  Users,
  FileText,
  Building2,
  BarChart3,
  UserCog,
  MapPin,
  Activity,
} from "lucide-react";

const items = [
  {
    to: "/leads",
    label: "Master - Walkins",
    icon: Users,
    roles: ["ADMIN", "RECEPTIONIST", "SUPER ADMIN"],
    children: [
      {
        to: "/leads/all",
        label: "All Walk-In",
      },
      {
        to: "/leads/add",
        label: "Add Walk-in's",
      },
    ],
  },
  {
    to: "/visa",
    label: "Visa Applications",
    icon: Activity,
    roles: ["ADMIN", "COUNSELLOR", "SUPER ADMIN"],
  },
  {
    to: "/applications",
    label: "Daily Tracker - Masters",
    icon: FileText,
    roles: ["ADMIN", "COUNSELLOR", "SUPER ADMIN"],
  },
  {
    to: "/reports",
    label: "Performances",
    icon: BarChart3,
    roles: ["ADMIN", "COUNSELLOR", "SUPER ADMIN"],
  },
  {
    to: "/branches",
    label: "Branches",
    icon: MapPin,
    roles: ["ADMIN", "SUPER ADMIN"],
  },
  {
    to: "/universities",
    label: "Abroad Universities",
    icon: Building2,
    roles: ["ADMIN", "SUPER ADMIN"],
  },
  {
    to: "/users",
    label: "User Management",
    icon: UserCog,
    roles: ["ADMIN", "SUPER ADMIN"],
  },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen } = useUi();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me");

        if (res.status === 200) {
          setUser(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  const role = user?.role?.name?.toUpperCase();

  const filteredItems = useMemo(() => {
    if (!role) return [];

    return items.filter((item) => item.roles.includes(role));
  }, [role]);

  const navigate = (url: string) => {
    router.push(url);
    setCommandOpen(false);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search modules..." />

      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {filteredItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.to}>
                <CommandItem onSelect={() => navigate(item.to)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>

                {"children" in item &&
                  item.children?.map((child) => (
                    <CommandItem
                      key={child.to}
                      value={`${item.label} ${child.label}`}
                      onSelect={() => navigate(child.to)}
                      className="pl-9"
                    >
                      {child.label}
                    </CommandItem>
                  ))}
              </div>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {(role === "ADMIN" ||
            role === "SUPER ADMIN" ||
            role === "RECEPTIONIST") && (
            <CommandItem onSelect={() => navigate("/leads/add")}>
              + Add Walk-in
            </CommandItem>
          )}

          {(role === "ADMIN" ||
            role === "COUNSELLOR" ||
            role === "SUPER ADMIN") && (
            <>
              <CommandItem onSelect={() => navigate("/visa")}>
                Open Visa Applications
              </CommandItem>

              <CommandItem onSelect={() => navigate("/applications")}>
                Open Daily Tracker
              </CommandItem>
            </>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}