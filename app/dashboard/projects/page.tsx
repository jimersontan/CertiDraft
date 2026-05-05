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
import { exportProjectToPDF } from "@/lib/export-utils";

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
    
    const tid = toast.loading("Deleting project...");
    try {
      await api.deleteProject(id);
      removeProject(id);
      toast.success("Project deleted successfully", { id: tid });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete project", { id: tid });
    }
  };

  const handleDuplicate = async (project: Project) => {
    const tid = toast.loading("Duplicating project...");
    try {
      // 1. Fetch full project to get elements
      const response = await api.getProject(project.id);
      const fullProject = response.data.data;
      
      // 2. Create new project with same elements
      await api.createProject({
        name: `${project.name} (Copy)`,
        event_type: project.eventType,
        description: project.description,
        template_id: project.templateId,
        elements: fullProject.elements || [],
      });
      
      toast.success("Project duplicated successfully", { id: tid });
      fetchProjects(); // Refresh list
    } catch (error) {
      console.error("Duplicate error:", error);
      toast.error("Failed to duplicate project", { id: tid });
    }
  };

  const handleDownload = async (project: Project) => {
    const tid = toast.loading("Preparing download...");
    try {
      // 1. Fetch full project to get elements
      const response = await api.getProject(project.id);
      const fullProject = response.data.data;
      
      // 2. Export to PDF
      await exportProjectToPDF(project.name, fullProject.elements || []);
      toast.dismiss(tid);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to prepare download", { id: tid });
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

      {/* Pro Features Banner — Glassmorphism */}
      <div className={`relative overflow-hidden rounded-2xl border shadow-md transition-all ${
        isPro
          ? "border-indigo-200/60 bg-gradient-to-r from-indigo-50 via-blue-50/60 to-violet-50"
          : "border-white/30 bg-gradient-to-br from-slate-900/80 via-indigo-950/90 to-slate-900/80 backdrop-blur-sm"
      }`}>
        {/* Decorative glow */}
        {!isPro && (
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        )}
        <div className="relative px-5 py-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              {isPro ? (
                <div className="flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 shadow-sm">
                  <Crown className="size-3 text-white" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">Pro Active</span>
                </div>
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                    <Crown className="size-4 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Unlock Premium Features</p>
                    <p className="text-[11px] text-slate-400">Upgrade your plan to access all tools</p>
                  </div>
                </>
              )}
            </div>
            {!isPro && (
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/40"
              >
                <Crown className="size-4" />
                Upgrade to Pro
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {proFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                    f.active
                      ? "border-indigo-200/60 bg-white/70 shadow-sm backdrop-blur-sm"
                      : "border-white/10 bg-white/5 backdrop-blur-sm"
                  }`}
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    f.active ? "bg-indigo-100 text-indigo-600" : "bg-white/10 text-slate-400"
                  }`}>
                    {f.active ? <Icon className="size-4" /> : <Lock className="size-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-bold ${
                      f.active ? "text-slate-800" : "text-slate-400"
                    }`}>{f.label}</p>
                    <p className={`truncate text-[10px] ${
                      f.active ? "text-muted-foreground" : "text-slate-600"
                    }`}>{f.desc}</p>
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
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search projects..."
            className="h-10 rounded-xl border-border/60 bg-white pl-9 shadow-inner shadow-slate-100 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/20 dark:bg-input/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-10 w-full rounded-xl border-border/60 bg-white shadow-inner shadow-slate-100 sm:w-[180px] dark:bg-input/30">
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

              {/* Visual Preview Area — renders actual template design at 0.25× scale */}
              {(() => {
                const tpl = fallbackTemplates.find(t => t.id === project.templateId) || fallbackTemplates[0];
                // Certificate is 595×421px in the editor; we scale to fit 100%×160px card
                // Scale factor ≈ 0.27 (160/595)
                const CERT_W = 595;
                const CERT_H = 421;
                const CARD_H = 160;
                const scale = CARD_H / CERT_H;
                const scaledW = CERT_W * scale;

                return (
                  <Link href={`/dashboard/projects/${project.id}/editor`} className="block">
                    <div
                      className="relative overflow-hidden bg-white"
                      style={{ height: CARD_H, width: "100%" }}
                    >
                      {/* Centred, scaled certificate */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "50%",
                          width: CERT_W,
                          height: CERT_H,
                          transform: `translateX(-50%) scale(${scale})`,
                          transformOrigin: "top center",
                          background: "#ffffff",
                          overflow: "hidden",
                          pointerEvents: "none",
                        }}
                      >
                        {/* Background */}
                        <div style={{ position: "absolute", inset: 0, background: "#ffffff" }} />

                        {/* Border frame */}
                        <div style={{
                          position: "absolute",
                          left: 20, top: 20,
                          width: 555, height: 381,
                          background: tpl.secondaryColor + "18",
                          border: `1.5px solid ${tpl.secondaryColor}30`,
                          borderRadius: 4,
                        }} />

                        {/* Org name */}
                        <div style={{
                          position: "absolute",
                          left: 150, top: 40,
                          width: 300, height: 30,
                          fontSize: 12,
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 500,
                          textAlign: "center",
                          color: "#9CA3AF",
                          letterSpacing: "0.15em",
                          lineHeight: "30px",
                        }}>
                          ORGANIZATION NAME
                        </div>

                        {/* Certificate title */}
                        <div style={{
                          position: "absolute",
                          left: 100, top: 80,
                          width: 400, height: 40,
                          fontSize: 22,
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 700,
                          textAlign: "center",
                          color: tpl.primaryColor,
                          lineHeight: "40px",
                          letterSpacing: "0.05em",
                        }}>
                          {tpl.featuredText.toUpperCase()}
                        </div>

                        {/* Divider */}
                        <div style={{
                          position: "absolute",
                          left: "50%",
                          top: 132,
                          width: 60,
                          height: 2,
                          background: tpl.secondaryColor,
                          transform: "translateX(-50%)",
                          borderRadius: 999,
                          opacity: 0.6,
                        }} />

                        {/* Recipient name placeholder */}
                        <div style={{
                          position: "absolute",
                          left: 100, top: 155,
                          width: 400, height: 50,
                          fontSize: 28,
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 800,
                          textAlign: "center",
                          color: "#111827",
                          lineHeight: "50px",
                          letterSpacing: "-0.02em",
                        }}>
                          {project.name}
                        </div>

                        {/* Description */}
                        <div style={{
                          position: "absolute",
                          left: 100, top: 220,
                          width: 400, height: 30,
                          fontSize: 13,
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 400,
                          textAlign: "center",
                          color: tpl.secondaryColor,
                          lineHeight: "30px",
                          fontStyle: "italic",
                        }}>
                          For outstanding performance and achievement.
                        </div>

                        {/* Bottom accent bar */}
                        <div style={{
                          position: "absolute",
                          bottom: 30,
                          left: 50,
                          right: 50,
                          height: 3,
                          background: `linear-gradient(to right, ${tpl.primaryColor}, ${tpl.secondaryColor})`,
                          borderRadius: 999,
                          opacity: 0.4,
                        }} />

                        {/* QR placeholder */}
                        <div style={{
                          position: "absolute",
                          right: 60, bottom: 50,
                          width: 44, height: 44,
                          border: "1.5px solid #d1d5db",
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,6px)", gap: 2 }}>
                            {Array.from({ length: 16 }).map((_, i) => (
                              <div key={i} style={{
                                width: 6, height: 6,
                                background: Math.random() > 0.4 ? "#374151" : "transparent",
                                borderRadius: 1,
                              }} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                    </div>
                  </Link>
                );
              })()}

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
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDuplicate(project)}
                    title="Duplicate Project"
                  >
                    <Copy className="size-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownload(project)}
                    title="Download PDF"
                  >
                    <Download className="size-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(project.id)}
                    title="Delete Project"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/80 bg-gradient-to-b from-slate-50/60 to-white px-6 py-20 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 ring-8 ring-blue-50/50">
            <FolderKanban className="size-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">
            {search || filter !== "all" ? "No matching projects" : "No projects yet"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            {search || filter !== "all"
              ? "Try adjusting your search or filter to find what you're looking for."
              : "Get started by creating your first certificate project. It only takes a minute."}
          </p>
          {!search && filter === "all" && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-500/40"
            >
              <Plus className="size-4" />
              Create First Project
            </button>
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

