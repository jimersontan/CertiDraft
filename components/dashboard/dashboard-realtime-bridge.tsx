"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function DashboardRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let removed = false;
    const channelName = `dashboard-live-${Math.random().toString(36).slice(2)}`;

    try {
      const supabase = createClient();
      const queueRefresh = () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }

        refreshTimer = setTimeout(() => {
          router.refresh();
        }, 250);
      };

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "batch_jobs" },
          queueRefresh
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "batch_uploads" },
          queueRefresh
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "certificates" },
          queueRefresh
        )
        .subscribe();

      return () => {
        removed = true;
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }
        void supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        if (!removed && refreshTimer) {
          clearTimeout(refreshTimer);
        }
      };
    }
  }, [router]);

  return null;
}
