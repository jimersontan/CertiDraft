"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { StepIndicator } from "@/components/dashboard/step-indicator";
import Link from "next/link";
import { useParams } from "next/navigation";

const steps = ["Upload Data", "Map Data", "Customize", "Generate"];

export default function UploadCSVPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  // Mock CSV data preview
  const mockPreview = {
    headers: ["Name", "Email", "Achievement", "Date", "Grade"],
    rows: [
      ["John Doe", "john@example.com", "Excellence in Leadership", "2026-04-15", "A+"],
      ["Jane Smith", "jane@example.com", "Outstanding Performance", "2026-04-15", "A"],
      ["Bob Wilson", "bob@example.com", "Best Innovation Award", "2026-04-15", "A+"],
      ["Alice Brown", "alice@example.com", "Top Contributor", "2026-04-15", "A"],
      ["Charlie Davis", "charlie@example.com", "Research Excellence", "2026-04-15", "B+"],
    ],
    totalRows: 250,
    totalColumns: 5,
    fileSize: "45KB",
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, []);

  const handleFile = (f: File) => {
    setFile(f);
    setValidating(true);
    setTimeout(() => { setValidating(false); setValidated(true); }, 1500);
  };

  return (
    <div className="space-y-6">
      <BackButton href={`/dashboard/projects/${projectId}/editor`} label="Back to Editor" />
      <StepIndicator currentStep={1} steps={steps} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Upload Data</h1>
        <p className="text-sm text-muted-foreground">Upload a CSV or Excel file with your recipient data.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
        className={`flex h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
          dragOver
            ? "border-primary bg-primary/5"
            : file
              ? "border-emerald-400 bg-emerald-50/50"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {file ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <FileSpreadsheet className="size-7 text-emerald-600" />
            </div>
            <p className="mt-3 font-semibold text-foreground">{file.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={(e) => { e.stopPropagation(); setFile(null); setValidated(false); }}>
              Clear File
            </Button>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Upload className="size-7 text-primary" />
            </div>
            <p className="mt-3 font-semibold text-foreground">
              Drag and drop your CSV or Excel file here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Accepted: .csv, .xlsx · Max 10MB
            </p>
          </>
        )}
      </div>

      {/* Validation */}
      {validating && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Validating file...
        </div>
      )}

      {validated && !validating && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="size-4" />
          File is valid and ready for mapping
        </div>
      )}

      {/* Preview table */}
      {file && validated && (
        <>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Columns: <strong className="text-foreground">{mockPreview.totalColumns}</strong></span>
            <span>Rows: <strong className="text-foreground">{mockPreview.totalRows}</strong></span>
            <span>Size: <strong className="text-foreground">{mockPreview.fileSize}</strong></span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">#</th>
                  {mockPreview.headers.map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockPreview.rows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button className="gap-2" asChild>
              <Link href={`/dashboard/projects/${projectId}/map-data`}>
                Validate &amp; Continue
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
