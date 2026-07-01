"use client";
import { useEffect, useRef, useState, useTransition } from "react";
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
  Eye,
  EyeOff,
  ChevronDown,
  Check,
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

type FormMode = "add" | "edit";

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const [metaData, setMetaData] = useState<MetaData>();
  const [page, setPage] = useState(1);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Add / Edit User dialog state (shared) ───────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [formUserId, setFormUserId] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [formBranchIds, setFormBranchIds] = useState<string[]>([]);

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

  useEffect(() => {
    if (!branchDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(e.target as Node)
      ) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [branchDropdownOpen]);

  // ── Shared Add/Edit handlers ────────────────────────────────────────────

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("");
    setFormRoleId("");
    setFormBranchIds([]);
    setFormError(null);
    setShowPassword(false);
    setBranchDropdownOpen(false);
  };

  const loadRolesAndBranches = async () => {
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

  const openAdd = async () => {
    setFormMode("add");
    setFormUserId(null);
    resetForm();
    setFormOpen(true);
    await loadRolesAndBranches();
  };

  const openEdit = async (u: UserRow) => {
    setFormMode("edit");
    setFormUserId(u.id);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPhone(u.phone ?? "");
    setFormPassword("");
    setFormRoleId(u.role.id);
    setFormBranchIds(u.branches.map((b) => b.id));
    setFormError(null);
    setShowPassword(false);
    setFormOpen(true);
    await loadRolesAndBranches();
  };

  const toggleBranch = (branchId: string) => {
    setFormBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handlePhoneChange = (value: string) => {
    // strip anything that isn't a digit, cap at 10 digits
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setFormPhone(digitsOnly);
  };

  const submitForm = async () => {
    setFormError(null);

    const missingPassword = formMode === "add" && !formPassword;
    if (!formName || !formEmail || missingPassword || !formRoleId) {
      setFormError(
        formMode === "add"
          ? "Name, email, password, and role are required."
          : "Name, email, and role are required."
      );
      return;
    }

    if (formPhone && formPhone.length !== 10) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }

    setFormSaving(true);
    try {
      if (formMode === "add") {
        const res = await axios.post("/api/users", {
          name: formName,
          email: formEmail,
          password: formPassword,
          phone: formPhone || undefined,
          roleId: formRoleId,
          branchIds: formBranchIds,
        });

        if (res.status === 201 || res.status === 200) {
          // Prepend new user locally so it shows immediately without a refetch
          setUsers((prev) => [res.data.data, ...prev]);
          toast.success(res.data?.message || "User created successfully.");
          setFormOpen(false);
          resetForm();
        }
      } else if (formUserId) {
        const res = await axios.put(`/api/users/${formUserId}`, {
          name: formName,
          email: formEmail,
          phone: formPhone || undefined,
          roleId: formRoleId,
          branchIds: formBranchIds,
          // only send password if the user actually typed a new one
          ...(formPassword ? { password: formPassword } : {}),
        });

        setUsers((prev) =>
          prev.map((u) =>
            u.id === formUserId
              ? {
                  ...u,
                  name: formName,
                  email: formEmail,
                  phone: formPhone,
                  role: roles.find((r) => r.id === formRoleId) ?? u.role,
                  branches: branches.filter((b) =>
                    formBranchIds.includes(b.id)
                  ),
                }
              : u
          )
        );

        toast.success(res.data?.message || "User updated successfully.");
        setFormOpen(false);
        resetForm();
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        (formMode === "add"
          ? "Failed to create user. Please try again."
          : "Failed to update user.");
      setFormError(message);
      toast.error(message);
    } finally {
      setFormSaving(false);
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
      const res = await axios.delete(`/api/users/${deleteUser.id}`);

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

      {/* Add / Edit User dialog (shared) */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === "add" ? "Add user" : "Edit user"}</DialogTitle>
            <DialogDescription>
              {formMode === "add"
                ? "Create a staff account and assign their role and branches."
                : "Update this user's details, role and branch assignments."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1 pl-2">
            {formError && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-name">Name</Label>
              <Input
                id="form-name"
                placeholder="Jane Doe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-email">Email</Label>
              <Input
                id="form-email"
                type="email"
                placeholder="jane@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-phone">Phone</Label>
              <Input
                id="form-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={formPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={(e) => {
                  // block letters/symbols; allow navigation & control keys
                  if (
                    ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      e.key
                    ) ||
                    e.ctrlKey ||
                    e.metaKey
                  ) {
                    return;
                  }
                  if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text");
                  handlePhoneChange(formPhone + pasted);
                }}
              />
              {formPhone.length > 0 && formPhone.length < 10 && (
                <p className="text-[11px] text-muted-foreground">
                  {10 - formPhone.length} digit{10 - formPhone.length > 1 ? "s" : ""} remaining
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-password">
                {formMode === "add" ? "Password" : "New password"}
              </Label>
              <div className="relative">
                <Input
                  id="form-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    formMode === "add" ? "Type password" : "Leave blank to keep current password"
                  }
                  className="pr-9"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {formMode === "edit" && (
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to keep the current password.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={formRoleId} onValueChange={setFormRoleId}>
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

            <div className="flex flex-col gap-1.5" ref={branchDropdownRef}>
              <Label>Branches</Label>
              <div className="relative">
                <button
                  type="button"
                  disabled={branchesLoading || branches.length === 0}
                  onClick={() => setBranchDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 text-sm border border-input rounded-md px-3 py-2 bg-transparent hover:bg-secondary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span
                    className={`truncate text-left ${formBranchIds.length === 0 ? "text-muted-foreground" : ""
                      }`}
                  >
                    {branchesLoading
                      ? "Loading branches…"
                      : branches.length === 0
                        ? "No branches found"
                        : formBranchIds.length === 0
                          ? "Select branches…"
                          : branches
                            .filter((b) => formBranchIds.includes(b.id))
                            .map((b) => b.name)
                            .join(", ")}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${branchDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {branchDropdownOpen && branches.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-md py-1">
                    {branches.map((b) => {
                      const selected = formBranchIds.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBranch(b.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-secondary/50"
                        >
                          <span
                            className={`flex items-center justify-center size-4 rounded border shrink-0 ${selected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border"
                              }`}
                          >
                            {selected && <Check className="size-3" />}
                          </span>
                          <span className="truncate">{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {formBranchIds.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {formBranchIds.length} branch{formBranchIds.length > 1 ? "es" : ""} selected
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formSaving}>
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={formSaving}>
              {formSaving && <LucideLoader2 className="size-3.5 mr-1.5 animate-spin" />}
              {formMode === "add" ? "Create user" : "Save changes"}
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