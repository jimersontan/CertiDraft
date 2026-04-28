import { 
  Users, 
  FileText, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  CheckCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const stats = [
  { 
    title: "Total Users", 
    value: "1,284", 
    change: "+12.5%", 
    trend: "up", 
    icon: Users,
    description: "New users this month"
  },
  { 
    title: "Certs Generated", 
    value: "45,210", 
    change: "+18.2%", 
    trend: "up", 
    icon: FileText,
    description: "Total since launch"
  },
  { 
    title: "Monthly Revenue", 
    value: "$12,450", 
    change: "+5.4%", 
    trend: "up", 
    icon: DollarSign,
    description: "MRR for current month"
  },
  { 
    title: "Active Subs", 
    value: "842", 
    change: "-2.1%", 
    trend: "down", 
    icon: Activity,
    description: "Pro & Enterprise users"
  },
];

const recentActivity = [
  { user: "John Doe", action: "Upgraded to Pro", date: "2 mins ago", status: "success" },
  { user: "Jane Smith", action: "Generated 500 certs", date: "15 mins ago", status: "success" },
  { user: "Robert Fox", action: "Account Suspended", date: "1 hour ago", status: "warning" },
  { user: "Emily Chen", action: "Created new template", date: "3 hours ago", status: "success" },
  { user: "Michael Scott", action: "Joined platform", date: "5 hours ago", status: "success" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Admin Dashboard" 
        description="Comprehensive overview of CertiDraft platform performance and health."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/analytics">View Detailed Reports</Link>
        </Button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="size-3 text-emerald-500 mr-1" />
                ) : (
                  <ArrowDownRight className="size-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs font-medium ${stat.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground ml-2">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time monitoring of core services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Database className="size-4 text-indigo-600" />
                <span className="text-sm font-medium">Database (Supabase)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle className="size-3.5" />
                <span className="text-xs font-bold uppercase">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Activity className="size-4 text-emerald-600" />
                <span className="text-sm font-medium">API Services</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle className="size-3.5" />
                <span className="text-xs font-bold uppercase">Operational</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Storage Usage (45GB / 100GB)</span>
                <span className="font-bold">45%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-indigo-600 w-[45%] rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system-wide events and user actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold">
                      <Clock className="size-2.5" />
                      {activity.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4 text-xs font-semibold" asChild>
              <Link href="/admin/users">View All Activity</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
