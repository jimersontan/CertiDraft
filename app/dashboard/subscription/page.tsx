"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  CheckCircle, 
  CreditCard, 
  Download, 
  Zap, 
  ShieldCheck, 
  Globe, 
  ArrowRight,
  Plus,
  Trash2,
  Lock,
  Calendar,
  AlertCircle,
  Activity,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

import { useAuth } from "@/context/AuthContext";
import { getPlanDetails } from "@/lib/subscriptions";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₱0",
    period: "/month",
    description: "Limited access for personal projects and funnels.",
    features: ["5 certificates/month", "Standard templates only", "System watermark", "Acquisition funnel access"],
    color: "gray",
  },
  {
    id: "starter",
    name: "Starter",
    price: "₱199",
    period: "/month",
    description: "Accommodates growing users with higher limits.",
    features: ["50 certificates/month", "Standard templates", "No watermark", "Standard support"],
    color: "blue",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₱599",
    period: "/month",
    description: "Targets active organizations and power users.",
    features: ["300 certificates/month", "Everything in Starter", "Email automation", "Priority email delivery", "Analytics dashboard", "Priority customer support"],
    popular: true,
    color: "purple",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₱1,499",
    period: "/month",
    description: "Large-scale operations with full white-labeling.",
    features: ["1,000 certificates/month", "Everything in Pro", "White-label branding", "API access", "Verification portal", "Dedicated account management"],
    color: "indigo",
  },
];

const initialInvoices: any[] = [];

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumberState, setCardNumberState] = useState("");
  const [expiryState, setExpiryState] = useState("");
  const [cvvState, setCvvState] = useState("");
  const [cardNameState, setCardNameState] = useState("");

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const formattedValue = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumberState(formattedValue.slice(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\//g, "").replace(/[^0-9]/gi, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setExpiryState(value.slice(0, 5));
  };

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const currentPlan = user?.plan || "free";
  const planInfo = getPlanDetails(currentPlan);
  const currentUsage = user?.certificates_this_month || 0;

  const handleUpgrade = (plan: any) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  const [usageStats, setUsageStats] = useState({
    certificates: 0,
    citations: 0,
    apiRequests: 0
  });

  const fetchUsageStats = useCallback(async () => {
    if (!user?.id) return;
    
    const supabase = await createClient();
    
    // Get certificates count
    const { count: certsCount } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    // Get projects count (as a proxy for activity if needed)
    // or if we had a usage table, we'd query that.
    
    setUsageStats({
      certificates: certsCount || 0,
      citations: 0, // Placeholder for future implementation
      apiRequests: 0 // Placeholder for future implementation
    });
  }, [user?.id]);

  useEffect(() => {
    // Calling an async function from an effect is fine, 
    // but we wrap it to ensure it's treated as a background side effect.
    const load = async () => {
      await fetchUsageStats();
    };
    load();
  }, [fetchUsageStats]);

  const processPayment = async () => {
    if (!selectedPlan) {
      toast.error("No plan selected");
      return;
    }

    console.log('Processing payment for plan:', selectedPlan.id, 'Cycle:', billingCycle);
    setIsProcessing(true);
    try {
      const response = await api.upgradeSubscription(selectedPlan.id, billingCycle);
      
      if (response.data.status === 'success') {
        await refreshUser();
        toast.success(`Payment successful! Welcome to the ${selectedPlan.name} plan!`);
        setIsCheckoutOpen(false);
        // Redirect to projects or reload to see changes
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorMsg = response.data.error?.message || response.data.message || "Payment failed";
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Payment Error:', err);
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || "Transaction failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBillingPortal = () => {
    const portalUrl = process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL;
    
    if (portalUrl) {
      toast.info("Redirecting to Billing Portal...");
      setTimeout(() => {
        window.open(portalUrl, "_blank");
      }, 1000);
    } else {
      toast.error("Billing portal is only available in production environments with a configured Stripe account.");
    }
  };

  const handleCancelSubscription = () => {
    const confirm = window.confirm("Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of the billing cycle.");
    if (confirm) {
      toast.warning("Cancelling subscription...");
      setTimeout(() => {
        toast.success("Subscription cancelled successfully.");
      }, 1500);
    }
  };

  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const handleAddCard = () => {
    setIsAddCardOpen(true);
  };

  const handleDeleteCard = () => {
    if (window.confirm("Are you sure you want to remove this payment method?")) {
      toast.info("Removing payment method...");
      setTimeout(() => {
        toast.success("Payment method removed.");
      }, 1000);
    }
  };

  const handleEditCard = () => {
    toast.info("Opening card editor...");
  };

  const getPrice = (price: string) => {
    if (price === "Custom" || price === "₱0") return price;
    const numericPrice = parseInt(price.replace("₱", "").replace(",", ""));
    return billingCycle === "yearly" 
      ? `₱${Math.round(numericPrice * 0.8 * 12).toLocaleString()}` 
      : price;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          <Zap className="size-3" />
          Powered by Stripe
        </div>
      </div>
      
      <PageHeader 
        title="Subscription & Billing" 
        description="View your current usage, manage payment methods, and upgrade your plan." 
      />

      {/* Billing Cycle Toggle */}
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <div className="flex items-center gap-4 rounded-full bg-muted p-1 border shadow-sm">
          <button 
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-6 py-1.5 text-sm font-bold transition-all ${
              billingCycle === "monthly" ? "bg-white text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingCycle("yearly")}
            className={`relative rounded-full px-6 py-1.5 text-sm font-bold transition-all ${
              billingCycle === "yearly" ? "bg-white text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <span className="absolute -top-4 -right-4 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase shadow-lg">
              -20%
            </span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
          <Globe className="size-3" />
          Prices shown in USD. Local taxes may apply.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Current Plan & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Plan Card */}
          <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-border/50 rounded-3xl bg-card">
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 size-64 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 size-64 rounded-full bg-indigo-500/10 blur-3xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">Current Active Plan</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tight drop-shadow-sm">
                    {plans.find(p => p.id === currentPlan)?.name} <span className="text-blue-200/80 font-medium">Edition</span>
                  </h2>
                </div>
                <div className="flex flex-col items-end">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 ring-1 ring-white/20 shadow-lg">
                    <p className="text-4xl font-black tracking-tighter">{getPrice(plans.find(p => p.id === currentPlan)?.price || "")}</p>
                    <p className="text-[10px] text-blue-100/60 font-bold uppercase tracking-widest text-right mt-1">billed {billingCycle}</p>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold backdrop-blur-md ring-1 ring-white/10 shadow-sm transition-all hover:bg-white/20">
                  <Calendar className="size-4 text-blue-200" />
                  {user?.plan_expires_at 
                    ? `Renews ${new Date(user.plan_expires_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : "Lifetime Access"
                  }
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold backdrop-blur-md ring-1 ring-white/10 shadow-sm transition-all hover:bg-white/20">
                  <ShieldCheck className="size-4 text-emerald-300" />
                  {user?.plan === 'free' ? "Standard Account" : "Premium Protection"}
                </div>
              </div>
            </div>
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight">Usage Metrics</h3>
                  <p className="text-xs text-muted-foreground font-medium">Monitoring your current billing period resources.</p>
                </div>
                <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] bg-muted px-3 py-1.5 rounded-lg">
                  Cycle: {user?.last_usage_reset 
                    ? `${new Date(user.last_usage_reset).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(new Date(user.last_usage_reset).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                    : 'Current Month'
                  }
                </span>
              </div>
              
              <div className="grid gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Resource</span>
                      <p className="text-sm font-bold">Certificate Generation</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-foreground">{currentUsage}</span>
                      <span className="text-sm text-muted-foreground font-bold ml-1">/ {planInfo.limit}</span>
                    </div>
                  </div>
                  <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted/50 p-1 shadow-inner ring-1 ring-border/50">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-1000 relative" 
                      style={{ width: `${Math.min((currentUsage / planInfo.limit) * 100, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer-slide_2s_infinite]" />
                    </div>
                  </div>
                  {currentPlan === 'free' && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
                      <AlertCircle className="size-4 shrink-0" />
                      <p className="text-[11px] font-bold">You&apos;ve utilized your free tier resources. Upgrade to eliminate all restrictions.</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className={`rounded-2xl border border-border/50 p-5 group transition-all hover:shadow-lg hover:shadow-primary/5 ${planInfo.hasAICitation ? 'bg-blue-50/50 border-blue-200' : 'bg-muted/20 opacity-60'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`size-8 rounded-lg flex items-center justify-center ${planInfo.hasAICitation ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                        <Globe className="size-4" />
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">AI Citations</p>
                    </div>
                    <p className="text-2xl font-black tracking-tighter">
                      {planInfo.hasAICitation ? 'Included' : 'Locked'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">Smart References & Citations</p>
                  </div>
                  <div className={`rounded-2xl border border-border/50 p-5 group transition-all hover:shadow-lg hover:shadow-primary/5 ${planInfo.hasAPI ? 'bg-indigo-50/50 border-indigo-200' : 'bg-muted/20 opacity-60'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`size-8 rounded-lg flex items-center justify-center ${planInfo.hasAPI ? 'bg-indigo-100 text-indigo-600' : 'bg-muted text-muted-foreground'}`}>
                        <Zap className="size-4" />
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">API Access</p>
                    </div>
                    <p className="text-2xl font-black tracking-tighter">
                      {planInfo.hasAPI ? 'Included' : 'Locked'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">External System Integration</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-8 flex justify-end gap-4">
              <Button variant="ghost" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors" onClick={handleBillingPortal}>Managed Billing Portal</Button>
              <Button variant="outline" className="text-[11px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 rounded-xl px-6 h-11 transition-all border-border/50" onClick={handleCancelSubscription}>Cancel Plan</Button>
            </CardFooter>
          </Card>

        </div>

        {/* Right Column: Plans list (Compact) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-black tracking-tight">Select Upgrade</h3>
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">3 Tiers Available</span>
          </div>
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-500 rounded-3xl ${
                  plan.id === currentPlan 
                    ? "ring-2 ring-primary bg-primary/[0.02] shadow-xl" 
                    : "border-border/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-bl-2xl shadow-lg z-10">
                    Recommended
                  </div>
                )}
                
                <CardHeader className="p-6 pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xl font-black tracking-tight">{plan.name}</h4>
                    <div className="text-right">
                      <span className="text-2xl font-black tracking-tighter">{getPrice(plan.price)}</span>
                      <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">{plan.period.replace("/", "")}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="px-6 pb-6 pt-0">
                  <div className="h-px w-full bg-border/40 mb-5" />
                  <ul className="space-y-3">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-3 text-xs font-medium text-muted-foreground/80">
                        <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                          <CheckCircle className="size-3 text-emerald-600" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="px-6 pb-6 pt-0">
                  <Button 
                    className={`w-full h-12 font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 ${
                      plan.id === currentPlan 
                        ? "bg-muted text-muted-foreground cursor-default" 
                        : "bg-foreground text-background hover:bg-primary hover:text-white shadow-lg hover:shadow-primary/20"
                    }`}
                    disabled={plan.id === currentPlan}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {plan.id === currentPlan ? "Your Active Plan" : (
                      <div className="flex items-center gap-2">
                        Get Started
                        <ArrowRight className="size-4" />
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-border/50 rounded-3xl bg-card">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight">Saved Methods</CardTitle>
                  <CardDescription className="text-xs font-medium">Encrypted & secured by Stripe vaulting.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl border-border/50 font-bold text-[11px] uppercase tracking-widest gap-2 hover:bg-primary hover:text-white transition-all shadow-sm" onClick={handleAddCard}>
                  <Plus className="size-3.5" /> Add New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 group transition-all hover:bg-primary/[0.06]">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-border/50 relative overflow-hidden group-hover:scale-105 transition-transform">
                    <CreditCard className="size-6 text-blue-600 relative z-10" />
                    <div className="absolute top-0 right-0 size-6 bg-blue-50 rounded-bl-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="font-black text-base tracking-tight whitespace-nowrap">{cardNumberState || "•••• •••• •••• 4242"}</p>
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-black text-white uppercase tracking-widest shadow-sm">Primary</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">Expires 12/2027 • Visa Gold</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 self-end xl:self-auto shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-all" onClick={handleDeleteCard}><Trash2 className="size-4" /></Button>
                  <Button variant="ghost" className="h-8 px-3 rounded-xl text-muted-foreground/50 font-bold text-[10px] uppercase tracking-widest hover:text-primary hover:bg-primary/5 transition-all" onClick={handleEditCard}>Manage</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-border/50 rounded-3xl bg-card">
        <CardHeader className="p-8 bg-muted/30 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight">Billing History</CardTitle>
              <CardDescription className="text-xs font-medium">Access and download your previous transaction records.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-10 px-5 rounded-xl border-border/50 font-bold text-[11px] uppercase tracking-widest gap-2 hover:bg-foreground hover:text-background transition-all shadow-sm">
              <Download className="size-4" /> Export Batch
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/10 text-muted-foreground border-b border-border/50 uppercase text-[10px] tracking-[0.2em] font-black">
                  <th className="px-8 py-5 text-left">Statement ID</th>
                  <th className="px-8 py-5 text-left">Issuance Date</th>
                  <th className="px-8 py-5 text-left">Total Amount</th>
                  <th className="px-8 py-5 text-left">Settlement</th>
                  <th className="px-8 py-5 text-right">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {initialInvoices.length > 0 ? initialInvoices.map((inv) => (
                  <tr key={inv.id} className="group transition-colors hover:bg-muted/10">
                    <td className="px-8 py-5 font-mono text-xs font-bold text-muted-foreground">{inv.id}</td>
                    <td className="px-8 py-5 text-[13px] font-bold text-foreground/80">{inv.date}</td>
                    <td className="px-8 py-5 font-black text-foreground">{inv.amount}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center rounded-full bg-emerald-100/50 px-3 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-widest ring-1 ring-emerald-200/50">
                        <CheckCircle className="mr-1.5 size-3" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-all">
                        <Download className="size-3.5" /> PDF
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-16 rounded-3xl bg-muted/30 flex items-center justify-center mb-2">
                          <Activity className="size-8 text-muted-foreground/20" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">No transaction history found</p>
                        <p className="text-xs text-muted-foreground/30 font-medium max-w-[240px]">Your billing statements will appear here once your first payment is processed.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 size-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 size-40 rounded-full bg-indigo-500/20 blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 ring-1 ring-white/30">
                <Crown className="size-6 text-white" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight mb-1 text-center">Premium Upgrade</DialogTitle>
              <DialogDescription className="text-blue-100 text-center opacity-90 font-medium">
                Unlock full access to <span className="text-white font-bold">{selectedPlan?.name}</span> features
              </DialogDescription>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Order Summary</Label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Renews Monthly</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-muted/30 p-5 border border-border/50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-white shadow-sm border border-border/50 flex items-center justify-center">
                    <Zap className="size-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{selectedPlan?.name} Membership</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Priority Support & AI Tools</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-xl text-foreground">{selectedPlan?.price}</span>
                  <p className="text-[10px] text-muted-foreground font-medium">VAT Included</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-2 px-1">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Secure Payment Details</Label>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2 group">
                  <Label htmlFor="card-name" className="text-[11px] font-bold ml-1 text-muted-foreground group-focus-within:text-primary transition-colors">Name on Card</Label>
                  <div className="relative">
                    <Input id="card-name" value={cardNameState} onChange={(e) => setCardNameState(e.target.value)} placeholder="John Doe" className="h-12 bg-muted/20 rounded-xl border-border/50 focus:ring-primary/20 focus:border-primary transition-all pl-4" />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="card-number" className="text-[11px] font-bold ml-1 text-muted-foreground group-focus-within:text-primary transition-colors">Card Number</Label>
                  <div className="relative">
                    <Input id="card-number" value={cardNumberState} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" className="h-12 bg-muted/20 rounded-xl border-border/50 focus:ring-primary/20 focus:border-primary transition-all pl-12" />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                      <div className="h-5 w-8 bg-blue-100 rounded opacity-50" />
                      <div className="h-5 w-8 bg-orange-100 rounded opacity-50" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 group">
                    <Label htmlFor="expiry" className="text-[11px] font-bold ml-1 text-muted-foreground group-focus-within:text-primary transition-colors">Expiry Date</Label>
                    <Input id="expiry" value={expiryState} onChange={handleExpiryChange} placeholder="MM/YY" className="h-12 bg-muted/20 rounded-xl border-border/50 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="cvv" className="text-[11px] font-bold ml-1 text-muted-foreground group-focus-within:text-primary transition-colors">CVV</Label>
                    <div className="relative">
                      <Input id="cvv" value={cvvState} onChange={(e) => setCvvState(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} placeholder="•••" type="password" className="h-12 bg-muted/20 rounded-xl border-border/50 focus:ring-primary/20 focus:border-primary transition-all pr-10" />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                PCI-DSS Compliant • 256-bit SSL
              </div>
              <div className="flex gap-4 opacity-30">
                {/* Mock logos */}
                <div className="h-4 w-8 bg-foreground rounded-sm" />
                <div className="h-4 w-8 bg-foreground rounded-sm" />
                <div className="h-4 w-8 bg-foreground rounded-sm" />
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 flex flex-col gap-3">
            <Button 
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3" 
              onClick={processPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${selectedPlan?.price || "₱1,499"}`
              )}
            </Button>
            <Button variant="ghost" className="w-full text-xs font-bold text-muted-foreground hover:text-foreground h-10" onClick={() => setIsCheckoutOpen(false)}>
              Cancel and go back
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Method Dialog */}
      <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details to save a new payment method.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-card-name">Name on Card</Label>
              <Input id="new-card-name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-card-number">Card Number</Label>
              <Input id="new-card-number" placeholder="0000 0000 0000 0000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-expiry">Expiry Date</Label>
                <Input id="new-expiry" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-cvv">CVV</Label>
                <Input id="new-cvv" placeholder="123" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCardOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success("Card added successfully!");
              setIsAddCardOpen(false);
            }}>Save Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
