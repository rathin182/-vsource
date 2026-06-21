"use client";
import { useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Checkbox } from "@/slids/components/ui/checkbox";
import { Badge } from "@/slids/components/ui/badge";
import { Plus } from "lucide-react";
import { rolesData } from "@/slids/data/mock";

const modules = ["Dashboard", "Leads", "Students", "Applications", "Universities", "Coaching", "Loans", "Reports", "Users", "Settings"];
const actions = ["Create", "Read", "Update", "Delete"];

export default function Roles() {
  const [selected, setSelected] = useState(rolesData[1].id);
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(() => {
    const m: Record<string, Record<string, boolean>> = {};
    modules.forEach((mod) => { m[mod] = { Create: true, Read: true, Update: true, Delete: false }; });
    return m;
  });

  const toggle = (mod: string, act: string) =>
    setPerms({ ...perms, [mod]: { ...perms[mod], [act]: !perms[mod][act] } });

  return (
    <PageTransition>
      <PageHeader
        title="Roles & Permissions"
        description="Configure granular module access per role."
        actions={<Button size="sm"><Plus className="size-4 mr-1.5" /> New Role</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <Card>
          <CardContent className="p-2 space-y-1">
            {rolesData.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-left transition-colors ${selected === r.id ? "bg-accent text-accent-foreground" : "hover:bg-secondary"}`}
              >
                <span className="font-medium">{r.name}</span>
                <Badge variant="secondary" className="text-[10px]">{r.users}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium">Module</th>
                {actions.map((a) => <th key={a} className="text-center px-4 py-3 font-medium">{a}</th>)}
              </tr></thead>
              <tbody>{modules.map((mod) => (
                <tr key={mod} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{mod}</td>
                  {actions.map((a) => (
                    <td key={a} className="px-4 py-3 text-center">
                      <Checkbox checked={perms[mod][a]} onCheckedChange={() => toggle(mod, a)} />
                    </td>
                  ))}
                </tr>
              ))}</tbody>
            </table></div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm">Reset</Button>
              <Button size="sm">Save permissions</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
