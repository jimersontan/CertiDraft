"use client";

import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Download, 
  Search, 
  ArrowUpRight, 
  MoreVertical,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";

const recentTransactions = [
  { id: "TX-9012", user: "John Doe", amount: "$29.00", date: "Today, 10:45 AM", method: "Visa •••• 4242", status: "Succeeded" },
  { id: "TX-9011", user: "Jane Smith", amount: "$29.00", date: "Yesterday, 4:20 PM", method: "Mastercard •••• 5555", status: "Succeeded" },
  { id: "TX-9010", user: "Robert Fox", amount: "$499.00", date: "Apr 25, 2024", method: "Bank Transfer", status: "Pending" },
  { id: "TX-9009", user: "Emily Chen", amount: "$29.00", date: "Apr 24, 2024", method: "Visa •••• 4242", status: "Succeeded" },
  { id: "TX-9008", user: "Michael Scott", amount: "$0.00", date: "Apr 24, 2024", method: "Free Tier", status: "Active" },
];

export default function AdminBillingPage() {
  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader 
        title="Subscriptions & Billing" 
        description="Monitor revenue, manage subscriptions, and process transactions."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="size-4" />
          Download CSV
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="size-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">+14% vs last mo</span>
            </div>
            <p className="text-3xl font-bold">$12,450</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Monthly Recurring Revenue</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="size-5 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 uppercase">842 Active</span>
            </div>
            <p className="text-3xl font-bold">78%</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Subscription Renewal Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <TrendingUp className="size-5 text-indigo-600" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase">$45.20 Avg</span>
            </div>
            <p className="text-3xl font-bold">$38,200</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Total Revenue (YTD)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <CardDescription>Latest payment activities across the platform.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search transaction ID..." className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs">{tx.id}</td>
                    <td className="px-4 py-4 font-medium">{tx.user}</td>
                    <td className="px-4 py-4 font-bold">{tx.amount}</td>
                    <td className="px-4 py-4 text-muted-foreground">{tx.date}</td>
                    <td className="px-4 py-4 text-xs font-medium">{tx.method}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {tx.status === "Succeeded" ? (
                          <CheckCircle className="size-3 text-emerald-500" />
                        ) : tx.status === "Pending" ? (
                          <Clock className="size-3 text-amber-500" />
                        ) : (
                          <CheckCircle className="size-3 text-blue-500" />
                        )}
                        <span className={`text-[10px] font-bold uppercase ${
                          tx.status === "Succeeded" ? "text-emerald-600" : 
                          tx.status === "Pending" ? "text-amber-600" : "text-blue-600"
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ExternalLink className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-4 text-xs font-semibold">View All Transactions</Button>
        </CardContent>
      </Card>
    </div>
  );
}
