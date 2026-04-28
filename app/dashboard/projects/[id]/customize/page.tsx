"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { StepIndicator } from "@/components/dashboard/step-indicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";

const steps = ["Upload Data", "Map Data", "Customize", "Generate"];

const sampleCitations: Record<string, string> = {
  professional:
    "Awarded for demonstrating exceptional leadership qualities and consistently exceeding performance benchmarks throughout the evaluation period.",
  friendly:
    "Congratulations on your amazing achievement! Your hard work and dedication truly shine through in everything you do.",
  formal:
    "This certificate is hereby conferred in recognition of meritorious contributions to the advancement of organizational objectives.",
  casual:
    "Way to go! You've knocked it out of the park this quarter and everyone's noticed your awesome work!",
};

export default function CustomizePage() {
  const params = useParams();
  const projectId = params.id as string;
  const [useAI, setUseAI] = useState(true);
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [manualTemplate, setManualTemplate] = useState(
    "Congratulations {name} for achieving {achievement} on {date}."
  );
  const [enableManual, setEnableManual] = useState(false);
  const [includeQR, setIncludeQR] = useState(true);
  const [qrSize, setQrSize] = useState("medium");
  const [qrPosition, setQrPosition] = useState("bottom-right");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <BackButton href={`/dashboard/projects/${projectId}/map-data`} label="Back to Mapping" />
      <StepIndicator currentStep={3} steps={steps} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Customize Certificates</h1>
        <p className="text-sm text-muted-foreground">Configure AI citations, manual text, and QR code settings.</p>
      </div>

      {/* AI Citation Toggle */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Sparkles className="size-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Use AI-Generated Citations</h3>
              <p className="text-sm text-muted-foreground">
                AI will generate unique, personalized text for each certificate
              </p>
            </div>
          </div>
          <button
            onClick={() => setUseAI(!useAI)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              useAI ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                useAI ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {useAI && (
          <div className="mt-5 space-y-4 border-t pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (1 sentence)</SelectItem>
                    <SelectItem value="medium">Medium (2-3 sentences)</SelectItem>
                    <SelectItem value="long">Long (4+ sentences)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Sample Output</Label>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <RefreshCw className="size-3" />
                  Regenerate
                </button>
              </div>
              <div className="mt-1.5 rounded-lg bg-muted/50 p-3 text-sm italic text-muted-foreground">
                &quot;{sampleCitations[tone]}&quot;
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual template */}
      {!useAI && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold">Manual Citation Template</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use {"{name}"}, {"{achievement}"}, {"{date}"}, {"{grade}"}, {"{event}"} as placeholders.
          </p>
          <textarea
            className="mt-3 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            rows={4}
            value={manualTemplate}
            onChange={(e) => setManualTemplate(e.target.value)}
            maxLength={500}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {manualTemplate.length}/500 characters
          </p>
        </div>
      )}

      {/* Manual per-cert customization */}
      <div className="rounded-xl border bg-card p-5">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={enableManual}
            onChange={() => setEnableManual(!enableManual)}
            className="rounded"
          />
          <div>
            <span className="font-medium">Enable manual customization for each certificate</span>
            <p className="text-sm text-muted-foreground">
              Edit each certificate&apos;s text individually after generation
            </p>
          </div>
        </label>
      </div>

      {/* QR Code settings */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">QR Code Verification</h3>
          <button
            onClick={() => setIncludeQR(!includeQR)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              includeQR ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${includeQR ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {includeQR && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Size</Label>
              <div className="flex gap-2">
                {["small", "medium", "large"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQrSize(s)}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium capitalize transition-all ${
                      qrSize === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Position</Label>
              <Select value={qrPosition} onValueChange={setQrPosition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/projects/${projectId}/map-data`}>Back to Mapping</Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/projects/${projectId}/generate`}>Continue to Generate</Link>
        </Button>
      </div>
    </div>
  );
}
