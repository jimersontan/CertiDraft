"use client";

import { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  Eye, 
  Pencil, 
  Trash2, 
  Copy,
  LayoutGrid,
  List
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/ui/back-button";

const mockTemplates = [
  { id: "1", name: "Corporate Excellence", category: "Corporate", status: "Published", uses: 12500, updated: "2 days ago" },
  { id: "2", name: "Academic Achievement", category: "Academic", status: "Published", uses: 8900, updated: "1 week ago" },
  { id: "3", name: "Training Completion", category: "Training", status: "Published", uses: 15200, updated: "3 days ago" },
  { id: "4", name: "Employee of the Month", category: "Recognition", status: "Published", uses: 4500, updated: "2 weeks ago" },
  { id: "5", name: "Sports Champion", category: "Sports", status: "Draft", uses: 0, updated: "Just now" },
  { id: "6", name: "Dean's List", category: "Academic", status: "Archived", uses: 2100, updated: "1 month ago" },
];

export default function AdminTemplatesPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");

  const filtered = mockTemplates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader 
        title="Template Management" 
        description="Create, edit, and manage global certificate templates."
      >
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Template
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              className="pl-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="training">Training</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center border rounded-lg p-1 bg-muted/30">
          <Button 
            variant={view === "grid" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button 
            variant={view === "list" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <Card key={template.id} className="group overflow-hidden border-border/50 hover:shadow-md transition-shadow">
              <div className="h-40 bg-muted/50 flex items-center justify-center relative border-b">
                <FileText className="size-12 text-muted-foreground/20" />
                <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  template.status === "Published" ? "bg-emerald-50 text-emerald-600" : 
                  template.status === "Draft" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-500"
                }`}>
                  {template.status}
                </span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <Button size="sm" variant="secondary" className="h-8">
                    <Pencil className="size-3.5 mr-1.5" />
                    Edit
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold">{template.name}</h3>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{template.category}</p>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{template.uses.toLocaleString()} uses</span>
                  <span>Updated {template.updated}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Template Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-4 font-medium">{t.name}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground uppercase font-bold">{t.category}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === "Published" ? "text-emerald-600" : t.status === "Draft" ? "text-blue-600" : "text-gray-500"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 tabular-nums">{t.uses.toLocaleString()}</td>
                    <td className="px-4 py-4 text-muted-foreground">{t.updated}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Copy className="size-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-red-500"><Trash2 className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
