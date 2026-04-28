"use client";

import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Download, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

const generationData = [
  { name: "Mon", value: 1200 },
  { name: "Tue", value: 1900 },
  { name: "Wed", value: 3200 },
  { name: "Thu", value: 2100 },
  { name: "Fri", value: 4500 },
  { name: "Sat", value: 1500 },
  { name: "Sun", value: 800 },
];

const revenueData = [
  { month: "Oct", rev: 8500 },
  { month: "Nov", rev: 9200 },
  { month: "Dec", rev: 11500 },
  { month: "Jan", rev: 10800 },
  { month: "Feb", rev: 12100 },
  { month: "Mar", rev: 13400 },
];

const planData = [
  { name: "Free", value: 442, color: "#94a3b8" },
  { name: "Pro", value: 340, color: "#4f46e5" },
  { name: "Enterprise", value: 62, color: "#7c3aed" },
];

const topTemplates = [
  { name: "Corporate Excellence", count: 1250 },
  { name: "Training Completion", count: 980 },
  { name: "Dean's List", count: 840 },
  { name: "Employee Month", count: 720 },
  { name: "Award Sports", count: 540 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("Last 7 Days");

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader 
        title="Analytics & Reports" 
        description="Deep dive into platform metrics, usage patterns, and growth trends."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <CalendarIcon className="size-4 text-muted-foreground" />
            {timeRange}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <Download className="size-4" />
            Export Report
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Revenue", val: "$124.5k", icon: DollarSign, trend: "+12%" },
          { title: "Avg. Certs/User", val: "42.5", icon: FileText, trend: "+5%" },
          { title: "Churn Rate", val: "2.3%", icon: Users, trend: "-0.4%" },
          { title: "Active Projects", val: "2,450", icon: TrendingUp, trend: "+18%" },
        ].map((m) => (
          <Card key={m.title} className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <m.icon className="size-4 text-muted-foreground" />
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {m.trend}
                </span>
              </div>
              <p className="text-2xl font-bold">{m.val}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generation Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Certificates Generated</CardTitle>
            <CardDescription>Daily generation volume for the current week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generationData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Revenue Trend</CardTitle>
            <CardDescription>Monthly recurring revenue growth (last 6 months).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="rev" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Breakdown */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">User Breakdown</CardTitle>
            <CardDescription>Distribution of users across subscription plans.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[300px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-6">
              {planData.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="size-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-medium text-muted-foreground">{p.name}</span>
                  <span className="text-xs font-bold">{Math.round((p.value / 844) * 100)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Templates */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Top Performing Templates</CardTitle>
            <CardDescription>Most frequently used certificate designs.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className="space-y-5">
              {topTemplates.map((t) => (
                <div key={t.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>{t.name}</span>
                    <span className="text-muted-foreground">{t.count.toLocaleString()} uses</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full" 
                      style={{ width: `${(t.count / 1250) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-6 text-xs font-semibold">View All Templates</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
