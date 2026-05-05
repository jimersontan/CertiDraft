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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => {
            const thumbnailClass = template.thumbnailClassName || "from-slate-700 via-slate-600 to-slate-500";
            
            return (
              <Card key={template.id} className="group border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden flex flex-col hover:scale-[1.02] transition-all duration-500 bg-card">
              {/* Visual Preview Area */}
              <div 
                className="aspect-[1.3/1] relative overflow-hidden p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${template.primaryColor} 0%, ${template.secondaryColor} 100%)`
                }}
              >
                  {/* Glass Card Preview */}
                  <div className="relative h-full w-full rounded-2xl border border-white/20 bg-black/10 backdrop-blur-md p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_center,_white_0,_transparent_70%)]" />
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">System Template</span>
                      <div className="px-1.5 py-0.5 rounded-lg border border-white/20 text-white/80 text-[7px] font-black uppercase tracking-widest bg-white/5">
                        {template.category}
                      </div>
                    </div>

                    <div className="relative z-10 text-center py-2">
                      <h4 className="text-lg font-black tracking-tight leading-none mb-1 drop-shadow-md">{template.name}</h4>
                      <p className="text-[8px] font-medium text-white/70 uppercase tracking-widest">Premium Layout</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2].map(i => (
                          <div key={i} className="size-5 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <Layout className="size-2 text-white/50" />
                          </div>
                        ))}
                      </div>
                      <div className="size-6 rounded-lg bg-white/20 flex items-center justify-center ring-1 ring-white/30">
                        <Zap className="size-3 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2 z-20">
                    {template.isPremium && (
                      <div className="bg-amber-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/20">
                        Pro
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px] flex items-center justify-center z-30">
                    <Button 
                      className="rounded-full px-8 py-6 bg-white text-slate-900 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all" 
                      asChild
                    >
                      <Link href={`/dashboard/projects?new=true&template=${template.id}`}>
                        Use Template
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-base font-black tracking-tight group-hover:text-primary transition-colors truncate">
                      {template.name}
                    </h3>
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${categoryBadge[template.category] || 'bg-slate-100 text-slate-500'}`}>
                      {template.category}
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground line-clamp-2 italic mb-6">
                    {template.description}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Layout className="size-3.5" />
                      <span>{template.style || 'Modern'}</span>
                    </div>
                    <Link
                      href={`/dashboard/projects?new=true&template=${template.id}`}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Select
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
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
