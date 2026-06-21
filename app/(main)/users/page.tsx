"use client";
import { useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Badge } from "@/slids/components/ui/badge";
import { Switch } from "@/slids/components/ui/switch";
import { Avatar, AvatarFallback } from "@/slids/components/ui/avatar";
import { Search, Plus, MoreHorizontal, Shield } from "lucide-react";
import { usersData } from "@/slids/data/mock";
import type { UserRow } from "@/slids/types";

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>(usersData);
  const [q, setQ] = useState("");
  const filtered = users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));

  const toggle = (id: string) => setUsers(users.map((u) => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));

  return (
    <PageTransition>
      <PageHeader
        title="User Management"
        description="Add staff, map to branches and control access."
        actions={<Button size="sm"><Plus className="size-4 mr-1.5" /> Add User</Button>}
      />

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search users…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Badge variant="secondary" className="ml-auto self-center"><Shield className="size-3 mr-1" /> {users.filter((u) => u.status === "active").length} active</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-2.5 font-medium">User</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Branch</th>
                <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">Last login</th>
                <th className="text-center px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr></thead>
              <tbody>{filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8"><AvatarFallback className="text-[10px] bg-accent text-accent-foreground">{u.name.split(" ").map((p) => p[0]).join("")}</AvatarFallback></Avatar>
                      <div><div className="font-medium">{u.name}</div><div className="text-[11px] text-muted-foreground">{u.email}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge variant="outline">{u.role}</Badge></td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{u.branch}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{u.lastLogin}</td>
                  <td className="px-4 py-3 text-center"><Switch checked={u.status === "active"} onCheckedChange={() => toggle(u.id)} /></td>
                  <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" className="size-7"><MoreHorizontal className="size-4" /></Button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
