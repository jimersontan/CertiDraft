"use client";

import type { Canvas, FabricObject } from "fabric";

import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Circle,
  Download,
  FileDown,
  HeartHandshake,
  ImagePlus,
  QrCode,
  RectangleHorizontal,
  Redo2,
  Save,
  Type,
  Undo2,
} from "lucide-react";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fallbackTemplates } from "@/lib/templates";
import { cn } from "@/lib/utils";

type FabricModule = typeof import("fabric");

type DesignBuilderProps = {
  templateId?: string;
};

type DraftPayload = {
  templateId: string;
  savedAt: string;
  snapshot: string;
};

const A4_WIDTH = 1123;
const A4_HEIGHT = 794;
const LOCAL_STORAGE_KEY = "certidraft-design-builder";

export function DesignBuilder({ templateId }: DesignBuilderProps) {
  const selectedTemplate = useMemo(
    () =>
      fallbackTemplates.find((template) => template.id === templateId) ??
      fallbackTemplates[0],
    [templateId]
  );

  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const fabricRef = useRef<FabricModule | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);

  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [ready, setReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Preparing canvas...");
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [properties, setProperties] = useState({
    text: "",
    fill: selectedTemplate.primaryColor,
    left: 0,
    top: 0,
    angle: 0,
    fontSize: 36,
  });

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    });
  }, []);

  const syncSelection = useCallback(() => {
    const canvas = canvasRef.current;
    const activeObject = (canvas?.getActiveObject() as FabricObject | null) ?? null;

    setSelectedObject(activeObject);

    if (!activeObject) {
      return;
    }

    const objectFill =
      typeof activeObject.fill === "string"
        ? activeObject.fill
        : selectedTemplate.primaryColor;
    const objectText =
      typeof activeObject.get("text") === "string"
        ? String(activeObject.get("text"))
        : "";
    const objectFontSize =
      typeof activeObject.get("fontSize") === "number"
        ? Number(activeObject.get("fontSize"))
        : 36;

    setProperties({
      text: objectText,
      fill: objectFill,
      left: Math.round(activeObject.left ?? 0),
      top: Math.round(activeObject.top ?? 0),
      angle: Math.round(activeObject.angle ?? 0),
      fontSize: objectFontSize,
    });
  }, [selectedTemplate.primaryColor]);

  const snapshotCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return "";
    }

    return JSON.stringify(canvas.toJSON());
  }, []);

  const persistDraft = useCallback(
    (message = "Draft saved") => {
      const snapshot = snapshotCanvas();
      if (!snapshot || typeof window === "undefined") {
        return;
      }

      const payload: DraftPayload = {
        templateId: selectedTemplate.id,
        savedAt: new Date().toISOString(),
        snapshot,
      };

      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      setStatusMessage(message);
    },
    [selectedTemplate.id, snapshotCanvas]
  );

  const pushHistory = useCallback(() => {
    if (isRestoringRef.current) {
      return;
    }

    const snapshot = snapshotCanvas();
    if (!snapshot) {
      return;
    }

    const currentSnapshot = historyRef.current[historyIndexRef.current];
    if (snapshot === currentSnapshot) {
      return;
    }

    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(snapshot);
    historyIndexRef.current = historyRef.current.length - 1;
    syncHistoryState();
  }, [snapshotCanvas, syncHistoryState]);

  const applyTemplate = useCallback(
    async (useAutosavedDraft: boolean) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;

      if (!canvas || !fabric) {
        return;
      }

      isRestoringRef.current = true;

      if (useAutosavedDraft && typeof window !== "undefined") {
        const savedDraft = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft) as DraftPayload;
          if (
            parsedDraft.templateId === selectedTemplate.id &&
            parsedDraft.snapshot
          ) {
            await canvas.loadFromJSON(parsedDraft.snapshot);
            canvas.renderAll();
            isRestoringRef.current = false;
            historyRef.current = [JSON.stringify(canvas.toJSON())];
            historyIndexRef.current = 0;
            syncHistoryState();
            syncSelection();
            setStatusMessage("Loaded autosaved draft");
            return;
          }
        }
      }

      canvas.clear();
      canvas.backgroundColor = "#fffdf8";

      const frame = new fabric.Rect({
        left: 24,
        top: 24,
        width: A4_WIDTH - 48,
        height: A4_HEIGHT - 48,
        fill: "",
        stroke: selectedTemplate.primaryColor,
        strokeWidth: 4,
        selectable: false,
        evented: false,
        rx: 14,
        ry: 14,
      });

      const innerFrame = new fabric.Rect({
        left: 52,
        top: 52,
        width: A4_WIDTH - 104,
        height: A4_HEIGHT - 104,
        fill: "",
        stroke: selectedTemplate.secondaryColor,
        strokeWidth: 1.5,
        selectable: false,
        evented: false,
        rx: 10,
        ry: 10,
      });

      const badge = new fabric.Textbox("CERTIDRAFT", {
        left: 78,
        top: 84,
        width: 220,
        fill: selectedTemplate.secondaryColor,
        fontSize: 18,
        fontWeight: "bold",
        charSpacing: 160,
        editable: true,
      });

      const title = new fabric.Textbox(selectedTemplate.featuredText, {
        left: 90,
        top: 175,
        width: A4_WIDTH - 180,
        textAlign: "center",
        fill: selectedTemplate.primaryColor,
        fontSize: 54,
        fontWeight: "bold",
        editable: true,
      });

      const recipient = new fabric.Textbox("Recipient Name", {
        left: 120,
        top: 300,
        width: A4_WIDTH - 240,
        textAlign: "center",
        fill: "#111827",
        fontSize: 62,
        fontWeight: "bold",
        editable: true,
      });

      const description = new fabric.Textbox(
        "Presented in recognition of exceptional achievement and commitment. Customize this wording, add your logo, and fine-tune every object.",
        {
          left: 170,
          top: 395,
          width: A4_WIDTH - 340,
          textAlign: "center",
          fill: "#475569",
          fontSize: 24,
          lineHeight: 1.35,
          editable: true,
        }
      );

      const signatureLine = new fabric.Rect({
        left: 150,
        top: 655,
        width: 220,
        height: 2,
        fill: "#94a3b8",
      });

      const signatureLabel = new fabric.Textbox("Authorized Signature", {
        left: 150,
        top: 668,
        width: 220,
        textAlign: "center",
        fill: "#64748b",
        fontSize: 16,
        editable: true,
      });

      const dateLine = new fabric.Rect({
        left: A4_WIDTH - 370,
        top: 655,
        width: 220,
        height: 2,
        fill: "#94a3b8",
      });

      const dateLabel = new fabric.Textbox("Issue Date", {
        left: A4_WIDTH - 370,
        top: 668,
        width: 220,
        textAlign: "center",
        fill: "#64748b",
        fontSize: 16,
        editable: true,
      });

      const qrBox = new fabric.Group(
        [
          new fabric.Rect({
            left: 0,
            top: 0,
            width: 84,
            height: 84,
            rx: 10,
            ry: 10,
            fill: "#ffffff",
            stroke: selectedTemplate.secondaryColor,
            strokeDashArray: [7, 6],
            strokeWidth: 2,
          }),
          new fabric.Textbox("QR", {
            left: 27,
            top: 26,
            width: 30,
            textAlign: "center",
            fill: selectedTemplate.secondaryColor,
            fontSize: 24,
            fontWeight: "bold",
          }),
        ],
        {
          left: A4_WIDTH - 175,
          top: 88,
        }
      );

      canvas.add(
        frame,
        innerFrame,
        badge,
        title,
        recipient,
        description,
        signatureLine,
        signatureLabel,
        dateLine,
        dateLabel,
        qrBox
      );

      canvas.renderAll();
      isRestoringRef.current = false;
      historyRef.current = [JSON.stringify(canvas.toJSON())];
      historyIndexRef.current = 0;
      syncHistoryState();
      syncSelection();
      setStatusMessage(`Loaded ${selectedTemplate.name}`);
    },
    [
      selectedTemplate.featuredText,
      selectedTemplate.id,
      selectedTemplate.name,
      selectedTemplate.primaryColor,
      selectedTemplate.secondaryColor,
      syncHistoryState,
      syncSelection,
    ]
  );

  const restoreHistory = useCallback(
    async (direction: "undo" | "redo") => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const nextIndex =
        direction === "undo"
          ? historyIndexRef.current - 1
          : historyIndexRef.current + 1;
      const snapshot = historyRef.current[nextIndex];

      if (!snapshot) {
        return;
      }

      isRestoringRef.current = true;
      historyIndexRef.current = nextIndex;
      await canvas.loadFromJSON(snapshot);
      canvas.renderAll();
      isRestoringRef.current = false;
      syncHistoryState();
      syncSelection();
      persistDraft(direction === "undo" ? "Undid last change" : "Redid change");
    },
    [persistDraft, syncHistoryState, syncSelection]
  );

  const withActiveObject = useCallback(
    (updater: (object: FabricObject) => void, message = "Updated selection") => {
      const canvas = canvasRef.current;
      const activeObject = (canvas?.getActiveObject() as FabricObject | null) ?? null;

      if (!canvas || !activeObject) {
        return;
      }

      updater(activeObject);
      activeObject.setCoords();
      canvas.requestRenderAll();
      syncSelection();
      pushHistory();
      persistDraft(message);
    },
    [persistDraft, pushHistory, syncSelection]
  );

  const addTextbox = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;

    if (!canvas || !fabric) {
      return;
    }

    const textbox = new fabric.Textbox("New text", {
      left: 180,
      top: 220,
      width: 360,
      fill: selectedTemplate.primaryColor,
      fontSize: 42,
      fontWeight: "bold",
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
    syncSelection();
    pushHistory();
    persistDraft("Added text");
  }, [
    persistDraft,
    pushHistory,
    selectedTemplate.primaryColor,
    syncSelection,
  ]);

  const addRectangle = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;

    if (!canvas || !fabric) {
      return;
    }

    const rectangle = new fabric.Rect({
      left: 140,
      top: 160,
      width: 220,
      height: 120,
      fill: "rgba(20, 184, 166, 0.15)",
      stroke: selectedTemplate.secondaryColor,
      strokeWidth: 2,
      rx: 12,
      ry: 12,
    });

    canvas.add(rectangle);
    canvas.setActiveObject(rectangle);
    canvas.requestRenderAll();
    syncSelection();
    pushHistory();
    persistDraft("Added rectangle");
  }, [
    persistDraft,
    pushHistory,
    selectedTemplate.secondaryColor,
    syncSelection,
  ]);

  const addCircle = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;

    if (!canvas || !fabric) {
      return;
    }

    const circle = new fabric.Circle({
      left: 220,
      top: 210,
      radius: 60,
      fill: "rgba(33, 76, 207, 0.15)",
      stroke: selectedTemplate.primaryColor,
      strokeWidth: 2,
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
    syncSelection();
    pushHistory();
    persistDraft("Added circle");
  }, [
    persistDraft,
    pushHistory,
    selectedTemplate.primaryColor,
    syncSelection,
  ]);

  const addQrPlaceholder = useCallback(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;

    if (!canvas || !fabric) {
      return;
    }

    const qrPlaceholder = new fabric.Group(
      [
        new fabric.Rect({
          left: 0,
          top: 0,
          width: 120,
          height: 120,
          rx: 14,
          ry: 14,
          fill: "#ffffff",
          stroke: selectedTemplate.primaryColor,
          strokeDashArray: [6, 5],
          strokeWidth: 2,
        }),
        new fabric.Textbox("Verification QR", {
          left: 12,
          top: 45,
          width: 96,
          textAlign: "center",
          fill: selectedTemplate.primaryColor,
          fontSize: 16,
          fontWeight: "bold",
        }),
      ],
      {
        left: 320,
        top: 150,
      }
    );

    canvas.add(qrPlaceholder);
    canvas.setActiveObject(qrPlaceholder);
    canvas.requestRenderAll();
    syncSelection();
    pushHistory();
    persistDraft("Added QR placeholder");
  }, [
    persistDraft,
    pushHistory,
    selectedTemplate.primaryColor,
    syncSelection,
  ]);

  const exportPdf = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const imageData = canvas.toDataURL({
      format: "png",
      multiplier: 2,
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [A4_WIDTH, A4_HEIGHT],
    });

    pdf.addImage(imageData, "PNG", 0, 0, A4_WIDTH, A4_HEIGHT);
    pdf.save(`${selectedTemplate.id}.pdf`);
    setStatusMessage("Exported PDF");
  }, [selectedTemplate.id]);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const imageData = canvas.toDataURL({
      format: "png",
      multiplier: 2,
    });

    const link = document.createElement("a");
    link.href = imageData;
    link.download = `${selectedTemplate.id}.png`;
    link.click();
    setStatusMessage("Downloaded PNG");
  }, [selectedTemplate.id]);

  const handleImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;

      if (!file || !canvas || !fabric) {
        return;
      }

      const fileReader = new FileReader();
      fileReader.onload = async () => {
        if (typeof fileReader.result !== "string") {
          return;
        }

        const image = await fabric.FabricImage.fromURL(fileReader.result);
        image.set({
          left: 160,
          top: 140,
          cornerStyle: "circle",
        });

        const maxWidth = 260;
        if ((image.width ?? 0) > maxWidth) {
          image.scaleToWidth(maxWidth);
        }

        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.requestRenderAll();
        syncSelection();
        pushHistory();
        persistDraft("Added image");
      };

      fileReader.readAsDataURL(file);
      event.target.value = "";
    },
    [persistDraft, pushHistory, syncSelection]
  );

  useEffect(() => {
    let disposed = false;

    async function setupCanvas() {
      if (!canvasElementRef.current) {
        return;
      }

      const fabricModule = await import("fabric");
      if (disposed || !canvasElementRef.current) {
        return;
      }

      fabricRef.current = fabricModule;

      const nextCanvas = new fabricModule.Canvas(canvasElementRef.current, {
        width: A4_WIDTH,
        height: A4_HEIGHT,
        preserveObjectStacking: true,
        backgroundColor: "#fffdf8",
      });

      canvasRef.current = nextCanvas;

      nextCanvas.on("selection:created", syncSelection);
      nextCanvas.on("selection:updated", syncSelection);
      nextCanvas.on("selection:cleared", () => setSelectedObject(null));
      nextCanvas.on("object:added", pushHistory);
      nextCanvas.on("object:modified", pushHistory);
      nextCanvas.on("object:removed", pushHistory);

      await applyTemplate(true);
      setReady(true);
      setStatusMessage(`Loaded ${selectedTemplate.name}`);
    }

    void setupCanvas();

    return () => {
      disposed = true;
      setReady(false);
      setSelectedObject(null);
      if (canvasRef.current) {
        void canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, [applyTemplate, pushHistory, selectedTemplate.name, syncSelection]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      persistDraft("Autosaved to browser storage");
    }, 10000);

    return () => window.clearInterval(interval);
  }, [persistDraft]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const modifierPressed = event.ctrlKey || event.metaKey;

      if (modifierPressed && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        void restoreHistory("undo");
      }

      if (
        (modifierPressed && event.key.toLowerCase() === "y") ||
        (modifierPressed &&
          event.shiftKey &&
          event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        void restoreHistory("redo");
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [restoreHistory]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_40%),linear-gradient(to_bottom,_rgba(20,184,166,0.05),_transparent_20%)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to gallery
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              Design Builder
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Editing <span className="font-medium text-foreground">{selectedTemplate.name}</span>
              {" "}
              on an A4 landscape canvas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => persistDraft()}>
              <Save className="size-4" />
              Save
            </Button>
            <Button variant="outline" onClick={exportPdf}>
              <FileDown className="size-4" />
              Export PDF
            </Button>
            <Button onClick={downloadPng}>
              <Download className="size-4" />
              Download
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)_300px] lg:px-8">
        <Card className="border-border/60 bg-background/90">
          <CardHeader>
            <CardTitle>Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToolbarButton
              icon={Type}
              label="Add Text"
              description="Insert a new editable text box."
              onClick={addTextbox}
            />
            <ToolbarButton
              icon={ImagePlus}
              label="Upload Image"
              description="Upload a logo, seal, or signature."
              onClick={() => fileInputRef.current?.click()}
            />
            <ToolbarButton
              icon={RectangleHorizontal}
              label="Add Rectangle"
              description="Create a filled block or decorative frame."
              onClick={addRectangle}
            />
            <ToolbarButton
              icon={Circle}
              label="Add Circle"
              description="Add a circular accent or badge."
              onClick={addCircle}
            />
            <ToolbarButton
              icon={QrCode}
              label="QR Placeholder"
              description="Drop in a verification area."
              onClick={addQrPlaceholder}
            />

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">
                Keyboard shortcuts
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use <span className="font-medium text-foreground">Ctrl/Cmd + Z</span>
                {" "}for undo and{" "}
                <span className="font-medium text-foreground">Ctrl/Cmd + Y</span>
                {" "}for redo.
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="overflow-hidden rounded-3xl border border-border/60 bg-background/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Live Preview</p>
              <p className="text-xs text-muted-foreground">{statusMessage}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!historyState.canUndo}
                onClick={() => void restoreHistory("undo")}
              >
                <Undo2 className="size-4" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!historyState.canRedo}
                onClick={() => void restoreHistory("redo")}
              >
                <Redo2 className="size-4" />
                Redo
              </Button>
            </div>
          </div>

          <div className="overflow-auto p-4">
            <div className="mx-auto min-w-fit rounded-[28px] bg-muted/40 p-4">
              <div className="overflow-hidden rounded-[24px] border border-border/60 bg-white shadow-2xl">
                <canvas
                  ref={canvasElementRef}
                  className={cn("max-w-none", !ready && "opacity-70")}
                />
              </div>
            </div>
          </div>
        </section>

        <Card className="border-border/60 bg-background/90">
          <CardHeader>
            <CardTitle>Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground">
                Active template
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedTemplate.name} • {selectedTemplate.category} • {selectedTemplate.style}
              </p>
            </div>

            {selectedObject ? (
              <>
                <PropertyField label="Selected layer">
                  <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm text-foreground">
                    {selectedObject.type}
                  </div>
                </PropertyField>

                {selectedObject.type === "textbox" ? (
                  <PropertyField label="Text">
                    <Input
                      value={properties.text}
                      onChange={(event) => {
                        const value = event.target.value;
                        setProperties((current) => ({ ...current, text: value }));
                        withActiveObject(
                          (object) => object.set("text", value),
                          "Updated text"
                        );
                      }}
                      placeholder="Edit text"
                    />
                  </PropertyField>
                ) : null}

                <PropertyField label="Color">
                  <input
                    type="color"
                    value={properties.fill}
                    className="h-10 w-full rounded-xl border border-input bg-background px-2"
                    onChange={(event) => {
                      const value = event.target.value;
                      setProperties((current) => ({ ...current, fill: value }));
                      withActiveObject(
                        (object) => object.set("fill", value),
                        "Updated color"
                      );
                    }}
                  />
                </PropertyField>

                {selectedObject.type === "textbox" ? (
                  <PropertyField label="Font size">
                    <Input
                      type="number"
                      value={properties.fontSize}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setProperties((current) => ({
                          ...current,
                          fontSize: value,
                        }));
                        withActiveObject(
                          (object) => object.set("fontSize", value),
                          "Updated font size"
                        );
                      }}
                    />
                  </PropertyField>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <PropertyField label="X position">
                    <Input
                      type="number"
                      value={properties.left}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setProperties((current) => ({ ...current, left: value }));
                        withActiveObject(
                          (object) => object.set("left", value),
                          "Updated X position"
                        );
                      }}
                    />
                  </PropertyField>

                  <PropertyField label="Y position">
                    <Input
                      type="number"
                      value={properties.top}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setProperties((current) => ({ ...current, top: value }));
                        withActiveObject(
                          (object) => object.set("top", value),
                          "Updated Y position"
                        );
                      }}
                    />
                  </PropertyField>
                </div>

                <PropertyField label="Rotation">
                  <Input
                    type="number"
                    value={properties.angle}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setProperties((current) => ({ ...current, angle: value }));
                      withActiveObject(
                        (object) => object.set("angle", value),
                        "Updated rotation"
                      );
                    }}
                  />
                </PropertyField>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                Select any object on the canvas to edit its font, color,
                position, and rotation.
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <HeartHandshake className="size-4 text-primary" />
                Auto-save enabled
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                This builder stores the design in browser localStorage every 10
                seconds and after edits.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: typeof Type;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border/60 bg-background p-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}

function PropertyField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
