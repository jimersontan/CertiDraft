import Link from "next/link";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
          <FileQuestion className="size-10 text-primary" />
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" size="lg" asChild>
            <Link href="/"><ArrowLeft className="size-4" />Go Back</Link>
          </Button>
          <Button size="lg" asChild>
            <Link href="/"><Home className="size-4" />Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
