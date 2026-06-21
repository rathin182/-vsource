"use client";
import { useState } from "react";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Input } from "@/slids/components/ui/input";
import { Badge } from "@/slids/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/slids/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { masterData } from "@/slids/data/mock";
import { toast } from "sonner";

const categories = [
  { key: "visaStatus", label: "Visa Status" },
  { key: "courseTypes", label: "Course Types" },
  { key: "banks", label: "Banks" },
  { key: "expenseTypes", label: "Expense Types" },
  { key: "leadStatuses", label: "Lead Status" },
  { key: "intakes", label: "Intakes" },
  { key: "applicationStatuses", label: "Application Status" },
] as const;

export default function MasterSettings() {
  const [data, setData] = useState<Record<string, string[]>>(masterData as unknown as Record<string, string[]>);
  const [tab, setTab] = useState<string>(categories[0].key);
  const [val, setVal] = useState("");

  const add = () => {
    if (!val.trim()) return;
    setData({ ...data, [tab]: [...data[tab], val.trim()] });
    setVal("");
    toast.success("Added");
  };
  const remove = (item: string) => {
    setData({ ...data, [tab]: data[tab].filter((i) => i !== item) });
    toast.success("Removed");
  };

  return (
    <PageTransition>
      <PageHeader title="Master Settings" description="Centralized configuration for system-wide masters." />
      <Card>
        <CardContent className="p-4 md:p-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap h-auto">
              {categories.map((c) => <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>)}
            </TabsList>
            {categories.map((c) => (
              <TabsContent key={c.key} value={c.key} className="mt-4">
                <div className="flex gap-2 mb-4">
                  <Input placeholder={`Add new ${c.label.toLowerCase()}…`} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
                  <Button onClick={add}><Plus className="size-4 mr-1.5" /> Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data[c.key]?.map((item) => (
                    <Badge key={item} variant="outline" className="text-sm py-1.5 px-3 gap-2 hover:border-destructive transition-colors group">
                      {item}
                      <button onClick={() => remove(item)} className="text-muted-foreground group-hover:text-destructive">
                        <Trash2 className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
