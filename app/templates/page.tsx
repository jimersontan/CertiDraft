import { TemplateGallery } from "@/components/certificates/template-gallery";
import {
  fallbackTemplates,
  mapTemplateRow,
  TemplateRecord,
} from "@/lib/templates";

import { createClient } from "@/lib/supabase/server";

async function getTemplates(): Promise<TemplateRecord[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return fallbackTemplates;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("templates").select("*");

    if (error || !data || data.length === 0) {
      return fallbackTemplates;
    }

    return data.map((row) => mapTemplateRow(row));
  } catch {
    return fallbackTemplates;
  }
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return <TemplateGallery templates={templates} />;
}
