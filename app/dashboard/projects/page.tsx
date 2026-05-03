"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Download,
  X,
  Loader2,
  Crown,
  Lock,
  Sparkles,
  Mail,
  Palette,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { api } from "@/lib/api-client";
import { useProjectStore, Project } from "@/lib/store";
import { toast } from "sonner";
import { fallbackTemplates, getTemplateElements } from "@/lib/templates";
import { useAuth } from "@/context/AuthContext";

const eventTypes = [
  "Birthday",
  "Graduation",
  "Training",
  "Award",
  "Sports",
  "Recognition",
  "Custom",
];

const statusColors: Record<string, string> = {
  draft: "border-gray-200 bg-gray-50 text-gray-600",
  active: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [initialTemplateId, setInitialTemplateId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isPro = user?.plan === "pro" || user?.plan === "enterprise";
  
  const { 
    projects, 
    setProjects, 
    isLoading, 
    setLoading, 
    removeProject 
  } = useProjectStore();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getProjects();
      const rawProjects = response.data.data || [];
      
      // Map API response to UI state
      const mappedProjects: Project[] = rawProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        eventType: p.event_type || "Custom",
        status: p.status || "draft",
        certificateCount: p.certificate_count || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at || p.created_at,
        templateId: p.template_id,
      }));
      
      setProjects(mappedProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const isNew = searchParams.get("new") === "true";
    if (isNew) {
      const tid = searchParams.get("template");
      queueMicrotask(() => {
        setShowModal(true);
        if (tid) setInitialTemplateId(tid);
      });
    }
  }, [searchParams]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    
    try {
      await api.deleteProject(id);
      removeProject(id);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete project");
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const proFeatures = [
    { icon: Infinity, label: "Unlimited Certificates", desc: "No monthly generation limits", active: isPro },
    { icon: Sparkles, label: "AI-Powered Citations", desc: "Smart text generation for certificates", active: isPro },
    { icon: Palette, label: "Custom Branding", desc: "Themes, colors & premium templates", active: isPro },
    { icon: Mail, label: "Priority Email Delivery", desc: "Fast certificate distribution", active: isPro },
  ];

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back to Dashboard" />

      <PageHeader title="My Projects" description="Manage and organize your certificate projects.">
        <Button className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="size-4" />
          New Project
        </Button>
      </PageHeader>

      {/* Pro Features Banner */}
      <div className={`relative overflow-hidden rounded-2xl border shadow-sm transition-all ${
        isPro 
          ? "border-blue-200/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80" 
          : "border-border/50 bg-muted/30"
      }`}>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isPro ? (
                <div className="flex items-center gap-2 rounded-full bg-blue-600 px-2.5 py-1 shadow-sm">
                  <Crown className="size-3 text-white" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Pro Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full bg-muted px-2.5 py-1">
                  <Lock className="size-3 text-muted-foreground" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Free Plan</span>
                </div>
              )}
            </div>
            {!isPro && (
              <Button size="sm" variant="default" className="h-7 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest gap-1.5" asChild>
                <Link href="/dashboard/subscription">
                  <Crown className="size-3" /> Upgrade
                </Link>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {proFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div 
                  key={f.label} 
                  className={`flex items-start gap-2.5 rounded-xl border p-3 transition-all ${
                    f.active 
                      ? "border-blue-200/50 bg-white/70 shadow-sm" 
                      : "border-border/30 bg-muted/20 opacity-60"
                  }`}
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    f.active ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                  }`}>
                    {f.active ? <Icon className="size-4" /> : <Lock className="size-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${f.active ? "text-foreground" : "text-muted-foreground"}`}>{f.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading projects...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card
              key={project.id}
              className="group relative border-border/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Status badge */}
              <div className="absolute right-3 top-3">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusColors[project.status] || statusColors.draft}`}
                >
                  {project.status}
                </span>
              </div>

              {/* Thumbnail placeholder */}
              <div className="flex h-32 items-center justify-center rounded-t-lg bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5">
                <FolderKanban className="size-10 text-primary/30" />
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">{project.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {project.eventType} · {project.certificateCount} certificates
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>

                {/* Hover actions */}
                <div className="mt-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" variant="default" className="flex-1" asChild>
                    <Link href={`/dashboard/projects/${project.id}/editor`}>
                      <Pencil className="size-3" />
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="size-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="size-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <FolderKanban className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No projects found</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {search || filter !== "all"
              ? "Try adjusting your search or filter."
              : "Create your first project to get started."}
          </p>
          {!search && filter === "all" && (
            <Button className="mt-5 gap-2" onClick={() => setShowModal(true)}>
              <Plus className="size-4" />
              Create First Project
            </Button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <CreateProjectModal 
          initialTemplateId={initialTemplateId}
          onClose={() => {
            setShowModal(false);
            setInitialTemplateId(null);
          }} 
          onSuccess={() => {
            setShowModal(false);
            setInitialTemplateId(null);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ 
  onClose, 
  onSuccess,
  initialTemplateId
}: { 
  onClose: () => void; 
  onSuccess: () => void;
  initialTemplateId?: string | null;
}) {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("graduation");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState(initialTemplateId || "00000000-0000-0000-0000-000000000001");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (initialTemplateId) {
      const t = fallbackTemplates.find(ft => ft.id === initialTemplateId);
      queueMicrotask(() => {
        setTemplate(initialTemplateId);
        if (t) setEventType(t.category.toLowerCase());
      });
    }
  }, [initialTemplateId]);

  const handleCreate = async () => {
    if (!name || !eventType) return;
    
    setIsCreating(true);
    try {
      await api.createProject({
        name,
        event_type: eventType,
        description,
        template_id: template,
        elements: getTemplateElements(template), 
      });
      toast.success("Project created successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Create project error:", error);
      const serverError = error.response?.data?.message || "Check console for details.";
      toast.error(`Failed to create project: ${serverError}`);
      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg animate-fade-in-up rounded-2xl bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Create New Certificate</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              placeholder="e.g., Q1 Training Certificates"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Event Type *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Notes about this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Template selection */}
          <div className="space-y-2">
            <Label>Template</Label>
            <div className="grid grid-cols-2 gap-2">
              {fallbackTemplates.slice(0, 4).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-lg border-2 p-3 text-left text-sm font-medium transition-all ${
                    template === t.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {t.name === "Executive Excellence" ? "Start from Blank" : t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>Cancel</Button>
          <Button disabled={!name || !eventType || isCreating} onClick={handleCreate}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}

