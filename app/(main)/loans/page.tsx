"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/slids/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/slids/components/ui/select";
import {
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  Pencil,
  RefreshCw,
  Building2,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { LoanInquiry } from "@/slids/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type LoanStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISBURSED";

interface Student {
  id: string;
  studentName: string;
  emailId: string;
  studentNumber: string;
}

// Status order enforces one-way progression
const STATUS_ORDER: LoanStatus[] = ["PENDING" , "APPROVED" , "REJECTED" , "DISBURSED"];

function getAllowedNextStatuses(current: LoanStatus): LoanStatus[] {
  // rejected is terminal; disbursed cannot go back
  if (current === "REJECTED" || current === "DISBURSED") return [];
  const idx = STATUS_ORDER.indexOf(current);
  // Can move forward OR jump to rejected at any non-terminal stage
  const forward = STATUS_ORDER.slice(idx + 1).filter((s) => s !== "REJECTED");
  return [...forward, "REJECTED"];
}

const statusMeta: Record<LoanStatus, { color: string; icon: React.ElementType }> = {
  PENDING: { color: "bg-warning/15 text-warning border-warning/20", icon: Clock },
  APPROVED: { color: "bg-success/15 text-success border-success/20", icon: CheckCircle2 },
  REJECTED: { color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
  DISBURSED: { color: "bg-primary/10 text-primary border-primary/20", icon: Wallet },
};

const DEFAULT_BANKS = [
  "HDFC Credila",
  "Avanse",
  "Axis Bank",
  "SBI",
  "ICICI",
  "Auxilo",
  "InCred",
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Loans() {
  const [list, setList] = useState<LoanInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [banks, setBanks] = useState<string[]>(DEFAULT_BANKS);

  // ── Add Dialog ──
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const emptyForm = { studentId: "", bank: "HDFC Credila", amount: 1500000, emi: 18000 };
  const [addForm, setAddForm] = useState(emptyForm);

  // ── Edit Dialog ──
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<LoanInquiry | null>(null);
  const [editForm, setEditForm] = useState({ bank: "", amount: 0, emi: 0, assignee: "" });

  // ── Status Dialog ──
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState<LoanInquiry | null>(null);
  const [newStatus, setNewStatus] = useState<LoanStatus>("APPROVED");

  // ── Manage Banks Dialog ──
  const [banksOpen, setBanksOpen] = useState(false);
  const [newBankName, setNewBankName] = useState("");

  // ─── Fetch loan inquiries ────────────────────────────────────────────────────

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/loan");
      console.log(data.data);
      setList(data.data);
    } catch {
      toast.error("Failed to load loan inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch students for dropdown ─────────────────────────────────────────────

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/student?few=true");
      setStudents(data.data);
    } catch {
      toast.error("Failed to load students");
    }
  }, []);

  useEffect(() => {
    fetchLoans();
    fetchStudents();
  }, [fetchLoans]);

  // ─── Add ─────────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!addForm.studentId) return toast.error("Please select a student");
    try {
      setAddLoading(true);
      await axios.post("/api/loan", {
        studentId: addForm.studentId,
        bank: addForm.bank,
        amount: Number(addForm.amount),
        emi: Number(addForm.emi),
      });
      toast.success("Loan inquiry created");
      setAddOpen(false);
      setAddForm(emptyForm);
      fetchLoans();
    } catch {
      toast.error("Failed to create loan inquiry");
    } finally {
      setAddLoading(false);
    }
  };

  // ─── Edit ────────────────────────────────────────────────────────────────────

  const openEdit = (loan: LoanInquiry) => {
    setEditTarget(loan);
    setEditForm({
      bank: loan.bank,
      amount: loan.amount,
      emi: loan.emi,
      assignee: loan.assignee ?? "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      setEditLoading(true);
      await axios.put(`/api/loan?id=${editTarget.id}`, {
        type: "details",
        bank: editForm.bank,
        amount: Number(editForm.amount),
        emi: Number(editForm.emi),
        assignee: editForm.assignee || null,
      });
      toast.success("Loan inquiry updated");
      setEditOpen(false);
      fetchLoans();
    } catch {
      toast.error("Failed to update loan inquiry");
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Status Change ───────────────────────────────────────────────────────────

  const openStatus = (loan: LoanInquiry) => {
    setStatusTarget(loan);
    const allowed = getAllowedNextStatuses(loan.status as LoanStatus);
    setNewStatus(allowed[0] ?? loan.status as LoanStatus);
    setStatusOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    try {
      setStatusLoading(true);
      await axios.put(`/api/loan?id=${statusTarget.id}`, {
        type: "status",
        status: newStatus.toUpperCase(),
      });
      toast.success(`Status updated to ${newStatus}`);
      setStatusOpen(false);
      fetchLoans();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (loan: LoanInquiry) => {
    if (!confirm(`Delete inquiry ${loan.id}? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/loan?id=${loan.id}`);
      toast.success("Loan inquiry deleted");
      fetchLoans();
    } catch {
      toast.error("Failed to delete loan inquiry");
    }
  };

  // ─── Bank Management ─────────────────────────────────────────────────────────

  const addBank = () => {
    const name = newBankName.trim();
    if (!name) return toast.error("Bank name cannot be empty");
    if (banks.includes(name)) return toast.error("Bank already exists");
    setBanks([...banks, name]);
    setNewBankName("");
    toast.success(`${name} added`);
  };

  const removeBank = (bank: string) => {
    setBanks(banks.filter((b) => b !== bank));
    toast.success(`${bank} removed`);
  };

  // ─── Stats ───────────────────────────────────────────────────────────────────

  const stats = [
    { label: "Total Inquiries", value: String(list.length)},
    { label: "Approved", value: String(list.filter((l) => l.status === "approved").length) },
    {
      label: "Disbursed (₹)",
      value: `₹${(
        list.filter((l) => l.status === "disbursed").reduce((s, l) => s + l.amount, 0) / 10000000
      ).toFixed(1)}Cr`,
    },
    { label: "Partner Banks", value: String(banks.length) },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageTransition>
      <PageHeader
        title="Education Loans"
        description="Loan inquiries, bank coordination and EMI tracking."
        actions={
          <div className="flex items-center gap-2">

            {/* ── Manage Banks ── */}
            <Dialog open={banksOpen} onOpenChange={setBanksOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Building2 className="size-4 mr-1.5" />
                  Manage Banks
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Partner Banks</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Add new bank */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="New bank name…"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addBank()}
                    />
                    <Button onClick={addBank} size="sm">
                      <Plus className="size-4" />
                    </Button>
                  </div>

                  {/* Bank list */}
                  <div className="divide-y divide-border rounded-md border border-border max-h-72 overflow-y-auto">
                    {banks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">No banks added yet.</p>
                    )}
                    {banks.map((bank) => (
                      <div
                        key={bank}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-secondary/40 transition-colors"
                      >
                        <span className="text-sm font-medium">{bank}</span>
                        <button
                          onClick={() => removeBank(bank)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {banks.length} bank{banks.length !== 1 ? "s" : ""} configured
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setBanksOpen(false)}>Done</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── Add Loan Inquiry ── */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4 mr-1.5" />
                  Loan Inquiry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Loan Inquiry</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  {/* Student select */}
                  <div className="grid gap-1.5">
                    <Label>Student</Label>
                    <Select
                      value={addForm.studentId}
                      onValueChange={(v) => setAddForm({ ...addForm, studentId: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Search and select a student…" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.length > 0 ? students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{s.studentName}</span>
                              <span className="text-xs text-muted-foreground">
                               {s.emailId} {s.studentNumber && "·" + " " + s.studentNumber}
                              </span>
                            </div>
                          </SelectItem>
                        )) : (
                          <div className="py-3 text-sm text-muted-foreground text-center">
                            No students found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bank select */}
                  <div className="grid gap-1.5">
                    <Label>Bank</Label>
                    <Select
                      value={addForm.bank}
                      onValueChange={(v) => setAddForm({ ...addForm, bank: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        value={addForm.amount}
                        onChange={(e) => setAddForm({ ...addForm, amount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>EMI (₹/mo)</Label>
                      <Input
                        type="number"
                        value={addForm.emi}
                        onChange={(e) => setAddForm({ ...addForm, emi: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={addLoading}>
                    {addLoading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Table ── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Loading inquiries…</span>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
              <Wallet className="size-8 opacity-30" />
              <p className="text-sm">No loan inquiries yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                    <th className="text-left font-medium px-4 py-2.5">Inquiry</th>
                    <th className="text-left font-medium px-4 py-2.5">Student</th>
                    <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">Bank</th>
                    <th className="text-right font-medium px-4 py-2.5">Amount</th>
                    <th className="text-right font-medium px-4 py-2.5 hidden md:table-cell">EMI</th>
                    <th className="text-left font-medium px-4 py-2.5">Status</th>
                    <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">Applied</th>
                    <th className="text-right font-medium px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((loan) => {
                    const meta = statusMeta[loan.status as LoanStatus] ?? statusMeta.PENDING;
                    const Icon = meta.icon;
                    const isTerminal =
                      loan.status === "rejected" || loan.status === "disbursed";
                    return (
                      <tr
                        key={loan.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {loan.id.slice(0, 6)}
                        </td>
                        <td className="px-4 py-0 font-medium">{loan.student.studentName}  <br />
                          <span className="text-[10px] text-muted-foreground -mt-2">
                                {loan.student.emailId} {loan.student.studentNumber && "·" + " " + loan.student.studentNumber}
                              </span>
                              </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                          {loan.bank}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {(loan.amount / 100000).toFixed(1)}L
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                          {loan.emi.toLocaleString()}/mo
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`capitalize gap-1 ${meta.color}`}
                          >
                            <Icon className="size-3" />
                            {loan.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                          {new Date(loan.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit details */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              title="Edit details"
                              onClick={() => openEdit(loan)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>

                            {/* Change status — disabled if terminal */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              title={isTerminal ? "Status is final" : "Change status"}
                              disabled={isTerminal}
                              onClick={() => openStatus(loan)}
                            >
                              <RefreshCw className="size-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 hover:text-destructive hover:bg-destructive/10"
                              title="Delete inquiry"
                              onClick={() => handleDelete(loan)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Details Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Loan Inquiry</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="grid gap-3 py-2">
              <div className="rounded-md bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                Editing <span className="font-mono font-medium">{editTarget.id}</span>
              </div>

              <div className="grid gap-1.5">
                <Label>Bank</Label>
                <Select
                  value={editForm.bank}
                  onValueChange={(v) => setEditForm({ ...editForm, bank: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, amount: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>EMI (₹/mo)</Label>
                  <Input
                    type="number"
                    value={editForm.emi}
                    onChange={(e) =>
                      setEditForm({ ...editForm, emi: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Assignee</Label>
                <Input
                  placeholder="Leave blank to unassign"
                  value={editForm.assignee}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assignee: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Status Dialog ── */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
          </DialogHeader>
          {statusTarget && (
            <div className="grid gap-4 py-2">
              <div className="rounded-md bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                Current status:{" "}
                <Badge
                  variant="outline"
                  className={`capitalize ml-1 ${statusMeta[statusTarget.status as LoanStatus]?.color}`}
                >
                  {statusTarget.status}
                </Badge>
              </div>

              {getAllowedNextStatuses(statusTarget.status as LoanStatus).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  This inquiry has reached a final status and cannot be changed.
                </p>
              ) : (
                <div className="grid gap-1.5">
                  <Label>New Status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(v) => setNewStatus(v as LoanStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllowedNextStatuses(statusTarget.status as LoanStatus).map((s) => {
                        const m = statusMeta[s];
                        const Icon = m.icon;
                        return (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center gap-2 capitalize">
                              <Icon className="size-3.5" />
                              {s}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status changes are permanent and cannot be reversed.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={
                statusLoading ||
                (statusTarget
                  ? getAllowedNextStatuses(statusTarget.status as LoanStatus).length === 0
                  : true)
              }
            >
              {statusLoading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Update status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}