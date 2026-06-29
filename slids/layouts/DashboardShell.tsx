import { Sidebar } from "@/slids/layouts/Sidebar";
import { Topbar } from "@/slids/layouts/Topbar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-y-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
