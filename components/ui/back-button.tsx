"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export function BackButton({
  href,
  label = "Back",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`gap-1.5 text-muted-foreground hover:text-foreground ${className}`}
        asChild
      >
        <Link href={href}>
          <ArrowLeft className="size-4" />
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-1.5 text-muted-foreground hover:text-foreground ${className}`}
      onClick={() => router.back()}
    >
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
