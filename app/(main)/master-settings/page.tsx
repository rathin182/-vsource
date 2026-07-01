"use client";

/**
 * MasterSettings
 * -------------------------------------------------------------------------
 * Drop-in page component for managing shared reference data (Countries,
 * Intake, Lead Source, Lead Degree, Lead University). Each tab hits its own
 * API endpoint independently, has its own search bar, and manages its own
 * loading / error / edit / delete state.
 *
 * Requires the following shadcn/ui components to be installed:
 *   npx shadcn add tabs table input button switch dialog alert-dialog label badge
 *
 * Expected API contract per entity endpoint (e.g. /api/master-settings/countries):
 *   GET    {endpoint}          -> MasterItem[]
 *   POST   {endpoint}          -> body: { name: string }               -> MasterItem
 *   PATCH  {endpoint}/{id}     -> body: Partial<{ name, status }>      -> MasterItem
 *   DELETE {endpoint}/{id}     -> void
 *
 * Swap the endpoints in TABS below to match your backend.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/slids/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/slids/components/ui/table";
import { Input } from "@/slids/components/ui/input";
import { Button } from "@/slids/components/ui/button";
import { Switch } from "@/slids/components/ui/switch";
import { Label } from "@/slids/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/slids/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/slids/components/ui/alert-dialog";
import {
  AlertCircle,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & tab config
// ---------------------------------------------------------------------------

interface MasterItem {
  id?: string;
  name: string;
  createdAt: string;
  // addedBy: string;
  status: boolean;
}

type EntityKey =
  | "countries"
  | "intake"
  | "lead-source"
  | "lead-degree"
  | "lead-university";

interface TabConfig {
  key: EntityKey;
  label: string;
  endpoint: string;
  postEndpoint: string;
  addLabel: string;
}

const TABS: TabConfig[] = [
  {
    key: "countries",
    label: "Countries",
    endpoint: "/api/countries/all",
    postEndpoint: "/api/countries",
    addLabel: "Add Country",
  },
  {
    key: "intake",
    label: "Intake",
    endpoint: "/api/intakes/all",
    postEndpoint: "/api/intakes",
    addLabel: "Add Intake",
  },
  {
    key: "lead-source",
    label: "Lead Source",
    endpoint: "/api/lead-sources",
    postEndpoint: "/api/lead-sources",
    addLabel: "Add Lead Source",
  },
  {
    key: "lead-degree",
    label: "Lead Degree",
    endpoint: "/api/lead-degrees",
    postEndpoint: "/api/lead-degrees",
    addLabel: "Add Lead Degree",
  },
  {
    key: "lead-university",
    label: "Lead University",
    endpoint: "/api/lead-universities",
    postEndpoint: "/api/lead-universities",
    addLabel: "Add University",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MasterSettings() {
  const [activeTab, setActiveTab] = useState<EntityKey>(TABS[0].key);

  return (
    <div className="mx-auto w-full max-w-9xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Master Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage the shared reference data used across the application.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as EntityKey)}
        className="w-full"
      >
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-zinc-200 bg-transparent p-0">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-zinc-500 shadow-none transition-colors data-[state=active]:border-red-600 data-[state=active]:bg-transparent data-[state=active]:text-red-600 data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab, i) => (
          <TabsContent
            key={i}
            value={tab.key}
            className="mt-6 focus-visible:outline-none"
          >
            {/* Each TabsContent only mounts while active, so every tab
                fetches its own endpoint independently the moment it's opened. */}
            <MasterDataTab
              
              postEndpoint={tab.postEndpoint}
              endpoint={tab.endpoint}
              entityLabel={tab.label}
              addLabel={tab.addLabel}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-tab table (fetch, search, toggle, edit, delete)
// ---------------------------------------------------------------------------

interface MasterDataTabProps {
  endpoint: string;
  postEndpoint: string;
  entityLabel: string;
  addLabel: string;
}

function MasterDataTab({
  endpoint,
  postEndpoint,
  entityLabel,
  addLabel,
}: MasterDataTabProps) {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCurrency, setFormCurrency] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MasterItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok)
          throw new Error(`Failed to load ${entityLabel.toLowerCase()}`);
        const data = (await res.json()) as { data: MasterItem[] };
        if (!cancelled) setItems(data.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : `Failed to load ${entityLabel.toLowerCase()}`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  function openAddForm() {
    setEditingItem(null);
    setFormName("");
    setFormCode("");
    setFormCurrency("");
    setFormOpen(true);
  }

  function openEditForm(item: MasterItem) {
    setEditingItem(item);
    setFormName(item.name);
    setFormCode((item as any).code ?? "");
    setFormCurrency((item as any).currency ?? "");
    setFormOpen(true);
  }

  async function handleFormSubmit() {
    const name = formName.trim();
    const code = formCode.trim();
    const currency = formCurrency.trim();
    if (!name) return;
    setSaving(true);
    try {
      if (editingItem) {
        const res = await fetch(`${postEndpoint}/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ...(entityLabel === "Countries" && { code, currency }) }),
        });
        if (!res.ok) throw new Error("Failed to save changes");
        window.location.reload()

      } else {
        const res = await fetch(postEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ...(entityLabel === "Countries" && { code, currency }) }),
        });
        if (!res.ok) throw new Error("Failed to add entry");
        window.location.reload()
      }
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(item: MasterItem, next: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)),
    );
    try {
      const res = await fetch(`${postEndpoint}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      // revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: !next } : i)),
      );
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${endpoint}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete entry");
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (filtered) {
      console.log(filtered);
    }
  }, [filtered]);
  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${entityLabel.toLowerCase()}...`}
            className="pl-9 focus-visible:ring-red-600"
          />
        </div>
        <Button
          onClick={openAddForm}
          className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {addLabel}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-zinc-200">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Added on</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-5 w-full animate-pulse rounded bg-zinc-100" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length < 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <Inbox className="h-6 w-6" />
                    <span className="text-sm">
                      {search
                        ? `No ${entityLabel.toLowerCase()} match "${search}"`
                        : `No ${entityLabel.toLowerCase()} yet`}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-zinc-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  {/* <TableCell className="text-zinc-500">{item.addedBy}</TableCell> */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.status}
                        onCheckedChange={(checked) =>
                          handleToggleStatus(item, checked)
                        }
                        className="data-[state=checked]:bg-red-600"
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          item.status ? "text-red-600" : "text-zinc-400",
                        )}
                      >
                        {item.status ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-600"
                        onClick={() => openEditForm(item)}
                        aria-label={`Edit`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-600"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${entityLabel}` : addLabel}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the name for this entry."
                : `Add a new entry to ${entityLabel.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="master-item-name">Name</Label>
            <Input
              id="master-item-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. United States"
              className="focus-visible:ring-red-600"
              autoFocus
            />
          </div>
          {
            entityLabel === "Countries" && (
              <>
                        <div className="grid gap-2 py-2">
            <Label htmlFor="master-item-name">Code</Label>
            <Input
              id="master-item-name"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="US"
              className="focus-visible:ring-red-600"
              autoFocus
            />
          </div>

          <div className="grid gap-2 py-2">
            <Label htmlFor="master-item-name">Currency</Label>
            <Input
              id="master-item-name"
              value={formCurrency}
              onChange={(e) => setFormCurrency(e.target.value)}
              placeholder="USD"
              className="focus-visible:ring-red-600"
              autoFocus
            />
          </div>
              </>
            )
          }
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={saving || !formName.trim()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editingItem ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this entry from{" "}
              {entityLabel.toLowerCase()}. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
            >
              {deleting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
