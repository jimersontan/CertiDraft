import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-accent p-12 lg:flex">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14,2 14,8 20,8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            CertiDraft
          </span>
        </Link>

        {/* Testimonial / Feature highlight */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex gap-1 text-white/80">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                ))}
            </div>
            <blockquote className="text-lg font-medium leading-relaxed text-white">
              &ldquo;CertiDraft transformed how we issue certificates. What took
              days now takes minutes. The AI citations feature alone saves us
              hours of manual work.&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                SM
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Sarah Mitchell
                </p>
                <p className="text-xs text-white/60">
                  Head of L&D, Nexus Corp
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="flex gap-8">
          {[
            { value: "2,000+", label: "Active Users" },
            { value: "50K+", label: "Certificates" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
