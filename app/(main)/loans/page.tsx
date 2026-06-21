"use client";
import { useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Label } from "@/slids/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/slids/components/ui/dialog";
import { loanInquiries as seed } from "@/slids/data/mock";
import type { LoanInquiry } from "@/slids/types";
import { Plus, CheckCircle2, Clock, XCircle, Wallet } from "lucide-react";
import { toast } from "sonner";

const statusMap = {
  pending: { color: "bg-warning/15 text-warning border-warning/20", icon: Clock },
  approved: { color: "bg-success/15 text-success border-success/20", icon: CheckCircle2 },
  rejected: { color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
  disbursed: { color: "bg-primary/10 text-primary border-primary/20", icon: Wallet },
};

export default function Loans() {
  const [list, setList] = useState<LoanInquiry[]>(seed);
  const [open, setOpen] = useState(false);
  const empty = { student: "", bank: "HDFC Credila", amount: 1500000, emi: 18000, status: "pending" as LoanInquiry["status"] };
  const [form, setForm] = useState(empty);

  const add = () => {
    if (!form.student) return toast.error("Student is required");
    setList([{ id: `LN${Date.now()}`, ...form, amount: Number(form.amount), emi: Number(form.emi), appliedAt: new Date().toISOString() }, ...list]);
    setOpen(false); setForm(empty);
    toast.success("Loan inquiry created");
  };

  return (
    <PageTransition>
      <PageHeader
        title="Education Loans"
        description="Loan inquiries, bank coordination and EMI tracking."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="size-4 mr-1.5" /> Loan Inquiry</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New loan inquiry</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1.5"><Label>Student</Label><Input value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Bank</Label>
                  <select className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })}>
                    {["HDFC Credila","Avanse","Axis Bank","SBI","ICICI","Auxilo","InCred"].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>EMI (₹/mo)</Label><Input type="number" value={form.emi} onChange={(e) => setForm({ ...form, emi: Number(e.target.value) })} /></div>
                </div>
                <div className="grid gap-1.5"><Label>Status</Label>
                  <select className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LoanInquiry["status"] })}>
                    {["pending","approved","rejected","disbursed"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={add}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Total Inquiries", v: String(list.length) },
          { l: "Approved", v: String(list.filter((l) => l.status === "approved").length) },
          { l: "Disbursed (₹)", v: `₹${(list.filter((l) => l.status === "disbursed").reduce((s, l) => s + l.amount, 0) / 10000000).toFixed(1)}Cr` },
          { l: "Partner Banks", v: "7" },
        ].map((s) => (
          <Card key={s.l}><CardContent className="p-4">
            <div className="text-xl font-bold">{s.v}</div><div className="text-[11px] text-muted-foreground">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                <th className="text-left font-medium px-4 py-2.5">Inquiry</th>
                <th className="text-left font-medium px-4 py-2.5">Student</th>
                <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">Bank</th>
                <th className="text-right font-medium px-4 py-2.5">Amount</th>
                <th className="text-right font-medium px-4 py-2.5 hidden md:table-cell">EMI</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">Applied</th>
              </tr></thead>
              <tbody>
                {list.map((l) => {
                  const Status = statusMap[l.status];
                  const Icon = Status.icon;
                  return (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono text-xs">{l.id}</td>
                      <td className="px-4 py-3 font-medium">{l.student}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{l.bank}</td>
                      <td className="px-4 py-3 text-right font-semibold">₹{(l.amount / 100000).toFixed(1)}L</td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">₹{l.emi.toLocaleString()}/mo</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={`capitalize gap-1 ${Status.color}`}><Icon className="size-3" />{l.status}</Badge></td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{new Date(l.appliedAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
