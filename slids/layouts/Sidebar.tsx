"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Building2,
  Banknote,
  BarChart3,
  Megaphone,
  UserCog,
  ShieldCheck,
  Settings2,
  MapPin,
  User,
  Settings,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";

import { useUi } from "@/slids/store";
import { cn } from "@/lib/utils";
import logo from "@/assets/vsourcess.png";
import { toast } from "sonner";

const items = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "Super Admin"],
  },
  {
    to: "/leads",
    label: "Leads",
    icon: Users,
    roles: ["ADMIN", "RECEPTIONIST", "Super Admin"],
    children: [
      { to: "/leads/all", label: "All Leads" },
      { to: "/leads/allocated", label: "Allocated" },
      { to: "/leads/today-followup", label: "Today Follow-up" },
      { to: "/leads/all-followup", label: "All Follow-ups" },
      { to: "/leads/add", label: "Add Lead" },
    ],
  },
  {
    to: "/students",
    label: "Students",
    icon: GraduationCap,
    roles: ["ADMIN", "COUNSELOR", "Super Admin"],
  },
  {
    to: "/applications",
    label: "Applications",
    icon: FileText,
    roles: ["ADMIN", "COUNSELOR", "Super Admin"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["ADMIN", "COUNSELOR", "Super Admin"],
  },
  {
    to: "/profile",
    label: "Profile",
    icon: User,
    roles: ["ADMIN", "RECEPTIONIST", "COUNSELOR", "Super Admin"],
  },

  // Admin only
  {
    to: "/universities",
    label: "Universities",
    icon: Building2,
    roles: ["ADMIN", "Super Admin"],
  },
  {
    to: "/loans",
    label: "Education Loans",
    icon: Banknote,
    roles: ["ADMIN", "Super Admin"],
  },
  {
    to: "/promotional",
    label: "Promotional",
    icon: Megaphone,
    roles: ["ADMIN", "Super Admin"],
  },
  {
    to: "/users",
    label: "User Management",
    icon: UserCog,
    roles: ["ADMIN", "Super Admin"],
  },
  {
    to: "/roles",
    label: "Roles & Permissions",
    icon: ShieldCheck,
    roles: ["ADMIN", "Super Admin"],
  },
  {
    to: "/master-settings",
    label: "Master Settings",
    icon: Settings2,
    roles: ["ADMIN", "Super Admin"],
  },
  {
    to: "/branches",
    label: "Branches",
    icon: MapPin,
    roles: ["ADMIN", "Super Admin"],
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["ADMIN", "Super Admin"],
  },
] as const;

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUi();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
          }
        );
const data = await response.json();
        if (!response.ok) {
          toast.error(
      data.message || "Failed to fetch user"
    );
    return;
        }

        setUser(data);
      } catch (error) {
        console.error(
          "Error fetching user:",
          error
        );
      }
    };

    fetchUser();
  }, []);

  const role = user?.role?.name;

  const filteredItems = items.filter((item) =>
    item.roles.includes(role)
  );

  // const { sidebarCollapsed, toggleSidebar } = useUi();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    leads: false, // default open
  });

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  return (
    <>
      {!sidebarCollapsed && (
        <div onClick={toggleSidebar} className="fixed inset-0 bg-black/50 z-40 md:hidden" />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300 z-50 flex flex-col",
          sidebarCollapsed
            ? "-translate-x-full md:w-[72px] md:translate-x-0"
            : "w-[252px] translate-x-0",
        )}
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center shrink-0">
            <Image
              src={logo}
              alt="VSource Logo"
              className={cn(
                "object-contain transition-all duration-300",
                sidebarCollapsed
                  ? "h-10 w-10"
                  : "h-11 w-auto max-w-[120px]"
              )}
              width={120}
              height={44}
            />
          </div>

          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight text-sidebar-foreground">VSource</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Study Abroad CRM
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="size-7 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-muted-foreground"
          >
            <ChevronLeft
              className={cn("size-4 transition-transform", sidebarCollapsed && "rotate-180")}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {filteredItems.map((it) => {
            const active = pathname === it.to || pathname.startsWith(it.to + "/");
            const Icon = it.icon;
            const hasChildren = "children" in it;
            const isOpen = openMenus[it.label.toLowerCase()];

            return (
              <div key={it.to} className="space-y-0.5">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(it.label.toLowerCase())}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
                      />
                    )}

                    <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />

                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate text-left">{it.label}</span>

                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isOpen && "rotate-180",
                          )}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={it.to}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
                      />
                    )}

                    <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />

                    {!sidebarCollapsed && <span className="truncate">{it.label}</span>}
                  </Link>
                )}

                <AnimatePresence>
                  {hasChildren && isOpen && !sidebarCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-5 border-l border-sidebar-border pl-3 space-y-1">
                        {it.children.map((child) => {
                          const childActive = pathname === child.to;

                          return (
                            <Link
                              key={child.to}
                              href={child.to}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors",
                                childActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  childActive ? "bg-primary" : "bg-sidebar-foreground/40",
                                )}
                              />
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="m-3 rounded-xl p-3 bg-[image:var(--gradient-soft)] border border-border">
            <div className="text-xs font-semibold text-foreground">Need help?</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Contact your branch admin or open the docs.
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
