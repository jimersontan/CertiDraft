"use client";

import { useState } from "react";
import Link from "next/link";
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

const eventTypes = [
  "Birthday",
  "Graduation",
  "Training",
  "Award",
  "Sports",
  "Recognition",
  "Custom",
];

// Mock projects data
const mockProjects = [
  {
    id: "1",
    name: "Q1 Training Certificates",
    eventType: "Training",
    status: "completed",
    certificateCount: 45,
    updatedAt: "2026-04-25",
  },
  {
    id: "2",
    name: "Annual Awards 2026",
    eventType: "Award",
    status: "active",
    certificateCount: 120,
    updatedAt: "2026-04-20",
  },
  {
    id: "3",
    name: "Graduation Batch A",
    eventType: "Graduation",
    status: "draft",
    certificateCount: 0,
    updatedAt: "2026-04-18",
  },
  {
    id: "4",
    name: "Sports Day Champions",
    eventType: "Sports",
    status: "completed",
    certificateCount: 30,
    updatedAt: "2026-04-15",
  },
];

const statusColors: Record<string, string> = {
  draft: "border-gray-200 bg-gray-50 text-gray-600",
  active: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = mockProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back to Dashboard" />

      <PageHeader title="My Projects" description="Manage and organize your certificate projects.">
        <Button className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="size-4" />
          New Project
        </Button>
      </PageHeader>

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
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card
              key={project.id}
              className="group relative border-border/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Status badge */}
              <div className="absolute right-3 top-3">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusColors[project.status]}`}
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
                  Updated {project.updatedAt}
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
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
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
        <CreateProjectModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("blank");

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
              {["blank", "corporate", "academic", "sports"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`rounded-lg border-2 p-3 text-left text-sm font-medium capitalize transition-all ${
                    template === t
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {t === "blank" ? "Start from Blank" : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!name || !eventType}>Create</Button>
        </div>
      </div>
    </div>
  );
}
