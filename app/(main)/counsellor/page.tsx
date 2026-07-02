"use client";
import { useEffect, useState, useTransition } from "react";
import {
  PageHeader,
  PageTransition,
} from "@/slids/components/common/PageHeader";
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
  Search,
  Plus,
  Pencil,
  Trash2,
  Shield,
  LucideLoader2,
  LucideArrowLeftCircle,
  LucideArrowLeft,
  ChevronsUpDown,
  Check,
  EyeOff,
  Eye,
} from "lucide-react";
import axios from "axios";
import { Select } from "@/slids/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/slids/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/slids/components/ui/command";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
}


interface UserRow {
  id: string;
  name: string;
  email: string;
  monthlyTarget: number;
  branches: { id: string; name: string }[];
  createdAt: string;
  _count: { leadCounselorsAssigned: number };
  updatedAt: string;
}



export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState(0);
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
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

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [branchIds, setBranchIds] = useState<string[]>([]);

  const createCounsellor = async () => {
    if (!name || !email || !phone || !password) {
      toast.error("Please fill all required fields.");
      return;
    }
    try {
      setCreateLoading(true);

      const res = await axios.post("/api/users/counsellor", {
        name,
        email,
        phone,
        password,
        monthlyTarget,
        branchIds,
      });

      if (res.status === 201) {
        setCreateOpen(false);

        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setMonthlyTarget(0);
        setBranchIds([]);

        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()),
  );

  const fetchData = () =>
    startTransition(async () => {
      const req = await axios.get(`/api/users/counsellor`);

      if (req.status === 200) {
        setUsers(req.data.data);
      }
    });

  useEffect(() => {
    fetchData();
  }, [page]);

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setTarget(u.monthlyTarget);
    setBranchIds(u.branches.map((branch) => branch.id));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await axios.put(`/api/users/${editUser.id}`, {
        name: editName,
        email: editEmail,
        monthlyTarget: target,
        branchIds
      });

      if (res.status === 200) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editUser.id
              ? {
                ...u,
                name: editName,
                email: editEmail,
                monthlyTarget: target,
                branches: branches.filter((branch) =>
                  branchIds.includes(branch.id),
                ),
              }
              : u,
          ),
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
      const res = await axios.delete("/api/users", {
        params: {
          id: deleteUser.id,
        },
      });

      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteOpen(false);

      toast.success("User deleted successfully.");
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to delete user.";

      toast.error(message);

      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getBranches = async () => {
    const req = await axios.get("/api/branches/all");
    if (req.status === 200) {
      setBranches(req.data.data)
    }
  }

  useEffect(() => {
    if (createOpen || editOpen) {
      getBranches()
    }
  }, [createOpen, editOpen])


  const blockInvalidNumberPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = e.clipboardData.getData("text");
    if (/[-+eE]/.test(pasted)) {
      e.preventDefault();
      document.execCommand("insertText", false, pasted.replace(/[-+eE]/g, ""));
    }
  };

  const handlePhoneField = (v: string) => {
    setPhone(v.replace(/[^0-9]/g, "").slice(0, 10));
  };

  const blockInvalidPhoneKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [
        "Backspace",
        "Delete",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
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
          <Button size="sm" onClick={() => setCreateOpen(true)}>
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
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">
                    Monthly Target
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">
                    Branches
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">
                    Assigned Leads
                  </th>
                  <th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">
                    Joined
                  </th>
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
                            {u.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline">{u.monthlyTarget}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {u.branches.length > 0 ? (
                        u.branches.map((b) => b.name).join(", ")
                      ) : (
                        <span className="italic">No branches</span>
                      )}
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {u._count.leadCounselorsAssigned}
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Counsellor</DialogTitle>
            <DialogDescription>
              Create a new counsellor account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">

            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={phone}
              maxLength={10}
              onChange={(e) => handlePhoneField(e.target.value)}
              onKeyDown={blockInvalidPhoneKeys}
              onPaste={blockInvalidNumberPaste}
              placeholder="9876543210"
                
              />
            </div>
            
            
            <div>
              <Label>Password</Label>

                <div className="relative">
                <Input
                  id="form-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={"Type password"}
                  className="pr-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            </div>

            <div>
              <Label>Monthly Target</Label>
              <Input
                type="number"
                value={monthlyTarget}
                onChange={(e) =>
                  setMonthlyTarget(Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Branches</Label>

              <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {branchIds.length > 0
                      ? `${branchIds.length} branch selected`
                      : "Select branches"}

                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-full">
                  <Command>
                    <CommandInput placeholder="Search branch..." />

                    <CommandEmpty>
                      No branch found.
                    </CommandEmpty>

                    <CommandGroup>
                      {branches.map((branch) => (
                        <CommandItem
                          key={branch.id}
                          value={`${branch.name} ${branch.email}`}
                          onSelect={() => {
                            setBranchIds((prev) =>
                              prev.includes(branch.id)
                                ? prev.filter((id) => id !== branch.id)
                                : [...prev, branch.id]
                            );
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${branchIds.includes(branch.id)
                              ? "opacity-100"
                              : "opacity-0"
                              }`}
                          />

                          <div className="flex flex-col">
                            <span>{branch.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {branch.email}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {branchIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {branches
                    .filter((b) => branchIds.includes(b.id))
                    .map((branch) => (
                      <Badge key={branch.id} variant="secondary">
                        {branch.name}
                      </Badge>
                    ))}
                </div>
              )}
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={createCounsellor}
              disabled={createLoading}
            >
              {createLoading && (
                <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Counsellor
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
              Update name or email for{" "}
              <span className="font-medium">{editUser?.name}</span>.
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
              <Label htmlFor="edit-target">Monthly Target</Label>
              <Input
                id="edit-target"
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </div>
          </div>


          <div className="space-y-2">
            <Label>Branches</Label>

            <Popover open={branchOpen} onOpenChange={setBranchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {branchIds.length > 0
                    ? `${branchIds.length} branch selected`
                    : "Select branches"}

                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-full">
                <Command>
                  <CommandInput placeholder="Search branch..." />

                  <CommandEmpty>
                    No branch found.
                  </CommandEmpty>

                  <CommandGroup>
                    {branches.map((branch) => (
                      <CommandItem
                        key={branch.id}
                        value={`${branch.name} ${branch.email}`}
                        onSelect={() => {
                          setBranchIds((prev) =>
                            prev.includes(branch.id)
                              ? prev.filter((id) => id !== branch.id)
                              : [...prev, branch.id]
                          );
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${branchIds.includes(branch.id)
                            ? "opacity-100"
                            : "opacity-0"
                            }`}
                        />

                        <div className="flex flex-col">
                          <span>{branch.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {branch.email}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {branchIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {branches
                  .filter((b) => branchIds.includes(b.id))
                  .map((branch) => (
                    <Badge key={branch.id} variant="secondary">
                      {branch.name}
                    </Badge>
                  ))}
              </div>
            )}
          </div>


          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving && (
                <LucideLoader2 className="size-3.5 mr-1.5 animate-spin" />
              )}
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
              <span className="font-medium text-foreground">
                {deleteUser?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading && (
                <LucideLoader2 className="size-3.5 mr-1.5 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
