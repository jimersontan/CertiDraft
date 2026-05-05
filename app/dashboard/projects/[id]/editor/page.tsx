"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Download,
  Eye,
  Type,
  Image as ImageIcon,
  Square,
  QrCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Undo2,
  Redo2,
  PanelLeft,
  PanelRight,
  X,
  Trash2,
  Sparkles,
  Lock,
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
import { useCanvasStore, CanvasElement } from "@/lib/canvas-store";
import { useAuth } from "@/context/AuthContext";
import { getPlanDetails } from "@/lib/subscriptions";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { exportProjectToPDF } from "@/lib/export-utils";

const fonts = ["Inter", "Arial", "Georgia", "Times New Roman", "Courier New", "Roboto"];

export default function EditorPage() {
  const [projectName, setProjectName] = useState("Untitled Project");
  const [editingName, setEditingName] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const planInfo = getPlanDetails(user?.plan || "free");
  const isPro = planInfo.hasAICitation;


  // Canvas Store
  const { 
    elements, 
    selectedElementId, 
    addElement, 
    updateElement, 
    removeElement, 
    setSelectedElementId,
    undo,
    redo,
    saveToHistory,
    setElements
  } = useCanvasStore();

  const handleGenerateCitation = async () => {
    if (!selectedElementId) return;
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for the AI.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.generateCitation(aiPrompt, "Certificate text generation");
      const resData = response.data;
      if (resData.status === "success" && resData.data?.citation) {
        updateElement(selectedElementId, { content: resData.data.citation });
        saveToHistory();
        toast.success("Citation generated and applied!");
      } else {
        toast.error(resData.error?.message || "Failed to generate citation");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to generate citation");
    } finally {
      setIsGenerating(false);
    }
  };

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initial Fetch
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await api.getProject(id as string);
        if (response.data.status === "success") {
          const project = response.data.data;
          setProjectName(project.name || "Untitled Project");
          if (project.elements && Array.isArray(project.elements)) {
            setElements(project.elements);
          }
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast.error("Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, setElements]);

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const response = await api.updateProject(id as string, {
        name: projectName,
        elements: elements,
      });
      if (response.data.status === "success") {
        toast.success("Project saved successfully!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportProjectToPDF(projectName, elements);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Responsive panel states
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Pan and Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setLeftPanelOpen(true);
        setRightPanelOpen(true);
      } else {
        setLeftPanelOpen(false);
        setRightPanelOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcuts and Wheel Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "");
        if (selectedElementId && !isTyping) {
          removeElement(selectedElementId);
        }
      }

      // Arrow key nudging
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "");
        if (selectedElementId && !isTyping) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const updates: any = {};
          if (e.key === "ArrowUp") updates.y = (selectedElement?.y || 0) - step;
          if (e.key === "ArrowDown") updates.y = (selectedElement?.y || 0) + step;
          if (e.key === "ArrowLeft") updates.x = (selectedElement?.x || 0) - step;
          if (e.key === "ArrowRight") updates.x = (selectedElement?.x || 0) + step;
          updateElement(selectedElementId, updates);
        }
      }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((prev) => Math.min(Math.max(0.1, prev * delta), 5));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [selectedElementId, selectedElement?.x, selectedElement?.y, removeElement, undo, redo, updateElement]);

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    isPanning.current = true;
    panStart.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!isPanning.current) return;
      setPan({
        x: me.clientX - panStart.current.x,
        y: me.clientY - panStart.current.y,
      });
    };

    const handleMouseUp = () => {
      isPanning.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background lg:left-[240px]">
      {/* Top action bar */}
      <div className="flex h-14 items-center justify-between border-b border-border/50 bg-card px-4">
        <div className="flex items-center gap-2 lg:gap-3">
          <Button variant="ghost" size="sm" className="hidden lg:flex gap-1.5" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          >
            <PanelLeft className="size-5" />
          </Button>

          <div className="hidden h-6 w-px bg-border lg:block" />
          
          <div className="flex items-center gap-2">
            {editingName ? (
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                className="h-8 w-32 sm:w-48 text-sm"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="truncate max-w-[120px] sm:max-w-none text-sm font-medium hover:text-primary"
              >
                {projectName}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-2 mr-4 hidden md:flex">
             <span className="text-xs text-muted-foreground font-mono">{Math.round(zoom * 100)}%</span>
             <div className="flex items-center gap-1">
               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}>-</Button>
               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(prev => Math.min(5, prev + 0.1))}>+</Button>
             </div>
          </div>

          <div className="flex items-center gap-1 sm:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo}>
              <Undo2 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo}>
              <Redo2 className="size-4" />
            </Button>
          </div>
          
          <div className="hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={undo}>
              <Undo2 className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={redo}>
              <Redo2 className="size-4" />
            </Button>
          </div>

          <div className="hidden h-6 w-px bg-border sm:block" />
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 sm:px-3 gap-1.5"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className={`size-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline text-xs">{isSaving ? "Saving..." : "Save"}</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 sm:px-3 gap-1.5"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="size-3.5" />
            <span className="hidden sm:inline text-xs">Preview</span>
          </Button>
          
          <Button 
            size="sm" 
            className="h-8 px-2 sm:px-3 gap-1.5"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            <Download className={`size-3.5 ${isExporting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline text-xs">{isExporting ? "Exporting..." : "Export PDF"}</span>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            disabled={!selectedElementId}
          >
            <PanelRight className="size-5" />
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Tools Panel */}
        <aside 
          className={`absolute inset-y-0 left-0 z-20 w-[200px] transform border-r border-border/50 bg-card transition-transform duration-300 lg:relative lg:translate-x-0 ${
            leftPanelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col p-3">
            <div className="flex items-center justify-between mb-4 lg:mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tools
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 lg:hidden" 
                onClick={() => setLeftPanelOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            
            <div className="space-y-1.5">
              {[
                { type: "text", icon: Type, label: "Add Text" },
                { type: "image", icon: ImageIcon, label: "Add Image" },
                { type: "shape", icon: Square, label: "Add Shape" },
                { type: "qr", icon: QrCode, label: "QR Code" },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => addElement(type as any)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-auto pt-6 lg:mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Shortcuts
              </p>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <p>Ctrl+Z — Undo</p>
                <p>Ctrl+Y — Redo</p>
                <p>Del — Delete</p>
                <p>Esc — Deselect</p>
                <p>Ctrl + Wheel — Zoom</p>
                <p>Drag BG — Pan</p>
              </div>
            </div>
          </div>
        </aside>

        {leftPanelOpen && (
          <div 
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setLeftPanelOpen(false)}
          />
        )}

        {/* Center Canvas Area */}
        <main 
          className="flex flex-1 items-center justify-center overflow-hidden bg-muted/50 relative cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedElementId(null);
              handleBackgroundMouseDown(e);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith("image/")) {
              const reader = new FileReader();
              reader.onload = (re) => {
                addElement("image");
                // Note: ideally we'd set the src here, but we need to wait for store update
              };
              reader.readAsDataURL(file);
            }
          }}
        >
          <div
            ref={canvasRef}
            className={`relative bg-white shadow-2xl transition-transform duration-75 ${isExporting ? "ring-0 shadow-none" : ""}`}
            style={{ 
              width: "595px", 
              height: "421px", 
              transform: isExporting ? "none" : `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            {/* Canvas border pattern */}
            {!isExporting && <div className="absolute inset-4 border-2 border-dashed border-gray-200 rounded pointer-events-none" />}

            {/* Dynamic Elements */}
            {elements.map((element, index) => (
              <DraggableElement 
                key={element.id} 
                element={element}
                index={index}
                isSelected={!isExporting && selectedElementId === element.id}
                onSelect={() => setSelectedElementId(element.id)}
                onUpdate={(updates) => updateElement(element.id, updates)}
                onEndDrag={() => saveToHistory()}
              />
            ))}
          </div>
        </main>

        {/* Right Properties Panel */}
        <aside 
          className={`absolute inset-y-0 right-0 z-20 w-[260px] transform border-l border-border/50 bg-card transition-transform duration-300 lg:relative lg:translate-x-0 ${
            rightPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="flex items-center justify-between mb-5 lg:mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Properties
              </p>
              <div className="flex items-center gap-1">
                {selectedElementId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                    onClick={() => removeElement(selectedElementId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 lg:hidden" 
                  onClick={() => setRightPanelOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {selectedElement ? (
                <div className="space-y-5">
                  {/* Image Source for Image elements */}
                  {selectedElement.type === "image" && (
                    <div className="space-y-3">
                      <Label className="text-xs">Image Source</Label>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full gap-2 text-xs"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (re) => {
                                  updateElement(selectedElement.id, { 
                                    src: re.target?.result as string,
                                  });
                                  saveToHistory();
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          <ImageIcon className="size-3.5" />
                          Upload Image
                        </Button>
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-[10px] text-muted-foreground uppercase">or URL</span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <Input 
                          placeholder="https://..." 
                          value={selectedElement.src || ""} 
                          onChange={(e) => updateElement(selectedElement.id, { src: e.target.value })}
                          onBlur={() => saveToHistory()}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Element Content for Text */}
                  {selectedElement.type === "text" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Content</Label>
                      <Input 
                        value={selectedElement.content} 
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  )}

                  {/* Font properties for Text */}
                  {selectedElement.type === "text" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Font Family</Label>
                        <Select 
                          value={selectedElement.fontFamily} 
                          onValueChange={(v) => updateElement(selectedElement.id, { fontFamily: v })}
                        >
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

                      <div className="space-y-1.5">
                        <Label className="text-xs">Font Size</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={8}
                            max={72}
                            value={selectedElement.fontSize}
                            onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                            onMouseUp={() => saveToHistory()}
                            className="flex-1 accent-primary"
                          />
                          <span className="w-8 text-center text-xs text-muted-foreground">{selectedElement.fontSize}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Alignment</Label>
                        <div className="flex gap-1">
                          <Button 
                            variant={selectedElement.textAlign === "left" ? "secondary" : "outline"} 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => updateElement(selectedElement.id, { textAlign: "left" })}
                          >
                            <AlignLeft className="size-3.5" />
                          </Button>
                          <Button 
                            variant={selectedElement.textAlign === "center" ? "secondary" : "outline"} 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => updateElement(selectedElement.id, { textAlign: "center" })}
                          >
                            <AlignCenter className="size-3.5" />
                          </Button>
                          <Button 
                            variant={selectedElement.textAlign === "right" ? "secondary" : "outline"} 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => updateElement(selectedElement.id, { textAlign: "right" })}
                          >
                            <AlignRight className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Color */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Color</Label>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {[
                        "#000000", "#1F2937", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6",
                        "#561C24", "#6D2932", "#C7B7A3", "#E8D8C4", "#F59E0B", "#6366F1",
                        "#EC4899", "#14B8A6", "#F3F4F6", "#FFFFFF"
                      ].map((c) => (
                        <button
                          key={c}
                          onClick={() => updateElement(selectedElement.id, { fill: c })}
                          className={`h-7 w-7 rounded-md border border-border/50 transition-all ${
                            selectedElement.fill === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    
                    {/* Hex Code Input */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">#</span>
                        <Input 
                          placeholder="HEX CODE" 
                          className="h-8 pl-5 pr-2 text-[10px] font-mono uppercase"
                          value={selectedElement.fill?.replace('#', '') || ""}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            if (/^[0-9A-F]{0,6}$/.test(val)) {
                              updateElement(selectedElement.id, { fill: `#${val}` });
                            }
                          }}
                          onBlur={() => saveToHistory()}
                        />
                      </div>
                      <div 
                        className="size-8 rounded-md border border-border/50 shadow-inner"
                        style={{ backgroundColor: selectedElement.fill || "#000000" }}
                      />
                    </div>
                  </div>

                  {/* Locking Toggle */}
                  <div className="pt-2 border-t border-border/50">
                    <label className="flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <Lock className={`size-3.5 ${selectedElement.locked ? "text-amber-500" : "text-muted-foreground"}`} />
                        <span className="font-medium">Lock Element</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedElement.locked || false} 
                        onChange={(e) => {
                          updateElement(selectedElement.id, { locked: e.target.checked });
                          saveToHistory();
                        }} 
                        className="rounded border-border/50 text-primary h-4 w-4" 
                      />
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-7">
                      Locked elements cannot be moved or resized.
                    </p>
                  </div>

                  {/* Position */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Position</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">X</span>
                        <Input 
                          type="number"
                          className="h-8 text-xs" 
                          value={Math.round(selectedElement.x)} 
                          onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Y</span>
                        <Input 
                          type="number"
                          className="h-8 text-xs" 
                          value={Math.round(selectedElement.y)} 
                          onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dimensions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Width</span>
                        <Input 
                          type="number"
                          className="h-8 text-xs" 
                          value={Math.round(selectedElement.width)} 
                          onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Height</span>
                        <Input 
                          type="number"
                          className="h-8 text-xs" 
                          value={Math.round(selectedElement.height)} 
                          onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Layer Controls */}
                  <div className="space-y-1.5 pt-4 border-t border-border/50">
                    <Label className="text-xs">Arrange</Label>
                    <div className="grid grid-cols-2 gap-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-8 text-[10px] font-bold uppercase tracking-wider"
                         onClick={() => {
                            const newElements = [...elements];
                            const idx = newElements.findIndex(el => el.id === selectedElement.id);
                            if (idx > 0) {
                              const el = newElements.splice(idx, 1)[0];
                              newElements.unshift(el);
                              setElements(newElements);
                              saveToHistory();
                            }
                         }}
                       >
                         To Back
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-8 text-[10px] font-bold uppercase tracking-wider"
                         onClick={() => {
                            const newElements = [...elements];
                            const idx = newElements.findIndex(el => el.id === selectedElement.id);
                            if (idx < newElements.length - 1) {
                              const el = newElements.splice(idx, 1)[0];
                              newElements.push(el);
                              setElements(newElements);
                              saveToHistory();
                            }
                         }}
                       >
                         To Front
                       </Button>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-5 mt-2">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-primary" /> AI Assistant
                      </Label>
                      {!isPro && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[8px] font-black text-white uppercase tracking-widest shadow-sm">
                          <Lock className="size-2" /> Pro
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={useAI} 
                          onChange={() => setUseAI(!useAI)} 
                          className="rounded border-border/50 text-primary h-4 w-4" 
                        />
                        Enable AI Citations
                      </label>
                      {useAI && (
                        !isPro ? (
                          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center">
                            <Lock className="size-4 text-blue-600 mx-auto mb-2" />
                            <p className="text-[10px] text-blue-800 font-medium mb-3">Upgrade to Pro to generate AI citations.</p>
                            <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest rounded-lg" asChild>
                              <Link href="/dashboard/subscription">View Plans</Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="e.g. Write a professional citation for outstanding dedication..."
                              className="w-full min-h-[80px] rounded-lg border border-border/50 bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <Button 
                              size="sm" 
                              onClick={handleGenerateCitation} 
                              disabled={isGenerating || !aiPrompt.trim()}
                              className="w-full h-8 text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                              {isGenerating ? (
                                <>
                                  <div className="size-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="size-3" />
                                  Generate & Apply
                                </>
                              )}
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 rounded-full bg-muted p-3">
                    <Type className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No Element Selected</p>
                  <p className="text-xs text-muted-foreground mt-1 px-4">
                    Select an element on the canvas to edit its properties.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {rightPanelOpen && (
          <div 
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setRightPanelOpen(false)}
          />
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-full max-w-[95vw] lg:max-w-[800px] aspect-square p-0 overflow-hidden bg-white border-none shadow-[0_32px_128px_rgba(0,0,0,0.3)] rounded-[40px] sm:max-w-none flex flex-col items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center w-full h-full p-6 lg:p-12">
            <div className="relative mb-8 text-center">
               <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                 <Eye className="size-3" />
                 Live Preview
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Certificate</h2>
            </div>

            <div className="relative group w-full flex justify-center">
              {/* Decorative background glow */}
              <div className="absolute -inset-10 bg-primary/5 blur-[100px] rounded-full opacity-50" />
              
              <div className="relative overflow-hidden rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.1)] border border-slate-100 bg-white flex items-center justify-center">
                <div 
                  className="relative origin-center scale-[0.5] sm:scale-[0.7] md:scale-[0.9] lg:scale-100"
                  style={{ 
                    width: "595px", 
                    height: "421px",
                    aspectRatio: "595/421"
                  }}
                >
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      style={{
                        position: "absolute",
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        opacity: element.opacity ?? 1,
                        transform: `rotate(${element.rotation ?? 0}deg)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start",
                      }}
                    >
                      {element.type === "text" && (
                        <p style={{
                          fontSize: `${element.fontSize}px`,
                          fontFamily: element.fontFamily,
                          fontWeight: element.fontWeight,
                          fontStyle: element.fontStyle,
                          color: element.fill,
                          textAlign: element.textAlign,
                          width: "100%",
                          margin: 0,
                          lineHeight: "1.2",
                        }}>
                          {element.content}
                        </p>
                      )}
                      {element.type === "qr" && (
                        <div className="flex h-full w-full items-center justify-center rounded bg-gray-100/50">
                          <QrCode className="size-2/3 text-gray-400" />
                        </div>
                      )}
                      {element.type === "image" && element.src && (
                        <img 
                          src={element.src} 
                          alt="" 
                          className="h-full w-full object-contain"
                        />
                      )}
                      {element.type === "shape" && (
                        <div className="h-full w-full" style={{ backgroundColor: element.fill }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-3">
               <Button 
                variant="ghost" 
                className="text-slate-500 font-bold hover:bg-slate-100 rounded-xl px-6"
                onClick={() => setIsPreviewOpen(false)}
               >
                 Keep Editing
               </Button>
               <Button 
                className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 rounded-xl px-8 h-12 font-bold"
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleExportPDF();
                }}
               >
                 <Download className="mr-2 size-4" />
                 Download PDF
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DraggableElementProps {
  element: CanvasElement;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onEndDrag: () => void;
}

function DraggableElement({ element, index, isSelected, onSelect, onUpdate, onEndDrag }: DraggableElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isDragging = useRef(false);
  const isResizing = useRef<string | null>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    if (element.locked) {
      // If already selected, allow clicking through to deselect or select others
      if (isSelected) {
        onSelect(); // This will effectively "ping" it but we want to allow bubbling
      } else {
        onSelect();
        e.stopPropagation();
      }
      return;
    }
    e.stopPropagation();
    onSelect();
    isDragging.current = true;
    startPos.current = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      onUpdate({
        x: startPos.current.x + (e.clientX - startPos.current.mouseX),
        y: startPos.current.y + (e.clientY - startPos.current.mouseY),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      onEndDrag();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [element.locked, element.x, element.y, isSelected, onSelect, onUpdate, onEndDrag, isEditing]);

  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    if (element.locked) return;
    e.stopPropagation();
    isResizing.current = handle;
    startPos.current = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const dx = e.clientX - startPos.current.mouseX;
      const dy = e.clientY - startPos.current.mouseY;
      const h = isResizing.current;

      let newX = startPos.current.x;
      let newY = startPos.current.y;
      let newW = startPos.current.width;
      let newH = startPos.current.height;

      if (h.includes("right")) newW = Math.max(10, startPos.current.width + dx);
      if (h.includes("bottom")) newH = Math.max(10, startPos.current.height + dy);
      if (h.includes("left")) {
        const w = Math.max(10, startPos.current.width - dx);
        newX = startPos.current.x + (startPos.current.width - w);
        newW = w;
      }
      if (h.includes("top")) {
        const height = Math.max(10, startPos.current.height - dy);
        newY = startPos.current.y + (startPos.current.height - height);
        newH = height;
      }

      onUpdate({ x: newX, y: newY, width: newW, height: newH });
    };

    const handleMouseUp = () => {
      isResizing.current = null;
      onEndDrag();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [element, onUpdate, onEndDrag]);

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    opacity: element.opacity ?? 1,
    transform: `rotate(${element.rotation ?? 0}deg)`,
    cursor: element.locked ? "default" : isEditing ? "text" : "move",
    userSelect: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start",
  };

  return (
    <div 
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        if (element.type === "text" && !element.locked) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      style={{
        ...style,
        // Large backgrounds should never jump to the front
        zIndex: (element.width > 400 && element.height > 300) ? 0 : (isSelected ? 10 : index + 1)
      }}
      className={`group ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : "hover:ring-1 hover:ring-blue-300 ring-offset-1"} ${element.locked ? "pointer-events-none" : "pointer-events-auto"}`}
    >
      {/* Click Shield for Locked Elements (allows selection but passes through other events if not selected?) */}
      {element.locked && (
        <div 
          className="absolute inset-0 z-0 pointer-events-auto cursor-default" 
          onMouseDown={(e) => {
            // Only intercept if we aren't clicking something else?
            // Actually, if we are here, we ALREADY missed the other elements because they are on top.
            e.stopPropagation();
            onSelect();
          }}
        />
      )}
      {/* Lock Icon Overlay for Locked Elements */}
      {element.locked && isSelected && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white p-1 rounded-t-md shadow-sm">
          <Lock className="size-3" />
        </div>
      )}
      {element.type === "text" && (
        isEditing ? (
          <textarea
            ref={inputRef}
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onBlur={() => {
              setIsEditing(false);
              onEndDrag();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setIsEditing(false);
                onEndDrag();
              }
            }}
            className="w-full bg-transparent resize-none overflow-hidden border-none focus:ring-0 p-0 text-center outline-none"
            style={{
              fontSize: `${element.fontSize}px`,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              color: element.fill,
              textAlign: element.textAlign,
            }}
          />
        ) : (
          <p style={{
            fontSize: `${element.fontSize}px`,
            fontFamily: element.fontFamily,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            color: element.fill,
            textAlign: element.textAlign,
            width: "100%",
            margin: 0,
            lineHeight: "1.2",
          }}>
            {element.content}
          </p>
        )
      )}

      {element.type === "qr" && (
        <div className="flex h-full w-full items-center justify-center rounded bg-gray-100/50">
          <QrCode className="size-2/3 text-gray-400" />
        </div>
      )}

      {element.type === "image" && (
        <div 
          className="relative h-full w-full overflow-hidden rounded border-2 border-dashed border-blue-200 bg-blue-50/30 text-blue-400 transition-colors hover:border-blue-400 hover:bg-blue-50/50"
          onClick={() => {
            if (!element.src) {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (re) => {
                    onUpdate({ src: re.target?.result as string });
                    onEndDrag();
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }
          }}
        >
          {element.src ? (
            <img 
              src={element.src} 
              alt="" 
              className="h-full w-full object-contain pointer-events-none"
              onError={() => onUpdate({ src: "" })}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <ImageIcon className="size-1/3" />
              <span className="text-[10px] font-medium">Click to upload</span>
            </div>
          )}
        </div>
      )}

      {element.type === "shape" && (
        <div className="h-full w-full" style={{ backgroundColor: element.fill }} />
      )}

      {isSelected && !isEditing && (
        <>
          {/* Resizing handles */}
          <div 
            className="absolute -left-1.5 -top-1.5 h-3 w-3 cursor-nwse-resize rounded-full border-2 border-blue-500 bg-white" 
            onMouseDown={(e) => handleResizeStart(e, "topleft")}
          />
          <div 
            className="absolute -right-1.5 -top-1.5 h-3 w-3 cursor-nesw-resize rounded-full border-2 border-blue-500 bg-white" 
            onMouseDown={(e) => handleResizeStart(e, "topright")}
          />
          <div 
            className="absolute -left-1.5 -bottom-1.5 h-3 w-3 cursor-nesw-resize rounded-full border-2 border-blue-500 bg-white" 
            onMouseDown={(e) => handleResizeStart(e, "bottomleft")}
          />
          <div 
            className="absolute -right-1.5 -bottom-1.5 h-3 w-3 cursor-nwse-resize rounded-full border-2 border-blue-500 bg-white" 
            onMouseDown={(e) => handleResizeStart(e, "bottomright")}
          />
        </>
      )}
    </div>
  );
}
