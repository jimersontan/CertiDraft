"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Download, 
  Search, 
  Filter, 
  MoreVertical,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Transaction {
  id: string;
  user_email: string;
  user_name: string;
  amount_usd: number;
  amount_php: number;
  plan: string;
  payment_method: string;
  status: string;
  created_at: string;
}

interface BillingMetrics {
  mrr_usd: number;
  mrr_php: number;
  total_revenue_ytd_usd: number;
  total_revenue_ytd_php: number;
  active_paid_subscriptions: number;
}

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 0 });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/billing?page=${pagination.page}&search=${searchTerm}`);
      const json = await res.json();
      if (json.status === "success") {
        setTransactions(json.data.transactions);
        setMetrics(json.data.metrics);
        setPagination(json.pagination);
      }
    } catch (err) {
      toast.error("Failed to load billing data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded': return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 uppercase text-[10px] font-black gap-1">
          <CheckCircle2 className="size-2.5" /> Succeeded
        </Badge>
      );
      case 'failed': return (
        <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 uppercase text-[10px] font-black gap-1">
          <XCircle className="size-2.5" /> Failed
        </Badge>
      );
      default: return (
        <Badge variant="outline" className="uppercase text-[10px] font-black gap-1">
          <Clock className="size-2.5" /> {status}
        </Badge>
      );
    }
  };

  const statCards = [
    {
      title: "Monthly Recurring Revenue",
      usd: metrics?.mrr_usd || 0,
      php: metrics?.mrr_php || 0,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      description: "Last 30 days"
    },
    {
      title: "Total Revenue (YTD)",
      usd: metrics?.total_revenue_ytd_usd || 0,
      php: metrics?.total_revenue_ytd_php || 0,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      description: "Year to date"
    },
    {
      title: "Active Subscriptions",
      value: metrics?.active_paid_subscriptions || 0,
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-50",
      description: "Paid tiers only"
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Billing & Finance" 
        description="Monitor revenue growth and manage customer transactions."
      >
        <Button variant="outline" className="rounded-full shadow-sm gap-2">
          <Download className="size-4" />
          Export Report
        </Button>
      </PageHeader>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl ring-1 ring-border/50 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-muted/20">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
              <div className={`size-8 rounded-xl ${stat.bg} shadow-sm border border-border/50 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {stat.value !== undefined ? (
                <div className="text-3xl font-black tracking-tighter text-foreground">{stat.value.toLocaleString()}</div>
              ) : (
                <>
                  <div className="text-3xl font-black tracking-tighter text-foreground">₱{stat.php.toLocaleString()}</div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase mt-1 tracking-widest">${stat.usd.toLocaleString()} USD</div>
                </>
              )}
              <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-4">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction Table */}
      <Card className="border-none shadow-2xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black tracking-tight">Recent Transactions</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Complete history of platform payments</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-10 rounded-full bg-muted/20 border-none ring-1 ring-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (PHP)</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tier</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" />
                      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Ledger...</p>
                    </td>
                  </tr>
                ) : transactions.length > 0 ? transactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="px-8 py-4">
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none">{tx.user_name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{tx.user_email}</p>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="font-black text-sm">₱{tx.amount_php.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">${tx.amount_usd} USD</div>
                    </td>
                    <td className="px-8 py-4">
                      <Badge variant="outline" className="uppercase text-[10px] font-black border-border/50">
                        {tx.plan || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-8 py-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="px-8 py-4">
                      <div className="text-xs font-bold text-foreground">
                        {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl w-48 p-2">
                          <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs">
                            <ExternalLink className="size-3.5" /> View Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs">
                            <ShieldAlert className="size-3.5" /> Refund Transaction
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Clock className="size-10 mx-auto text-muted-foreground opacity-20 mb-4" />
                      <p className="text-sm font-bold opacity-40 uppercase tracking-widest">No transaction records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-4 bg-muted/10 border-t border-border/40 flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Page <span className="text-foreground">{pagination.page}</span> of <span className="text-foreground">{pagination.total_pages || 1}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full size-8" 
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full size-8" 
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
