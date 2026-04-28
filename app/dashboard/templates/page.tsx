"use client";

import { useState } from "react";
import { Search, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/ui/back-button";
import { PageHeader } from "@/components/ui/page-header";

const mockTemplates = [
  { id: "1", name: "Corporate Excellence", category: "Corporate", uses: 2450, featured: true },
  { id: "2", name: "Academic Achievement", category: "Academic", uses: 1870, featured: true },
  { id: "3", name: "Sports Champion", category: "Sports", uses: 980, featured: false },
  { id: "4", name: "Employee Recognition", category: "Recognition", uses: 1340, featured: true },
  { id: "5", name: "Training Completion", category: "Corporate", uses: 2100, featured: false },
  { id: "6", name: "Dean's List", category: "Academic", uses: 750, featured: false },
  { id: "7", name: "Tournament Winner", category: "Sports", uses: 560, featured: false },
  { id: "8", name: "Volunteer Award", category: "Recognition", uses: 890, featured: false },
];

const categoryColors: Record<string, string> = {
  Corporate: "bg-blue-100 text-blue-700",
  Academic: "bg-purple-100 text-purple-700",
  Sports: "bg-emerald-100 text-emerald-700",
  Recognition: "bg-amber-100 text-amber-700",
};

const gradients: Record<string, string> = {
  Corporate: "from-blue-50 via-blue-100/50 to-indigo-50",
  Academic: "from-purple-50 via-purple-100/50 to-violet-50",
  Sports: "from-emerald-50 via-green-100/50 to-teal-50",
  Recognition: "from-amber-50 via-yellow-100/50 to-orange-50",
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = mockTemplates.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || t.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back to Dashboard" />

      <PageHeader
        title="Certificate Templates"
        description="Choose from professionally designed templates to get started quickly."
      />

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Corporate">Corporate</SelectItem>
            <SelectItem value="Academic">Academic</SelectItem>
            <SelectItem value="Sports">Sports</SelectItem>
            <SelectItem value="Recognition">Recognition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => (
            <Card
              key={template.id}
              className="group overflow-hidden border-border/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Thumbnail */}
              <div className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${gradients[template.category] || "from-gray-50 to-gray-100"}`}>
                <FileText className="size-12 text-primary/20" />
                {/* Category badge */}
                <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryColors[template.category]}`}>
                  {template.category}
                </span>
                {template.featured && (
                  <span className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    <Sparkles className="size-3" />
                    Featured
                  </span>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5">
                  <Button
                    size="sm"
                    className="scale-90 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100"
                  >
                    Use Template
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">{template.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Used {template.uses.toLocaleString()} times
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No templates found</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Try adjusting your search or category filter.
          </p>
        </div>
      )}
    </div>
  );
}
