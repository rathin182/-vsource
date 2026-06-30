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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
import {
  Search, Plus, Pencil, Trash2, Shield, LucideLoader2,
  LucideArrowLeft,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface MetaData {
  totalPages: number;
  total: number;
  limit: number;
  page: number;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  branches: Branch[];
  createdAt: string;
  updatedAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const [metaData, setMetaData] = useState<MetaData>();
  const [page, setPage] = useState(1);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPass, setEditPass] = useState("");

  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Add User state ──────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [newBranchIds, setNewBranchIds] = useState<string[]>([]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
  );

  const fetchData = () =>
    startTransition(async () => {
      const req = await axios.get(`/api/users?page=${page}`);

      if (req.status === 200) {
        setUsers(req.data.data);
        setMetaData(req.data.meta);
      }
    });

  useEffect(() => {
    fetchData();
  }, [page]);

  // ── Add User handlers ───────────────────────────────────────────────────

  const resetAddForm = () => {
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword("");
    setNewRoleId("");
    setNewBranchIds([]);
    setAddError(null);
  };

  const openAdd = async () => {
    setAddOpen(true);
    resetAddForm();

    // Fetch roles and branches in parallel, only if not already loaded
    if (branches.length === 0) {
      setBranchesLoading(true);
      try {
        const res = await axios.get("/api/branches/all");
        if (res.status === 200) {
          // adjust this line if your branches/all response shape differs
          setBranches(res.data.data ?? res.data);
        }
      } catch {
        // non-fatal — branch select will just be empty
      } finally {
        setBranchesLoading(false);
      }
    }

    if (roles.length === 0) {
      setRolesLoading(true);
      try {
        const res = await axios.get("/api/roles/allrole");
        if (res.status === 200) {
          setRoles(res.data.data ?? res.data);
        }
      } catch {
        // non-fatal — role select will just be empty
      } finally {
        setRolesLoading(false);
      }
    }
  };

  const toggleBranch = (branchId: string) => {
    setNewBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const createUser = async () => {
    setAddError(null);

    if (!newName || !newEmail || !newPassword || !newRoleId) {
      setAddError("Name, email, password, and role are required.");
      return;
    }

    setAddSaving(true);
    try {
      const res = await axios.post("/api/users", {
        name: newName,
        email: newEmail,
        password: newPassword,
        phone: newPhone || undefined,
        roleId: newRoleId,
        branches: newBranchIds,
      });

      if (res.status === 201 || res.status === 200) {
        // Prepend new user locally so it shows immediately without a refetch
        setUsers((prev) => [res.data.data, ...prev]);
        setAddOpen(false);
        resetAddForm();
      }
    } catch (err: any) {
      setAddError(
        err?.response?.data?.error ?? "Failed to create user. Please try again."
      );
    } finally {
      setAddSaving(false);
    }
  };

  // ── Edit handlers ────────────────────────────────────────────────────────
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
      const res = await axios.put(`/api/users/${editUser.id}`, {
        name: editName,
        email: editEmail,
        password: editPass
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? { ...u, name: editName, email: editEmail }
            : u
        )
      );

      setEditOpen(false);

      toast.success(
        res.data?.message || "User updated successfully."
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update user."
      );
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete handlers ──────────────────────────────────────────────────────
  const openDelete = (u: UserRow) => {
    setDeleteUser(u);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;

    setDeleteLoading(true);

    try {
      const res = await axios.delete(`/api/users?id=${deleteUser.id}`);

      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteOpen(false);

      toast.success(
        res.data?.message || "User deleted successfully."
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to delete user."
      );
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
        title="User Management"
        description="Add staff, map to branches and control access."
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-4 mr-1.5" /> Add User
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
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Role</th>
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
                      <Badge variant="outline">{u.role.name}</Badge>
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
          <button onClick={() => setPage(page + 1)} disabled={metaData?.page === 1} className="px-2 py-2 text-primary  rounded-full"><LucideArrowLeft size={16} /></button>
          {metaData && metaData.page} / {metaData && metaData.totalPages}
          <button onClick={() => setPage(page + 1)} disabled={metaData?.page === metaData?.totalPages} className="px-2 py-2 bg-primary rotate-180 text-white rounded-full"><LucideArrowLeft size={16} /></button>
        </div>
      </div>

      {/* Add User dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetAddForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Create a staff account and assign their role and branches.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1 pl-2">
            {addError && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {addError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                placeholder="Jane Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="jane@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                type="tel"
                placeholder="+91 90000 00000"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                placeholder="Temporary password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={newRoleId} onValueChange={setNewRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder={rolesLoading ? "Loading roles…" : "Select a role…"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Branches</Label>
              {branchesLoading ? (
                <p className="text-xs text-muted-foreground">Loading branches…</p>
              ) : branches.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No branches found.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {branches.map((b) => {
                    const selected = newBranchIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBranch(b.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
                          }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {newBranchIds.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {newBranchIds.length} branch{newBranchIds.length > 1 ? "es" : ""} selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addSaving}>
              Cancel
            </Button>
            <Button onClick={createUser} disabled={addSaving}>
              {addSaving && <LucideLoader2 className="size-3.5 mr-1.5 animate-spin" />}
              Create user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-password">Change Password</Label>
              <Input
                id="edit-password"
                type="text"
                placeholder="Enter New Password"
                value={editPass}
                onChange={(e) => setEditPass(e.target.value)}
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