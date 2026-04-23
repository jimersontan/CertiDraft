"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const templates = [
  {
    name: "Corporate",
    description: "Professional certificates for business achievements and training completions.",
    color: "from-blue-600 to-blue-800",
    accent: "bg-blue-500",
    category: "Business",
  },
  {
    name: "Academic",
    description: "Elegant certificates for academic achievements, diplomas, and course completions.",
    color: "from-teal-600 to-teal-800",
    accent: "bg-teal-500",
    category: "Education",
  },
  {
    name: "Sports",
    description: "Dynamic certificates for athletic achievements, tournaments, and competitions.",
    color: "from-blue-500 to-teal-600",
    accent: "bg-blue-400",
    category: "Athletics",
  },
  {
    name: "Recognition",
    description: "Elegant certificates for employee recognition, volunteer awards, and special honors.",
    color: "from-teal-500 to-blue-700",
    accent: "bg-teal-400",
    category: "Awards",
  },
];

function CertificateCard({
  template,
  isActive,
}: {
  template: (typeof templates)[0];
  isActive: boolean;
}) {
  return (
    <div
      className={`group relative flex-shrink-0 w-[320px] sm:w-[360px] transition-all duration-500 ${
        isActive ? "scale-105 z-10" : "scale-95 opacity-70"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg transition-shadow duration-300 group-hover:shadow-xl">
        {/* Certificate preview area */}
        <div className={`relative h-56 bg-gradient-to-br ${template.color} p-6`}>
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
              }}
            />
          </div>

          {/* Certificate content */}
          <div className="relative flex h-full flex-col items-center justify-center text-center text-white">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-px w-8 bg-white/40" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              <div className="h-px w-8 bg-white/40" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/70">
              Certificate of {template.name === "Recognition" ? "Recognition" : "Achievement"}
            </p>
            <h4 className="mt-2 text-lg font-bold">John Anderson</h4>
            <p className="mt-1 text-xs text-white/70">
              has been awarded for outstanding performance
            </p>
            <div className="mt-4 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="h-px w-16 bg-white/30" />
                <p className="mt-1 text-[9px] text-white/50">Signature</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded border border-white/20">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Card footer */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${template.accent}`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {template.category}
                </span>
              </div>
              <h4 className="mt-1 text-base font-semibold text-foreground">
                {template.name} Template
              </h4>
            </div>
            <Button variant="outline" size="sm">
              Preview
            </Button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {template.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TemplatesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="templates" className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Templates
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Start with a{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              stunning template
            </span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Choose from our curated collection of professional templates and
            customize them to match your brand.
          </p>
        </div>

        {/* Templates carousel */}
        <div className="mt-16">
          {/* Cards */}
          <div className="flex items-center justify-center gap-6 overflow-x-auto px-4 pb-8 scrollbar-hide">
            {templates.map((template, index) => (
              <div
                key={template.name}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <CertificateCard
                  template={template}
                  isActive={activeIndex === index}
                />
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {templates.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`View template ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
