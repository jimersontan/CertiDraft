import { z } from "zod";

/* ─── Auth Schemas ─── */

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password must be less than 72 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/* ─── Project Schemas ─── */

export const eventTypes = [
  "Birthday",
  "Graduation",
  "Training",
  "Award",
  "Sports",
  "Recognition",
  "Custom",
] as const;

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  eventType: z.enum(eventTypes as unknown as [string, ...string[]], {
    error: "Please select an event type",
  } as any),
  description: z.string().max(500, "Description is too long").optional(),
  templateId: z.string().optional(),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

/* ─── CSV Upload Schema ─── */

export const csvUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ].includes(file.type) ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".xlsx"),
      "Please upload a CSV or Excel file"
    ),
});

export type CsvUploadFormData = z.infer<typeof csvUploadSchema>;

/* ─── Data Mapping Schema ─── */

export const dataMappingSchema = z.object({
  mappings: z.record(z.string(), z.string()).refine(
    (mappings) => {
      // At least one mapping must exist
      return Object.values(mappings).some((v) => v.length > 0);
    },
    { message: "At least one field must be mapped" }
  ),
});

export type DataMappingFormData = z.infer<typeof dataMappingSchema>;

/* ─── Customization Schema ─── */

export const customizationSchema = z.object({
  useAICitations: z.boolean().default(false),
  aiTone: z.enum(["professional", "friendly", "formal", "casual"]).optional(),
  aiLength: z.enum(["short", "medium", "long"]).optional(),
  manualTemplate: z.string().max(500).optional(),
  enableManualCustomization: z.boolean().default(false),
  includeQRCode: z.boolean().default(true),
  qrSize: z.enum(["small", "medium", "large"]).default("medium"),
  qrPosition: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
    .default("bottom-right"),
});

export type CustomizationFormData = z.infer<typeof customizationSchema>;

/* ─── Password Strength Helper ─── */

export function getPasswordStrength(
  password: string
): {
  score: 0 | 1 | 2 | 3;
  label: "Too short" | "Weak" | "Medium" | "Strong";
  color: string;
} {
  if (password.length < 6) {
    return { score: 0, label: "Too short", color: "bg-gray-300" };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Medium", color: "bg-amber-500" };
  return { score: 3, label: "Strong", color: "bg-emerald-500" };
}
