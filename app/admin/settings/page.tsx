"use client";

import { useState } from "react";
import { 
  Settings, 
  Shield, 
  Mail, 
  Database, 
  Globe, 
  Save,
  Bell,
  Lock,
  Cloud
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BackButton } from "@/components/ui/back-button";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader 
        title="System Settings" 
        description="Configure global platform parameters, security, and integrations."
      >
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : (
            <>
              <Save className="size-4" />
              Save Changes
            </>
          )}
        </Button>
      </PageHeader>

      <div className="grid gap-6">
        {/* General Config */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="size-4 text-indigo-600" />
              <CardTitle className="text-lg">General Configuration</CardTitle>
            </div>
            <CardDescription>Platform-wide branding and behavior settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" defaultValue="CertiDraft AI" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input id="supportEmail" defaultValue="support@certidraft.com" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Disable frontend and show maintenance page.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* AI & Generation */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="size-4 text-indigo-600" />
              <CardTitle className="text-lg">AI & Certificate Generation</CardTitle>
            </div>
            <CardDescription>Control AI model parameters and generation limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="aiModel">Default AI Model</Label>
                <Input id="aiModel" defaultValue="GPT-4o" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxBatch">Max Batch Size (Free)</Label>
                <Input id="maxBatch" type="number" defaultValue="10" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Enable AI Citations</p>
                <p className="text-xs text-muted-foreground">Allow users to generate text using AI.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="size-4 text-red-600" />
              <CardTitle className="text-lg">Security & Authentication</CardTitle>
            </div>
            <CardDescription>Configure user access and platform security policies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div>
                <p className="text-sm font-semibold">New User Registration</p>
                <p className="text-xs text-muted-foreground">Allow new users to sign up to the platform.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Enforce 2FA for all admin accounts.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="apiKey">Admin API Key</Label>
              <div className="flex gap-2">
                <Input id="apiKey" type="password" defaultValue="cd_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXX" className="font-mono" />
                <Button variant="outline">Regenerate</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
