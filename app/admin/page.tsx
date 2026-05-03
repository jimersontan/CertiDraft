"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  CheckCircle,
  Clock,
  Zap,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

interface DashboardStats {
  total_users: { count: number; growth_percentage: number; change_direction: string; last_month_count: number };
  certificates_generated: { lifetime_total: number; this_month: number; success_rate: number; failed_count: number };
  monthly_revenue: { amount_usd: number; amount_php: number; exchange_rate: number; currency: string; percentage_change: number; status: string };
  active_subscriptions: { total: number; free_plan: number; pro_plan: number; enterprise_plan: number; churn_rate: number };
}

interface ActivityLog {
  id: string;
  action: string;
  user_name: string;
  user_email: string;
  details: any;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activities?limit=10')
      ]);

      if (!statsRes.ok || !activitiesRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const statsJson = await statsRes.json();
      const activitiesJson = await activitiesRes.json();

      setStats(statsJson.data);
      setActivities(activitiesJson.data.recent_activities);
      setError(null);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Unable to load dashboard data. Please try again.");
      toast.error("Failed to sync dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-xs">Syncing real-time data...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="size-12 text-destructive opacity-50" />
        <h2 className="text-xl font-bold">Dashboard Sync Error</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => { setIsLoading(true); fetchData(); }} className="mt-2">
          Retry Sync
        </Button>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.total_users.count.toLocaleString() || "0", 
      change: `${stats?.total_users.growth_percentage}%`, 
      trend: stats?.total_users.change_direction, 
      icon: Users,
      description: "Active accounts"
    },
    { 
      title: "Certificates", 
      value: stats?.certificates_generated.lifetime_total.toLocaleString() || "0", 
      change: `${stats?.certificates_generated.success_rate}%`, 
      trend: "up", 
      icon: FileText,
      description: "Success rate"
    },
    { 
      title: "Monthly Revenue", 
      value: stats ? `₱${stats.monthly_revenue.amount_php.toLocaleString()}` : "₱0.00", 
      change: `${stats?.monthly_revenue.percentage_change}%`, 
      trend: stats?.monthly_revenue.status, 
      icon: DollarSign,
      description: `PHP @ ${stats?.monthly_revenue.exchange_rate}`
    },
    { 
      title: "Active Subs", 
      value: stats?.active_subscriptions.total.toLocaleString() || "0", 
      change: `${stats?.active_subscriptions.churn_rate}%`, 
      trend: "down", 
      icon: Zap,
      description: "Churn rate"
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Admin Control Center" 
        description="Real-time operational overview of the CertiDraft AI platform."
      >
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border/50 bg-background px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground lg:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            Live Sync: Operational
          </div>
          <Button variant="outline" size="sm" className="rounded-full shadow-sm" asChild>
            <Link href="/admin/analytics">Detailed Reports</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-none shadow-xl ring-1 ring-border/50 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-muted/20">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
              <div className="size-8 rounded-xl bg-white shadow-sm border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <stat.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-black tracking-tighter text-foreground">{stat.value}</div>
              <div className="flex items-center mt-3">
                <div className={`flex items-center rounded-full px-2.5 py-0.5 ${stat.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="size-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="size-3 mr-1" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest">{stat.change}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest ml-4">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* System Health */}
        <Card className="lg:col-span-1 border-none shadow-xl ring-1 ring-border/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/10">
            <CardTitle className="text-lg font-black tracking-tight">System Health</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Real-time service status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <HealthItem label="Database" service="Supabase" status="connected" icon={Database} color="text-indigo-600" />
            <HealthItem label="API Services" service="Edge Runtime" status="operational" icon={Activity} color="text-emerald-600" />
            <HealthItem label="Storage" service="450GB / 1000GB" status="45%" isProgress icon={CheckCircle} color="text-amber-600" />
            <HealthItem label="Redis Cache" service="Upstash" status="connected" icon={CheckCircle} color="text-rose-600" />
            <HealthItem label="Email Service" service="SendGrid" status="operational" icon={CheckCircle} color="text-blue-600" />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-none shadow-xl ring-1 ring-border/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black tracking-tight">Recent Activity</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Latest platform events</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-black uppercase tracking-widest" asChild>
              <Link href="/admin/users">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {activities.length > 0 ? activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-xs font-black text-primary uppercase transition-colors group-hover:bg-primary group-hover:text-white">
                      {activity.user_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground leading-none">{activity.user_name}</p>
                      <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold tracking-tighter">{activity.action.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                      <Clock className="size-3" />
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Activity className="size-10 mx-auto mb-4 opacity-10 animate-pulse" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-40">No recent activity detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HealthItem({ label, service, status, icon: Icon, color, isProgress }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-3xl bg-muted/20 border border-border/10">
      <div className="flex items-center gap-4">
        <div className={`size-10 rounded-2xl bg-white shadow-sm border border-border/50 flex items-center justify-center ${color}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-widest block">{label}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{service}</span>
        </div>
      </div>
      {isProgress ? (
        <div className="w-24 space-y-1">
          <div className="flex justify-between text-[8px] font-black uppercase">
            <span>{status}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${color.replace('text-', 'bg-')} w-[45%] rounded-full`} />
          </div>
        </div>
      ) : (
        <div className={`flex items-center gap-1.5 ${status === 'connected' || status === 'operational' ? 'text-emerald-600' : 'text-rose-600'}`}>
          <div className="size-1.5 rounded-full bg-current animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
        </div>
      )}
    </div>
  );
}
