import { Bell, Info, AlertTriangle, CheckCircle2, MoreHorizontal, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Notifications — CertiDraft AI",
  description: "Stay updated with your certificate generation status and system alerts.",
};

const notifications = [
  {
    id: 1,
    title: "Batch Generation Completed",
    message: "Your batch 'April Workshop' has been successfully generated. All 45 certificates are ready for download.",
    type: "success",
    time: "2 hours ago",
    isRead: false,
  },
  {
    id: 2,
    title: "System Maintenance",
    message: "Scheduled maintenance will occur on Sunday, May 3rd from 2:00 AM to 4:00 AM EST. Some features may be temporarily unavailable.",
    type: "info",
    time: "1 day ago",
    isRead: true,
  },
  {
    id: 3,
    title: "Subscription Renewal",
    message: "Your Pro subscription will renew in 3 days. Ensure your payment method is up to date.",
    type: "warning",
    time: "2 days ago",
    isRead: true,
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your system alerts and activity updates.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CheckCircle2 className="size-4" />
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="size-4" />
            Preferences
          </Button>
        </div>
      </section>

      {/* Notification List */}
      <section>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>
                You have {notifications.filter(n => !n.isRead).length} unread notifications.
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreHorizontal className="size-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`group flex gap-4 p-5 transition-colors hover:bg-muted/30 ${!notification.isRead ? 'bg-primary/[0.02]' : ''}`}
                  >
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getTypeStyles(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                          {!notification.isRead && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                          )}
                        </h3>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pr-8">
                        {notification.message}
                      </p>
                      <div className="flex gap-4 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs font-medium text-primary hover:underline">Mark as read</button>
                        <button className="text-xs font-medium text-destructive hover:underline flex items-center gap-1">
                          <Trash2 className="size-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                    <Bell className="size-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    You don't have any new notifications at the moment.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Settings Preview */}
      <section className="rounded-2xl border border-border/60 bg-muted/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold">Notification Settings</h2>
          <p className="text-sm text-muted-foreground">
            Control which alerts you receive and where you see them.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/settings">Configure Settings</a>
        </Button>
      </section>
    </div>
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case "success": return <CheckCircle2 className="size-5" />;
    case "warning": return <AlertTriangle className="size-5" />;
    case "info": return <Info className="size-5" />;
    default: return <Bell className="size-5" />;
  }
}

function getTypeStyles(type: string) {
  switch (type) {
    case "success": return "bg-emerald-50 text-emerald-600";
    case "warning": return "bg-amber-50 text-amber-600";
    case "info": return "bg-blue-50 text-blue-600";
    default: return "bg-muted text-muted-foreground";
  }
}
