"use client";

import Link from "next/link";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Table2,
  UploadCloud,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ParsedRow = Record<string, string>;

type ValidationResult = {
  errors: string[];
  warnings: string[];
  requiredFieldMatches: Record<string, string | null>;
};

const TEMPLATE_FIELDS = [
  {
    key: "name",
    label: "Name",
    placeholder: "{name}",
    helperText: "Recipient full name shown on the certificate.",
    required: true,
  },
  {
    key: "achievement",
    label: "Achievement",
    placeholder: "{achievement}",
    helperText: "Award, completion, or milestone text.",
    required: true,
  },
  {
    key: "date",
    label: "Date",
    placeholder: "{date}",
    helperText: "Issue date or ceremony date.",
    required: true,
  },
  {
    key: "grade",
    label: "Grade",
    placeholder: "{grade}",
    helperText: "Optional grade, score, or distinction.",
    required: false,
  },
] as const;

type TemplateFieldKey = (typeof TEMPLATE_FIELDS)[number]["key"];
type FieldMapping = Record<TemplateFieldKey, string>;

const REQUIRED_FIELDS = ["Name", "Achievement", "Date"] as const;
const UNMAPPED_VALUE = "__unmapped__";
const MAPPING_STORAGE_KEY = "certi:data-mapping";

export function BatchUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<"upload" | "mapping">("upload");
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>(createEmptyMapping());
  const [mappingSavedAt, setMappingSavedAt] = useState<string | null>(null);

  const previewRows = rows.slice(0, 10);
  const rowCount = rows.length;
  const columnCount = headers.length;

  const hasData = headers.length > 0 && rows.length > 0;
  const firstRecipient = rows[0] ?? null;
  const mappedFieldCount = TEMPLATE_FIELDS.filter(
    (field) => fieldMapping[field.key]
  ).length;
  const requiredFieldsMapped = TEMPLATE_FIELDS.filter(
    (field) => field.required
  ).every((field) => fieldMapping[field.key]);
  const duplicateMappedHeaders = getDuplicateMappedHeaders(fieldMapping);

  async function handleFileSelection(file: File | undefined) {
    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx"].includes(extension)) {
      toast.error("Please upload a .csv or .xlsx file.");
      setValidation({
        errors: ["Unsupported file type. Only .csv and .xlsx are accepted."],
        warnings: [],
        requiredFieldMatches: {},
      });
      return;
    }

    setIsParsing(true);
    setCurrentStep("upload");
    setValidation(null);
    setFileName(file.name);
    setFieldMapping(createEmptyMapping());
    setMappingSavedAt(null);

    try {
      const parsedRows =
        extension === "csv"
          ? await parseCsvFile(file)
          : await parseExcelFile(file);

      const normalizedRows = normalizeRows(parsedRows);
      const normalizedHeaders = extractHeaders(normalizedRows);

      setHeaders(normalizedHeaders);
      setRows(normalizedRows);

      if (normalizedRows.length === 0) {
        const errorMessage =
          "No recipient rows were found in the uploaded file.";
        setValidation({
          errors: [errorMessage],
          warnings: [],
          requiredFieldMatches: {},
        });
        toast.error(errorMessage);
      } else {
        toast.success(`Loaded ${normalizedRows.length} rows from ${file.name}.`);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to parse the uploaded file.";

      setHeaders([]);
      setRows([]);
      setValidation({
        errors: [message],
        warnings: [],
        requiredFieldMatches: {},
      });
      toast.error(message);
    } finally {
      setIsParsing(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFileSelection(event.target.files?.[0]);
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    void handleFileSelection(file);
  }

  function clearUpload() {
    setHeaders([]);
    setRows([]);
    setFileName(null);
    setValidation(null);
    setCurrentStep("upload");
    setFieldMapping(createEmptyMapping());
    setMappingSavedAt(null);
  }

  function validateAndContinue() {
    if (!hasData) {
      const message = "Upload a CSV or Excel file before validating.";
      toast.error(message);
      setValidation({
        errors: [message],
        warnings: [],
        requiredFieldMatches: {},
      });
      return;
    }

    const result = validateRows(rows, headers);
    setValidation(result);

    if (result.errors.length > 0) {
      toast.error("Validation failed. Fix the highlighted issues to continue.");
      setCurrentStep("upload");
      return;
    }

    toast.success("Validation passed. Proceeding to mapping step.");
    setFieldMapping(createInitialMapping(headers, result.requiredFieldMatches));
    setMappingSavedAt(null);
    setCurrentStep("mapping");
  }

  function handleFieldMappingChange(fieldKey: TemplateFieldKey, value: string) {
    setFieldMapping((current) => ({
      ...current,
      [fieldKey]: value === UNMAPPED_VALUE ? "" : value,
    }));
    setMappingSavedAt(null);
  }

  function saveMappingAndContinue() {
    if (!firstRecipient) {
      toast.error("Upload at least one recipient row before saving the mapping.");
      return;
    }

    if (!requiredFieldsMapped) {
      toast.error("Map all required template fields before continuing.");
      return;
    }

    if (duplicateMappedHeaders.length > 0) {
      toast.error(
        `Resolve duplicate CSV assignments before continuing: ${duplicateMappedHeaders.join(", ")}.`
      );
      return;
    }

    const savedAt = new Date().toISOString();

    try {
      localStorage.setItem(
        MAPPING_STORAGE_KEY,
        JSON.stringify({
          fileName,
          headers,
          mapping: fieldMapping,
          templateFields: TEMPLATE_FIELDS,
          sampleRecipient: firstRecipient,
          savedAt,
        })
      );
      setMappingSavedAt(savedAt);
      toast.success("Mapping saved. Continuing to batch settings.");
      window.location.assign("/dashboard");
    } catch {
      toast.error("Unable to save the mapping in this browser session.");
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(to_bottom,_rgba(20,184,166,0.05),_transparent_22%)]">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={handleInputChange}
      />

      <section className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm text-primary">
                <FileSpreadsheet className="size-4" />
                Batch recipient import
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Upload recipient data from CSV or Excel.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Drop in your spreadsheet, preview the first 10 rows, validate
                required fields, and move into the data mapping step before batch
                certificate generation.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:min-w-[360px]">
              <StatCard label="Supported" value="CSV, XLSX" />
              <StatCard label="Preview" value="10 rows" />
              <StatCard label="Checks" value="3 rules" />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-6">
          <Card className="border-border/60 bg-background/90 shadow-sm">
            <CardHeader>
              <CardTitle>Upload file</CardTitle>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex w-full flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-14 text-center transition",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                  <UploadCloud className="size-8" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  Drag and drop your file here
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Click to upload a `.csv` or `.xlsx` file. Include columns like
                  name, achievement, grade, and date to speed up mapping.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    .csv
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    .xlsx
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    First 10 rows preview
                  </span>
                </div>
              </button>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button onClick={() => inputRef.current?.click()} disabled={isParsing}>
                  {isParsing ? "Parsing file..." : "Click to upload"}
                </Button>
                <Button variant="outline" onClick={clearUpload} disabled={!hasData}>
                  Clear file
                </Button>
                {fileName ? (
                  <p className="text-sm text-muted-foreground">
                    Loaded file: <span className="font-medium text-foreground">{fileName}</span>
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {validation?.errors.length ? (
            <Alert variant="destructive">
              <AlertTitle>Validation issues found</AlertTitle>
              <AlertDescription>
                <ul className="space-y-1">
                  {validation.errors.map((error) => (
                    <li key={error} className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {validation?.warnings.length ? (
            <Alert>
              <AlertTitle>Validation summary</AlertTitle>
              <AlertDescription>
                <ul className="space-y-1">
                  {validation.warnings.map((warning) => (
                    <li key={warning} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-primary" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <Card className="border-border/60 bg-background/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preview table</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  First 10 recipient rows from the uploaded dataset.
                </p>
              </div>
              <div className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
                {rowCount} rows • {columnCount} columns
              </div>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <div className="overflow-hidden rounded-2xl border border-border/60">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          {headers.map((header) => (
                            <th
                              key={header}
                              className="whitespace-nowrap px-4 py-3 text-left font-medium text-foreground"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-background">
                        {previewRows.map((row, index) => (
                          <tr key={`preview-row-${index}`}>
                            {headers.map((header) => (
                              <td
                                key={`${index}-${header}`}
                                className="whitespace-nowrap px-4 py-3 text-muted-foreground"
                              >
                                {row[header] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
                  <Table2 className="mx-auto size-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    No file preview yet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload a spreadsheet to inspect the first 10 rows before
                    validation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 bg-background/90 shadow-sm">
            <CardHeader>
              <CardTitle>Validation & continue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ChecklistItem label="Checks for empty rows" />
              <ChecklistItem label="Checks duplicate recipient names" />
              <ChecklistItem label="Checks required fields: Name, Achievement, Date" />

              <Button className="w-full" onClick={validateAndContinue} disabled={!hasData}>
                Validate & Continue
              </Button>

              <p className="text-sm text-muted-foreground">
                On success, the upload moves to the data mapping step with the
                detected column headers ready for alignment.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-background/90 shadow-sm">
            <CardHeader>
              <CardTitle>Mapping step</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep === "mapping" && validation ? (
                <>
                  <Alert>
                    <AlertTitle>Ready for data mapping</AlertTitle>
                    <AlertDescription>
                      Match each CSV column to a template placeholder, then
                      review the live certificate preview for the first
                      recipient.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                    <Card className="border border-border/60 bg-muted/10 py-0 shadow-none">
                      <CardHeader className="border-b border-border/60 py-4">
                        <CardTitle className="text-sm">CSV Columns</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Available headers from the uploaded spreadsheet.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3 py-4">
                        {headers.map((header) => {
                          const linkedFields = TEMPLATE_FIELDS.filter(
                            (field) => fieldMapping[field.key] === header
                          );

                          return (
                            <div
                              key={header}
                              className="rounded-2xl border border-border/60 bg-background px-4 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {header}
                                  </p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Sample: {firstRecipient?.[header] || "—"}
                                  </p>
                                </div>
                                <span className="rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground">
                                  {linkedFields.length > 0
                                    ? linkedFields.map((field) => field.label).join(", ")
                                    : "Unmapped"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    <Card className="border border-border/60 bg-muted/10 py-0 shadow-none">
                      <CardHeader className="border-b border-border/60 py-4">
                        <CardTitle className="text-sm">Template Fields</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Select the CSV column that should fill each template
                          placeholder.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4 py-4">
                        {TEMPLATE_FIELDS.map((field) => {
                          const selectedHeader = fieldMapping[field.key];
                          const sampleValue =
                            selectedHeader && firstRecipient
                              ? firstRecipient[selectedHeader] || "—"
                              : "Not mapped yet";

                          return (
                            <div
                              key={field.key}
                              className="rounded-2xl border border-border/60 bg-background p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-foreground">
                                  {field.label}
                                </p>
                                <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary">
                                  {field.placeholder}
                                </span>
                                {field.required ? (
                                  <span className="rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground">
                                    Required
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 text-sm text-muted-foreground">
                                {field.helperText}
                              </p>

                              <Select
                                value={selectedHeader || UNMAPPED_VALUE}
                                onValueChange={(value) =>
                                  handleFieldMappingChange(field.key, value)
                                }
                              >
                                <SelectTrigger className="mt-4">
                                  <SelectValue placeholder="Select CSV column" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>CSV Columns</SelectLabel>
                                    <SelectItem value={UNMAPPED_VALUE}>
                                      Leave unmapped
                                    </SelectItem>
                                    {headers.map((header) => (
                                      <SelectItem key={header} value={header}>
                                        {header}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>

                              <p className="mt-3 text-sm text-muted-foreground">
                                Sample value:{" "}
                                <span className="font-medium text-foreground">
                                  {sampleValue}
                                </span>
                              </p>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border border-border/60 bg-background/95 py-0 shadow-none">
                    <CardHeader className="border-b border-border/60 py-4">
                      <CardTitle className="text-sm">Live Preview</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        First recipient preview using the current field mapping.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4 py-5">
                      <div className="rounded-[28px] border border-primary/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(20,184,166,0.06))] p-6">
                        <div className="rounded-[24px] border border-border/60 bg-background/95 px-6 py-8 text-center shadow-sm">
                          <p className="text-xs font-medium uppercase tracking-[0.35em] text-primary">
                            Certificate Preview
                          </p>
                          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                            {getMappedPreviewValue(firstRecipient, fieldMapping, "name")}
                          </h3>
                          <p className="mt-4 text-sm leading-7 text-muted-foreground">
                            is recognized for
                          </p>
                          <p className="mt-2 text-xl font-medium text-foreground">
                            {getMappedPreviewValue(
                              firstRecipient,
                              fieldMapping,
                              "achievement"
                            )}
                          </p>
                          <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-left">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Date
                              </p>
                              <p className="mt-2 font-medium text-foreground">
                                {getMappedPreviewValue(firstRecipient, fieldMapping, "date")}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-left">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                Grade
                              </p>
                              <p className="mt-2 font-medium text-foreground">
                                {getMappedPreviewValue(firstRecipient, fieldMapping, "grade")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border bg-muted/20 px-3 py-1">
                          {mappedFieldCount} of {TEMPLATE_FIELDS.length} fields mapped
                        </span>
                        <span className="rounded-full border border-border bg-muted/20 px-3 py-1">
                          {requiredFieldsMapped
                            ? "Required fields mapped"
                            : "Required fields pending"}
                        </span>
                        {mappingSavedAt ? (
                          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-primary">
                            Saved {new Date(mappingSavedAt).toLocaleTimeString()}
                          </span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    {duplicateMappedHeaders.length > 0
                      ? `Duplicate assignments found for: ${duplicateMappedHeaders.join(", ")}. Use a unique CSV column for each template field.`
                      : "Mapping configuration is ready to save once every required field is matched."}
                  </div>

                  <Button className="w-full" onClick={saveMappingAndContinue}>
                    Continue
                  </Button>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  Validate the uploaded file first to unlock the mapping step and
                  review detected column headers.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
      <CheckCircle2 className="size-4 text-primary" />
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}

function normalizeRows(rows: ParsedRow[]) {
  return rows.map((row) => {
    const entries = Object.entries(row).map(([key, value]) => [
      String(key).trim(),
      String(value ?? "").trim(),
    ]);

    return Object.fromEntries(entries);
  });
}

function extractHeaders(rows: ParsedRow[]) {
  return Array.from(
    new Set(
      rows.flatMap((row) =>
        Object.keys(row).filter((header) => header.trim().length > 0)
      )
    )
  );
}

function createEmptyMapping(): FieldMapping {
  return TEMPLATE_FIELDS.reduce(
    (mapping, field) => {
      mapping[field.key] = "";
      return mapping;
    },
    {} as FieldMapping
  );
}

function createInitialMapping(
  headers: string[],
  requiredFieldMatches: Record<string, string | null>
): FieldMapping {
  return TEMPLATE_FIELDS.reduce(
    (mapping, field) => {
      mapping[field.key] =
        requiredFieldMatches[field.label] ??
        matchHeader(headers, field.label) ??
        matchHeader(headers, field.key) ??
        "";
      return mapping;
    },
    createEmptyMapping()
  );
}

function getDuplicateMappedHeaders(mapping: FieldMapping) {
  const counts = new Map<string, number>();

  Object.values(mapping)
    .filter((value) => value.trim().length > 0)
    .forEach((value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([header]) => header);
}

function getMappedPreviewValue(
  row: ParsedRow | null,
  mapping: FieldMapping,
  fieldKey: TemplateFieldKey
) {
  const header = mapping[fieldKey];

  if (!header || !row) {
    return "Not mapped yet";
  }

  return row[header] || "No sample value";
}

function validateRows(rows: ParsedRow[], headers: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredFieldMatches = Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [field, matchHeader(headers, field)])
  ) as Record<string, string | null>;

  const missingRequiredHeaders = REQUIRED_FIELDS.filter(
    (field) => !requiredFieldMatches[field]
  );

  if (missingRequiredHeaders.length > 0) {
    errors.push(
      `Missing required columns: ${missingRequiredHeaders.join(", ")}.`
    );
  }

  const duplicateNames = findDuplicateNames(rows, requiredFieldMatches.Name);
  if (duplicateNames.length > 0) {
    errors.push(
      `Duplicate recipient names found: ${duplicateNames.slice(0, 5).join(", ")}.`
    );
  }

  const emptyRowIndexes = rows
    .map((row, index) =>
      Object.values(row).every((value) => value.trim() === "") ? index + 1 : null
    )
    .filter((value): value is number => value !== null);

  if (emptyRowIndexes.length > 0) {
    errors.push(
      `Empty rows detected at positions: ${emptyRowIndexes.slice(0, 5).join(", ")}.`
    );
  }

  REQUIRED_FIELDS.forEach((field) => {
    const matchedHeader = requiredFieldMatches[field];
    if (!matchedHeader) {
      return;
    }

    const invalidRows = rows
      .map((row, index) =>
        row[matchedHeader]?.trim() ? null : index + 1
      )
      .filter((value): value is number => value !== null);

    if (invalidRows.length > 0) {
      errors.push(
        `${field} has empty cells in rows: ${invalidRows.slice(0, 5).join(", ")}.`
      );
    }
  });

  if (errors.length === 0) {
    warnings.push("No validation errors found.");
    warnings.push(`${rows.length} recipient rows are ready for mapping.`);
    warnings.push(`${headers.length} column headers detected.`);
  }

  return {
    errors,
    warnings,
    requiredFieldMatches,
  };
}

function findDuplicateNames(rows: ParsedRow[], nameHeader: string | null) {
  if (!nameHeader) {
    return [];
  }

  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = row[nameHeader]?.trim().toLowerCase();
    if (!value) {
      return;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function matchHeader(headers: string[], field: string) {
  const normalizedField = field.toLowerCase();

  return (
    headers.find((header) => normalizeHeader(header) === normalizedField) ??
    headers.find((header) => normalizeHeader(header).includes(normalizedField)) ??
    null
  );
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseCsvFile(file: File) {
  return new Promise<ParsedRow[]>((resolve, reject) => {
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: false,
      complete(results) {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message));
          return;
        }
        resolve(results.data);
      },
      error(error) {
        reject(error);
      },
    });
  });
}

async function parseExcelFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json<ParsedRow>(firstSheet, {
    defval: "",
  });
}
