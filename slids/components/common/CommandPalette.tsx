import { useRouter } from "next/navigation";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/slids/components/ui/command";
import { useUi } from "@/slids/store";
import {
  LayoutDashboard, Users, GraduationCap, FileText, Building2, BookOpen, Banknote,
  BarChart3, Megaphone, UserCog, ShieldCheck, Settings2, MapPin, User, Settings,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/students", label: "Students", icon: GraduationCap },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/universities", label: "Universities", icon: Building2 },
  { to: "/coaching", label: "Coaching", icon: BookOpen },
  { to: "/loans", label: "Education Loans", icon: Banknote },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/promotional", label: "Promotional", icon: Megaphone },
  { to: "/users", label: "Users", icon: UserCog },
  { to: "/roles", label: "Roles", icon: ShieldCheck },
  { to: "/master-settings", label: "Master Settings", icon: Settings2 },
  { to: "/branches", label: "Branches", icon: MapPin },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUi();
  const router = useRouter();

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Search modules, leads, students…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <CommandItem
                key={it.to}
                onSelect={() => { router.push(it.to); setCommandOpen(false); }}
              >
                <Icon className="size-4 mr-2" /> {it.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => { router.push("/leads"); setCommandOpen(false); }}>
            + Add new lead
          </CommandItem>
          <CommandItem onSelect={() => { router.push("/students"); setCommandOpen(false); }}>
            + Add new student
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
