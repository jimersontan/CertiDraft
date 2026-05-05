import { jsPDF } from "jspdf";
import { api } from "./api-client";
import { toast } from "sonner";
import { CanvasElement } from "./canvas-store";

export const exportProjectToPDF = async (projectName: string, elements: CanvasElement[]) => {
  toast.loading("Generating PDF...", { id: "pdf-export" });

  try {
    const W = 595;   // certificate width (px)
    const H = 421;   // certificate height (px)
    const DPR = 3;   // 3× resolution for crisp text

    // ── Step 1: pre-load every web font used in text elements ──────────────
    const usedFonts = [
      ...new Set(
        elements
          .filter(e => e.type === "text")
          .map(e => e.fontFamily || "Inter")
      ),
    ];
    
    if (typeof window !== "undefined") {
      await Promise.all(
        usedFonts.flatMap(family => [
          document.fonts.load(`400 16px "${family}"`).catch(() => null),
          document.fonts.load(`700 16px "${family}"`).catch(() => null),
          document.fonts.load(`800 16px "${family}"`).catch(() => null),
          document.fonts.load(`italic 400 16px "${family}"`).catch(() => null),
        ])
      );
    }

    // ── Step 2: create offscreen canvas ────────────────────────────────────
    const offscreen = document.createElement("canvas");
    offscreen.width  = W * DPR;
    offscreen.height = H * DPR;
    const ctx = offscreen.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // ── Helpers ────────────────────────────────────────────────────────────
    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>(resolve => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => resolve(img);
        if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
        img.src = src;
      });

    const wrapText = (text: string, maxW: number): string[] => {
      const lines: string[] = [];
      for (const para of text.split("\n")) {
        const words = para.split(" ");
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxW && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
      }
      return lines.length ? lines : [""];
    };

    // ── Step 3: draw each element in z-order ───────────────────────────────
    for (const el of elements) {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      if (el.rotation) {
        const cx = el.x + el.width  / 2;
        const cy = el.y + el.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      switch (el.type) {
        case "shape": {
          ctx.fillStyle = el.fill || "#3B82F6";
          ctx.fillRect(el.x, el.y, el.width, el.height);
          break;
        }

        case "text": {
          if (!el.content) break;
          const fs  = el.fontSize   || 16;
          const ff  = el.fontFamily || "Inter";
          const fw  = el.fontWeight || "normal";
          const fi  = el.fontStyle  || "normal";
          const lh  = fs * 1.25;

          ctx.font          = `${fi} ${fw} ${fs}px "${ff}", sans-serif`;
          ctx.fillStyle     = el.fill || "#000000";
          ctx.textBaseline  = "top";
          ctx.textAlign     = (el.textAlign || "left") as CanvasTextAlign;

          const lines = wrapText(el.content, el.width);
          const baseX =
            el.textAlign === "center" ? el.x + el.width / 2
          : el.textAlign === "right"  ? el.x + el.width
          : el.x;

          lines.forEach((line, i) =>
            ctx.fillText(line, baseX, el.y + i * lh)
          );
          break;
        }

        case "image": {
          if (!el.src) break;
          const img = await loadImg(el.src);
          if (img.naturalWidth > 0) {
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
          } else {
            ctx.fillStyle = "#e5e7eb";
            ctx.fillRect(el.x, el.y, el.width, el.height);
          }
          break;
        }

        case "qr": {
          ctx.strokeStyle = "#9ca3af";
          ctx.lineWidth   = 1;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
          ctx.fillStyle    = "#9ca3af";
          ctx.font         = "8px sans-serif";
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("QR", el.x + el.width / 2, el.y + el.height / 2);
          break;
        }
      }
      ctx.restore();
    }

    // ── Step 4: export to PDF ──────────────────────────────────────────────
    const imgData = offscreen.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
    pdf.save(`${projectName.replace(/\s+/g, "_")}.pdf`);

    await api.updateUsage();
    toast.success("PDF exported successfully!", { id: "pdf-export" });

  } catch (error) {
    console.error("[ExportPDF] failed:", error);
    toast.error("Export failed — check the console for details.", { id: "pdf-export" });
  }
};
