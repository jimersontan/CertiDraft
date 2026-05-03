import {
  BookOpen,
  FileText,
  Video,
  Download,
  ExternalLink,
  Lightbulb,
  ArrowRight,
  Play,
  Clock,
  FileSpreadsheet,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Resources — CertiDraft AI",
  description: "Guides, tutorials, and templates to help you use CertiDraft effectively.",
};

const guides = [
  {
    title: "Getting Started Guide",
    description: "Learn how to set up your first project and generate certificates in 5 minutes.",
    icon: Lightbulb,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    link: "#",
    tag: "Essential",
    tagColor: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Data Formatting Tips",
    description: "How to structure your CSV or Excel files for perfect certificate data mapping.",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    link: "#",
    tag: "Tips",
    tagColor: "bg-blue-50 text-blue-700",
  },
  {
    title: "Template Customization",
    description: "Advanced techniques for customizing templates with your own branding and styles.",
    icon: BookOpen,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    link: "#",
    tag: "Advanced",
    tagColor: "bg-violet-50 text-violet-700",
  },
];

const videos = [
  { title: "Dashboard Overview", duration: "2:45", views: "1.2k views", link: "#" },
  { title: "Batch Generation Workflow", duration: "4:20", views: "980 views", link: "#" },
  { title: "Managing Projects", duration: "3:15", views: "754 views", link: "#" },
];

const downloads = [
  {
    title: "CSV Sample Data",
    description: "A pre-formatted CSV file to test your first certificate batch.",
    filename: "sample.csv",
    icon: Table2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    size: "4 KB",
  },
  {
    title: "Excel Template",
    description: "Standard Excel template with required columns for mapped fields.",
    filename: "template.xlsx",
    icon: FileSpreadsheet,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    size: "12 KB",
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header */}
      <section className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-8 ring-indigo-50/50">
          <BookOpen className="size-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Resources &amp; Learning
          </h1>
          <p className="mt-1 text-slate-500">
            Everything you need to master certificate generation with CertiDraft.
          </p>
        </div>
      </section>

      {/* Feature Guide Cards */}
      <section>
        <h2 className="mb-5 text-xs font-black uppercase tracking-widest text-slate-400">
          Guides &amp; Documentation
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {guides.map((guide, i) => {
            const Icon = guide.icon;
            return (
              <a
                key={i}
                href={guide.link}
                className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${guide.iconBg}`}>
                    <Icon className={`size-5 ${guide.iconColor}`} />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${guide.tagColor}`}>
                    {guide.tag}
                  </span>
                </div>
                <h3 className="mt-5 font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {guide.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-slate-500 leading-relaxed">
                  {guide.description}
                </p>
                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                  Read Guide
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        {/* Video Tutorials — Mini Player Style */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Video Tutorials
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="divide-y divide-slate-50">
              {videos.map((video, i) => (
                <a
                  key={i}
                  href={video.link}
                  className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-slate-50"
                >
                  {/* Play button */}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-all group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-rose-200">
                    <Play className="size-4 fill-current" />
                    <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-slate-900 text-[7px] font-black text-white">
                      {i + 1}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {video.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="size-3" />
                      <span>{video.duration}</span>
                      <span>·</span>
                      <span>{video.views}</span>
                    </div>
                  </div>

                  {/* Watch pill */}
                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition-all group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    Watch
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Sample Templates — File Download Style */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Sample Templates
          </h2>
          <div className="space-y-4">
            {downloads.map((file, i) => {
              const Icon = file.icon;
              return (
                <div
                  key={i}
                  className="group flex items-start gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-5 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 ${file.iconBg} shadow-sm`}>
                    <Icon className={`size-6 ${file.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{file.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {file.size}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{file.description}</p>
                    <button className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      <Download className="size-3.5" />
                      {file.filename}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Community Section */}
      <section
        className="relative overflow-hidden rounded-2xl border border-slate-100 p-8 text-center shadow-sm"
        style={{ background: "linear-gradient(135deg, #f8faff 0%, #f0f4ff 60%, #fafbff 100%)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-blue-100/40 blur-2xl" />
        <div className="relative">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <ExternalLink className="size-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Join the Community</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Connect with educators and professionals using CertiDraft to automate their certificate workflows.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Discord Server
              <ExternalLink className="size-3.5" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              GitHub Repo
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
