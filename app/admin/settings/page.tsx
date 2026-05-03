"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Mail, 
  CreditCard, 
  Key, 
  Save, 
  RefreshCw, 
  Globe, 
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        if (json.status === "success") {
          setSettings(json.data);
        }
      } catch (err) {
        toast.error("Failed to load system settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (key: string, value: any) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} settings updated`);
        setSettings({ ...settings, [key]: value });
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      toast.error(`Failed to update ${key} settings`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-10 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="System Settings" 
        description="Configure platform-wide parameters, API keys, and integrations."
      />

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-muted/30 p-1 rounded-full h-12 border border-border/50">
          <TabsTrigger value="general" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
            <Globe className="size-3.5 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="email" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
            <Mail className="size-3.5 mr-2" /> Email
          </TabsTrigger>
          <TabsTrigger value="payment" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
            <CreditCard className="size-3.5 mr-2" /> Payment
          </TabsTrigger>
          <TabsTrigger value="api_keys" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
            <Key className="size-3.5 mr-2" /> API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/10 p-8">
              <CardTitle className="text-xl font-black tracking-tight">General Configuration</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest">Basic platform identity and display settings.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Site Name</label>
                <Input 
                  value={settings?.general?.site_name} 
                  onChange={(e) => setSettings({...settings, general: {...settings.general, site_name: e.target.value}})}
                  className="rounded-full bg-muted/20 border-none ring-1 ring-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Site Description</label>
                <Textarea 
                  value={settings?.general?.site_description} 
                  onChange={(e) => setSettings({...settings, general: {...settings.general, site_description: e.target.value}})}
                  className="rounded-3xl bg-muted/20 border-none ring-1 ring-border/50 min-h-[100px]"
                />
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => handleSave('general', settings.general)} 
                  disabled={isSaving}
                  className="rounded-full px-8 shadow-lg gap-2"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save General Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/10 p-8">
              <CardTitle className="text-xl font-black tracking-tight">Email Delivery</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest">Configure outbound mail settings and sender identity.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Sender Name</label>
                  <Input 
                    value={settings?.email?.sender_name} 
                    onChange={(e) => setSettings({...settings, email: {...settings.email, sender_name: e.target.value}})}
                    className="rounded-full bg-muted/20 border-none ring-1 ring-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Sender Email</label>
                  <Input 
                    value={settings?.email?.sender_email} 
                    onChange={(e) => setSettings({...settings, email: {...settings.email, sender_email: e.target.value}})}
                    className="rounded-full bg-muted/20 border-none ring-1 ring-border/50"
                  />
                </div>
              </div>
              <div className="p-4 rounded-3xl bg-blue-50 border border-blue-100 flex items-start gap-4">
                <AlertCircle className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">Domain Verification</p>
                  <p className="text-xs text-blue-700/80 font-medium">Ensure your SendGrid sender identity is verified before changing the sender email to avoid delivery failures.</p>
                </div>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => handleSave('email', settings.email)} 
                  disabled={isSaving}
                  className="rounded-full px-8 shadow-lg gap-2"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save Email Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/10 p-8">
              <CardTitle className="text-xl font-black tracking-tight">Billing & Currency</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest">Manage exchange rates, tax parameters, and currency display.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Primary Currency</label>
                  <Input 
                    value={settings?.payment?.currency} 
                    disabled
                    className="rounded-full bg-muted/5 border-none ring-1 ring-border/50 opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Exchange Rate (USD → PHP)</label>
                  <div className="relative">
                    <Input 
                      type="number"
                      step="0.1"
                      value={settings?.payment?.exchange_rate} 
                      onChange={(e) => setSettings({...settings, payment: {...settings.payment, exchange_rate: parseFloat(e.target.value)}})}
                      className="rounded-full bg-muted/20 border-none ring-1 ring-border/50 pr-10"
                    />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 size-8 rounded-full">
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Tax Rate (%)</label>
                  <Input 
                    type="number"
                    value={settings?.payment?.tax_rate} 
                    onChange={(e) => setSettings({...settings, payment: {...settings.payment, tax_rate: parseFloat(e.target.value)}})}
                    className="rounded-full bg-muted/20 border-none ring-1 ring-border/50"
                  />
                </div>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => handleSave('payment', settings.payment)} 
                  disabled={isSaving}
                  className="rounded-full px-8 shadow-lg gap-2"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Update Billing Parameters
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api_keys">
          <Card className="border-none shadow-xl ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/10 p-8">
              <CardTitle className="text-xl font-black tracking-tight">External API Integration</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest">Secure storage for platform secrets and service provider tokens.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <ApiKeyItem 
                  label="OpenAI API Key" 
                  value={settings?.api_keys?.openai} 
                  onChange={(val: string) => setSettings({...settings, api_keys: {...settings.api_keys, openai: val}})}
                />
                <ApiKeyItem 
                  label="SendGrid API Key" 
                  value={settings?.api_keys?.sendgrid} 
                  onChange={(val: string) => setSettings({...settings, api_keys: {...settings.api_keys, sendgrid: val}})}
                />
                <ApiKeyItem 
                  label="Stripe Secret Key" 
                  value={settings?.api_keys?.stripe} 
                  onChange={(val: string) => setSettings({...settings, api_keys: {...settings.api_keys, stripe: val}})}
                />
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => handleSave('api_keys', settings.api_keys)} 
                  disabled={isSaving}
                  className="rounded-full px-8 shadow-lg gap-2"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save Encrypted Secrets
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiKeyItem({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end ml-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
        <button 
          onClick={() => setShow(!show)}
          className="text-[8px] font-black uppercase tracking-widest text-primary hover:underline"
        >
          {show ? "Hide" : "Show Key"}
        </button>
      </div>
      <div className="relative">
        <Input 
          type={show ? "text" : "password"}
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk_..."
          className="rounded-full bg-muted/20 border-none ring-1 ring-border/50 font-mono text-xs"
        />
        {value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
            <ShieldCheck className="size-4" />
          </div>
        )}
      </div>
    </div>
  );
}
