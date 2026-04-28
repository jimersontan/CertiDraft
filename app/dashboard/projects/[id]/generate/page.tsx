"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Download,
  Mail,
  LinkIcon,
  Copy,
  Search,
  ArrowLeft,
  FileText,
  Clock,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";
import { StepIndicator } from "@/components/dashboard/step-indicator";
import { useParams } from "next/navigation";

const steps = ["Upload Data", "Map Data", "Customize", "Generate"];

const mockCertificates = Array.from({ length: 12 }, (_, i) => ({
  id: `cert-${i + 1}`,
  name: [
    "John Doe", "Jane Smith", "Bob Wilson", "Alice Brown",
    "Charlie Davis", "Diana Miller", "Edward Jones", "Fiona Garcia",
    "George Martinez", "Helen Anderson", "Ivan Thomas", "Julia Jackson",
  ][i],
  date: "Apr 15, 2026",
  size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
}));

export default function GeneratePage() {
  const params = useParams();
  const projectId = params.id as string;
  const [phase, setPhase] = useState<"generating" | "complete">("generating");
  const [progress, setProgress] = useState(0);
  const [currentRecipient, setCurrentRecipient] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchCerts, setSearchCerts] = useState("");

  // Simulate generation
  useEffect(() => {
    if (phase !== "generating") return;
    const total = 250;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 8 + 2;
        const idx = Math.floor((next / 100) * mockCertificates.length) % mockCertificates.length;
        setCurrentRecipient(mockCertificates[idx].name);
        if (next >= 100) {
          clearInterval(interval);
          setPhase("complete");
          return 100;
        }
        return next;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [phase]);

  const generated = Math.floor((progress / 100) * 250);
  const filteredCerts = mockCertificates.filter((c) =>
    c.name.toLowerCase().includes(searchCerts.toLowerCase())
  );

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <BackButton href={`/dashboard/projects/${projectId}/customize`} label="Back to Customize" />
      <StepIndicator currentStep={4} steps={steps} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {phase === "generating" ? "Generating Certificates..." : "Generation Complete!"}
        </h1>
      </div>

      {/* Progress section */}
      <div className="rounded-xl border bg-card p-6">
        {/* Progress bar */}
        <div className="space-y-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {phase === "complete"
                ? "All certificates generated!"
                : `Processing: ${currentRecipient}...`}
            </span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Generated {generated} out of 250 certificates
          </p>
        </div>

        {/* Completion summary */}
        {phase === "complete" && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="size-5" />
              <span className="font-semibold">All certificates generated successfully!</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <FileText className="size-4" />
                250 certificates
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <HardDrive className="size-4" />
                45 MB total
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Clock className="size-4" />
                8 min 23 sec
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Download options — shown after complete */}
      {phase === "complete" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button size="lg" className="h-auto flex-col gap-1 py-4">
              <Download className="size-5" />
              <span className="text-sm font-semibold">Download All (ZIP)</span>
              <span className="text-xs text-primary-foreground/70">45 MB</span>
            </Button>
            <Button size="lg" variant="outline" className="h-auto flex-col gap-1 py-4">
              <Mail className="size-5" />
              <span className="text-sm font-semibold">Send via Email</span>
              <span className="text-xs text-muted-foreground">To all recipients</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-auto flex-col gap-1 py-4"
              onClick={handleCopy}
            >
              {copied ? <CheckCircle className="size-5 text-emerald-500" /> : <LinkIcon className="size-5" />}
              <span className="text-sm font-semibold">
                {copied ? "Copied!" : "Copy Share Link"}
              </span>
              <span className="text-xs text-muted-foreground">Public batch link</span>
            </Button>
            <Button size="lg" variant="outline" className="h-auto flex-col gap-1 py-4" asChild>
              <Link href={`/dashboard/projects/${projectId}/editor`}>
                <ArrowLeft className="size-5" />
                <span className="text-sm font-semibold">Edit & Regenerate</span>
                <span className="text-xs text-muted-foreground">Make changes</span>
              </Link>
            </Button>
          </div>

          {/* Individual certificates */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Individual Certificates</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  className="pl-9"
                  value={searchCerts}
                  onChange={(e) => setSearchCerts(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Size</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCerts.map((cert) => (
                    <tr key={cert.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{cert.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{cert.date}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{cert.size}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline"><Download className="size-3" /></Button>
                          <Button size="sm" variant="outline"><Mail className="size-3" /></Button>
                          <Button size="sm" variant="outline"><Copy className="size-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <Button asChild>
              <Link href="/dashboard/projects">Back to Projects</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
