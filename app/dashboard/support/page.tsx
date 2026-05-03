import { Headphones, Mail, MessageSquare, LifeBuoy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Support — CertiDraft AI",
  description: "Get help and support for your CertiDraft projects.",
};

const faqs = [
  {
    question: "How do I create a new certificate batch?",
    answer: "Go to the Projects page, click 'Create New Project', and follow the step-by-step guide to upload your CSV/Excel file and select a template.",
  },
  {
    question: "Can I customize the email sent to recipients?",
    answer: "Yes, in the Project settings, you can customize the email subject and body before starting the generation process.",
  },
  {
    question: "What file formats are supported for batch uploads?",
    answer: "We currently support .csv and .xlsx (Excel) files for bulk certificate generation.",
  },
  {
    question: "How do I download my generated certificates?",
    answer: "Once a batch is completed, you can download all certificates as a ZIP file from the project dashboard.",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Support & Help Center</h1>
        <p className="mt-2 text-muted-foreground">
          Need help with CertiDraft? Our team is here to assist you.
        </p>
      </section>

      {/* Support Options */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="size-5 text-primary" />
            </div>
            <CardTitle>Email Support</CardTitle>
            <CardDescription>
              Expect a response within 24 hours on business days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <a href="mailto:support@certidraft.com">Contact via Email</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <MessageSquare className="size-5 text-blue-600" />
            </div>
            <CardTitle>Live Chat</CardTitle>
            <CardDescription>
              Available for Pro and Enterprise users 9am-5pm EST.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <LifeBuoy className="size-5 text-emerald-600" />
            </div>
            <CardTitle>Help Center</CardTitle>
            <CardDescription>
              Browse our documentation and detailed how-to guides.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <a href="/dashboard/resources">
                View Documentation
                <ExternalLink className="ml-2 size-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* FAQs */}
      <section>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions about CertiDraft.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {faqs.map((faq, i) => (
                <div key={i} className="space-y-2">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* System Status */}
      <section className="rounded-2xl border border-border/60 bg-muted/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Headphones className="size-5" />
            </div>
            <div>
              <p className="font-semibold">All systems operational</p>
              <p className="text-sm text-muted-foreground">
                Certificate generation and delivery is running smoothly.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
            View Status Page
          </Button>
        </div>
      </section>
    </div>
  );
}
