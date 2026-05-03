"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Layout,
  Filter,
  ChevronRight,
  ArrowRight,
  Zap,
  Loader2,
  FileText,
} from "lucide-react";
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

const categoryColors: Record<string, string> = {
  Corporate: "bg-blue-100 text-blue-700",
  Academic: "bg-purple-100 text-purple-700",
  Sports: "bg-emerald-100 text-emerald-700",
  Recognition: "bg-amber-100 text-amber-700",
};

const gradients: Record<string, string> = {
  Corporate: "from-blue-600 via-blue-500 to-indigo-600",
  Academic: "from-purple-600 via-purple-500 to-violet-600",
  Sports: "from-emerald-600 via-green-500 to-teal-600",
  Recognition: "from-amber-600 via-yellow-500 to-orange-600",
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
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
      <div className="sticky top-0 z-10 -mx-4 space-y-4 bg-background/80 px-4 py-4 backdrop-blur-md lg:mx-0 lg:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="h-11 rounded-full pl-10 border-border/50 bg-background shadow-sm focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:pb-0">
             <Filter className="size-4 text-muted-foreground mr-1 shrink-0" />
             {templateCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {category}
                </button>
             ))}
          </div>
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
          {filtered.map((template) => (
            <Card
              key={template.id}
              className="group overflow-hidden border-border/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              {/* Thumbnail Area */}
              <div className={`relative aspect-[1.4/1] overflow-hidden bg-gradient-to-br ${template.thumbnailClassName}`}>
                {/* Dynamic Background Pattern */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ 
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${template.primaryColor} 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}
                />

                {/* Mock Certificate Preview Overlay */}
                <div className="absolute inset-0 flex items-center justify-center p-5">
                   <div 
                    className="h-full w-full rounded-sm bg-white shadow-lg flex flex-col items-center p-3 border-2 transition-transform duration-500 group-hover:scale-[1.02]"
                    style={{ borderColor: template.primaryColor }}
                   >
                      {/* Frame */}
                      <div 
                        className="absolute inset-1 border opacity-20 rounded-[1px]" 
                        style={{ borderColor: template.secondaryColor }}
                      />

                      {/* Header */}
                      <div className="flex w-full justify-between items-start mb-3 px-1">
                        <div className="size-5 rounded-full opacity-20" style={{ backgroundColor: template.primaryColor }} />
                        <div className="h-1.5 w-16 rounded-full opacity-10" style={{ backgroundColor: template.primaryColor }} />
                      </div>

                      {/* Title */}
                      <div className="h-2.5 w-3/4 rounded-full mb-1.5" style={{ backgroundColor: template.primaryColor }} />
                      <div className="h-1.5 w-1/2 rounded-full mb-4 opacity-40" style={{ backgroundColor: template.primaryColor }} />

                      {/* Recipient Mock */}
                      <div className="h-4 w-2/3 rounded-sm mb-3 opacity-80" style={{ backgroundColor: '#f3f4f6' }} />

                      {/* Body text lines */}
                      <div className="space-y-1 w-full flex flex-col items-center">
                        <div className="h-1 w-1/2 rounded-full opacity-10" style={{ backgroundColor: template.primaryColor }} />
                        <div className="h-1 w-2/3 rounded-full opacity-10" style={{ backgroundColor: template.primaryColor }} />
                      </div>

                      {/* Signatures */}
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
                
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                
                <div className="absolute bottom-4 left-4">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${categoryColors[template.category] || 'bg-white/20 text-white'}`}>
                    {template.category}
                  </span>
                </div>
                
                {/* Quick Action Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" className="rounded-full shadow-lg bg-white text-primary hover:bg-white/90" asChild>
                    <Link href={`/dashboard/projects?new=true&template=${template.id}`}>
                      Use Template
                    </Link>
                  </Button>
                </div>
              </div>

              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layout className="size-3.5" />
                    <span>{template.style || 'Modern'}</span>
                  </div>
                  <Link 
                    href={`/dashboard/projects?new=true&template=${template.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:gap-2 transition-all"
                  >
                    SELECT
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
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

      {/* Featured CTA */}
      <div className="mt-12 overflow-hidden rounded-3xl bg-primary px-8 py-12 text-primary-foreground shadow-2xl shadow-primary/30">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold">Need a custom design?</h2>
            <p className="mt-3 text-primary-foreground/80">
              Our enterprise team can create bespoke templates tailored to your brand guidelines and specific certificate requirements.
            </p>
          </div>
          <Button size="lg" variant="secondary" className="group h-14 rounded-full px-8 text-sm font-bold" asChild>
            <Link href="/contact">
              Talk to an Expert
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          
          {/* Decorative background elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-primary-foreground/5 blur-3xl" />
        </div>
      </div>
    </div>
  );
}
