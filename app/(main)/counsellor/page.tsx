"use client";
import { useEffect, useState, useTransition } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Badge } from "@/slids/components/ui/badge";
import { Avatar, AvatarFallback } from "@/slids/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/slids/components/ui/dialog";
import { Label } from "@/slids/components/ui/label";
import {
  Search, Plus, Pencil, Trash2, Shield, LucideLoader2,
  LucideArrowLeftCircle,
  LucideArrowLeft,
} from "lucide-react";
import axios from "axios";

interface Role {
  id: string;
  name: string;
}

interface MetaData {
  totalPages: number,
  total: number,
  limit: number,
  page: number
}
interface UserRow {
  id: string;
  name: string;
  email: string;
  monthlyTarget: number;
  branches: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const [metaData, setMetaData] = useState<MetaData>()
  const [page, setPage] = useState(1)
    // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
  );

  const fetchData = () =>
    startTransition(async () => {
      const req = await axios.get(`/api/users/counsellor`);
      
      if (req.status === 200) {
        setUsers(req.data.data);
        console.log(req.data.data);
      }
    });

  useEffect(() => {
    fetchData();
  }, [page]);

  // Edit handlers
  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await axios.patch(`/api/users/${editUser.id}`, {
        name: editName,
        email: editEmail,
      });
      if (res.status === 200) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editUser.id ? { ...u, name: editName, email: editEmail } : u
          )
        );
        setEditOpen(false);
      }
    } finally {
      setEditSaving(false);
    }
  };

  // Delete handlers
  const openDelete = (u: UserRow) => {
    setDeleteUser(u);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      const res = await axios.delete(`/api/users/${deleteUser.id}`);
      if (res.status === 200) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
        setDeleteOpen(false);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="w-[80vw] h-screen grid place-items-center">
        <LucideLoader2 size={34} className="animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Counsellor Management"
        description="Manage list of counsellor."
        actions={
          <Button size="sm">
            <Plus className="size-4 mr-1.5" /> Add counsellor
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users…"
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Badge variant="secondary" className="ml-auto self-center">
              <Shield className="size-3 mr-1" /> {users.length} users
            </Badge>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-2.5 font-medium">User</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Monthly Target</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Branches</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-[10px] bg-accent text-accent-foreground">
                            {u.name.split(" ").map((p) => p[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline">{u.monthlyTarget}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {u.branches.length > 0
                        ? u.branches.map((b) => b.name).join(", ")
                        : <span className="italic">No branches</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => openDelete(u)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    
        </CardContent>
      </Card>

            <div className="w-full flex justify-between items-center my-4 px-2">
              <p className="text-sm text-gray-400">Showing: {users.length} / {metaData && metaData.total}</p>
              <div className=""></div>
              <div className="text-sm text-gray-400 flex justify-center items-center gap-2">
                <button onClick={() => setPage(page + 1)} disabled={metaData?.page === 1}  className="px-2 py-2 text-primary  rounded-full"><LucideArrowLeft size={16}/></button>
                {metaData && metaData.page} / {metaData && metaData.totalPages}
                <button onClick={() => setPage(page + 1)} disabled={metaData?.page === metaData?.totalPages} className="px-2 py-2 bg-primary rotate-180 text-white rounded-full"><LucideArrowLeft size={16}/></button>
                </div>
            </div>

            
      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update name or email for <span className="font-medium">{editUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving && <LucideLoader2 className="size-3.5 mr-1.5 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteUser?.name}</span>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading && <LucideLoader2 className="size-3.5 mr-1.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}