"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Download,
  Eye,
  MoreHorizontal,
  Type,
  Image,
  Square,
  QrCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fonts = ["Inter", "Arial", "Georgia", "Times New Roman", "Courier New", "Roboto"];

export default function EditorPage() {
  const [projectName, setProjectName] = useState("Untitled Project");
  const [editingName, setEditingName] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>("text-1");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [useAI, setUseAI] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col bg-background lg:left-[240px]">
      {/* Top action bar */}
      <div className="flex h-14 items-center justify-between border-b border-border/50 bg-card px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          {editingName ? (
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              className="h-8 w-48 text-sm"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-medium hover:text-primary"
            >
              {projectName}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Undo2 className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Redo2 className="size-4" />
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <Button variant="outline" size="sm" className="gap-1.5">
            <Save className="size-3.5" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="size-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Tools Panel */}
        <div className="w-[200px] shrink-0 overflow-y-auto border-r border-border/50 bg-muted/30 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </p>
          <div className="space-y-1.5">
            {[
              { icon: Type, label: "Add Text" },
              { icon: Image, label: "Add Image" },
              { icon: Square, label: "Add Shape" },
              { icon: QrCode, label: "QR Code" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex w-full items-center gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shortcuts
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Ctrl+Z — Undo</p>
              <p>Ctrl+Y — Redo</p>
              <p>Del — Delete</p>
              <p>Esc — Deselect</p>
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/50 p-8">
          <div
            className="relative bg-white shadow-2xl"
            style={{ width: "595px", height: "421px", aspectRatio: "210/148" }}
            onClick={() => setSelectedElement(null)}
          >
            {/* Canvas border pattern */}
            <div className="absolute inset-4 border-2 border-dashed border-gray-200 rounded" />

            {/* Sample elements */}
            <div
              className={`absolute left-1/2 top-12 -translate-x-1/2 cursor-move select-none text-center ${
                selectedElement === "org" ? "outline-2 outline-dashed outline-blue-400 outline-offset-2" : ""
              }`}
              onClick={(e) => { e.stopPropagation(); setSelectedElement("org"); }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                Organization Name
              </p>
            </div>

            <div
              className={`absolute left-1/2 top-20 -translate-x-1/2 cursor-move select-none text-center ${
                selectedElement === "title" ? "outline-2 outline-dashed outline-blue-400 outline-offset-2" : ""
              }`}
              onClick={(e) => { e.stopPropagation(); setSelectedElement("title"); }}
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                Certificate of Achievement
              </p>
            </div>

            <div
              className={`absolute left-1/2 top-44 -translate-x-1/2 cursor-move select-none text-center ${
                selectedElement === "text-1" ? "outline-2 outline-dashed outline-blue-400 outline-offset-2" : ""
              }`}
              onClick={(e) => { e.stopPropagation(); setSelectedElement("text-1"); }}
            >
              <p className="text-2xl font-bold text-gray-900">
                {"{recipient_name}"}
              </p>
            </div>

            <div
              className={`absolute bottom-16 left-1/2 -translate-x-1/2 cursor-move select-none ${
                selectedElement === "qr" ? "outline-2 outline-dashed outline-blue-400 outline-offset-2" : ""
              }`}
              onClick={(e) => { e.stopPropagation(); setSelectedElement("qr"); }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                <QrCode className="size-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-[260px] shrink-0 overflow-y-auto border-l border-border/50 bg-muted/30 p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Properties
          </p>

          {selectedElement ? (
            <div className="space-y-4">
              {/* Font */}
              <div className="space-y-1.5">
                <Label className="text-xs">Font Family</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fonts.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font size */}
              <div className="space-y-1.5">
                <Label className="text-xs">Font Size</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={8}
                    max={72}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-8 text-center text-xs text-muted-foreground">{fontSize}</span>
                </div>
              </div>

              {/* Style buttons */}
              <div className="space-y-1.5">
                <Label className="text-xs">Style</Label>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Bold className="size-3.5" /></Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Italic className="size-3.5" /></Button>
                  <div className="w-px bg-border" />
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><AlignLeft className="size-3.5" /></Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><AlignCenter className="size-3.5" /></Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"><AlignRight className="size-3.5" /></Button>
                </div>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-1.5">
                  {["#000000", "#1F2937", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6"].map((c) => (
                    <button
                      key={c}
                      className="h-7 w-7 rounded-md border border-border/50 transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <Label className="text-xs">Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">X</span>
                    <Input className="h-7 text-xs" defaultValue="120" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Y</span>
                    <Input className="h-7 text-xs" defaultValue="176" />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="space-y-1.5">
                <Label className="text-xs">Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">W</span>
                    <Input className="h-7 text-xs" defaultValue="355" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">H</span>
                    <Input className="h-7 text-xs" defaultValue="40" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <Label className="text-xs">Customization</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={useAI} onChange={() => setUseAI(!useAI)} className="rounded" />
                    Use AI-Generated Citations
                  </label>
                  {useAI && (
                    <div className="rounded-lg bg-blue-50 p-2 text-xs text-blue-700 italic">
                      &quot;Awarded for outstanding dedication and exemplary performance...&quot;
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select an element on the canvas to edit its properties.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
