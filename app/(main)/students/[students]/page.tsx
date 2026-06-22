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

  const selectedStudentId = params.students as string;

  const selectedStudent = seed.find((s) => s.id === selectedStudentId);

  useEffect(() => {
    console.log(selectedStudent);
  }, [selectedStudentId]);

  return (
    <div className="w-full h-screen -m-5">
      <StudentData student={selectedStudent} />
    </div>
  );
}