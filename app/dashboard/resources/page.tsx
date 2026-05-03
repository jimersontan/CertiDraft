import { BookOpen, FileText, Video, Download, ExternalLink, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Resources — CertiDraft AI",
  description: "Guides, tutorials, and templates to help you use CertiDraft effectively.",
};

const guides = [
  {
    title: "Getting Started Guide",
    description: "Learn how to set up your first project and generate certificates in 5 minutes.",
    icon: <Lightbulb className="size-5 text-amber-600" />,
    link: "#",
    tag: "Essential",
  },
  {
    title: "Data Formatting Tips",
    description: "How to structure your CSV or Excel files for perfect certificate data mapping.",
    icon: <FileText className="size-5 text-blue-600" />,
    link: "#",
    tag: "Tips",
  },
  {
    title: "Template Customization",
    description: "Advanced techniques for customizing templates with your own branding.",
    icon: <BookOpen className="size-5 text-purple-600" />,
    link: "#",
    tag: "Advanced",
  },
];

const videos = [
  {
    title: "Dashboard Overview",
    duration: "2:45",
    link: "#",
  },
  {
    title: "Batch Generation Workflow",
    duration: "4:20",
    link: "#",
  },
  {
    title: "Managing Projects",
    duration: "3:15",
    link: "#",
  },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources & Learning</h1>
            <p className="mt-1 text-muted-foreground">
              Everything you need to master certificate generation with CertiDraft.
            </p>
          </div>
        </div>
      </section>

      {/* Main Guides */}
      <section className="grid gap-6 md:grid-cols-3">
        {guides.map((guide, i) => (
          <Card key={i} className="border-border/50 transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  {guide.icon}
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  {guide.tag}
                </span>
              </div>
              <CardTitle className="mt-4">{guide.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {guide.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="group w-full justify-between gap-2 px-0 text-primary hover:bg-transparent" asChild>
                <a href={guide.link}>
                  Read Guide
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Video Tutorials */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Video Tutorials</h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {videos.map((video, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-600">
                        <Video className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{video.title}</p>
                        <p className="text-xs text-muted-foreground">{video.duration} duration</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={video.link}>Watch</a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Downloads */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Sample Templates</h2>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-4 rounded-xl border border-border/50 p-4 bg-muted/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Download className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">CSV Sample Data</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    A pre-formatted CSV file to test your first certificate batch.
                  </p>
                  <Button variant="link" className="h-auto p-0 text-xs text-primary mt-2">
                    Download sample.csv
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl border border-border/50 p-4 bg-muted/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Download className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">Excel Template</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Standard Excel template with required columns for mapped fields.
                  </p>
                  <Button variant="link" className="h-auto p-0 text-xs text-primary mt-2">
                    Download template.xlsx
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Community / External */}
      <section className="rounded-2xl border border-border/60 bg-gradient-to-r from-primary/5 to-transparent p-8 text-center">
        <h2 className="text-xl font-bold">Join the Community</h2>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-sm">
          Connect with other educators and professionals using CertiDraft to automate their workflows.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button variant="outline" className="gap-2">
            Discord Server
            <ExternalLink className="size-3.5" />
          </Button>
          <Button variant="outline" className="gap-2">
            GitHub Repo
            <ExternalLink className="size-3.5" />
          </Button>
        </div>
      </section>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
