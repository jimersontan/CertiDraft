"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const csvColumns = ["Name", "Email", "Achievement", "Date", "Grade"];
const templateFields = [
  { key: "recipient_name", label: "Recipient Name", required: true },
  { key: "achievement", label: "Achievement Text", required: true },
  { key: "issue_date", label: "Issue Date", required: true },
  { key: "email", label: "Email Address", required: false },
  { key: "grade", label: "Grade / Level", required: false },
];

export default function MapDataPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [mappings, setMappings] = useState<Record<string, string>>({
    recipient_name: "Name",
    achievement: "Achievement",
    issue_date: "Date",
    email: "Email",
    grade: "",
  });

  const updateMapping = (fieldKey: string, csvCol: string) => {
    setMappings((prev) => ({ ...prev, [fieldKey]: csvCol }));
  };

  const requiredMapped = templateFields
    .filter((f) => f.required)
    .every((f) => mappings[f.key]);

  // Sample preview data
  const sampleData: Record<string, string> = {
    Name: "John Doe",
    Email: "john@example.com",
    Achievement: "Excellence in Leadership",
    Date: "2026-04-15",
    Grade: "A+",
  };

  return (
    <div className="space-y-6">
      <BackButton href={`/dashboard/projects/${projectId}/upload-csv`} label="Back to Upload" />
      <StepIndicator currentStep={2} steps={steps} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Map Data</h1>
        <p className="text-sm text-muted-foreground">Connect your CSV columns to certificate template fields.</p>
      </div>

      {/* Mapping interface */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: CSV Columns */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            CSV Columns
          </div>
          <div className="flex flex-wrap gap-2">
            {csvColumns.map((col) => {
              const isMapped = Object.values(mappings).includes(col);
              return (
                <span
                  key={col}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isMapped
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {isMapped && <CheckCircle className="mr-1 inline size-3" />}
                  {col}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right: Template Fields */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 rounded-lg bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700">
            Certificate Template Fields
          </div>
          <div className="space-y-3">
            {templateFields.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <div className="min-w-[140px]">
                  <span className="text-sm font-medium">{field.label}</span>
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </div>
                <Select
                  value={mappings[field.key] || ""}
                  onValueChange={(val) => updateMapping(field.key, val)}
                >
                  <SelectTrigger className={`h-9 text-sm ${
                    field.required && !mappings[field.key]
                      ? "border-red-300"
                      : mappings[field.key]
                        ? "border-emerald-300"
                        : ""
                  }`}>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {csvColumns.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mappings[field.key] ? (
                  <CheckCircle className="size-4 shrink-0 text-emerald-500" />
                ) : field.required ? (
                  <AlertCircle className="size-4 shrink-0 text-red-400" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Live Preview (Record 1)</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {templateFields.map((field) => {
            const csvCol = mappings[field.key];
            const value = csvCol ? sampleData[csvCol] : "—";
            return (
              <div key={field.key} className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className={`text-sm font-medium ${csvCol ? "text-foreground" : "text-muted-foreground"}`}>
                  {value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/projects/${projectId}/upload-csv`}>Back to Upload</Link>
        </Button>
        <Button disabled={!requiredMapped} asChild>
          <Link href={`/dashboard/projects/${projectId}/customize`}>Continue to Customization</Link>
        </Button>
      </div>
    </div>
  );
}
