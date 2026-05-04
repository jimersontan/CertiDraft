"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderKanban,
  FileText,
  Clock,
  Users,
  Headphones,
  BookOpen,
  Bell,
  Crown,
  LogOut,
  Menu,
  X,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";
import { getPlanDetails } from "@/lib/subscriptions";

interface SidebarProps {
  userName: string;
  userEmail: string;
  userAvatar?: string;
  subscriptionTier?: string;
  notificationCount?: number;
  isAdmin?: boolean;
}

const navGroups = [
  {
    label: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home },
      { label: "Projects", href: "/dashboard/projects", icon: FolderKanban, hasAction: true },
      { label: "Templates", href: "/dashboard/templates", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Recent", href: "/dashboard/recent", icon: Clock },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Resources", href: "/dashboard/resources", icon: BookOpen },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell, hasBadge: true },
      { label: "Subscription Plan", href: "/dashboard/subscription", icon: Crown },
      { label: "Support", href: "/dashboard/support", icon: Headphones },
    ],
  },
];

export function Sidebar({
  userName,
  userEmail,
  subscriptionTier = "free",
  notificationCount = 0,
  isAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    queueMicrotask(() => {
      setMobileOpen(false);
    });
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border/50 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14,2 14,8 20,8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Certi<span className="text-primary">Draft</span>
          </span>
        </Link>
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 mt-1 px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const isLocked = (item as any).requiresPro && subscriptionTier === "free";

                return (
                  <div key={item.label} className="group/item relative">
                    <Link
                      href={isLocked ? "/dashboard/subscription" : item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : isLocked
                            ? "text-muted-foreground/40 cursor-not-allowed"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {(item as any).hasAction && !isLocked && (
                        <Plus className="size-4 opacity-0 transition-opacity group/item-hover:opacity-100" />
                      )}
                      {isLocked && (
                        <span className="ml-auto rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
                          PRO
                        </span>
                      )}
                      {(item as any).hasBadge && notificationCount > 0 && (
                        notificationCount > 9 ? (
                          <span className="ml-auto flex h-2 w-2 rounded-full bg-rose-500 ring-1 ring-white animate-pulse" />
                        ) : (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold leading-none text-white antialiased ring-2 ring-white">
                            {notificationCount}
                          </span>
                        )
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div>
            <p className="mb-2 mt-1 px-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Admin</p>
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-all"
            >
              <ShieldCheck className="size-4 flex-shrink-0" />
              <span className="flex-1">Admin Panel</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-border/40 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
              {(subscriptionTier === "pro" || subscriptionTier === "enterprise") && (
                <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[8px] font-black text-white shadow-sm">
                  <Crown className="size-2" /> Pro
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Logout"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-card shadow-sm lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-border/50 bg-card transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Close sidebar"
        >
          <X className="size-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-border/40 bg-card shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:block">
        {sidebarContent}
      </aside>
    </>
  );
}
