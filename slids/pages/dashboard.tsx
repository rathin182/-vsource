import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageTransition } from "@/slids/others/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/slids/others/ui/card";
import { Button } from "@/slids/others//ui/button";
import { Badge } from "@/slids/others/ui/badge";
import { Avatar, AvatarFallback } from "@/slids/others/ui/avatar";
import {
  Users,
  GraduationCap,
  FileText,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Calendar,
  Phone,
  QrCode,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  monthlyRevenue,
  countryAdmissions,
  leadSourceSplit,
  counselorsData,
  notifications,
  leads,
} from "@/slids/others/other-ts/data/mock";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/dashboard" as any)({ component: Dashboard });

const COLORS = [
  "oklch(0.58 0.22 27)",
  "oklch(0.62 0.15 240)",
  "oklch(0.65 0.17 155)",
  "oklch(0.78 0.16 75)",
  "oklch(0.55 0.2 305)",
];

const kpis = [
  {
    label: "Total Leads",
    value: "2,847",
    delta: "+12.4%",
    up: true,
    icon: Users,
    sub: "vs last month",
  },
  {
    label: "Active Students",
    value: "1,243",
    delta: "+6.8%",
    up: true,
    icon: GraduationCap,
    sub: "vs last month",
  },
  {
    label: "Applications",
    value: "684",
    delta: "+18.2%",
    up: true,
    icon: FileText,
    sub: "this quarter",
  },
  {
    label: "Revenue (₹)",
    value: "₹3.89Cr",
    delta: "-2.1%",
    up: false,
    icon: Banknote,
    sub: "Nov 2025",
  },
];

function Dashboard() {
  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of leads, admissions, and branch performance."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Calendar className="size-4 mr-1.5" /> This month
            </Button>
            <Button size="sm">
              <Plus className="size-4 mr-1.5" /> Quick add
            </Button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="size-10 rounded-xl bg-accent flex items-center justify-center">
                    <k.icon className="size-5 text-primary" />
                  </div>
                  <Badge
                    variant={k.up ? "secondary" : "destructive"}
                    className="text-[10px] gap-0.5"
                  >
                    {k.up ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {k.delta}
                  </Badge>
                </div>
                <div className="mt-4 text-2xl font-bold tracking-tight">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {k.label} · {k.sub}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Revenue & Applications</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Monthly trend · Jan–Nov 2025</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="size-3" /> +23.4% YoY
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ left: -10, right: 8 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.58 0.22 27)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.58 0.22 27)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.58 0.22 27)"
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Sources</CardTitle>
            <p className="text-xs text-muted-foreground">Top channels this month</p>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={leadSourceSplit}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {leadSourceSplit.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {leadSourceSplit.map((s, i) => (
                <div key={s.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{s.source}</span>
                  </div>
                  <span className="font-medium">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Country admissions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Admissions by Country</CardTitle>
            <p className="text-xs text-muted-foreground">Confirmed enrollments in 2025</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={countryAdmissions} margin={{ left: -10 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="country"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="oklch(0.58 0.22 27)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions / widgets */}
        <div className="grid grid-cols-2 gap-4">
          {/* <Card className="col-span-2 bg-[image:var(--gradient-primary)] text-white border-0">
              <CardContent className="p-5">
                <Phone className="size-5 mb-3" />
                <div className="text-sm font-semibold">Call Integration</div>
                <div className="text-xs opacity-85 mt-1">Click-to-call ready · Ozonetel</div>
                <Button variant="secondary" size="sm" className="mt-3 h-8">Configure</Button>
              </CardContent>
            </Card> */}
          <Card>
            <CardContent className="p-4">
              <QrCode className="size-5 text-primary mb-2" />
              <div className="text-sm font-semibold">QR Leads</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">12 today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Calendar className="size-5 text-primary mb-2" />
              <div className="text-sm font-semibold">Follow-ups</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">8 pending</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Counselor performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Counselor Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left font-medium px-5 py-2.5">Counselor</th>
                    <th className="text-left font-medium px-5 py-2.5">Branch</th>
                    <th className="text-right font-medium px-5 py-2.5">Leads</th>
                    <th className="text-right font-medium px-5 py-2.5">Converted</th>
                    <th className="text-right font-medium px-5 py-2.5">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {counselorsData.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7">
                            <AvatarFallback className="text-[10px] bg-accent text-accent-foreground">
                              {c.name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{c.branch}</td>
                      <td className="px-5 py-3 text-right">{c.leads}</td>
                      <td className="px-5 py-3 text-right font-semibold text-success">
                        {c.conversions}
                      </td>
                      <td className="px-5 py-3 text-right">{c.rating.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications
              .concat(notifications)
              .slice(0, 6)
              .map((n, i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-7 shrink-0 rounded-full bg-accent flex items-center justify-center mt-0.5">
                    <span className="size-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{n.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{n.description}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">{n.time}</div>
                </div>
              ))}
            <div className="text-xs text-muted-foreground pt-2">
              {leads.length} leads · {counselorsData.length} counselors active
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
