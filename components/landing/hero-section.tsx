import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden pt-16"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-teal-50 animate-gradient" />
        {/* Decorative orbs */}
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Badge */}
            <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Now with AI-Powered Citations
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up delay-100 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Automate Certificate{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Generation
              </span>{" "}
              in Minutes
            </h1>

            {/* Subheading */}
            <p className="animate-fade-in-up delay-200 mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Design stunning certificates with drag-and-drop ease. Let AI handle citations, 
              and verify authenticity with instant QR codes.
            </p>

            {/* CTAs */}
            <div className="animate-fade-in-up delay-300 mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                asChild
              >
                <Link href="/auth/signup">
                  Start Free
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-1"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-semibold"
                asChild
              >
                <Link href="#demo">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
                  </svg>
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="animate-fade-in-up delay-400 mt-10 flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {[
                  "bg-blue-400",
                  "bg-teal-400",
                  "bg-blue-500",
                  "bg-teal-500",
                ].map((color, i) => (
                  <div
                    key={i}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${color} text-xs font-bold text-white ring-2 ring-background`}
                  >
                    {["JD", "AK", "MR", "SL"][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <svg
                        key={i}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                </div>
                <p className="text-muted-foreground">
                  Loved by <span className="font-semibold text-foreground">2,000+</span> users
                </p>
              </div>
            </div>
          </div>

          {/* Right side — Certificate mockup */}
          <div className="animate-fade-in-up delay-300 relative hidden lg:block">
            <div className="animate-float relative">
              {/* Glow behind card */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
              {/* Certificate Card */}
              <div className="relative rounded-2xl border border-border/50 bg-card p-8 shadow-2xl">
                {/* Certificate header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">certificate-preview.pdf</span>
                </div>

                {/* Certificate body */}
                <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-b from-primary/[0.02] to-transparent p-8 text-center">
                  {/* Ornamental top */}
                  <div className="mx-auto mb-4 flex items-center justify-center gap-2">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
                    </svg>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary/70">Certificate of Excellence</p>
                  <h3 className="mt-3 text-xl font-bold text-foreground">Jane Doe</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    has successfully completed the course
                  </p>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    Advanced AI & Machine Learning
                  </p>
                  <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                    <span>April 23, 2026</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="4" height="4" />
                        <rect x="18" y="18" width="3" height="3" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -right-4 -top-4 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
