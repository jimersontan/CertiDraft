export type TemplateCategory =
  | "All"
  | "Corporate"
  | "Academic"
  | "Sports"
  | "Recognition";

export type TemplateRecord = {
  id: string;
  name: string;
  category: Exclude<TemplateCategory, "All">;
  industry: string;
  style: string;
  description: string;
  thumbnailClassName: string;
  accentClassName: string;
  featuredText: string;
  primaryColor: string;
  secondaryColor: string;
};

export const templateCategories: TemplateCategory[] = [
  "All",
  "Corporate",
  "Academic",
  "Sports",
  "Recognition",
];

export const fallbackTemplates: TemplateRecord[] = [
  {
    id: "corporate-blueprint",
    name: "Executive Excellence",
    category: "Corporate",
    industry: "Business",
    style: "Minimal",
    description:
      "A polished layout for training completions, employee awards, and leadership recognitions.",
    thumbnailClassName: "from-blue-700 via-blue-600 to-cyan-500",
    accentClassName: "bg-blue-500/15 text-blue-700",
    featuredText: "Leadership Award",
    primaryColor: "#214ccf",
    secondaryColor: "#14b8a6",
  },
  {
    id: "corporate-gold",
    name: "Prestige Boardroom",
    category: "Corporate",
    industry: "Finance",
    style: "Luxury",
    description:
      "A formal certificate with premium accents designed for high-value recognition programs.",
    thumbnailClassName: "from-slate-900 via-slate-800 to-amber-500",
    accentClassName: "bg-amber-500/15 text-amber-700",
    featuredText: "Certificate of Merit",
    primaryColor: "#111827",
    secondaryColor: "#d97706",
  },
  {
    id: "academic-classic",
    name: "Scholars Crest",
    category: "Academic",
    industry: "Education",
    style: "Classic",
    description:
      "Balanced typography and crest-inspired framing for diplomas, honors, and course completion.",
    thumbnailClassName: "from-emerald-700 via-teal-600 to-cyan-500",
    accentClassName: "bg-emerald-500/15 text-emerald-700",
    featuredText: "Academic Distinction",
    primaryColor: "#0f766e",
    secondaryColor: "#16a34a",
  },
  {
    id: "academic-modern",
    name: "Campus Modern",
    category: "Academic",
    industry: "E-Learning",
    style: "Contemporary",
    description:
      "A lighter visual system for workshops, seminars, and digital academy certificates.",
    thumbnailClassName: "from-sky-500 via-indigo-500 to-violet-500",
    accentClassName: "bg-indigo-500/15 text-indigo-700",
    featuredText: "Completion Award",
    primaryColor: "#4f46e5",
    secondaryColor: "#0ea5e9",
  },
  {
    id: "sports-champion",
    name: "Champion Series",
    category: "Sports",
    industry: "Athletics",
    style: "Bold",
    description:
      "High-energy composition for tournaments, seasonal leagues, and sportsmanship awards.",
    thumbnailClassName: "from-orange-500 via-red-500 to-rose-600",
    accentClassName: "bg-rose-500/15 text-rose-700",
    featuredText: "Tournament Winner",
    primaryColor: "#ef4444",
    secondaryColor: "#f97316",
  },
  {
    id: "sports-elite",
    name: "Victory Grid",
    category: "Sports",
    industry: "Fitness",
    style: "Dynamic",
    description:
      "A strong diagonal layout suited for coaching programs, endurance events, and team awards.",
    thumbnailClassName: "from-lime-500 via-emerald-500 to-teal-500",
    accentClassName: "bg-lime-500/15 text-lime-700",
    featuredText: "Elite Performance",
    primaryColor: "#22c55e",
    secondaryColor: "#14b8a6",
  },
  {
    id: "recognition-star",
    name: "Spotlight Honor",
    category: "Recognition",
    industry: "HR",
    style: "Elegant",
    description:
      "A celebratory layout ideal for monthly awards, internal appreciation, and milestones.",
    thumbnailClassName: "from-fuchsia-600 via-violet-600 to-indigo-600",
    accentClassName: "bg-fuchsia-500/15 text-fuchsia-700",
    featuredText: "Outstanding Service",
    primaryColor: "#9333ea",
    secondaryColor: "#ec4899",
  },
  {
    id: "recognition-impact",
    name: "Impact Tribute",
    category: "Recognition",
    industry: "Nonprofit",
    style: "Warm",
    description:
      "A softer presentation for volunteer recognition, appreciation events, and community service.",
    thumbnailClassName: "from-amber-400 via-orange-500 to-pink-500",
    accentClassName: "bg-orange-500/15 text-orange-700",
    featuredText: "Community Excellence",
    primaryColor: "#ea580c",
    secondaryColor: "#ec4899",
  },
];

type SupabaseTemplateRow = Partial<{
  id: string | number;
  name: string;
  title: string;
  category: string;
  industry: string;
  style: string;
  description: string;
  primary_color: string;
  secondary_color: string;
}>;

export function mapTemplateRow(row: SupabaseTemplateRow): TemplateRecord {
  const category = normalizeCategory(row.category);
  const fallback =
    fallbackTemplates.find((template) => template.category === category) ??
    fallbackTemplates[0];

  return {
    id: String(row.id ?? row.name ?? row.title ?? fallback.id),
    name: row.name ?? row.title ?? fallback.name,
    category,
    industry: row.industry ?? fallback.industry,
    style: row.style ?? fallback.style,
    description: row.description ?? fallback.description,
    thumbnailClassName: fallback.thumbnailClassName,
    accentClassName: fallback.accentClassName,
    featuredText: fallback.featuredText,
    primaryColor: row.primary_color ?? fallback.primaryColor,
    secondaryColor: row.secondary_color ?? fallback.secondaryColor,
  };
}

function normalizeCategory(value?: string): TemplateRecord["category"] {
  if (!value) {
    return "Corporate";
  }

  const normalized = value.toLowerCase();
  if (normalized.includes("academic")) {
    return "Academic";
  }
  if (normalized.includes("sport")) {
    return "Sports";
  }
  if (normalized.includes("recogn")) {
    return "Recognition";
  }

  return "Corporate";
}
