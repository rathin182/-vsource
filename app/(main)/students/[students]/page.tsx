"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Users, FileText, CreditCard, FileCheck2, BarChart3, Search, Bell, Sun, Moon, Plus, ChevronRight, Filter, TrendingUp, Percent, DollarSign, User, MapPin, Calendar, GraduationCap, Check, Briefcase, Globe2, Trash2, Eye, FileSignature, SlidersHorizontal, FolderOpen, LayoutGrid, TableProperties, ArrowUpRight, ExternalLink, GripVertical, X } from 'lucide-react';
import { students as seed } from "@/slids/data/mock";
import type { Student } from "@/slids/types";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import StudentData from "@/slids/modules/internal-student/Studentdetails";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const [student, setStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const selectedStudentId = params.students as string;

  const studentfetch = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/student?id=${selectedStudentId}`);

      const data = await res.json();

      console.log(data, "lead data");

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      setStudent(data.data);
    } catch (error) {
      toast.error("Failed to fetch student.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    studentfetch();
  }, [selectedStudentId]);

  return (
    <div className="w-full h-screen -m-5">
      <StudentData student={student} reloadStudent={studentfetch} />
    </div>
  );
}