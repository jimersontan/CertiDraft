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
  isPremium?: boolean;
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
    id: "00000000-0000-0000-0000-000000000001",
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
    id: "00000000-0000-0000-0000-000000000002",
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
    isPremium: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    name: "Royal Sovereign",
    category: "Recognition",
    industry: "Official",
    style: "Imperial",
    description: "An intricate, gold-accented layout for prestigious institutional recognitions.",
    thumbnailClassName: "from-indigo-950 via-purple-900 to-amber-400",
    accentClassName: "bg-amber-400/20 text-amber-600",
    featuredText: "Imperial Recognition",
    primaryColor: "#1e1b4b",
    secondaryColor: "#fbbf24",
    isPremium: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
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
    id: "00000000-0000-0000-0000-000000000004",
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
    id: "00000000-0000-0000-0000-000000000005",
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
    id: "00000000-0000-0000-0000-000000000006",
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
    isPremium: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
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
    isPremium: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000008",
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
  {
    id: "00000000-0000-0000-0000-000000000009",
    name: "Summit Achievement",
    category: "Sports",
    industry: "Adventure",
    style: "Geometric",
    description: "Sharp angles and bold colors for outdoor challenges, hiking, and mountaineering clubs.",
    thumbnailClassName: "from-blue-900 via-slate-800 to-emerald-500",
    accentClassName: "bg-emerald-500/10 text-emerald-600",
    featuredText: "Peak Performance",
    primaryColor: "#0f172a",
    secondaryColor: "#10b981",
  },
  {
    id: "00000000-0000-0000-0000-000000000010",
    name: "Global Scholar",
    category: "Academic",
    industry: "Higher Ed",
    style: "Traditional",
    description: "Ornate borders and serif typography for honorary degrees and international fellowships.",
    thumbnailClassName: "from-red-900 via-stone-800 to-amber-600",
    accentClassName: "bg-amber-600/10 text-amber-700",
    featuredText: "Honorary Fellowship",
    primaryColor: "#7f1d1d",
    secondaryColor: "#d97706",
    isPremium: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000011",
    name: "Tech Innovator",
    category: "Corporate",
    industry: "Technology",
    style: "Futuristic",
    description: "Cyber-themed layout for hackathons, coding bootcamps, and digital transformation awards.",
    thumbnailClassName: "from-cyan-900 via-blue-950 to-purple-600",
    accentClassName: "bg-cyan-500/10 text-cyan-600",
    featuredText: "Innovation Leader",
    primaryColor: "#083344",
    secondaryColor: "#06b6d4",
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

export function getTemplateElements(templateId: string): any[] {
  const template = fallbackTemplates.find(t => t.id === templateId) || fallbackTemplates[0];
  
  return [
    {
      id: "bg-color",
      type: "shape",
      x: 0,
      y: 0,
      width: 595,
      height: 421,
      fill: "#ffffff",
      locked: true,
    },
    {
      id: "border-frame",
      type: "shape",
      x: 20,
      y: 20,
      width: 555,
      height: 381,
      fill: template.secondaryColor + "10", // 10% opacity
      locked: true,
    },
    {
      id: "org-name",
      type: "text",
      content: "ORGANIZATION NAME",
      x: 150,
      y: 40,
      width: 300,
      height: 30,
      fontSize: 12,
      fontFamily: "Inter",
      fontWeight: "500",
      textAlign: "center",
      fill: "#9CA3AF",
    },
    {
      id: "cert-title",
      type: "text",
      content: template.featuredText.toUpperCase(),
      x: 100,
      y: 80,
      width: 400,
      height: 40,
      fontSize: 24,
      fontFamily: "Inter",
      fontWeight: "700",
      textAlign: "center",
      fill: template.primaryColor,
    },
    {
      id: "recipient-name",
      type: "text",
      content: "{recipient_name}",
      x: 100,
      y: 180,
      width: 400,
      height: 60,
      fontSize: 32,
      fontFamily: "Inter",
      fontWeight: "800",
      textAlign: "center",
      fill: "#111827",
    },
    {
      id: "description",
      type: "text",
      content: "For outstanding performance and achievement.",
      x: 100,
      y: 260,
      width: 400,
      height: 40,
      fontSize: 14,
      fontFamily: "Inter",
      fontWeight: "400",
      textAlign: "center",
      fill: "#4B5563",
    },
    {
      id: "qr-code",
      type: "qr",
      x: 270,
      y: 330,
      width: 50,
      height: 50,
    },
  ];
}
