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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => (
            <Card key={template.id} className="group border-none shadow-xl ring-1 ring-border/50 rounded-[2rem] overflow-hidden flex flex-col hover:scale-[1.02] transition-all duration-300">
              <div className="aspect-[1.4/1] bg-muted/30 relative overflow-hidden">
                {template.thumbnail_url ? (
                  <img src={template.thumbnail_url} alt={template.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Layout className="size-10 opacity-10" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  {template.is_featured && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                      <Star className="size-2 mr-1 fill-amber-700" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-white/80 backdrop-blur-md font-black text-[8px] uppercase tracking-widest px-2 py-0.5 border-none shadow-sm">
                    {template.category}
                  </Badge>
                </div>
                
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" className="rounded-full shadow-lg" asChild>
                    <Link href={`/dashboard/projects?new=true&template=${template.id}`}>
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                    <Edit className="size-4" />
                  </Button>
                </div>
              </div>
              <CardHeader className="p-5 pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-black tracking-tight group-hover:text-primary transition-colors">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-1 line-clamp-1">{template.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full -mr-2">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl w-48 p-2">
                      <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs" onClick={() => handleToggleFeatured(template)}>
                        <Star className={`size-3.5 ${template.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} /> 
                        {template.is_featured ? 'Unfeature' : 'Feature Template'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs">
                        <Copy className="size-3.5" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 opacity-50" />
                      <DropdownMenuItem className="rounded-xl gap-2 font-bold text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50" onClick={() => { setSelectedTemplate(template); setIsDeleteOpen(true); }}>
                        <Trash2 className="size-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardFooter className="p-5 pt-4 mt-auto border-t border-border/40 bg-muted/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <FileText className="size-3" />
                  {template.uses} Uses
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">
                  {new Date(template.created_at).toLocaleDateString()}
                </div>
              </CardFooter>
            </Card>
          ))}
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
