"use client";
import { PageHeader, PageTransition } from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Badge } from "@/slids/components/ui/badge";
import { Button } from "@/slids/components/ui/button";
import { Download, FileText, Plus } from "lucide-react";
import { promotionalMaterials } from "@/slids/data/mock";

export default function Promotional() {
  return (
    <PageTransition>
      <PageHeader
        title="Promotional Materials"
        description="Brochures, flyers and country-specific marketing assets."
        actions={<Button size="sm"><Plus className="size-4 mr-1.5" /> Upload Asset</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {promotionalMaterials.map((p) => (
          <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-all">
            <div className="aspect-[4/3] bg-[image:var(--gradient-soft)] relative flex items-center justify-center border-b border-border">
              <FileText className="size-12 text-primary/40" />
              <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">{p.category}</Badge>
            </div>
            <CardContent className="p-3">
              <div className="text-sm font-semibold truncate">{p.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{p.country} · {p.size}</div>
              <Button size="sm" variant="outline" className="w-full mt-3 h-8"><Download className="size-3.5 mr-1.5" /> Download</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageTransition>
  );
}
