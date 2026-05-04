"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Layout, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  Copy,
  Loader2,
  Filter,
  MoreVertical,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileText
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { fallbackTemplates } from "@/lib/templates";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail_url: string;
  is_featured: boolean;
  uses: number;
  created_at: string;
}

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const json = await res.json();
      if (json.status === "success") {
        setTemplates(json.data);
      }
    } catch (err) {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleToggleFeatured = async (template: Template) => {
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: template.id, is_featured: !template.is_featured })
      });
      if (res.ok) {
        toast.success(template.is_featured ? "Removed from featured" : "Set as featured");
        fetchTemplates();
      }
    } catch (err) {
      toast.error("Failed to update template");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch(`/api/admin/templates?id=${selectedTemplate.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Template deleted successfully");
        setIsDeleteOpen(false);
        fetchTemplates();
      }
    } catch (err) {
      toast.error("Failed to delete template");
    }
  };

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...Array.from(new Set(templates.map(t => t.category)))];

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Template Management" 
        description="Design and manage the system-wide certificate template library."
      >
        <Button className="rounded-full shadow-lg gap-2" asChild>
          <Link href="/dashboard/projects?new=true">
            <Plus className="size-4" />
            Create Template
          </Link>
        </Button>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2rem] bg-indigo-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Templates</p>
              <Layout className="size-5 opacity-50" />
            </div>
            <p className="text-4xl font-black">{templates.length}</p>
            <p className="text-xs mt-2 font-medium opacity-70">Active in Library</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2rem]">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Most Popular</p>
              <Star className="size-5 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-xl font-black truncate">{templates.sort((a, b) => b.uses - a.uses)[0]?.name || "N/A"}</p>
            <p className="text-xs mt-2 font-bold text-muted-foreground uppercase tracking-widest">
              {templates.sort((a, b) => b.uses - a.uses)[0]?.uses || 0} Total Uses
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2rem]">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Library Health</p>
              <CheckCircle2 className="size-5 text-emerald-500" />
            </div>
            <p className="text-4xl font-black">100%</p>
            <p className="text-xs mt-2 font-medium text-muted-foreground">All templates operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2rem] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search templates..." 
                className="pl-10 rounded-full bg-muted/20 border-none ring-1 ring-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Filter className="size-4 text-muted-foreground mr-2 shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeCategory === cat 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="size-10 animate-spin text-primary opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Indexing Library...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => {
            // Find the rich metadata for this template if it exists in fallbacks
            const richMetadata = fallbackTemplates.find(t => t.id === template.id || t.name === template.name);
            const thumbnailClass = richMetadata?.thumbnailClassName || "from-slate-700 via-slate-600 to-slate-500";
            
            return (
              <Card key={template.id} className="group border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden flex flex-col hover:scale-[1.02] transition-all duration-500 bg-card">
                {/* Visual Preview Area */}
                <div className={`aspect-[1.3/1] relative overflow-hidden bg-gradient-to-br ${thumbnailClass} p-6 text-white`}>
                  {/* Glass Card Preview */}
                  <div className="relative h-full w-full rounded-2xl border border-white/20 bg-black/10 backdrop-blur-md p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_center,_white_0,_transparent_70%)]" />
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">System Template</span>
                      <Badge variant="outline" className="border-white/20 text-white/80 text-[7px] px-1.5 h-4 font-black uppercase tracking-widest bg-white/5">
                        {template.category}
                      </Badge>
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
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2 z-20">
                    {template.is_featured && (
                      <Badge className="bg-amber-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 shadow-lg shadow-amber-500/20">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center gap-3 z-30">
                    <Button size="icon" variant="secondary" className="rounded-2xl shadow-xl hover:scale-110 transition-transform" asChild title="Preview Template">
                      <Link href={`/dashboard/projects?new=true&template=${template.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <Button size="icon" variant="secondary" className="rounded-2xl shadow-xl hover:scale-110 transition-transform" title="Edit Properties">
                      <Edit className="size-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="rounded-2xl shadow-xl hover:scale-110 transition-transform text-rose-600" onClick={() => { setSelectedTemplate(template); setIsDeleteOpen(true); }} title="Delete Template">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <CardHeader className="p-6 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-black tracking-tight group-hover:text-primary transition-colors truncate max-w-[180px]">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-[11px] font-medium text-muted-foreground line-clamp-1 italic">
                        {template.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-full -mr-2 hover:bg-muted/50">
                          <MoreVertical className="size-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl w-48 p-2">
                        <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-2">Manage Layout</DropdownMenuLabel>
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs" onClick={() => handleToggleFeatured(template)}>
                          <Star className={`size-3.5 ${template.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} /> 
                          {template.is_featured ? 'Remove Featured' : 'Pin to Featured'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs">
                          <Copy className="size-3.5" /> Clone Template
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 opacity-50" />
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={() => { setSelectedTemplate(template); setIsDeleteOpen(true); }}>
                          <Trash2 className="size-3.5" /> Remove from Library
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardFooter className="p-6 pt-4 mt-auto border-t border-border/40 bg-muted/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="size-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                      {template.uses} <span className="text-muted-foreground">Uses</span>
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-muted/50 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    {new Date(template.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-border/50 bg-muted/20 rounded-[2.5rem] py-20 text-center">
          <AlertCircle className="size-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-xl font-bold tracking-tight">No templates found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto text-sm mt-1">We couldn't find any templates matching "{searchTerm}".</p>
          <Button variant="outline" className="mt-8 rounded-full font-bold" onClick={() => { setSearchTerm(""); setActiveCategory("All"); }}>
            Clear Filters
          </Button>
        </Card>
      )}

      {/* Delete Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl text-center">
          <div className="size-16 rounded-[2rem] bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 mb-4">
            <Trash2 className="size-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter">Delete Template?</h2>
          <p className="text-muted-foreground text-sm mt-2">
            This will permanently remove <span className="font-bold text-foreground">"{selectedTemplate?.name}"</span> from the library. 
            Existing projects using this template will not be affected.
          </p>
          <DialogFooter className="gap-3 mt-8">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-full flex-1 font-bold">Keep Template</Button>
            <Button variant="destructive" onClick={handleDeleteTemplate} className="rounded-full flex-1 font-bold shadow-lg shadow-rose-200">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
