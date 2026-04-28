"use client";

import { CheckCircle, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/ui/page-header";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    features: ["10 certificates/month", "Basic templates", "PDF export", "Email support"],
    current: false,
    cta: "Current Plan",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: ["Unlimited certificates", "AI-powered citations", "Custom branding", "Priority email delivery", "Team collaboration", "Analytics dashboard"],
    current: true,
    cta: "Current Plan",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Everything in Pro", "Dedicated account manager", "Custom integrations", "SLA guarantee", "On-premise option", "Advanced security"],
    current: false,
    cta: "Contact Sales",
  },
];

const invoices = [
  { date: "Apr 1, 2026", amount: "$29.00", status: "Paid" },
  { date: "Mar 1, 2026", amount: "$29.00", status: "Paid" },
  { date: "Feb 1, 2026", amount: "$29.00", status: "Paid" },
  { date: "Jan 1, 2026", amount: "$29.00", status: "Paid" },
];

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back to Dashboard" />
      <PageHeader title="Your Subscription Plan" description="Manage your plan, billing, and usage." />

      {/* Current plan */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Pro Plan</p>
              <h2 className="mt-1 text-3xl font-bold">$29<span className="text-lg font-normal text-muted-foreground">/month</span></h2>
              <p className="mt-1 text-sm text-muted-foreground">Renews on May 15, 2026</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Manage Billing</Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Cancel Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold">Usage This Month</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;ve generated <strong className="text-foreground">145</strong> out of <strong className="text-foreground">unlimited</strong> certificates this month
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[29%] rounded-full bg-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">43 days remaining in billing period</p>
        </CardContent>
      </Card>

      {/* Plans comparison */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Available Plans</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative transition-shadow hover:shadow-md ${
                plan.popular ? "border-primary shadow-md" : "border-border/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6">
                <h4 className="text-lg font-bold">{plan.name}</h4>
                <p className="mt-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="size-4 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={plan.current}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Visa ending in 4242</p>
              <p className="text-xs text-muted-foreground">Expires 12/2027</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Update</Button>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-2.5">{inv.date}</td>
                  <td className="px-4 py-2.5 font-medium">{inv.amount}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{inv.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button variant="ghost" size="sm"><Download className="size-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
