"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Layout,
  ArrowRight,
  Zap,
  Loader2,
  Crown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  templateCategories,
  mapTemplateRow,
} from "@/lib/templates";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/ui/page-header";

const categoryBadge: Record<string, string> = {
  Corporate: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
  Academic: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
  Sports: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
  Recognition: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getTemplates();
      const rawTemplates = response.data.data || [];
      const mappedTemplates = rawTemplates.map((t: any) => mapTemplateRow(t));
      setTemplates(mappedTemplates);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchTemplates();
    });
  }, [fetchTemplates]);

  const filtered = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-10">
      <BackButton href="/dashboard" label="Back to Dashboard" />
      
      {/* Header section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Template Library
          </h1>
          <p className="mt-2 text-muted-foreground">
            Choose from our professionally designed certificate layouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden h-10 items-center gap-2 rounded-full border border-border/50 bg-background px-4 text-xs font-medium text-muted-foreground lg:flex">
             <Zap className="size-3.5 text-amber-500 fill-amber-500" />
             <span>80+ Premium Layouts</span>
           </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="sticky top-0 z-10 -mx-4 space-y-4 bg-background/90 px-4 py-4 backdrop-blur-md lg:mx-0 lg:px-0">
        {/* Row 1: Search + Sort */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search templates..."
              className="h-11 rounded-full border-border/50 bg-white pl-10 shadow-inner shadow-slate-100 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 dark:bg-input/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-11 w-[160px] rounded-full border-border/50 bg-white shadow-sm dark:bg-input/30">
              <SlidersHorizontal className="mr-2 size-3.5 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="name">A → Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Row 2: Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {templateCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                activeCategory === category
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading templates...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((template, i) => (
            <div
              key={template.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/80"
            >
              {/* Pro badge */}
              {template.isPremium && (
                <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 shadow-md">
                  <Crown className="size-2.5 text-white" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">Pro</span>
                </div>
              )}

              {/* Thumbnail */}
              <div className={`relative aspect-[1.4/1] overflow-hidden bg-gradient-to-br ${template.thumbnailClassName}`}>
                {/* Dot pattern */}
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${template.primaryColor} 1px, transparent 0)`, backgroundSize: '24px 24px' }} />

                {/* Inner glow frame */}
                <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 40px 10px rgba(0,0,0,0.18)` }} />

                {/* Certificate mock */}
                <div className="absolute inset-0 flex items-center justify-center p-5">
                  <div className="relative h-full w-full rounded-sm bg-white shadow-xl flex flex-col items-center p-3 border-2 transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ borderColor: template.primaryColor }}>
                    <div className="absolute inset-1 border opacity-20 rounded-[1px]" style={{ borderColor: template.secondaryColor }} />
                    <div className="flex w-full justify-between items-start mb-3 px-1">
                      <div className="size-5 rounded-full opacity-20" style={{ backgroundColor: template.primaryColor }} />
                      <div className="h-1.5 w-16 rounded-full opacity-10" style={{ backgroundColor: template.primaryColor }} />
                    </div>
                    <div className="h-2.5 w-3/4 rounded-full mb-1.5" style={{ backgroundColor: template.primaryColor }} />
                    <div className="h-1.5 w-1/2 rounded-full mb-4 opacity-40" style={{ backgroundColor: template.primaryColor }} />
                    <div className="h-4 w-2/3 rounded-sm mb-3 opacity-80" style={{ backgroundColor: '#f3f4f6' }} />
                    <div className="space-y-1 w-full flex flex-col items-center">
                      <div className="h-1 w-1/2 rounded-full opacity-10" style={{ backgroundColor: template.primaryColor }} />
                      <div className="h-1 w-2/3 rounded-full opacity-10" style={{ backgroundColor: template.primaryColor }} />
                    </div>
                    <div className="mt-auto flex w-full justify-between px-3 pb-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-0.5 w-10 opacity-20" style={{ backgroundColor: template.primaryColor }} />
                        <div className="h-1 w-8 opacity-10" style={{ backgroundColor: template.primaryColor }} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-0.5 w-10 opacity-20" style={{ backgroundColor: template.primaryColor }} />
                        <div className="h-1 w-8 opacity-10" style={{ backgroundColor: template.primaryColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover overlay + CTA */}
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <Link
                    href={`/dashboard/projects?new=true&template=${template.id}`}
                    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-900 shadow-xl transition-all hover:scale-105 hover:bg-white/95"
                  >
                    Use Template
                  </Link>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {template.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {template.description}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    categoryBadge[template.category] || 'bg-slate-100 text-slate-500'
                  }`}>
                    {template.category}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Layout className="size-3.5" />
                    <span>{template.style || 'Modern'}</span>
                  </div>
                  <Link
                    href={`/dashboard/projects?new=true&template=${template.id}`}
                    className="group/btn flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 transition-all duration-200 hover:bg-indigo-600 hover:text-white"
                  >
                    Select
                    <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-20 text-center">
          <div className="mb-6 rounded-2xl bg-muted p-6">
            <Search className="size-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold">No templates found</h3>
          <p className="mt-2 max-w-xs text-muted-foreground">
            We couldn&apos;t find any templates matching &quot;{search}&quot; in the {activeCategory} category.
          </p>
          <Button 
            variant="outline" 
            className="mt-8 rounded-full"
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Featured CTA — Mesh Gradient */}
      <div className="relative mt-12 overflow-hidden rounded-3xl px-8 py-14 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6d28d9 100%)' }}>
        {/* Mesh blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl" />
        {/* Subtle dot mesh */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-white/10">
              <Zap className="size-3 fill-amber-300 text-amber-300" />
              Enterprise & Custom Plans
            </div>
            <h2 className="text-3xl font-extrabold text-white">Need a custom design?</h2>
            <p className="mt-3 text-indigo-200/80">
              Our enterprise team creates bespoke templates tailored to your brand guidelines and specific certificate requirements.
            </p>
          </div>

          {/* Shimmer button */}
          <Link
            href="/contact"
            className="group relative inline-flex h-14 items-center gap-2 overflow-hidden rounded-full bg-white px-8 text-sm font-bold text-indigo-700 shadow-xl shadow-indigo-900/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-indigo-900/60"
          >
            {/* shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-indigo-100/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Talk to an Expert</span>
            <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
