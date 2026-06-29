"use client";
import { useEffect, useState, useTransition } from "react";
import {
  PageHeader,
  PageTransition,
} from "@/slids/components/common/PageHeader";
import { Card, CardContent } from "@/slids/components/ui/card";
import { Button } from "@/slids/components/ui/button";
import { Badge } from "@/slids/components/ui/badge";

import {
  MapPin,
  Users,
  GraduationCap,
  Plus,
  Building2,
  TrendingUp,
  LucideLoader2,
  LucideArrowLeft,
  LucideEdit2,
  LucideTrash,
} from "lucide-react";
import type { Branch } from "@/slids/types";
import axios from "axios";
import { useRouter } from "next/navigation";

interface MetaData {
  totalPages: number;
  total: number;
  limit: number;
  page: number;
}

export default function Branches() {
  const [list, setList] = useState<Branch[]>([]);
  const [transition, startTransition] = useTransition();
  const [delPrompt, setDelPrompt] = useState(false);

  const [metaData, setMetaData] = useState<MetaData>();
  const [page, setPage] = useState(1)
  const router = useRouter()

  const fetchData = () =>
    startTransition(async () => {
      const req = await axios.get(`/api/branches?page=${page}`);
      if (req.status === 200) {
        setList(req.data.data);
        setMetaData(req.data.meta);
      }
    });

  const delData = (id: string) =>
    startTransition(async () => {
      const req = await axios.delete(`/api/branches/${id}`);
      if (req.status === 200) {
        window.location.reload()
      }
    });

  const delAsk = (id: string, name: string) => {
    const ok = window.confirm(`Are you sure want to delete ${name}`)
    if (ok) {
      delData(id)
    }
  }

  useEffect(() => {
    fetchData();
  }, [page]);

  if (transition) {
    return (
      <div className="w-[80vw] h-screen grid place-items-center">
        <LucideLoader2 size={34} className="animate-spin" />
      </div>
    );
  }
  return (
    <PageTransition>
      <PageHeader
        title="Branches"
        description="Manage office locations and team performance."
        actions={
              <Button size="sm" onClick={() => router.push("/branches/add")}>
                <Plus className="size-4 mr-1.5" /> New Branch
              </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list?.length > 0 &&
          list.map((b) => (
            <Card
              key={b.id}
              className="overflow-hidden hover:shadow-md transition-all"
            >
              <div className="h-20 bg-[image:var(--gradient-soft)] relative flex items-center px-4 border-b border-border">
                <div className="size-12 rounded-xl bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-md">
                  <Building2 className="size-5 text-white" />
                </div>
                <Badge
                  className="ml-auto"
                  variant={b.status ? "default" : "secondary"}
                >
                  {b.status ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="font-bold">{b.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="size-3" /> {b.city}, {b.state}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  {b.code}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <Users className="size-3.5 mx-auto text-primary" />
                    <div className="font-bold text-sm mt-1">{b.usersCount}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Users
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <GraduationCap className="size-3.5 mx-auto text-primary" />
                    <div className="font-bold text-sm mt-1">
                      {b.studentsCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Students
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <TrendingUp className="size-3.5 mx-auto text-primary" />
                    <div className="font-bold text-sm mt-1">{b.leadsCount}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Leads
                    </div>
                  </div>
                </div>

                <div className="w-full flex pt-3 gap-2.5">
                  <div className="w-5/6" onClick={() => router.push(`/branches/${b.id}`)}>
                  <Button variant={"outline"} className="w-full shadow-none">
                    <LucideEdit2 /> Edit
                  </Button>
                  </div>
                  <div className="w-1/6" onClick={() => delAsk(b.id, b.name)}>
                  <Button variant={"destructive"} className="w-full shadow-none">
                    <LucideTrash />
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
      <div className="w-full flex justify-between items-center my-4 px-2">
        <p className="text-sm text-gray-400">
          Showing: {list.length} / {metaData && metaData.total}
        </p>
        <div className=""></div>
        <div className="text-sm text-gray-400 flex justify-center items-center gap-2">
          <button onClick={() => setPage(page - 1)} disabled={metaData?.page === 1} className="px-2 py-2 text-primary  rounded-full">
            <LucideArrowLeft size={16} />
          </button>
          {metaData && metaData.page} / {metaData && metaData.totalPages}
          <button onClick={() => setPage(page + 1)} disabled={metaData?.page === metaData?.totalPages} className="px-2 py-2 bg-primary rotate-180 text-white rounded-full">
            <LucideArrowLeft size={16} />
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
