"use client";

import { useEffect, useState } from "react";
import { Bell, Moon, Search, Sun, LogOut, User as UserIcon, Settings, Command, Menu } from "lucide-react";
import { useAuth, useUi } from "@/slids/store";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/slids/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/slids/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/slids/components/ui/avatar";
import { Badge } from "@/slids/components/ui/badge";
import { notifications } from "@/slids/data/mock";
import { Input } from "@/slids/components/ui/input";
import { CommandPalette } from "@/slids/components/common/CommandPalette";
import { useTheme } from "next-themes";

export function Topbar() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { setCommandOpen, toggleSidebar } = useUi();
  const router = useRouter();
  const pathname = usePathname();
  const [unread] = useState(notifications.filter((n) => !n.read).length);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen]);

  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <>
      <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="h-full px-4 md:px-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="size-5" />
          </Button>
          <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
            {crumbs.length === 0 ? (
              <span className="font-medium text-foreground">Overview</span>
            ) : (
              crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span
                    className={
                      i === crumbs.length - 1
                        ? "font-medium text-foreground capitalize"
                        : "capitalize"
                    }
                  >
                    {c.replace("-", " ")}
                  </span>
                  {i < crumbs.length - 1 && <span className="text-muted-foreground/50">/</span>}
                </span>
              ))
            )}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setCommandOpen(true)}
            className="hidden md:flex items-center gap-2 h-9 w-72 px-3 rounded-lg border border-input bg-secondary/50 text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Search anything…</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border flex items-center gap-0.5">
              <Command className="size-2.5" />K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (mounted) {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
              }
            }}
            className="relative"
            aria-label="Toggle Theme"
          >
            {!mounted ? (
              <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
            ) : resolvedTheme === "dark" ? (
              <Moon className="h-5 w-5 text-foreground transition-all" />
            ) : (
              <Sun className="h-5 w-5 text-foreground transition-all" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-4" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications <Badge variant="secondary">{unread} new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2.5">
                  <div className="flex w-full items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                  <span className="text-xs text-muted-foreground pl-3.5">{n.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-secondary transition-colors">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-[image:var(--gradient-primary)] text-white text-xs font-semibold">
                    {user?.name
                      ?.split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold">{user?.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{user?.role?.name}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <UserIcon className="size-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="size-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="size-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandPalette />
    </>
  );
}
