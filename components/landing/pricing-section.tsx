import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: "₱0",
    period: "/month",
    description: "Experience the platform before committing",
    features: [
      "5 certificates per month",
      "Standard templates only",
      "System watermark",
      "Standard QR verification",
      "Email support",
    ],
    cta: "Get Started",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Starter",
    price: "₱199",
    period: "/month",
    description: "Perfect for growing users",
    features: [
      "50 certificates per month",
      "Standard templates",
      "No system watermark",
      "Standard QR verification",
      "Email support",
    ],
    cta: "Go Starter",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "₱599",
    period: "/month",
    description: "For active organizations",
    features: [
      "300 certificates per month",
      "Everything in Starter",
      "AI-powered citations",
      "Email automation",
      "Priority email delivery",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Go Pro",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "₱1,499",
    period: "/month",
    description: "For large-scale operations",
    features: [
      "1,000 certificates per month",
      "Everything in Pro",
      "White-label branding",
      "API access for integrations",
      "Verification portal",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              transparent
            </span>{" "}
            pricing
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel
            anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                plan.popular
                  ? "border-primary/30 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                  : "border-border/50 hover:border-primary/20 hover:shadow-primary/5"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-md">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className={plan.popular ? "pt-8" : ""}>
                <CardDescription className="text-sm font-medium">
                  {plan.name}
                </CardDescription>
                <CardTitle className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className={`mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-primary" : "text-teal-500"
                        }`}
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant={plan.variant}
                  className={`w-full ${
                    plan.popular
                      ? "h-11 shadow-md shadow-primary/20 transition-shadow hover:shadow-lg hover:shadow-primary/30"
                      : "h-11"
                  }`}
                  asChild
                >
                  <Link href="/auth/signup">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
