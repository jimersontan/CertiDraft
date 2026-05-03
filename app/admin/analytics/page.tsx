"use client";

import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Loader2,
  Filter,
  Layout
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30days");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?period=${period}`);
        const json = await res.json();
        if (json.status === "success") {
          setData(json.data);
        }
      } catch (err) {
        toast.error("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const planData = data ? [
    { name: 'Free', value: data.plan_breakdown.free },
    { name: 'Pro', value: data.plan_breakdown.pro },
    { name: 'Enterprise', value: data.plan_breakdown.enterprise },
  ] : [];

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Processing platform metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Analytics & Insights" 
        description="Deep dive into platform performance, growth, and user behavior."
      >
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] rounded-full bg-background shadow-sm border-border/50">
              <Calendar className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-full shadow-sm gap-2">
            <Download className="size-4" />
            Export Data
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Certificate Generation Chart */}
        <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black tracking-tight">Certificate Volume</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Daily completed generations</CardDescription>
              </div>
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.certificates_over_time}>
                <defs>
                  <linearGradient id="colorCerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 900, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                  itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="certificates" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCerts)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black tracking-tight">Revenue Trend</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Monthly recurring revenue (PHP)</CardDescription>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <DollarSign className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }}
                  tickFormatter={(val) => `₱${val/1000}k`}
                />
                <Tooltip 
                   cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                   labelStyle={{ fontWeight: 900, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Bar 
                  dataKey="revenue_php" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/10">
            <CardTitle className="text-lg font-black tracking-tight">User Distribution</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Breakdown by subscription tier</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Templates */}
        <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/10">
            <CardTitle className="text-lg font-black tracking-tight">Top Templates</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Most popular certificate layouts</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-6">
              {data?.top_templates.map((template: any, i: number) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="size-8 rounded-xl bg-muted/30 flex items-center justify-center text-[10px] font-black">
                      #{i + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold">{template.name}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{template.uses} USES</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${(template.uses / data.top_templates[0].uses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
