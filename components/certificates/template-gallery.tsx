"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TemplateCategory,
  TemplateRecord,
  templateCategories,
} from "@/lib/templates";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

type TemplateGalleryProps = {
  templates: TemplateRecord[];
};

export function TemplateGallery({ templates }: TemplateGalleryProps) {
  const loadingTimeoutRef = useRef<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<TemplateCategory>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  function triggerLoadingState() {
    if (loadingTimeoutRef.current) {
      window.clearTimeout(loadingTimeoutRef.current);
    }

    setCurrentPage(1);
    setLoading(true);
    loadingTimeoutRef.current = window.setTimeout(() => setLoading(false), 250);
  }

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesCategory =
        selectedCategory === "All" || template.category === selectedCategory;
      const haystack = [
        template.name,
        template.category,
        template.industry,
        template.style,
        template.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 || haystack.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory, templates]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const favoriteCount = favorites.length;

  function toggleFavorite(templateId: string) {
    setFavorites((current) =>
      current.includes(templateId)
        ? current.filter((id) => id !== templateId)
        : [...current, templateId]
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border/60 bg-gradient-to-br from-blue-50 via-background to-teal-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm text-primary">
                <Sparkles className="size-4" />
                Curated certificate templates
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Browse templates and jump straight into your next certificate.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Explore ready-made layouts filtered by category, industry, and
                style. Pick a template and open it in the builder with one click.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:min-w-[360px]">
              <StatCard label="Templates" value={String(templates.length)} />
              <StatCard label="Favorites" value={String(favoriteCount)} />
              <StatCard label="Categories" value="4" />
            </div>
          </div>

          <div className="mt-10 grid gap-4 rounded-3xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  triggerLoadingState();
                }}
                placeholder="Search by name, industry, style, or category"
                className="h-11 rounded-2xl pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value as TemplateCategory);
                triggerLoadingState();
              }}
              className="h-11 rounded-2xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {templateCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Template gallery
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing {filteredTemplates.length} results across certificate
              styles.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Public template browsing with local favorites.
          </p>
        </div>

        {loading ? (
          <GallerySkeleton />
        ) : paginatedTemplates.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {paginatedTemplates.map((template) => {
                const isFavorite = favorites.includes(template.id);

                return (
                  <Card
                    key={template.id}
                    className="overflow-hidden border border-border/70 bg-card/90 pt-0 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <CardHeader className="px-0">
                      <div
                        className={cn(
                          "relative overflow-hidden rounded-none border-b border-border/50 bg-gradient-to-br p-5 text-white",
                          template.thumbnailClassName
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFavorite(template.id)}
                          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur transition hover:bg-black/35"
                          aria-label={
                            isFavorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <Heart
                            className={cn(
                              "size-4 transition",
                              isFavorite && "fill-current"
                            )}
                          />
                        </button>

                        <div className="absolute inset-0 opacity-15">
                          <div
                            className="h-full w-full"
                            style={{
                              backgroundImage:
                                "radial-gradient(circle at top right, white 0, transparent 30%), repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.12) 10px, rgba(255,255,255,0.12) 20px)",
                            }}
                          />
                        </div>

                        <div className="relative flex aspect-[4/3] flex-col justify-between rounded-2xl border border-white/20 bg-black/10 p-5 backdrop-blur-sm">
                          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75">
                            <span>CertiDraft</span>
                            <span>{template.style}</span>
                          </div>

                          <div className="space-y-2 text-center">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                              {template.featuredText}
                            </p>
                            <h3 className="text-2xl font-semibold">
                              {template.name}
                            </h3>
                            <p className="text-sm text-white/80">
                              {template.industry} certificate layout
                            </p>
                          </div>

                          <div className="flex items-end justify-between text-xs text-white/65">
                            <span>{template.category}</span>
                            <span>Preview</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 pt-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              template.accentClassName
                            )}
                          >
                            {template.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {template.industry}
                          </span>
                        </div>
                        <CardTitle className="mt-3">{template.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {template.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{template.style} style</span>
                      <span>{isFavorite ? "Saved" : "Ready to use"}</span>
                    </CardContent>

                    <CardFooter className="justify-between gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => toggleFavorite(template.id)}
                      >
                        {isFavorite ? "Favorited" : "Favorite"}
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href={`/builder?template=${template.id}`}>
                          Use Template
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
            <h3 className="text-lg font-semibold text-foreground">
              No templates match your filters
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different search term or switch back to all categories.
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`template-skeleton-${index}`}
          className="overflow-hidden rounded-xl border border-border/70 bg-card p-0"
        >
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="flex gap-3 border-t border-border/60 p-4">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
